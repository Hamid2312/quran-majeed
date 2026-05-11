import { create } from 'zustand';
import { ReciterStats } from '../models/Session';
import { ReciterProfile } from '../models/Session';
import { getReciters } from '../services/StorageService';
import { getReciterStats } from '../services/SessionService';

interface AnalyticsState {
  reciters: ReciterProfile[];
  selectedReciterId: string | null;
  stats: ReciterStats | null;
  loading: boolean;
  error: string | null;

  loadReciters: () => Promise<void>;
  selectReciter: (id: string) => Promise<void>;
  refreshStats: () => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  reciters: [],
  selectedReciterId: null,
  stats: null,
  loading: false,
  error: null,

  loadReciters: async () => {
    try {
      const reciters = await getReciters();
      set({ reciters });
      // Auto-select first reciter if none selected
      if (!get().selectedReciterId && reciters.length > 0) {
        await get().selectReciter(reciters[0].id);
      }
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  selectReciter: async (id: string) => {
    set({ selectedReciterId: id, loading: true, error: null });
    try {
      const stats = await getReciterStats(id);
      set({ stats, loading: false });
    } catch (e: any) {
      set({ loading: false, error: e.message });
    }
  },

  refreshStats: async () => {
    const { selectedReciterId } = get();
    if (selectedReciterId) {
      await get().selectReciter(selectedReciterId);
    }
  },
}));
