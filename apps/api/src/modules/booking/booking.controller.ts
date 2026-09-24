import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { JwtAuthGuard, AuthenticatedUser } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import {
  BookingEstimateRequestDto,
  CreateBookingDto,
  FarmerDashboardSummaryDto,
  FarmerBookingDetailDto,
} from '@astra/shared';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get('capacity')
  async getBookingCapacity(
    @CurrentUser() user: AuthenticatedUser,
    @Query('date') dateStr?: string,
    @Query('centreId') centreId?: string,
  ) {
    return this.bookingService.getCapacity(user.userId, centreId, dateStr);
  }

  @Post('estimate')
  @HttpCode(HttpStatus.OK)
  async estimateBooking(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: BookingEstimateRequestDto,
  ) {
    return this.bookingService.estimateBooking(user.userId, dto);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createBooking(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookingService.createBooking(user.userId, dto);
  }

  @Get('dashboard-summary')
  async getDashboardSummary(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<FarmerDashboardSummaryDto> {
    return this.bookingService.getFarmerDashboardSummary(user.userId);
  }

  @Get('my-visits')
  async getMyVisits(@CurrentUser() user: AuthenticatedUser) {
    return this.bookingService.getMyVisits(user.userId);
  }

  @Get(':id/detail')
  async getBookingDetail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<FarmerBookingDetailDto> {
    return this.bookingService.getAuthorizedBookingDetail(user.userId, id);
  }

  @Get(':id')
  async getBookingById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<FarmerBookingDetailDto> {
    return this.bookingService.getAuthorizedBookingDetail(user.userId, id);
  }

  @Patch(':id/cancel')
  async cancelBooking(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.bookingService.cancelBooking(user.userId, id, reason);
  }
}
