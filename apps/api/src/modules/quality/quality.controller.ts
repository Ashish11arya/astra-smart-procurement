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
import { QualityService } from './quality.service';
import { JwtAuthGuard, AuthenticatedUser } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { UserRole, CreateQualityAssessmentDto } from '@astra/shared';

@Controller('quality')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.QUALITY_OFFICER, UserRole.QUALITY, UserRole.GOVERNMENT_ADMIN)
export class QualityController {
  constructor(private readonly qualityService: QualityService) {}

  @Get('queue')
  async getQualityQueue(@CurrentUser() user: AuthenticatedUser, @Query('date') dateStr?: string) {
    return this.qualityService.getQualityQueue(user.userId, dateStr);
  }

  @Post(':bookingId')
  @HttpCode(HttpStatus.OK)
  async recordQualityAssessment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('bookingId') bookingId: string,
    @Body() dto: CreateQualityAssessmentDto,
  ) {
    return this.qualityService.recordQualityAssessment(user.userId, bookingId, dto);
  }
}
