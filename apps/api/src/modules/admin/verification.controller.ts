import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard, AuthenticatedUser } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import {
  UserRole,
  FarmerVerificationDecisionDto,
} from '@astra/shared';

@Controller('verification')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.FARMER_VERIFICATION_AUTHORITY)
export class VerificationController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * Get operational workload statistics for Farmer Verification Authority
   */
  @Get('stats')
  async getVerificationStats() {
    return this.adminService.getAuthorityDashboardStats();
  }

  /**
   * Get applications queue for scrutiny and review
   */
  @Get('applications')
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

  /**
   * Get complete structured verification dossier for an application
   */
  @Get('applications/:id')
  async getFarmerApplicationDetail(@Param('id') farmerIdOrRegId: string) {
    return this.adminService.getFarmerApplicationDetail(farmerIdOrRegId);
  }

  /**
   * Authoritative verification decision (APPROVE | REJECT | RETURN_FOR_CORRECTION)
   * Strictly restricted to appointed FARMER_VERIFICATION_AUTHORITY officers.
   */
  @Post('applications/:id/decision')
  @HttpCode(HttpStatus.OK)
  async processFarmerDecision(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') farmerIdOrRegId: string,
    @Body() dto: FarmerVerificationDecisionDto,
  ) {
    if (user.role !== UserRole.FARMER_VERIFICATION_AUTHORITY) {
      throw new ForbiddenException(
        'Access denied: Operational verification decisions can only be executed by appointed Farmer Verification Authority officers.',
      );
    }
    return this.adminService.processFarmerDecision(user.userId, farmerIdOrRegId, dto);
  }

  /**
   * Get verification audit history
   */
  @Get('history')
  async getVerificationHistory(@Query('limit') limitStr?: string) {
    const limit = limitStr ? parseInt(limitStr, 10) : 50;
    return this.adminService.getAuditLogs(undefined, limit);
  }
}
