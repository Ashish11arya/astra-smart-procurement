import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  RequestOtpDto,
  VerifyOtpDto,
  RequestOtpResponseDto,
  VerifyOtpResponseDto,
  CheckFarmerRegistrationResponseDto,
} from '@astra/shared';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('farmer/check-registration')
  @HttpCode(HttpStatus.OK)
  async checkFarmerRegistration(
    @Body() body: { mobile?: string; mobileNumber?: string },
  ): Promise<CheckFarmerRegistrationResponseDto> {
    const mobile = body.mobile || body.mobileNumber || '';
    return this.authService.checkFarmerRegistration(mobile);
  }

  @Post('farmer/request-otp')
  @HttpCode(HttpStatus.OK)
  async requestFarmerOtp(
    @Body() body: RequestOtpDto & { mobileNumber?: string; scope?: 'LOGIN' | 'REGISTER' },
  ): Promise<RequestOtpResponseDto> {
    const mobile = body.mobile || body.mobileNumber;
    return this.authService.requestFarmerOtp(mobile, body.scope);
  }

  @Post('farmer/verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyFarmerOtp(
    @Body() body: VerifyOtpDto & { mobileNumber?: string; scope?: 'LOGIN' | 'REGISTER' },
  ): Promise<VerifyOtpResponseDto> {
    const mobile = body.mobile || body.mobileNumber;
    return this.authService.verifyFarmerOtp(mobile, body.otp, body.scope);
  }

  @Post('officer/request-otp')
  @HttpCode(HttpStatus.OK)
  async requestOfficerOtp(
    @Body() body: { mobile: string; scope?: 'OPERATIONS' | 'AUTHORITY' },
  ): Promise<RequestOtpResponseDto> {
    return this.authService.requestOfficerOtp(body.mobile, body.scope);
  }

  @Post('officer/verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOfficerOtp(
    @Body() body: { mobile: string; otp: string; scope?: 'OPERATIONS' | 'AUTHORITY' },
  ) {
    return this.authService.verifyOfficerOtp(body.mobile, body.otp, body.scope);
  }
}
