import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from '../../database/prisma.service';
import { PrometheusService } from '../../common/metrics/prometheus.service';

describe('HealthController', () => {
  let controller: HealthController;

  const mockPrismaService = {
    $queryRaw: jest.fn().mockResolvedValue([{ result: 1 }]),
  };

  const mockPrometheusService = {
    getMetrics: jest.fn().mockResolvedValue('# metrics'),
    getContentType: jest.fn().mockReturnValue('text/plain'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PrometheusService, useValue: mockPrometheusService },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('healthCheck', () => {
    it('should be defined', () => {
      expect(controller.healthCheck).toBeDefined();
    });

    it('should return health status', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ result: 1 }]);
      const result = await controller.healthCheck();
      expect(result.status).toBeDefined();
    });
  });

  describe('metrics', () => {
    it('should be defined', () => {
      expect(controller.metrics).toBeDefined();
    });
  });

  describe('prometheusMetrics', () => {
    it('should be defined', () => {
      expect(controller.prometheusMetrics).toBeDefined();
    });
  });
});
