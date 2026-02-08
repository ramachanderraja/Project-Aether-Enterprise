import { apiClient } from '@/shared/services/api/apiClient';

export interface TrainingModuleSummary {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string;
  duration: string;
  sortOrder: number;
  isCompleted: boolean;
}

export interface TrainingModulesResponse {
  modules: TrainingModuleSummary[];
  totalDuration: string;
  categories: string[];
}

export interface TrainingModuleDetail extends TrainingModuleSummary {
  content: Record<string, unknown> | null;
  resources: Array<{ type: string; title: string; url: string }> | null;
  completedAt: string | null;
}

export interface TrainingProgress {
  completedModules: string[];
  totalModules: number;
  percentComplete: number;
  lastActivity: string | null;
  totalTimeSpentMin: number;
  streak: number;
}

export interface CompleteModuleResponse {
  success: boolean;
  moduleId: string;
  moduleSlug: string;
  completedAt: string;
  newCertificates: string[];
}

export interface Certificate {
  id: string;
  title: string;
  description: string | null;
  status: 'earned' | 'available';
  progress: number;
  requiredModules: string[];
  completedModules: string[];
  issuedAt?: string;
  expiresAt?: string | null;
}

export const trainingApi = {
  getModules: async (category?: string): Promise<TrainingModulesResponse> => {
    const params = category ? { category } : {};
    const response = await apiClient.get<TrainingModulesResponse>('/training/modules', { params });
    return response.data;
  },

  getModuleDetails: async (moduleId: string): Promise<TrainingModuleDetail> => {
    const response = await apiClient.get<TrainingModuleDetail>(`/training/modules/${moduleId}`);
    return response.data;
  },

  getProgress: async (): Promise<TrainingProgress> => {
    const response = await apiClient.get<TrainingProgress>('/training/progress');
    return response.data;
  },

  completeModule: async (moduleId: string, timeSpentMin?: number): Promise<CompleteModuleResponse> => {
    const response = await apiClient.post<CompleteModuleResponse>(
      `/training/modules/${moduleId}/complete`,
      timeSpentMin != null ? { timeSpentMin } : {},
    );
    return response.data;
  },

  uncompleteModule: async (moduleId: string): Promise<void> => {
    await apiClient.delete(`/training/modules/${moduleId}/complete`);
  },

  getCertificates: async (): Promise<Certificate[]> => {
    const response = await apiClient.get<Certificate[]>('/training/certificates');
    return response.data;
  },
};
