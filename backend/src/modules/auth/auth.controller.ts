import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto, RefreshTokenDto, LogoutDto } from './dto';
import { Public } from './decorators/public.decorator';
import { PrismaService } from '../../database/prisma.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Post('seed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Seed demo users (temp endpoint)' })
  async seedDemoUsers() {
    try {
      // Create default tenant
      const tenant = await this.prisma.tenant.upsert({
        where: { domain: 'demo.aether.local' },
        update: {},
        create: {
          name: 'Demo Organization',
          domain: 'demo.aether.local',
          plan: 'enterprise',
          isActive: true,
        },
      });

      // Create admin role
      const adminRole = await this.prisma.role.upsert({
        where: { name: 'admin' },
        update: {},
        create: {
          name: 'admin',
          description: 'Administrator with full access',
          isSystem: true,
        },
      });

      // Create demo user
      const hashedPassword = await bcrypt.hash('Demo@2024', 10);
      const adminUser = await this.prisma.user.upsert({
        where: { email: 'admin@demo.com' },
        update: { passwordHash: hashedPassword },
        create: {
          email: 'admin@demo.com',
          passwordHash: hashedPassword,
          firstName: 'Demo',
          lastName: 'Admin',
          isActive: true,
          tenantId: tenant.id,
        },
      });

      // Assign admin role
      await this.prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: adminUser.id,
            roleId: adminRole.id,
          },
        },
        update: {},
        create: {
          userId: adminUser.id,
          roleId: adminRole.id,
        },
      });

      return {
        message: 'Demo users seeded successfully',
        user: { email: adminUser.email, id: adminUser.id },
      };
    } catch (error) {
      return {
        message: 'Seed failed',
        error: error.message,
      };
    }
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Request() req, @Body() loginDto: LoginDto) {
    return this.authService.login(req.user);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout and invalidate tokens' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(@Request() req, @Body() logoutDto: LogoutDto) {
    await this.authService.logout(req.user.sub, logoutDto.refresh_token);
    return { success: true, message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({ status: 200, description: 'User details retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@Request() req) {
    return this.authService.getCurrentUser(req.user.sub);
  }
}
