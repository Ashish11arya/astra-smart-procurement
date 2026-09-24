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
} from '@nestjs/common';
import { WeighmentService } from './weighment.service';
import { JwtAuthGuard, AuthenticatedUser } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import {
  UserRole,
  HardwareSimulateReadingDto,
  WeighmentCorrectionRequestDto,
  WeighmentSupervisorDecisionDto,
} from '@astra/shared';

@Controller('weighment')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WeighmentController {
  constructor(private readonly weighmentService: WeighmentService) {}

  @Get('queue')
  @Roles(
    UserRole.WEIGHMENT_OFFICER,
    UserRole.WEIGHMENT,
    UserRole.WEIGHMENT_SUPERVISOR,
    UserRole.GOVERNMENT_ADMIN,
  )
  async getWeighmentQueue(@CurrentUser() user: AuthenticatedUser, @Query('date') dateStr?: string) {
    return this.weighmentService.getWeighmentQueue(user.userId, dateStr);
  }

  @Post('hardware-simulate')
  @HttpCode(HttpStatus.OK)
  @Roles(
    UserRole.WEIGHMENT_OFFICER,
    UserRole.WEIGHMENT,
    UserRole.WEIGHMENT_SUPERVISOR,
    UserRole.GOVERNMENT_ADMIN,
  )
  async simulateHardwareReading(@Body() dto: HardwareSimulateReadingDto) {
    return this.weighmentService.simulateHardwareReading(dto);
  }

  @Post(':bookingId/confirm')
  @HttpCode(HttpStatus.OK)
  @Roles(
    UserRole.WEIGHMENT_OFFICER,
    UserRole.WEIGHMENT,
    UserRole.WEIGHMENT_SUPERVISOR,
    UserRole.GOVERNMENT_ADMIN,
  )
  async confirmHardwareWeighment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('bookingId') bookingId: string,
    @Body('deviceCode') deviceCode: string,
    @Body('hardwareWeightQuintals') hardwareWeightQuintals: number,
  ) {
    return this.weighmentService.confirmHardwareWeighment(
      user.userId,
      bookingId,
      deviceCode,
      hardwareWeightQuintals,
    );
  }

  @Post(':bookingId/correction-request')
  @HttpCode(HttpStatus.OK)
  @Roles(
    UserRole.WEIGHMENT_OFFICER,
    UserRole.WEIGHMENT,
    UserRole.WEIGHMENT_SUPERVISOR,
    UserRole.GOVERNMENT_ADMIN,
  )
  async raiseCorrectionRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('bookingId') bookingId: string,
    @Body() dto: WeighmentCorrectionRequestDto,
  ) {
    return this.weighmentService.raiseCorrectionRequest(user.userId, bookingId, dto);
  }

  @Get('supervisor/pending-corrections')
  @Roles(UserRole.WEIGHMENT_SUPERVISOR, UserRole.GOVERNMENT_ADMIN)
  async getPendingCorrections(@CurrentUser() user: AuthenticatedUser) {
    return this.weighmentService.getPendingCorrections(user.userId);
  }

  @Post('supervisor/:recordId/decision')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.WEIGHMENT_SUPERVISOR, UserRole.GOVERNMENT_ADMIN)
  async supervisorDecision(
    @CurrentUser() user: AuthenticatedUser,
    @Param('recordId') recordId: string,
    @Body() dto: WeighmentSupervisorDecisionDto,
    @Body('requestedFinalWeightQuintals') requestedFinalWeightQuintals?: number,
  ) {
    return this.weighmentService.supervisorDecision(
      user.userId,
      recordId,
      dto,
      requestedFinalWeightQuintals,
    );
  }
}
