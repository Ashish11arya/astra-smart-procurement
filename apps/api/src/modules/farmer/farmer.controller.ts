import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { FarmerService } from './farmer.service';
import { BookingService } from '../booking/booking.service';
import { JwtAuthGuard, AuthenticatedUser } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import {
  FarmerRegistrationDto,
  FarmerStatusResponseDto,
  RegistrationSummaryDto,
  FarmerDashboardSummaryDto,
  FarmerBookingDetailDto,
} from '@astra/shared';

@Controller('farmer')
@UseGuards(JwtAuthGuard)
export class FarmerController {
  constructor(
    private readonly farmerService: FarmerService,
    @Inject(forwardRef(() => BookingService))
    private readonly bookingService: BookingService,
  ) {}

  @Get('me')
  async getMe(@CurrentUser() user: AuthenticatedUser): Promise<FarmerStatusResponseDto> {
    return this.farmerService.getFarmerMe(user.userId);
  }

  @Get('dashboard')
  async getDashboard(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<FarmerDashboardSummaryDto> {
    return this.bookingService.getFarmerDashboardSummary(user.userId);
  }

  @Get('bookings/:id')
  async getBookingDetail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<FarmerBookingDetailDto> {
    return this.bookingService.getAuthorizedBookingDetail(user.userId, id);
  }

  @Get('registration-status')
  async getRegistrationStatus(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<RegistrationSummaryDto> {
    return this.farmerService.getRegistrationStatus(user.userId);
  }

  @Post('registration')
  @HttpCode(HttpStatus.CREATED)
  async submitRegistration(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: FarmerRegistrationDto,
  ): Promise<RegistrationSummaryDto> {
    return this.farmerService.submitRegistration(user.userId, body);
  }

  @Put('registration')
  @HttpCode(HttpStatus.OK)
  async updateRegistration(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: FarmerRegistrationDto,
  ): Promise<RegistrationSummaryDto> {
    return this.farmerService.updateRegistration(user.userId, body);
  }
}
