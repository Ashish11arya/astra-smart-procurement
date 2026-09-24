import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface AuthenticatedUser {
  userId: string;
  mobile: string;
  role: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication token missing or invalid');
    }

    const token = authHeader.substring(7);
    const secret =
      this.configService.get<string>('JWT_SECRET') ||
      process.env.JWT_SECRET ||
      'astra_dev_jwt_secret_change_in_production_min32chars';

    try {
      const payload = await this.jwtService.verifyAsync(token, { secret });
      request.user = {
        userId: payload.sub,
        mobile: payload.mobile,
        role: payload.role,
      } as AuthenticatedUser;
      return true;
    } catch {
      throw new UnauthorizedException('Session expired or token invalid. Please verify your mobile number again.');
    }
  }
}
