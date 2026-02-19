import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
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

// In-memory demo users (no database required)
interface InMemoryUser {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  tenantId: string;
  tenantName: string;
  roles: string[];
  permissions: string[];
  avatarUrl: string | null;
  lastLoginAt: Date | null;
  mfaEnabled: boolean;
}

// Pre-hashed password for Demo@2024
const DEMO_PASSWORD_HASH = bcrypt.hashSync('Demo@2024', 10);

const IN_MEMORY_USERS: InMemoryUser[] = [
  {
    id: 'usr_admin_001',
    email: 'admin@demo.com',
    passwordHash: DEMO_PASSWORD_HASH,
    firstName: 'Demo',
    lastName: 'Admin',
    isActive: true,
    tenantId: 'tenant_demo_001',
    tenantName: 'Demo Organization',
    roles: ['admin'],
    permissions: ['*'],
    avatarUrl: null,
    lastLoginAt: null,
    mfaEnabled: false,
  },
];

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = IN_MEMORY_USERS.find(u => u.email === email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login in memory
    user.lastLoginAt = new Date();

    return user;
  }

  async login(user: any): Promise<AuthTokens & { user: any }> {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      tenant_id: user.tenantId,
      roles: user.roles,
      permissions: user.permissions,
    };

    const tokens = await this.generateTokens(payload);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        roles: user.roles,
        permissions: user.permissions,
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

      const user = IN_MEMORY_USERS.find(u => u.id === decoded.sub);
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const payload: TokenPayload = {
        sub: user.id,
        email: user.email,
        tenant_id: user.tenantId,
        roles: user.roles,
        permissions: user.permissions,
      };

      return this.generateTokens(payload);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    // No-op in file-based mode (tokens expire naturally)
  }

  async getCurrentUser(userId: string): Promise<any> {
    const user = IN_MEMORY_USERS.find(u => u.id === userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      avatar_url: user.avatarUrl,
      roles: user.roles,
      permissions: user.permissions,
      tenant: {
        id: user.tenantId,
        name: user.tenantName,
        plan: 'enterprise',
      },
      preferences: {
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
        expiresIn:
          this.configService.get<string>('jwt.accessTokenExpiry') || '1h',
      }),
      this.jwtService.signAsync(payload, {
        expiresIn:
          this.configService.get<string>('jwt.refreshTokenExpiry') || '7d',
      }),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 3600,
    };
  }
}
