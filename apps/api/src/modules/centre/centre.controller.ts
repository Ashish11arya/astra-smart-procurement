import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  ParseFloatPipe,
} from '@nestjs/common';
import { CentreService } from './centre.service';
import { JwtAuthGuard, AuthenticatedUser } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { UserRole, CounterStatus } from '@astra/shared';

@Controller()
export class CentreController {
  constructor(private readonly centreService: CentreService) {}

  @Get('public/procurement-summary')
  async getPublicProcurementSummary() {
    return this.centreService.getPublicProcurementSummary();
  }

  @Get('procurement-summary')
  async getProcurementSummary() {
    return this.centreService.getPublicProcurementSummary();
  }

  @Get('centres/states')
  async getStates() {
    return this.centreService.getStates();
  }

  @Get('centres/districts')
  async getDistricts(@Query('stateId') stateId?: string) {
    return this.centreService.getDistricts(stateId);
  }

  @Get('centres')
  async discoverCentres(
    @Query('stateId') stateId?: string,
    @Query('districtId') districtId?: string,
    @Query('search') search?: string,
    @Query('lat') latStr?: string,
    @Query('lon') lonStr?: string,
  ) {
    const lat = latStr ? parseFloat(latStr) : undefined;
    const lon = lonStr ? parseFloat(lonStr) : undefined;
    return this.centreService.discoverCentres({
      stateId,
      districtId,
      search,
      lat,
      lon,
    });
  }

  @Get('centres/:id')
  async getCentreDetails(@Param('id') id: string) {
    return this.centreService.getCentreDetails(id);
  }

  @Get('centre-officer/dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROCUREMENT_CENTRE_OFFICER, UserRole.GOVERNMENT_ADMIN)
  async getCentreOfficerDashboard(
    @CurrentUser() user: AuthenticatedUser,
    @Query('date') dateStr?: string,
  ) {
    return this.centreService.getCentreOfficerDashboard(user.userId, dateStr);
  }

  @Get('centre-officer/forecast')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROCUREMENT_CENTRE_OFFICER, UserRole.GOVERNMENT_ADMIN)
  async getCentreForecast(@CurrentUser() user: AuthenticatedUser) {
    return this.centreService.getCentreForecast(user.userId);
  }

  @Patch('centre-officer/counters/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROCUREMENT_CENTRE_OFFICER, UserRole.GOVERNMENT_ADMIN)
  async updateCounterStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') counterId: string,
    @Body('status') status: CounterStatus,
  ) {
    return this.centreService.updateCounterStatus(user.userId, counterId, status);
  }

  @Get('centre-officer/capacity')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROCUREMENT_CENTRE_OFFICER, UserRole.GOVERNMENT_ADMIN)
  async getCentreCapacityConfig(@CurrentUser() user: AuthenticatedUser) {
    return this.centreService.getCentreCapacityConfig(user.userId);
  }

  @Patch('centre-officer/capacity')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROCUREMENT_CENTRE_OFFICER, UserRole.GOVERNMENT_ADMIN)
  async updateCentreCapacityConfig(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: any,
  ) {
    return this.centreService.updateCentreCapacityConfig(user.userId, dto);
  }
}
