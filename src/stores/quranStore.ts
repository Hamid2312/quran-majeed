import { create } from 'zustand';
import { Surah } from '../models/Quran';
import { fetchSurah } from '../services/QuranService';

interface QuranState {
  loadedSurahs: Record<number, Surah>;
  currentSurahNumber: number | null;
  loading: boolean;
  error: string | null;

  loadSurah: (surahNumber: number) => Promise<void>;
  setCurrentSurah: (n: number) => void;
  clearError: () => void;
}

export const useQuranStore = create<QuranState>((set, get) => ({
  loadedSurahs: {},
  currentSurahNumber: null,
  loading: false,
  error: null,

  loadSurah: async (surahNumber: number) => {
    if (get().loadedSurahs[surahNumber]) {
      set({ currentSurahNumber: surahNumber });
      return;
    }
    set({ loading: true, error: null });
    try {
      const surah = await fetchSurah(surahNumber);
      set(state => ({
        loadedSurahs: { ...state.loadedSurahs, [surahNumber]: surah },
        currentSurahNumber: surahNumber,
        loading: false,
      }));
    } catch (e: any) {
      set({ loading: false, error: e.message ?? 'Failed to load surah' });
    }
  },

  setCurrentSurah: (n: number) => set({ currentSurahNumber: n }),
  clearError: () => set({ error: null }),
}));
