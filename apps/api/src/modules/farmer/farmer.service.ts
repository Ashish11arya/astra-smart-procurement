import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import {
  GOVERNMENT_PROVIDER_TOKEN,
  GovernmentIntegrationProvider,
} from '../../integrations/government/government.interface';
import {
  FARMER_VERIFICATION_PROVIDER_TOKEN,
  FarmerVerificationProvider,
} from '../../integrations/verification/farmer-verification.provider';
import {
  FarmerState,
  RegistrationStatus,
  Gender,
  FarmerCategory,
  FarmerRegistrationDto,
  FarmerStatusResponseDto,
  RegistrationSummaryDto,
  FarmerProfileDto,
} from '@astra/shared';

@Injectable()
export class FarmerService {
  private readonly logger = new Logger(FarmerService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(GOVERNMENT_PROVIDER_TOKEN)
    private readonly governmentProvider: GovernmentIntegrationProvider,
    @Inject(FARMER_VERIFICATION_PROVIDER_TOKEN)
    private readonly verificationProvider: FarmerVerificationProvider,
  ) {}

  /**
   * Helper to mask bank account number (e.g. ••••••••1234)
   */
  private maskAccountNumber(acc: string): string {
    if (!acc || acc.length < 4) return acc;
    return `••••••••${acc.slice(-4)}`;
  }

  /**
   * Generates a unique, official-format registration/application number.
   * Format: ASTRA-FR-YYYY-XXXXXX (e.g. ASTRA-FR-2026-001245)
   */
  private generateRegistrationNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const rand = crypto.randomInt(1000, 999999);
    return `ASTRA-FR-${year}-${String(rand).padStart(6, '0')}`;
  }

  /**
   * Generates a unique farmer code for verified or registered farmers.
   */
  private generateFarmerCode(): string {
    const rand = crypto.randomInt(10000, 99999);
    return `ASTRA-FARMER-${rand}`;
  }

  /**
   * Retrieves authenticated farmer profile and resolved state.
   */
  async getFarmerMe(userId: string): Promise<FarmerStatusResponseDto> {
    const farmer = await this.prisma.farmer.findUnique({
      where: { userId },
      include: {
        registrations: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { landParcels: true },
        },
      },
    });

    if (!farmer) {
      return { farmerState: FarmerState.NOT_REGISTERED };
    }

    const latestReg = farmer.registrations[0];
    const farmerProfile: FarmerProfileDto = {
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

    let farmerState: FarmerState = FarmerState.NOT_REGISTERED;
    let registrationSummary: RegistrationSummaryDto | undefined;

    if (latestReg) {
      registrationSummary = this.mapRegistrationToSummary(latestReg);
      if (farmer.isVerified) {
        farmerState = FarmerState.VERIFIED;
      } else {
        switch (latestReg.status) {
          case RegistrationStatus.VERIFIED:
            farmerState = FarmerState.VERIFIED;
            break;
          case RegistrationStatus.RETURNED_FOR_CORRECTION:
          case RegistrationStatus.ACTION_REQUIRED:
            farmerState = FarmerState.RETURNED_FOR_CORRECTION;
            break;
          case RegistrationStatus.VERIFICATION_PENDING:
          case RegistrationStatus.UNDER_VERIFICATION:
            farmerState = FarmerState.VERIFICATION_PENDING;
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
      }
    }

    return {
      farmerState,
      farmer: farmerProfile,
      registration: registrationSummary,
    };
  }

  /**
   * Retrieves the current detailed verification status of the farmer's registration.
   */
  async getRegistrationStatus(userId: string): Promise<RegistrationSummaryDto> {
    const farmer = await this.prisma.farmer.findUnique({
      where: { userId },
      include: {
        registrations: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { landParcels: true },
        },
      },
    });

    if (!farmer || farmer.registrations.length === 0) {
      throw new NotFoundException('No active registration found for this farmer.');
    }

    return this.mapRegistrationToSummary(farmer.registrations[0]);
  }

  /**
   * Submits a fresh farmer registration.
   * State immediately transitions to: VERIFICATION_PENDING.
   * Zero automatic verification: Awaiting official Authorised Procurement Authority review.
   */
  async submitRegistration(userId: string, data: FarmerRegistrationDto): Promise<RegistrationSummaryDto> {
    // 1. Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User profile not found.');
    }

    // 2. Validate mandatory sections
    if (!data.personal?.fullName || !data.personal?.gender || !data.personal?.category) {
      throw new BadRequestException('Personal details are incomplete.');
    }
    if (!data.address?.district || !data.address?.block || !data.address?.village) {
      throw new BadRequestException('Address details are incomplete.');
    }
    if (!data.landParcels || data.landParcels.length === 0) {
      throw new BadRequestException('At least one land parcel declaration is required.');
    }
    if (!data.bank?.accountNumber || !data.bank?.ifscCode || !data.bank?.bankName) {
      throw new BadRequestException('Bank and payment details are mandatory.');
    }
    if (data.consent && data.consent.declarationConfirmed === false) {
      throw new BadRequestException('Farmer consent and declaration confirmation is required.');
    }

    // 3. Prevent duplicate active submission
    const existingFarmer = await this.prisma.farmer.findUnique({
      where: { userId },
      include: {
        registrations: {
          where: {
            status: {
              in: [
                RegistrationStatus.SUBMITTED,
                RegistrationStatus.VERIFICATION_PENDING,
                RegistrationStatus.UNDER_VERIFICATION,
                RegistrationStatus.VERIFIED,
              ],
            },
          },
        },
      },
    });

    if (existingFarmer && existingFarmer.registrations.length > 0) {
      const activeReg = existingFarmer.registrations[0];
      throw new ConflictException(
        `A registration already exists (${activeReg.registrationNumber}) with status: ${activeReg.status}. Duplicate submissions are prevented.`,
      );
    }

    // Check if another farmer profile is using this mobile
    const duplicateFarmerMobile = await this.prisma.farmer.findFirst({
      where: {
        mobile: user.mobile,
        NOT: { userId },
      },
    });
    if (duplicateFarmerMobile) {
      throw new ConflictException(
        'A farmer profile with this mobile number already exists.',
      );
    }

    // 4. Create or update Farmer entity
    let farmer = existingFarmer;
    if (!farmer) {
      farmer = await this.prisma.farmer.create({
        data: {
          userId,
          farmerCode: this.generateFarmerCode(),
          fullName: data.personal.fullName.trim(),
          fatherOrSpouseName: data.personal.fatherOrSpouseName?.trim(),
          gender: data.personal.gender,
          category: data.personal.category,
          mobile: user.mobile,
          village: data.address.village.trim(),
          district: data.address.district.trim(),
          isVerified: false,
        },
        include: { registrations: true },
      });
    } else {
      farmer = await this.prisma.farmer.update({
        where: { id: farmer.id },
        data: {
          fullName: data.personal.fullName.trim(),
          fatherOrSpouseName: data.personal.fatherOrSpouseName?.trim(),
          gender: data.personal.gender,
          category: data.personal.category,
          village: data.address.village.trim(),
          district: data.address.district.trim(),
          isVerified: false,
        },
        include: { registrations: true },
      });
    }

    // 5. Generate official registration number (ASTRA-FR-YYYY-XXXXXX)
    const registrationNumber = this.generateRegistrationNumber();
    const maskedBank = {
      ...data.bank,
      accountNumberMasked: this.maskAccountNumber(data.bank.accountNumber),
    };

    // 6. Create FarmerRegistration in PostgreSQL (Strictly VERIFICATION_PENDING)
    const registration = await this.prisma.farmerRegistration.create({
      data: {
        registrationNumber,
        farmerId: farmer.id,
        status: RegistrationStatus.VERIFICATION_PENDING,
        submittedAt: new Date(),
        personalDetails: data.personal as any,
        addressDetails: data.address as any,
        bankDetails: maskedBank as any,
        documents: data.documents as any,
        landParcels: {
          create: data.landParcels.map((parcel) => ({
            district: parcel.district || data.address.district,
            block: parcel.block || data.address.block,
            panchayat: parcel.panchayat || data.address.panchayat,
            village: parcel.village || data.address.village,
            khasraNumber: parcel.khasraNumber || (parcel as any).surveyNumber || 'N/A',
            areaAcres: Number(parcel.areaAcres || (parcel as any).areaInAcres || 0),
            ownershipType:
              ((String(parcel.ownershipType) === 'OWNED' ? 'OWNER' : parcel.ownershipType) as any) ||
              'OWNER',
          })),
        },
      },
      include: { landParcels: true },
    });

    // 7. Upsert FarmerVerification record for dedicated Authority workflow
    await this.prisma.farmerVerification.upsert({
      where: { farmerId: farmer.id },
      create: {
        farmerId: farmer.id,
        status: RegistrationStatus.VERIFICATION_PENDING,
        submittedAt: new Date(),
      },
      update: {
        status: RegistrationStatus.VERIFICATION_PENDING,
        submittedAt: new Date(),
        reason: null,
      },
    });

    // 8. Create audit record
    await this.prisma.auditLog.create({
      data: {
        eventType: 'FARMER_SUBMITTED',
        actorId: userId,
        actorRole: 'FARMER',
        reason: 'Farmer registration submitted for authority verification',
        newState: {
          registrationNumber,
          farmerCode: farmer.farmerCode,
          fullName: farmer.fullName,
          district: data.address.district,
        },
      },
    });

    this.logger.log(
      `Farmer registration submitted: ${registrationNumber} for farmer ${farmer.fullName} (${farmer.farmerCode}) - Status: VERIFICATION_PENDING`,
    );

    // 9. Non-blocking advisory check against external registry adapter (Clean mock)
    const totalLandArea = data.landParcels.reduce((acc, p) => acc + Number(p.areaAcres || 0), 0);
    this.verificationProvider
      .checkRegistry({
        registrationId: registration.id,
        registrationNumber: registration.registrationNumber,
        fullName: farmer.fullName,
        mobile: farmer.mobile,
        district: data.address.district,
        block: data.address.block,
        panchayat: data.address.panchayat,
        village: data.address.village,
        landAreaAcres: totalLandArea,
        bankIfsc: data.bank.ifscCode,
        bankAccountNumber: data.bank.accountNumber,
      })
      .catch((err) => {
        this.logger.warn(`External registry advisory check failed (non-blocking): ${err.message}`);
      });

    return this.mapRegistrationToSummary(registration);
  }

  /**
   * Updates an existing registration when status is RETURNED_FOR_CORRECTION, ACTION_REQUIRED or DRAFT.
   */
  async updateRegistration(userId: string, data: FarmerRegistrationDto): Promise<RegistrationSummaryDto> {
    const farmer = await this.prisma.farmer.findUnique({
      where: { userId },
      include: {
        registrations: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { landParcels: true },
        },
      },
    });

    if (!farmer || farmer.registrations.length === 0) {
      throw new NotFoundException('No registration record found to update.');
    }

    const reg = farmer.registrations[0];
    if (
      reg.status !== RegistrationStatus.RETURNED_FOR_CORRECTION &&
      reg.status !== RegistrationStatus.ACTION_REQUIRED &&
      reg.status !== RegistrationStatus.DRAFT
    ) {
      throw new BadRequestException(
        `Registration is in ${reg.status} status and cannot be modified directly.`,
      );
    }

    // Delete existing parcels and recreate
    await this.prisma.landParcel.deleteMany({
      where: { registrationId: reg.id },
    });

    const maskedBank = {
      ...data.bank,
      accountNumberMasked: this.maskAccountNumber(data.bank.accountNumber),
    };

    // Re-submit updated details for verification (Strictly VERIFICATION_PENDING)
    const updated = await this.prisma.farmerRegistration.update({
      where: { id: reg.id },
      data: {
        status: RegistrationStatus.VERIFICATION_PENDING,
        actionRequiredNotes: null,
        rejectionReason: null,
        reason: null,
        personalDetails: data.personal as any,
        addressDetails: data.address as any,
        bankDetails: maskedBank as any,
        documents: data.documents as any,
        landParcels: {
          create: data.landParcels.map((parcel) => ({
            district: parcel.district || data.address.district,
            block: parcel.block || data.address.block,
            panchayat: parcel.panchayat || data.address.panchayat,
            village: parcel.village || data.address.village,
            khasraNumber: parcel.khasraNumber || (parcel as any).surveyNumber || 'N/A',
            areaAcres: Number(parcel.areaAcres || (parcel as any).areaInAcres || 0),
            ownershipType:
              ((String(parcel.ownershipType) === 'OWNED' ? 'OWNER' : parcel.ownershipType) as any) ||
              'OWNER',
          })),
        },
      },
      include: { landParcels: true },
    });

    // Reset verification tracking record
    await this.prisma.farmerVerification.upsert({
      where: { farmerId: farmer.id },
      create: {
        farmerId: farmer.id,
        status: RegistrationStatus.VERIFICATION_PENDING,
        submittedAt: new Date(),
      },
      update: {
        status: RegistrationStatus.VERIFICATION_PENDING,
        submittedAt: new Date(),
        reason: null,
      },
    });

    // Record audit log
    await this.prisma.auditLog.create({
      data: {
        eventType: 'FARMER_SUBMITTED',
        actorId: userId,
        actorRole: 'FARMER',
        reason: 'Farmer re-submitted registration with corrections for authority verification',
        newState: {
          registrationNumber: reg.registrationNumber,
          farmerCode: farmer.farmerCode,
        },
      },
    });

    this.logger.log(`Registration updated and re-submitted for verification: ${reg.registrationNumber}`);
    return this.mapRegistrationToSummary(updated);
  }

  private mapRegistrationToSummary(reg: any): RegistrationSummaryDto {
    return {
      id: reg.id,
      registrationNumber: reg.registrationNumber,
      status: reg.status as RegistrationStatus,
      submittedAt: reg.submittedAt?.toISOString(),
      verifiedAt: reg.verifiedAt?.toISOString(),
      actionRequiredNotes: reg.actionRequiredNotes || undefined,
      rejectionReason: reg.rejectionReason || reg.reason || undefined,
      personal: reg.personalDetails || undefined,
      address: reg.addressDetails || undefined,
      bank: reg.bankDetails || undefined,
      documents: reg.documents || undefined,
      landParcels: reg.landParcels?.map((p: any) => ({
        id: p.id,
        district: p.district,
        block: p.block,
        panchayat: p.panchayat,
        village: p.village,
        khasraNumber: p.khasraNumber,
        areaAcres: p.areaAcres,
        ownershipType: p.ownershipType,
      })),
    };
  }
}
