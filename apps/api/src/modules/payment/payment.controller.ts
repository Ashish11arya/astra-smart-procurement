import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard, AuthenticatedUser } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { UserRole, CreatePaymentSettlementDto } from '@astra/shared';

@Controller('payment')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PAYMENT_OFFICER, UserRole.PAYMENT, UserRole.GOVERNMENT_ADMIN)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('queue')
  async getPaymentQueue(@CurrentUser() user: AuthenticatedUser, @Query('date') dateStr?: string) {
    return this.paymentService.getPaymentQueue(user.userId, dateStr);
  }

  @Post(':bookingId')
  @HttpCode(HttpStatus.OK)
  async recordPaymentSettlement(
    @CurrentUser() user: AuthenticatedUser,
    @Param('bookingId') bookingId: string,
    @Body() dto: CreatePaymentSettlementDto,
  ) {
    return this.paymentService.recordPaymentSettlement(user.userId, bookingId, dto);
  }
}
