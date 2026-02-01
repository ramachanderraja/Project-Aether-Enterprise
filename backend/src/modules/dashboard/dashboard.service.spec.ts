import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../../database/prisma.service';
import { KpiService } from './services/kpi.service';
import { AnomalyService } from './services/anomaly.service';

describe('DashboardService', () => {
  let service: DashboardService;

  const mockPrismaService = {
    financialMetric: { findMany: jest.fn() },
    deal: { count: jest.fn(), aggregate: jest.fn() },
    cost: { aggregate: jest.fn() },
    customer: { count: jest.fn() },
  };

  const mockKpiService = {
    getExecutiveKpis: jest.fn().mockResolvedValue({}),
  };

  const mockAnomalyService = {
    getAnomalies: jest.fn().mockResolvedValue({ data: [] }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: KpiService, useValue: mockKpiService },
        { provide: AnomalyService, useValue: mockAnomalyService },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getExecutiveDashboard', () => {
    it('should be defined', () => {
      expect(service.getExecutiveDashboard).toBeDefined();
    });
  });

  describe('getCashFlowForecast', () => {
    it('should be defined', () => {
      expect(service.getCashFlowForecast).toBeDefined();
    });
  });

  describe('getAiInsights', () => {
    it('should be defined', () => {
      expect(service.getAiInsights).toBeDefined();
    });
  });
});
