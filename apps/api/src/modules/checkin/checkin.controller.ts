import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CheckinService } from './checkin.service';
import { JwtAuthGuard, AuthenticatedUser } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { UserRole } from '@astra/shared';

@Controller('checkin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CHECK_IN_OFFICER, UserRole.CHECK_IN, UserRole.GOVERNMENT_ADMIN)
export class CheckinController {
  constructor(private readonly checkinService: CheckinService) {}

  @Get('today')
  async getTodayScheduledArrivals(@CurrentUser() user: AuthenticatedUser) {
    return this.checkinService.getTodayScheduledArrivals(user.userId);
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  async validateBooking(
    @CurrentUser() user: AuthenticatedUser,
    @Body('tokenOrNumber') tokenOrNumber: string,
  ) {
    return this.checkinService.validateBookingForCheckin(user.userId, tokenOrNumber);
  }

  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  async confirmCheckin(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { bookingId?: string; tokenOrNumber?: string },
  ) {
    const target = body.bookingId || body.tokenOrNumber;
    return this.checkinService.confirmCheckin(user.userId, target || '');
  }

  @Post(':bookingId')
  @HttpCode(HttpStatus.OK)
  async performCheckin(
    @CurrentUser() user: AuthenticatedUser,
    @Param('bookingId') bookingId: string,
  ) {
    return this.checkinService.confirmCheckin(user.userId, bookingId);
  }
}
