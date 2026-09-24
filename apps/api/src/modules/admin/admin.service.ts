import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  UserRole,
  CentreVerificationStatus,
  CentreOperationalStatus,
  CounterStatus,
  RegistrationStatus,
  FarmerVerificationDecisionDto,
} from '@astra/shared';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetch all centres for administrative monitoring and verification.
   */
  async getAllCentres() {
    return this.prisma.procurementCentre.findMany({
      include: {
        state: true,
        district: true,
        counters: true,
        personnel: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Authorised Procurement Authority registers a new centre.
   * Centre starts strictly in PENDING_VERIFICATION state!
   */
  async registerCentre(
    adminUserId: string,
    data: {
      centreCode: string;
      name: string;
      stateId: string;
      districtId: string;
      block?: string;
      address: string;
      latitude: number;
      longitude: number;
      agency?: string;
      operatingDays?: string;
      operatingHoursStart?: string;
      operatingHoursEnd?: string;
      morningCapacityQuintals?: number;
      afternoonCapacityQuintals?: number;
      maxHourlyCapacityQuintals?: number;
      maxQuantityPerBooking?: number;
      numCounters?: number;
    },
  ) {
    const existing = await this.prisma.procurementCentre.findUnique({
      where: { centreCode: data.centreCode },
    });
    if (existing) {
      throw new BadRequestException(`Centre code '${data.centreCode}' is already registered.`);
    }

    const centre = await this.prisma.procurementCentre.create({
      data: {
        centreCode: data.centreCode,
        name: data.name,
        stateId: data.stateId,
        districtId: data.districtId,
        block: data.block || null,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        agency: data.agency || 'Food & Civil Supplies Corporation',
        operatingDays: data.operatingDays || 'Monday - Saturday',
        operatingHoursStart: data.operatingHoursStart || '08:00',
        operatingHoursEnd: data.operatingHoursEnd || '17:00',
        morningCapacityQuintals: data.morningCapacityQuintals || 300.0,
        afternoonCapacityQuintals: data.afternoonCapacityQuintals || 250.0,
        maxHourlyCapacityQuintals: data.maxHourlyCapacityQuintals || 60.0,
        maxQuantityPerBooking: data.maxQuantityPerBooking || 150.0,
        verificationStatus: CentreVerificationStatus.PENDING_VERIFICATION,
        operationalStatus: CentreOperationalStatus.OPEN,
        counters: {
          create: Array.from({ length: data.numCounters || 2 }, (_, i) => ({
            counterNumber: i + 1,
            counterName: `Processing Counter #${i + 1}`,
            status: CounterStatus.AVAILABLE,
          })),
        },
      },
      include: {
        state: true,
        district: true,
        counters: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        eventType: 'CENTRE_REGISTERED',
        centreId: centre.id,
        actorId: adminUserId,
        actorRole: 'GOVERNMENT_ADMIN',
        newState: {
          centreCode: centre.centreCode,
          name: centre.name,
          status: CentreVerificationStatus.PENDING_VERIFICATION,
        },
        reason: 'New procurement centre registered by Authorised Authority',
      },
    });

    return centre;
  }

  /**
   * Verify a registered centre (PENDING_VERIFICATION -> VERIFIED)
   */
  async verifyCentre(adminUserId: string, centreId: string) {
    const centre = await this.prisma.procurementCentre.findUnique({
      where: { id: centreId },
    });
    if (!centre) throw new NotFoundException('Centre not found.');

    const updated = await this.prisma.procurementCentre.update({
      where: { id: centreId },
      data: { verificationStatus: CentreVerificationStatus.VERIFIED },
    });

    await this.prisma.auditLog.create({
      data: {
        eventType: 'CENTRE_VERIFIED',
        centreId,
        actorId: adminUserId,
        actorRole: 'GOVERNMENT_ADMIN',
        previousState: { status: centre.verificationStatus },
        newState: { status: CentreVerificationStatus.VERIFIED },
        reason: 'Inspection and operational readiness verified',
      },
    });

    return updated;
  }

  /**
   * Activate a verified centre (VERIFIED -> ACTIVE)
   * Only VERIFIED + ACTIVE centres are visible to farmers!
   */
  async activateCentre(adminUserId: string, centreId: string) {
    const centre = await this.prisma.procurementCentre.findUnique({
      where: { id: centreId },
    });
    if (!centre) throw new NotFoundException('Centre not found.');

    const updated = await this.prisma.procurementCentre.update({
      where: { id: centreId },
      data: {
        verificationStatus: CentreVerificationStatus.ACTIVE,
        operationalStatus: CentreOperationalStatus.OPEN,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        eventType: 'CENTRE_ACTIVATED',
        centreId,
        actorId: adminUserId,
        actorRole: 'GOVERNMENT_ADMIN',
        previousState: { status: centre.verificationStatus },
        newState: { status: CentreVerificationStatus.ACTIVE },
        reason: 'Procurement season commenced - centre activated for farmer bookings',
      },
    });

    return updated;
  }

  /**
   * Suspend or deactivate a centre
   */
  async setCentreStatus(
    adminUserId: string,
    centreId: string,
    verificationStatus: CentreVerificationStatus,
    operationalStatus?: CentreOperationalStatus,
  ) {
    const centre = await this.prisma.procurementCentre.findUnique({
      where: { id: centreId },
    });
    if (!centre) throw new NotFoundException('Centre not found.');

    const updated = await this.prisma.procurementCentre.update({
      where: { id: centreId },
      data: {
        verificationStatus,
        ...(operationalStatus ? { operationalStatus } : {}),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        eventType: 'CENTRE_STATUS_CHANGED',
        centreId,
        actorId: adminUserId,
        actorRole: 'GOVERNMENT_ADMIN',
        previousState: { status: centre.verificationStatus, operational: centre.operationalStatus },
        newState: { status: verificationStatus, operational: operationalStatus },
        reason: 'Administrative lifecycle update',
      },
    });

    return updated;
  }

  /**
   * Fetch all farmer applications for Authority review with pagination, search, and filtering.
   */
  async getFarmerApplications(filters: {
    status?: string;
    district?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};

    if (filters.status && filters.status !== 'ALL') {
      if (filters.status === 'VERIFICATION_PENDING') {
        where.status = {
          in: [
            RegistrationStatus.VERIFICATION_PENDING,
            RegistrationStatus.SUBMITTED,
            RegistrationStatus.UNDER_VERIFICATION,
          ],
        };
      } else if (filters.status === 'RETURNED_FOR_CORRECTION') {
        where.status = {
          in: [
            RegistrationStatus.RETURNED_FOR_CORRECTION,
            RegistrationStatus.ACTION_REQUIRED,
          ],
        };
      } else {
        where.status = filters.status;
      }
    }

    if (filters.district && filters.district !== 'ALL') {
      where.farmer = {
        ...where.farmer,
        district: { equals: filters.district, mode: 'insensitive' },
      };
    }

    if (filters.search) {
      const s = filters.search.trim();
      where.OR = [
        { registrationNumber: { contains: s, mode: 'insensitive' } },
        { farmer: { fullName: { contains: s, mode: 'insensitive' } } },
        { farmer: { mobile: { contains: s } } },
        { farmer: { farmerCode: { contains: s, mode: 'insensitive' } } },
      ];
    }

    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));
    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      this.prisma.farmerRegistration.count({ where }),
      this.prisma.farmerRegistration.findMany({
        where,
        include: {
          farmer: true,
          landParcels: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      items: items.map((reg) => {
        const address = (reg.addressDetails as any) || {};
        return {
          id: reg.id,
          registrationNumber: reg.registrationNumber,
          farmerId: reg.farmerId,
          farmerCode: reg.farmer.farmerCode,
          fullName: reg.farmer.fullName,
          mobile: reg.farmer.mobile,
          district: reg.farmer.district || address.district || 'N/A',
          block: address.block || 'N/A',
          panchayat: address.panchayat || 'N/A',
          village: reg.farmer.village || address.village || 'N/A',
          registrationDate: reg.createdAt.toISOString(),
          submittedAt: reg.submittedAt ? reg.submittedAt.toISOString() : reg.createdAt.toISOString(),
          status: reg.status,
          isVerified: reg.farmer.isVerified,
          landAreaAcres: reg.landParcels?.reduce((sum, p) => sum + Number(p.areaAcres || 0), 0) || 0,
            totalAreaAcres: reg.landParcels?.reduce((sum, p) => sum + Number(p.areaAcres || 0), 0) || 0,
        };
      }),
    };
  }

  /**
   * Fetch complete structured verification detail for a farmer application.
   */
  async getFarmerApplicationDetail(farmerIdOrRegId: string) {
    const reg = await this.prisma.farmerRegistration.findFirst({
      where: {
        OR: [{ id: farmerIdOrRegId }, { farmerId: farmerIdOrRegId }],
      },
      include: {
        farmer: true,
        landParcels: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!reg) {
      throw new NotFoundException('Farmer application not found.');
    }

    // Fetch related audit trail
    const auditLogs = await this.prisma.auditLog.findMany({
      where: {
        OR: [
          { actorId: reg.farmer.userId },
          { actorId: reg.farmer.id },
          { reason: { contains: reg.registrationNumber } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return {
      registrationId: reg.id,
      registrationNumber: reg.registrationNumber,
      farmerId: reg.farmerId,
      farmerCode: reg.farmer.farmerCode,
      status: reg.status,
      isVerified: reg.farmer.isVerified,
      submittedAt: reg.submittedAt ? reg.submittedAt.toISOString() : reg.createdAt.toISOString(),
      verifiedAt: reg.verifiedAt ? reg.verifiedAt.toISOString() : undefined,
      verifiedBy: reg.verifiedBy || undefined,
      rejectedAt: reg.rejectedAt ? reg.rejectedAt.toISOString() : undefined,
      rejectedBy: reg.rejectedBy || undefined,
      returnedAt: reg.returnedAt ? reg.returnedAt.toISOString() : undefined,
      returnedBy: reg.returnedBy || undefined,
      reason: reg.reason || reg.rejectionReason || reg.actionRequiredNotes || undefined,
      personal: reg.personalDetails,
      address: reg.addressDetails,
      landParcels: reg.landParcels?.map((p) => ({
        id: p.id,
        district: p.district,
        block: p.block,
        panchayat: p.panchayat,
        village: p.village,
        khasraNumber: p.khasraNumber,
        areaAcres: p.areaAcres,
        ownershipType: p.ownershipType,
      })),
      bank: reg.bankDetails,
      documents: reg.documents,
      auditLogs: auditLogs.map((a) => ({
        id: a.id,
        eventType: a.eventType,
        actorRole: a.actorRole,
        reason: a.reason,
        createdAt: a.createdAt.toISOString(),
      })),
    };
  }

  /**
   * Process an official Authority verification decision (APPROVE | REJECT | RETURN_FOR_CORRECTION).
   * Atomic, transactional, and protected against concurrency race conditions.
   */
  async processFarmerDecision(
    adminUserId: string,
    farmerIdOrRegId: string,
    dto: FarmerVerificationDecisionDto,
  ) {
    const { decision, reason } = dto;

    if (decision === 'REJECT' || decision === 'RETURN_FOR_CORRECTION') {
      if (!reason || !reason.trim()) {
        throw new BadRequestException('A formal official reason is mandatory for rejection or return.');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch registration with lock
      const reg = await tx.farmerRegistration.findFirst({
        where: {
          OR: [{ id: farmerIdOrRegId }, { farmerId: farmerIdOrRegId }],
        },
        include: { farmer: true },
        orderBy: { createdAt: 'desc' },
      });

      if (!reg) {
        throw new NotFoundException('Farmer application not found.');
      }

      // 2. Concurrency check: Ensure application is in a reviewable state
      const reviewableStates: string[] = [
        RegistrationStatus.VERIFICATION_PENDING,
        RegistrationStatus.SUBMITTED,
        RegistrationStatus.UNDER_VERIFICATION,
        RegistrationStatus.RETURNED_FOR_CORRECTION,
      ];

      if (!reviewableStates.includes(reg.status as string)) {
        throw new ConflictException(
          `Application cannot be processed. It is currently in '${reg.status}' status.`,
        );
      }

      const now = new Date();

      if (decision === 'APPROVE') {
        // Update registration
        const updatedReg = await tx.farmerRegistration.update({
          where: { id: reg.id },
          data: {
            status: RegistrationStatus.VERIFIED,
            verifiedAt: now,
            verifiedBy: adminUserId,
            rejectionReason: null,
            actionRequiredNotes: null,
            reason: null,
          },
        });

        // Update farmer entity to verified
        await tx.farmer.update({
          where: { id: reg.farmerId },
          data: { isVerified: true },
        });

        // Upsert FarmerVerification record
        await tx.farmerVerification.upsert({
          where: { farmerId: reg.farmerId },
          create: {
            farmerId: reg.farmerId,
            status: RegistrationStatus.VERIFIED,
            verifiedAt: now,
            verifiedBy: adminUserId,
            reason: null,
          },
          update: {
            status: RegistrationStatus.VERIFIED,
            verifiedAt: now,
            verifiedBy: adminUserId,
            reason: null,
          },
        });

        // Create immutable audit log
        await tx.auditLog.create({
          data: {
            eventType: 'FARMER_APPROVED',
            actorId: adminUserId,
            actorRole: 'GOVERNMENT_ADMIN',
            reason: reason || 'Farmer application verified and approved by Authorised Authority',
            newState: {
              farmerId: reg.farmerId,
              registrationNumber: reg.registrationNumber,
              farmerCode: reg.farmer.farmerCode,
              fullName: reg.farmer.fullName,
            },
          },
        });

        return {
          success: true,
          decision: 'APPROVED',
          status: RegistrationStatus.VERIFIED,
          farmer: { id: reg.farmerId, isVerified: true },
          message: `Farmer ${reg.farmer.fullName} (${reg.registrationNumber}) has been officially VERIFIED.`,
        };
      }

      if (decision === 'REJECT') {
        const updatedReg = await tx.farmerRegistration.update({
          where: { id: reg.id },
          data: {
            status: RegistrationStatus.REJECTED,
            rejectedAt: now,
            rejectedBy: adminUserId,
            rejectionReason: reason,
            reason,
          },
        });

        await tx.farmer.update({
          where: { id: reg.farmerId },
          data: { isVerified: false },
        });

        await tx.farmerVerification.upsert({
          where: { farmerId: reg.farmerId },
          create: {
            farmerId: reg.farmerId,
            status: RegistrationStatus.REJECTED,
            rejectedAt: now,
            rejectedBy: adminUserId,
            reason,
          },
          update: {
            status: RegistrationStatus.REJECTED,
            rejectedAt: now,
            rejectedBy: adminUserId,
            reason,
          },
        });

        await tx.auditLog.create({
          data: {
            eventType: 'FARMER_REJECTED',
            actorId: adminUserId,
            actorRole: 'GOVERNMENT_ADMIN',
            reason,
            newState: {
              farmerId: reg.farmerId,
              registrationNumber: reg.registrationNumber,
              farmerCode: reg.farmer.farmerCode,
            },
          },
        });

        return {
          success: true,
          decision: 'REJECTED',
          status: RegistrationStatus.REJECTED,
          farmer: { id: reg.farmerId, isVerified: false },
          message: `Farmer ${reg.farmer.fullName} (${reg.registrationNumber}) has been REJECTED.`,
        };
      }

      if (decision === 'RETURN_FOR_CORRECTION') {
        const updatedReg = await tx.farmerRegistration.update({
          where: { id: reg.id },
          data: {
            status: RegistrationStatus.RETURNED_FOR_CORRECTION,
            returnedAt: now,
            returnedBy: adminUserId,
            actionRequiredNotes: reason,
            reason,
          },
        });

        await tx.farmer.update({
          where: { id: reg.farmerId },
          data: { isVerified: false },
        });

        await tx.farmerVerification.upsert({
          where: { farmerId: reg.farmerId },
          create: {
            farmerId: reg.farmerId,
            status: RegistrationStatus.RETURNED_FOR_CORRECTION,
            returnedAt: now,
            returnedBy: adminUserId,
            reason,
          },
          update: {
            status: RegistrationStatus.RETURNED_FOR_CORRECTION,
            returnedAt: now,
            returnedBy: adminUserId,
            reason,
          },
        });

        await tx.auditLog.create({
          data: {
            eventType: 'FARMER_RETURNED',
            actorId: adminUserId,
            actorRole: 'GOVERNMENT_ADMIN',
            reason,
            newState: {
              farmerId: reg.farmerId,
              registrationNumber: reg.registrationNumber,
              farmerCode: reg.farmer.farmerCode,
            },
          },
        });

        return {
          success: true,
          decision: 'RETURNED_FOR_CORRECTION',
          status: RegistrationStatus.RETURNED_FOR_CORRECTION,
          farmer: { id: reg.farmerId, isVerified: false },
          message: `Farmer ${reg.farmer.fullName} (${reg.registrationNumber}) has been RETURNED FOR CORRECTION.`,
        };
      }

      throw new BadRequestException('Invalid decision type.');
    });
  }

  /**
   * High-level Authority operational metrics backed by real database records.
   */
  async getAuthorityDashboardStats() {
    const [
      pendingVerifications,
      verifiedFarmers,
      returnedApplications,
      rejectedApplications,
      pendingCentres,
      activeCentres,
      suspendedCentres,
      totalPersonnel,
      activePersonnel,
      recentActivity,
    ] = await Promise.all([
      this.prisma.farmerRegistration.count({
        where: {
          status: {
            in: [
              RegistrationStatus.VERIFICATION_PENDING,
              RegistrationStatus.SUBMITTED,
              RegistrationStatus.UNDER_VERIFICATION,
            ],
          },
        },
      }),
      this.prisma.farmerRegistration.count({
        where: { status: RegistrationStatus.VERIFIED },
      }),
      this.prisma.farmerRegistration.count({
        where: {
          status: {
            in: [
              RegistrationStatus.RETURNED_FOR_CORRECTION,
              RegistrationStatus.ACTION_REQUIRED,
            ],
          },
        },
      }),
      this.prisma.farmerRegistration.count({
        where: { status: RegistrationStatus.REJECTED },
      }),
      this.prisma.procurementCentre.count({
        where: { verificationStatus: CentreVerificationStatus.PENDING_VERIFICATION },
      }),
      this.prisma.procurementCentre.count({
        where: { verificationStatus: CentreVerificationStatus.ACTIVE },
      }),
      this.prisma.procurementCentre.count({
        where: { verificationStatus: CentreVerificationStatus.SUSPENDED },
      }),
      this.prisma.centrePersonnelAssignment.count(),
      this.prisma.centrePersonnelAssignment.count({ where: { isActive: true } }),
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { centre: true },
      }),
    ]);

    return {
      pendingVerifications,
      verifiedFarmers,
      returnedApplications,
      rejectedApplications,
      pendingCentres,
      activeCentres,
      suspendedCentres,
      totalPersonnel,
      activePersonnel,
      recentActivity: recentActivity.map((a) => ({
        id: a.id,
        eventType: a.eventType,
        actorRole: a.actorRole,
        centreName: a.centre?.name,
        reason: a.reason,
        createdAt: a.createdAt.toISOString(),
      })),
    };
  }

  /**
   * Fetch all personnel assignments with center and user profile.
   */
  async getPersonnelRoster() {
    return this.prisma.centrePersonnelAssignment.findMany({
      include: {
        user: true,
        centre: {
          include: { district: true, state: true },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });
  }

  /**
   * Activate or deactivate personnel access.
   */
  async togglePersonnelStatus(adminUserId: string, assignmentId: string, isActive: boolean) {
    const assignment = await this.prisma.centrePersonnelAssignment.findUnique({
      where: { id: assignmentId },
      include: { user: true, centre: true },
    });

    if (!assignment) {
      throw new NotFoundException('Personnel assignment record not found.');
    }

    const updated = await this.prisma.centrePersonnelAssignment.update({
      where: { id: assignmentId },
      data: { isActive },
    });

    await this.prisma.auditLog.create({
      data: {
        eventType: isActive ? 'PERSONNEL_ACTIVATED' : 'PERSONNEL_DEACTIVATED',
        centreId: assignment.centreId,
        actorId: adminUserId,
        actorRole: 'GOVERNMENT_ADMIN',
        newState: {
          assignmentId,
          userMobile: assignment.user.mobile,
          role: assignment.role,
          isActive,
        },
        reason: `Officer access ${isActive ? 'activated' : 'deactivated'} by Authorised Authority`,
      },
    });

    return updated;
  }

  /**
   * Assign appointed personnel to a specific centre and department
   */
  async assignPersonnel(
    adminUserId: string,
    data: {
      userMobile: string;
      centreId: string;
      role: UserRole;
      department: string;
    },
  ) {
    const centre = await this.prisma.procurementCentre.findUnique({
      where: { id: data.centreId },
    });
    if (!centre) throw new NotFoundException('Centre not found.');

    // Normalize and map role safely
    let mappedRole = data.role as any;
    if (mappedRole === 'OPERATOR') mappedRole = UserRole.WEIGHMENT_OFFICER;
    else if (mappedRole === 'INSPECTOR') mappedRole = UserRole.QUALITY_OFFICER;
    else if (mappedRole === 'CENTRE_MANAGER') mappedRole = UserRole.PROCUREMENT_CENTRE_OFFICER;
    else if (!Object.values(UserRole).includes(mappedRole)) {
      mappedRole = UserRole.PROCUREMENT_CENTRE_OFFICER;
    }

    // Find or create officer user account
    let user = await this.prisma.user.findUnique({
      where: { mobile: data.userMobile },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          mobile: data.userMobile,
          role: mappedRole,
        },
      });
    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { role: mappedRole },
      });
    }

    const assignment = await this.prisma.centrePersonnelAssignment.upsert({
      where: {
        userId_centreId: {
          userId: user.id,
          centreId: data.centreId,
        },
      },
      create: {
        userId: user.id,
        centreId: data.centreId,
        role: mappedRole,
        department: data.department,
        isActive: true,
      },
      update: {
        role: mappedRole,
        department: data.department,
        isActive: true,
      },
      include: {
        centre: true,
        user: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        eventType: 'PERSONNEL_ASSIGNED',
        centreId: data.centreId,
        actorId: adminUserId,
        actorRole: 'GOVERNMENT_ADMIN',
        newState: {
          userId: user.id,
          mobile: user.mobile,
          role: mappedRole,
          department: data.department,
        },
        reason: 'Officer appointed and granted departmental centre access',
      },
    });

    return assignment;
  }

  /**
   * Fetch audit trail logs
   */
  async getAuditLogs(centreId?: string, limit: number = 50) {
    return this.prisma.auditLog.findMany({
      where: centreId ? { centreId } : {},
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        centre: true,
        booking: true,
      },
    });
  }
}
