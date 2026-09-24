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
import { ProcurementService } from './procurement.service';
import { JwtAuthGuard, AuthenticatedUser } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { UserRole, CreateProcurementDecisionDto } from '@astra/shared';

@Controller('procurement')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PROCUREMENT_OFFICER, UserRole.PROCUREMENT, UserRole.GOVERNMENT_ADMIN)
export class ProcurementController {
  constructor(private readonly procurementService: ProcurementService) {}

  @Get('queue')
  async getProcurementQueue(@CurrentUser() user: AuthenticatedUser, @Query('date') dateStr?: string) {
    return this.procurementService.getProcurementQueue(user.userId, dateStr);
  }

  @Post(':bookingId')
  @HttpCode(HttpStatus.OK)
  async recordProcurementDecision(
    @CurrentUser() user: AuthenticatedUser,
    @Param('bookingId') bookingId: string,
    @Body() dto: CreateProcurementDecisionDto,
  ) {
    return this.procurementService.recordProcurementDecision(user.userId, bookingId, dto);
  }
}
