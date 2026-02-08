import { create } from 'zustand';
import {
  trainingApi,
  TrainingModuleSummary,
  TrainingProgress,
  Certificate,
} from '../services/trainingApi';

interface TrainingState {
  modules: TrainingModuleSummary[];
  categories: string[];
  totalDuration: string;
  progress: TrainingProgress | null;
  certificates: Certificate[];
  isLoadingModules: boolean;
  isLoadingProgress: boolean;
  isLoadingCertificates: boolean;
  error: string | null;

  fetchModules: (category?: string) => Promise<void>;
  fetchProgress: () => Promise<void>;
  fetchCertificates: () => Promise<void>;
  completeModule: (slug: string) => Promise<string[]>;
  uncompleteModule: (slug: string) => Promise<void>;
}

export const useTrainingStore = create<TrainingState>()((set, get) => ({
  modules: [],
  categories: [],
  totalDuration: '',
  progress: null,
  certificates: [],
  isLoadingModules: false,
  isLoadingProgress: false,
  isLoadingCertificates: false,
  error: null,

  fetchModules: async (category?: string) => {
    set({ isLoadingModules: true, error: null });
    try {
      const data = await trainingApi.getModules(category);
      set({
        modules: data.modules,
        categories: data.categories,
        totalDuration: data.totalDuration,
        isLoadingModules: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load modules',
        isLoadingModules: false,
      });
    }
  },

  fetchProgress: async () => {
    set({ isLoadingProgress: true });
    try {
      const progress = await trainingApi.getProgress();
      set({ progress, isLoadingProgress: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load progress',
        isLoadingProgress: false,
      });
    }
  },

  fetchCertificates: async () => {
    set({ isLoadingCertificates: true });
    try {
      const certificates = await trainingApi.getCertificates();
      set({ certificates, isLoadingCertificates: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load certificates',
        isLoadingCertificates: false,
      });
    }
  },

  completeModule: async (slug: string) => {
    try {
      const result = await trainingApi.completeModule(slug);

      // Optimistically update local state
      const { modules } = get();
      set({
        modules: modules.map((m) =>
          m.slug === slug ? { ...m, isCompleted: true } : m,
        ),
      });

      // Refresh progress and certificates in background
      get().fetchProgress();
      if (result.newCertificates.length > 0) {
        get().fetchCertificates();
      }

      return result.newCertificates;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to complete module',
      });
      return [];
    }
  },

  uncompleteModule: async (slug: string) => {
    try {
      await trainingApi.uncompleteModule(slug);

      const { modules } = get();
      set({
        modules: modules.map((m) =>
          m.slug === slug ? { ...m, isCompleted: false } : m,
        ),
      });

      get().fetchProgress();
      get().fetchCertificates();
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to uncomplete module',
      });
    }
  },
}));
