import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/prisma.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      deleteMany: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('mock-token'),
    verify: jest.fn().mockReturnValue({ sub: 'user-123' }),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, any> = {
        'jwt.secret': 'test-secret',
        'jwt.accessTokenExpiry': '1h',
        'jwt.refreshTokenExpiry': '7d',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should be defined', () => {
      expect(service.validateUser).toBeDefined();
    });
  });

  describe('login', () => {
    it('should be defined', () => {
      expect(service.login).toBeDefined();
    });
  });

  describe('refreshToken', () => {
    it('should be defined', () => {
      expect(service.refreshToken).toBeDefined();
    });
  });

  describe('logout', () => {
    it('should be defined', () => {
      expect(service.logout).toBeDefined();
    });
  });

  describe('getCurrentUser', () => {
    it('should be defined', () => {
      expect(service.getCurrentUser).toBeDefined();
    });
  });
});
