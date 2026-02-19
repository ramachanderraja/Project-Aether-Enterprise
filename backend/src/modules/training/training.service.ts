import { Injectable, NotFoundException } from '@nestjs/common';

// In-memory training data for file-based mode
const TRAINING_MODULES = [
  {
    id: 'tm_001', slug: 'platform-overview', title: 'Platform Overview',
    description: 'Introduction to the Aether FP&A platform', category: 'Getting Started',
    duration: '15 min', sortOrder: 1, isActive: true,
  },
  {
    id: 'tm_002', slug: 'dashboard-navigation', title: 'Dashboard Navigation',
    description: 'Learn to navigate executive dashboards', category: 'Getting Started',
    duration: '10 min', sortOrder: 2, isActive: true,
  },
  {
    id: 'tm_003', slug: 'data-import', title: 'Data Import & Management',
    description: 'How to import and manage financial data', category: 'Data Management',
    duration: '20 min', sortOrder: 3, isActive: true,
  },
  {
    id: 'tm_004', slug: 'revenue-analytics', title: 'Revenue Analytics',
    description: 'Understanding ARR, pipeline, and revenue metrics', category: 'Analytics',
    duration: '25 min', sortOrder: 4, isActive: true,
  },
  {
    id: 'tm_005', slug: 'cost-intelligence', title: 'Cost Intelligence',
    description: 'Analyzing and optimizing costs', category: 'Analytics',
    duration: '20 min', sortOrder: 5, isActive: true,
  },
  {
    id: 'tm_006', slug: 'scenario-planning', title: 'Scenario Planning',
    description: 'Building and comparing what-if scenarios', category: 'Advanced',
    duration: '30 min', sortOrder: 6, isActive: true,
  },
  {
    id: 'tm_007', slug: 'ai-agent', title: 'AI Agent & Insights',
    description: 'Using the AI assistant for financial analysis', category: 'Advanced',
    duration: '20 min', sortOrder: 7, isActive: true,
  },
];

// In-memory completions (user-scoped)
const completions = new Map<string, Set<string>>();

@Injectable()
export class TrainingService {
  async getTrainingModules(userId: string, category?: string) {
    let modules = TRAINING_MODULES.filter(m => m.isActive);
    if (category) {
      modules = modules.filter(m => m.category === category);
    }

    const userCompletions = completions.get(userId) || new Set<string>();
    const categories = [...new Set(modules.map(m => m.category))];
    const totalMinutes = modules.reduce((sum, m) => {
      const match = m.duration.match(/(\d+)/);
      return sum + (match ? parseInt(match[1], 10) : 0);
    }, 0);

    return {
      modules: modules.map(m => ({
        id: m.id,
        slug: m.slug,
        title: m.title,
        description: m.description,
        category: m.category,
        duration: m.duration,
        sortOrder: m.sortOrder,
        isCompleted: userCompletions.has(m.id),
      })),
      totalDuration: `${totalMinutes} min`,
      categories,
    };
  }

  async getModuleDetails(moduleId: string, userId: string) {
    const module = TRAINING_MODULES.find(
      m => (m.id === moduleId || m.slug === moduleId) && m.isActive,
    );

    if (!module) {
      throw new NotFoundException(`Training module "${moduleId}" not found`);
    }

    const userCompletions = completions.get(userId) || new Set<string>();
    return {
      ...module,
      isCompleted: userCompletions.has(module.id),
      completedAt: null,
    };
  }

  async getUserProgress(userId: string) {
    const totalModules = TRAINING_MODULES.filter(m => m.isActive).length;
    const userCompletions = completions.get(userId) || new Set<string>();

    return {
      completedModules: [...userCompletions].map(id => {
        const m = TRAINING_MODULES.find(mod => mod.id === id);
        return m?.slug || id;
      }),
      totalModules,
      percentComplete: totalModules > 0
        ? Math.round((userCompletions.size / totalModules) * 100)
        : 0,
      lastActivity: null,
      totalTimeSpentMin: 0,
      streak: 0,
    };
  }

  async markModuleComplete(moduleSlugOrId: string, userId: string, timeSpentMin?: number) {
    const module = TRAINING_MODULES.find(
      m => (m.id === moduleSlugOrId || m.slug === moduleSlugOrId) && m.isActive,
    );

    if (!module) {
      throw new NotFoundException(`Training module "${moduleSlugOrId}" not found`);
    }

    if (!completions.has(userId)) {
      completions.set(userId, new Set<string>());
    }
    completions.get(userId)!.add(module.id);

    return {
      success: true,
      moduleId: module.id,
      moduleSlug: module.slug,
      completedAt: new Date().toISOString(),
      newCertificates: [],
    };
  }

  async uncompleteModule(moduleSlugOrId: string, userId: string) {
    const module = TRAINING_MODULES.find(
      m => (m.id === moduleSlugOrId || m.slug === moduleSlugOrId) && m.isActive,
    );

    if (!module) {
      throw new NotFoundException(`Training module "${moduleSlugOrId}" not found`);
    }

    const userCompletions = completions.get(userId);
    if (userCompletions) {
      userCompletions.delete(module.id);
    }

    return { success: true, moduleId: module.id, moduleSlug: module.slug };
  }

  async getUserCertificates(userId: string) {
    return [];
  }
}
