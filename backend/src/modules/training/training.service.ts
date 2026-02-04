import { Injectable } from '@nestjs/common';

@Injectable()
export class TrainingService {
  async getTrainingModules() {
    return {
      modules: [
        {
          id: 'overview',
          title: 'System Architecture',
          description: 'Project Aether Overview and Core Capabilities',
          duration: '10 min',
          category: 'fundamentals',
          order: 1,
        },
        {
          id: 'sales',
          title: 'Sales Performance',
          description: 'The Revenue Engine - Pipeline and Forecasting',
          duration: '8 min',
          category: 'modules',
          order: 2,
        },
        {
          id: 'reports',
          title: 'Profitability Reports',
          description: 'Strategic Profitability Analysis',
          duration: '7 min',
          category: 'modules',
          order: 3,
        },
        {
          id: 'marketing',
          title: 'Marketing Metrics',
          description: 'Acquisition Engine and Channel Performance',
          duration: '6 min',
          category: 'modules',
          order: 4,
        },
        {
          id: 'gtm',
          title: 'Go-To-Market (GTM)',
          description: 'Unit Economics and SaaS Metrics',
          duration: '5 min',
          category: 'modules',
          order: 5,
        },
        {
          id: 'revenue',
          title: 'Revenue & Profitability',
          description: 'Profitability & SaaS Metrics Deep Dive',
          duration: '8 min',
          category: 'modules',
          order: 6,
        },
        {
          id: 'cost',
          title: 'Cost Intelligence',
          description: 'The Efficiency Engine - Cost Control',
          duration: '7 min',
          category: 'modules',
          order: 7,
        },
        {
          id: 'intelligence',
          title: 'The Intelligent Core',
          description: 'Central Neural Engine and ML Operations',
          duration: '9 min',
          category: 'advanced',
          order: 8,
        },
        {
          id: 'scenarios',
          title: 'Scenario Planning',
          description: 'Monte Carlo Simulation and Risk Analysis',
          duration: '8 min',
          category: 'advanced',
          order: 9,
        },
        {
          id: 'governance',
          title: 'Governance & Lineage',
          description: 'Trust, Compliance, and Audit Trails',
          duration: '6 min',
          category: 'advanced',
          order: 10,
        },
      ],
      totalDuration: '74 min',
      categories: ['fundamentals', 'modules', 'advanced'],
    };
  }

  async getModuleDetails(moduleId: string) {
    const moduleContent = {
      overview: {
        id: 'overview',
        title: 'System Architecture',
        content: 'Aether is an Autonomous Financial Operating System...',
        sections: [
          {
            title: 'Core Capabilities',
            items: ['Digital Twin', 'Generative Reasoning', 'Auto-Correction', 'Explainable AI'],
          },
          {
            title: 'Architecture Layers',
            items: ['Executive Experience Layer', 'Agent Orchestration', 'Intelligent Core', 'Unified Data Fabric'],
          },
        ],
        resources: [
          { type: 'video', title: 'Architecture Overview', url: '/videos/architecture.mp4' },
          { type: 'pdf', title: 'Technical Whitepaper', url: '/docs/whitepaper.pdf' },
        ],
      },
    };

    return moduleContent[moduleId] || {
      id: moduleId,
      title: moduleId.charAt(0).toUpperCase() + moduleId.slice(1),
      content: 'Module content loading...',
      sections: [],
      resources: [],
    };
  }

  async getUserProgress() {
    // Mock user progress - would come from database
    return {
      completedModules: ['overview', 'sales'],
      totalModules: 10,
      percentComplete: 20,
      lastActivity: new Date(Date.now() - 86400000).toISOString(),
      streak: 3,
      totalTimeSpent: 18, // minutes
    };
  }

  async markModuleComplete(moduleId: string) {
    // Mock implementation - would update database
    return {
      success: true,
      moduleId,
      completedAt: new Date().toISOString(),
      message: `Module "${moduleId}" marked as complete`,
    };
  }

  async getUserCertificates() {
    return {
      certificates: [
        {
          id: 'cert-001',
          title: 'Aether Fundamentals',
          issuedAt: '2025-01-10',
          validUntil: '2026-01-10',
          status: 'active',
        },
      ],
      available: [
        {
          id: 'cert-002',
          title: 'Advanced Analytics',
          requiredModules: ['revenue', 'cost', 'scenarios'],
          progress: 33,
        },
        {
          id: 'cert-003',
          title: 'ML Operations',
          requiredModules: ['intelligence', 'governance'],
          progress: 0,
        },
      ],
    };
  }
}
