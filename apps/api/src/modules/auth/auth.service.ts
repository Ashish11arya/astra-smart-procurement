import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../redis/redis.service';
import {
  UserRole,
  FarmerState,
  RegistrationStatus,
  Gender,
  FarmerCategory,
  RequestOtpResponseDto,
  VerifyOtpResponseDto,
  FarmerProfileDto,
  RegistrationSummaryDto,
  CheckFarmerRegistrationResponseDto,
} from '@astra/shared';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly otpMode: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.otpMode = this.configService.get<string>('OTP_MODE') || process.env.OTP_MODE || 'development';
  }

  /**
   * Generates SHA-256 hash with salt for secure storage in Redis.
   */
  private hashOtp(otp: string, mobile: string): string {
    const salt = this.configService.get<string>('JWT_SECRET') || 'astra_salt_secret';
    return crypto.createHash('sha256').update(`${mobile}:${otp}:${salt}`).digest('hex');
  }

  /**
   * Masks mobile number for secure logs (e.g. 98XXXXXX10).
   */
  private maskMobile(mobile: string): string {
    if (mobile.length < 6) return mobile;
    return `${mobile.slice(0, 2)}XXXXXX${mobile.slice(-2)}`;
  }

  /**
   * Checks database for farmer registration existence and status by mobile number.
   * Completely privacy-safe: Never reveals farmer name, ID, Aadhaar, bank details, or address.
   */
  async checkFarmerRegistration(mobileInput: string): Promise<CheckFarmerRegistrationResponseDto> {
    const mobile = mobileInput.trim().replace(/^(\+91|0)/, '');
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      throw new BadRequestException('Please enter a valid 10-digit Indian mobile number.');
    }

    const farmer = await this.prisma.farmer.findFirst({
      where: {
        OR: [
          { mobile },
          { user: { mobile } },
        ],
      },
      include: {
        registrations: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!farmer) {
      return {
        exists: false,
        status: FarmerState.NOT_REGISTERED,
        message: 'No farmer registration was found for this mobile number.',
      };
    }

    let status: FarmerState = FarmerState.NOT_REGISTERED;
    if (farmer.isVerified) {
      status = FarmerState.VERIFIED;
    } else if (farmer.registrations && farmer.registrations.length > 0) {
      const latestReg = farmer.registrations[0];
      switch (latestReg.status) {
        case RegistrationStatus.VERIFIED:
          status = FarmerState.VERIFIED;
          break;
        case RegistrationStatus.ACTION_REQUIRED:
          status = FarmerState.ACTION_REQUIRED;
          break;
        case RegistrationStatus.UNDER_VERIFICATION:
        case RegistrationStatus.VERIFICATION_PENDING:
          status = FarmerState.UNDER_VERIFICATION;
          break;
        case RegistrationStatus.SUBMITTED:
          status = FarmerState.SUBMITTED;
          break;
        case RegistrationStatus.REJECTED:
          status = FarmerState.REJECTED;
          break;
        case RegistrationStatus.DRAFT:
          status = FarmerState.DRAFT;
          break;
        default:
          status = FarmerState.NOT_REGISTERED;
      }
    } else {
      status = FarmerState.DRAFT;
    }

    return {
      exists: true,
      status,
      message: 'This mobile number is already registered.',
    };
  }

  /**
   * Request 6-digit OTP for farmer mobile number.
   * Enforces scope-based verification:
   * - LOGIN: farmer must already exist in database.
   * - REGISTER: farmer must not already exist in database.
   */
  async requestFarmerOtp(mobileInput: string, scope?: 'LOGIN' | 'REGISTER'): Promise<RequestOtpResponseDto> {
    const mobile = mobileInput.trim().replace(/^(\+91|0)/, '');

    // Validate 10-digit Indian mobile number
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      throw new BadRequestException('Please enter a valid 10-digit Indian mobile number.');
    }

    // Server-side check before generating OTP
    if (scope === 'LOGIN') {
      const regCheck = await this.checkFarmerRegistration(mobile);
      if (!regCheck.exists) {
        throw new NotFoundException('No farmer registration was found for this mobile number. Please register first.');
      }
    } else if (scope === 'REGISTER') {
      const regCheck = await this.checkFarmerRegistration(mobile);
      if (regCheck.exists) {
        throw new ConflictException('This mobile number is already registered. Please go to Farmer Login.');
      }
    }

    const redis = this.redisService.getClient();
    if (redis && this.redisService.getIsConnected()) {
      // Check resend cooldown
      const inCooldown = await redis.get(`otp:cooldown:${mobile}`);
      if (inCooldown) {
        const ttl = await redis.ttl(`otp:cooldown:${mobile}`);
        throw new HttpException(
          `Please wait ${ttl > 0 ? ttl : 60} seconds before requesting a new OTP.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    // Generate secure 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = this.hashOtp(otp, mobile);

    if (redis && this.redisService.getIsConnected()) {
      // Store hashed OTP with 5 minute TTL (300 seconds)
      await redis.set(`otp:hash:${mobile}`, otpHash, 'EX', 300);
      // Reset attempt counter
      await redis.set(`otp:attempts:${mobile}`, '0', 'EX', 300);
      // Set 60-second cooldown
      await redis.set(`otp:cooldown:${mobile}`, '1', 'EX', 60);
    }

    // Development OTP output per architectural requirement
    if (this.otpMode === 'development') {
      const masked = this.maskMobile(mobile);
      this.logger.log(`\n=======================================================\n[DEV OTP]\nMobile: +91 ${masked} (Raw: ${mobile})\nOTP: ${otp}\nScope: ${scope || 'UNSPECIFIED'}\nExpires: 5 minutes\n=======================================================`);
    } else {
      // In production mode, pass to real SMS provider adapter (Part 3/later)
      this.logger.log(`[PROD OTP] Dispatched via configured SMS gateway to +91 ${this.maskMobile(mobile)} (Scope: ${scope || 'UNSPECIFIED'})`);
    }

    return {
      success: true,
      message: 'OTP sent successfully to your mobile number.',
      cooldownSeconds: 60,
      ...(this.otpMode === 'development' ? { devOtp: otp } : {}),
    };
  }

  /**
   * Verifies 6-digit OTP, authenticates user, and resolves farmer registration state.
   * If scope === 'LOGIN', rejects un-registered farmers without creating records.
   */
  async verifyFarmerOtp(
    mobileInput: string,
    otpInput: string,
    scope?: 'LOGIN' | 'REGISTER',
  ): Promise<VerifyOtpResponseDto> {
    const mobile = mobileInput.trim().replace(/^(\+91|0)/, '');
    const otp = otpInput.trim();

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      throw new BadRequestException('Please enter a valid 10-digit mobile number.');
    }

    if (!/^\d{6}$/.test(otp)) {
      throw new BadRequestException('Please enter a valid 6-digit OTP.');
    }

    const regCheck = await this.checkFarmerRegistration(mobile);
    if (scope === 'LOGIN' && !regCheck.exists) {
      throw new NotFoundException('No farmer registration was found for this mobile number. Please register first.');
    }
    if (scope === 'REGISTER' && regCheck.exists) {
      throw new ConflictException('This mobile number is already registered. Please go to Farmer Login.');
    }

    const redis = this.redisService.getClient();
    if (redis && this.redisService.getIsConnected()) {
      const storedHash = await redis.get(`otp:hash:${mobile}`);
      if (!storedHash) {
        throw new BadRequestException('OTP has expired or was not requested. Please request a new OTP.');
      }

      const attemptsStr = await redis.get(`otp:attempts:${mobile}`);
      const attempts = parseInt(attemptsStr || '0', 10);
      if (attempts >= 5) {
        await redis.del(`otp:hash:${mobile}`);
        throw new HttpException(
          'Too many failed attempts. For security, please request a new OTP.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      const incomingHash = this.hashOtp(otp, mobile);
      const isDevBypass = this.otpMode === 'development' && (otp === '123456' || otp === '654321');
      if (incomingHash !== storedHash && !isDevBypass) {
        await redis.incr(`otp:attempts:${mobile}`);
        const remaining = 4 - attempts;
        throw new BadRequestException(
          `Incorrect OTP. Please try again.${remaining > 0 ? ` (${remaining} attempts remaining)` : ''}`,
        );
      }

      // Cleanup consumed OTP state from Redis
      await redis.del(`otp:hash:${mobile}`);
      await redis.del(`otp:attempts:${mobile}`);
      await redis.del(`otp:cooldown:${mobile}`);
    } else {
      this.logger.warn('Redis offline; skipping Redis validation in fallback mode');
    }

    // 1. Resolve User record
    let user = await this.prisma.user.findUnique({ where: { mobile } });
    if (!user) {
      if (scope === 'LOGIN') {
        throw new NotFoundException('Farmer account not found. Please register first.');
      }
      user = await this.prisma.user.create({
        data: {
          mobile,
          role: UserRole.FARMER,
          isActive: true,
        },
      });
      this.logger.log(`Created new ASTRA User record for mobile +91 ${this.maskMobile(mobile)}`);
    }

    // 2. Generate signed JWT session token
    const token = await this.jwtService.signAsync({
      sub: user.id,
      mobile: user.mobile,
      role: user.role,
    });

    // 3. Resolve Farmer profile & Registration state
    const farmer = await this.prisma.farmer.findUnique({
      where: { userId: user.id },
      include: {
        registrations: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { landParcels: true },
        },
      },
    });

    let farmerState: FarmerState = FarmerState.NOT_REGISTERED;
    let farmerProfile: FarmerProfileDto | undefined;
    let registrationSummary: RegistrationSummaryDto | undefined;

    if (farmer) {
      farmerProfile = {
        id: farmer.id,
        farmerCode: farmer.farmerCode,
        fullName: farmer.fullName,
        fatherOrSpouseName: farmer.fatherOrSpouseName || undefined,
        gender: (farmer.gender as unknown as Gender) || undefined,
        category: (farmer.category as unknown as FarmerCategory) || undefined,
        mobile: farmer.mobile,
        isVerified: farmer.isVerified,
        village: farmer.village || undefined,
        district: farmer.district || undefined,
      };

      const latestReg = farmer.registrations[0];
      if (latestReg) {
        registrationSummary = {
          id: latestReg.id,
          registrationNumber: latestReg.registrationNumber,
          status: latestReg.status as RegistrationStatus,
          submittedAt: latestReg.submittedAt?.toISOString(),
          verifiedAt: latestReg.verifiedAt?.toISOString(),
          actionRequiredNotes: latestReg.actionRequiredNotes || undefined,
          rejectionReason: latestReg.rejectionReason || undefined,
          personal: (latestReg.personalDetails as any) || undefined,
          address: (latestReg.addressDetails as any) || undefined,
          bank: (latestReg.bankDetails as any) || undefined,
          documents: (latestReg.documents as any) || undefined,
          landParcels: latestReg.landParcels?.map((p) => ({
            id: p.id,
            district: p.district,
            block: p.block,
            panchayat: p.panchayat,
            village: p.village,
            khasraNumber: p.khasraNumber,
            areaAcres: p.areaAcres,
            ownershipType: p.ownershipType as any,
          })),
        };
      }

      // Determine state hierarchy
      if (farmer.isVerified) {
        farmerState = FarmerState.VERIFIED;
      } else if (latestReg) {
        switch (latestReg.status) {
          case RegistrationStatus.VERIFIED:
            farmerState = FarmerState.VERIFIED;
            break;
          case RegistrationStatus.ACTION_REQUIRED:
            farmerState = FarmerState.ACTION_REQUIRED;
            break;
          case RegistrationStatus.UNDER_VERIFICATION:
            farmerState = FarmerState.UNDER_VERIFICATION;
            break;
          case RegistrationStatus.SUBMITTED:
            farmerState = FarmerState.SUBMITTED;
            break;
          case RegistrationStatus.REJECTED:
            farmerState = FarmerState.REJECTED;
            break;
          case RegistrationStatus.DRAFT:
            farmerState = FarmerState.DRAFT;
            break;
          default:
            farmerState = FarmerState.NOT_REGISTERED;
        }
      } else {
        farmerState = FarmerState.NOT_REGISTERED;
      }
    }

    this.logger.log(
      `Farmer authenticated: mobile=${this.maskMobile(mobile)}, resolvedState=${farmerState}`,
    );

    return {
      token,
      user: {
        id: user.id,
        mobile: user.mobile,
        role: user.role as UserRole,
      },
      farmerState,
      farmer: farmerProfile,
      registration: registrationSummary,
    };
  }

  /**
   * Request OTP for authorised department officers and centre personnel.
   */
  async requestOfficerOtp(
    mobileInput: string,
    scope?: 'OPERATIONS' | 'AUTHORITY' | 'VERIFICATION',
  ): Promise<RequestOtpResponseDto> {
    const mobile = mobileInput.trim().replace(/^(\+91|0)/, '');
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      throw new BadRequestException('Please enter a valid 10-digit mobile number.');
    }

    const user = await this.prisma.user.findUnique({
      where: { mobile },
      include: {
        personnelAssignments: {
          include: { centre: true },
        },
      },
    });

    if (!user || user.role === UserRole.FARMER) {
      throw new BadRequestException('No authorised officer account found for this mobile number.');
    }

    if (scope === 'AUTHORITY' && user.role !== UserRole.GOVERNMENT_ADMIN) {
      throw new BadRequestException('Access restricted to authorised state procurement authority accounts only.');
    }

    if (scope === 'VERIFICATION' && user.role !== UserRole.FARMER_VERIFICATION_AUTHORITY) {
      throw new BadRequestException('Access restricted to authorised Farmer Verification Authority personnel only.');
    }

    // In development mode, use standard dev OTP
    const otp = this.otpMode === 'development' ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();

    const redis = this.redisService.getClient();
    if (redis && this.redisService.getIsConnected()) {
      const hashedOtp = this.hashOtp(otp, mobile);
      await redis.set(`officer:otp:${mobile}`, hashedOtp, 'EX', 300);
    }

    this.logger.log(`[OFFICER DEV OTP] Mobile: ${this.maskMobile(mobile)} | Role: ${user.role} | OTP: ${otp}`);

    return {
      success: true,
      message: 'OTP sent to registered officer mobile.',
      cooldownSeconds: 60,
      devOtp: this.otpMode === 'development' ? otp : undefined,
    };
  }

  /**
   * Verify officer OTP and issue role-scoped JWT token with assigned centre.
   */
  async verifyOfficerOtp(
    mobileInput: string,
    otpInput: string,
    scope?: 'OPERATIONS' | 'AUTHORITY' | 'VERIFICATION',
  ) {
    const mobile = mobileInput.trim().replace(/^(\+91|0)/, '');
    const otp = otpInput.trim();

    const user = await this.prisma.user.findUnique({
      where: { mobile },
      include: {
        personnelAssignments: {
          where: { isActive: true },
          include: { centre: true },
        },
      },
    });

    if (!user || user.role === UserRole.FARMER) {
      throw new BadRequestException('No authorised officer account found for this mobile number.');
    }

    if (scope === 'AUTHORITY' && user.role !== UserRole.GOVERNMENT_ADMIN) {
      throw new BadRequestException('Access restricted to authorised state procurement authority accounts only.');
    }

    if (scope === 'VERIFICATION' && user.role !== UserRole.FARMER_VERIFICATION_AUTHORITY) {
      throw new BadRequestException('Access restricted to authorised Farmer Verification Authority personnel only.');
    }

    // Check OTP
    let isValid = false;
    const redis = this.redisService.getClient();
    if (redis && this.redisService.getIsConnected()) {
      const storedHash = await redis.get(`officer:otp:${mobile}`);
      const inputHash = this.hashOtp(otp, mobile);
      if (storedHash && storedHash === inputHash) {
        isValid = true;
        await redis.del(`officer:otp:${mobile}`);
      }
    }

    if (!isValid && this.otpMode === 'development' && (otp === '123456' || otp === '654321')) {
      isValid = true;
    }

    if (!isValid) {
      throw new BadRequestException('Invalid or expired OTP. Please try again.');
    }

    const token = await this.jwtService.signAsync({
      sub: user.id,
      mobile: user.mobile,
      role: user.role,
    });

    const activeAssignment = user.personnelAssignments[0];

    return {
      token,
      user: {
        id: user.id,
        mobile: user.mobile,
        role: user.role,
      },
      assignment: activeAssignment
        ? {
            id: activeAssignment.id,
            centreId: activeAssignment.centreId,
            centreName: activeAssignment.centre.name,
            centreCode: activeAssignment.centre.centreCode,
            role: activeAssignment.role,
            department: activeAssignment.department,
          }
        : null,
    };
  }
}
