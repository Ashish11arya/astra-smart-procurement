import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard, AuthenticatedUser } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import {
  UserRole,
  CentreVerificationStatus,
  CentreOperationalStatus,
  FarmerVerificationDecisionDto,
} from '@astra/shared';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.GOVERNMENT_ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  async getDashboardStats() {
    return this.adminService.getAuthorityDashboardStats();
  }

  @Get('farmers')
  async getFarmerApplications(
    @Query('status') status?: string,
    @Query('district') district?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getFarmerApplications({
      status,
      district,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get('farmers/:id')
  async getFarmerApplicationDetail(@Param('id') farmerIdOrRegId: string) {
    return this.adminService.getFarmerApplicationDetail(farmerIdOrRegId);
  }

  @Post('farmers/:id/decision')
  @HttpCode(HttpStatus.OK)
  async processFarmerDecision(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') farmerIdOrRegId: string,
    @Body() dto: FarmerVerificationDecisionDto,
  ) {
    throw new ForbiddenException(
      'Operational farmer verification decisions cannot be executed by State Authority. Operational scrutiny and decisions are strictly restricted to appointed Farmer Verification Authority officers.',
    );
  }

  @Get('personnel')
  async getPersonnelRoster() {
    return this.adminService.getPersonnelRoster();
  }

  @Patch('personnel/:id/status')
  async togglePersonnelStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') assignmentId: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.adminService.togglePersonnelStatus(user.userId, assignmentId, isActive);
  }

  @Put('personnel/:id/status')
  async togglePersonnelStatusPut(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') assignmentId: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.adminService.togglePersonnelStatus(user.userId, assignmentId, isActive);
  }

  @Get('centres')
  async getAllCentres() {
    return this.adminService.getAllCentres();
  }

  @Post('centres')
  @HttpCode(HttpStatus.CREATED)
  async registerCentre(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
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
    return this.adminService.registerCentre(user.userId, body);
  }

  @Patch('centres/:id/verify')
  async verifyCentre(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') centreId: string,
  ) {
    return this.adminService.verifyCentre(user.userId, centreId);
  }

  @Patch('centres/:id/activate')
  async activateCentre(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') centreId: string,
  ) {
    return this.adminService.activateCentre(user.userId, centreId);
  }

  @Patch('centres/:id/status')
  async setCentreStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') centreId: string,
    @Body('verificationStatus') verificationStatus: CentreVerificationStatus,
    @Body('operationalStatus') operationalStatus?: CentreOperationalStatus,
  ) {
    return this.adminService.setCentreStatus(user.userId, centreId, verificationStatus, operationalStatus);
  }

  @Post('personnel')
  @HttpCode(HttpStatus.OK)
  async assignPersonnel(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      userMobile?: string;
      mobile?: string;
      centreId: string;
      role: UserRole;
      department: string;
    },
  ) {
    const userMobile = body.userMobile || body.mobile;
    if (!userMobile) {
      throw new BadRequestException('Officer mobile number is required.');
    }
    return this.adminService.assignPersonnel(user.userId, {
      ...body,
      userMobile,
    });
  }

  @Post('personnel/assign')
  @HttpCode(HttpStatus.OK)
  async assignPersonnelAlias(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      userMobile?: string;
      mobile?: string;
      centreId: string;
      role: UserRole;
      department: string;
    },
  ) {
    return this.assignPersonnel(user, body);
  }

  @Get('audit-logs')
  async getAuditLogs(
    @Query('centreId') centreId?: string,
    @Query('limit') limitStr?: string,
  ) {
    const limit = limitStr ? parseInt(limitStr, 10) : 50;
    return this.adminService.getAuditLogs(centreId, limit);
  }
}
