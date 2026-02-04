import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto, RegisterDto, RefreshTokenDto } from './dto';

export interface TokenPayload {
  sub: string;
  email: string;
  tenant_id: string;
  roles: string[];
  permissions: string[];
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        include: {
          tenant: true,
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('User account is deactivated');
      }

      if (!user.passwordHash) {
        throw new UnauthorizedException('Invalid credentials - no password set');
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Update last login
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      return user;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('validateUser error:', error);
      throw new UnauthorizedException('Authentication failed');
    }
  }

  async login(user: any): Promise<AuthTokens & { user: any }> {
    const roles = user.roles.map((ur: any) => ur.role.name);
    const permissions = [
      ...new Set(
        user.roles.flatMap((ur: any) =>
          ur.role.permissions.map((rp: any) => rp.permission.name),
        ),
      ),
    ];

    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      tenant_id: user.tenantId,
      roles,
      permissions: permissions as string[],
    };

    const tokens = await this.generateTokens(payload);

    // Store refresh token hash
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: await bcrypt.hash(tokens.refresh_token, 10),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        roles,
        permissions,
        tenant_id: user.tenantId,
      },
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthTokens> {
    const { refresh_token } = refreshTokenDto;

    try {
      const decoded = this.jwtService.verify(refresh_token, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      const storedToken = await this.prisma.refreshToken.findFirst({
        where: {
          userId: decoded.sub,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        include: {
          user: {
            include: {
              roles: {
                include: {
                  role: {
                    include: {
                      permissions: { include: { permission: true } },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!storedToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Validate the token hash
      const isValid = await bcrypt.compare(refresh_token, storedToken.tokenHash);
      if (!isValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Revoke old token
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });

      // Generate new tokens
      const user = storedToken.user;
      const roles = user.roles.map((ur: any) => ur.role.name);
      const permissions = [
        ...new Set(
          user.roles.flatMap((ur: any) =>
            ur.role.permissions.map((rp: any) => rp.permission.name),
          ),
        ),
      ];

      const payload: TokenPayload = {
        sub: user.id,
        email: user.email,
        tenant_id: user.tenantId,
        roles,
        permissions: permissions as string[],
      };

      const tokens = await this.generateTokens(payload);

      // Store new refresh token
      await this.prisma.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: await bcrypt.hash(tokens.refresh_token, 10),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    // Revoke all refresh tokens for the user
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  async getCurrentUser(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: true,
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
        preferences: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const roles = user.roles.map((ur: any) => ur.role.name);
    const permissions = [
      ...new Set(
        user.roles.flatMap((ur: any) =>
          ur.role.permissions.map((rp: any) => rp.permission.name),
        ),
      ),
    ];

    return {
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      avatar_url: user.avatarUrl,
      roles,
      permissions,
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        plan: user.tenant.plan,
      },
      preferences: user.preferences || {
        theme: 'light',
        locale: 'en-US',
        timezone: 'America/New_York',
        default_currency: 'USD',
      },
      last_login: user.lastLoginAt,
    };
  }

  private async generateTokens(payload: TokenPayload): Promise<AuthTokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get<string>('jwt.accessTokenExpiry') || '1h',
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get<string>('jwt.refreshTokenExpiry') || '7d',
      }),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 3600, // 1 hour in seconds
    };
  }
}
