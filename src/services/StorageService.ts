import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReciterProfile } from '../models/Session';

const KEYS = {
  RECITERS: '@quran_app/reciters',
  SETTINGS: '@quran_app/settings',
};

// ─── Reciters ─────────────────────────────────────────────────────────────

export async function getReciters(): Promise<ReciterProfile[]> {
  const raw = await AsyncStorage.getItem(KEYS.RECITERS);
  return raw ? JSON.parse(raw) : [];
}

export async function saveReciter(profile: ReciterProfile): Promise<void> {
  const all = await getReciters();
  const idx = all.findIndex(r => r.id === profile.id);
  if (idx >= 0) {
    all[idx] = profile;
  } else {
    all.push(profile);
  }
  await AsyncStorage.setItem(KEYS.RECITERS, JSON.stringify(all));
}

export async function deleteReciter(id: string): Promise<void> {
  const all = await getReciters();
  const filtered = all.filter(r => r.id !== id);
  await AsyncStorage.setItem(KEYS.RECITERS, JSON.stringify(filtered));
}

export async function getReciterById(id: string): Promise<ReciterProfile | undefined> {
  const all = await getReciters();
  return all.find(r => r.id === id);
}

// ─── App Settings ─────────────────────────────────────────────────────────

export interface AppSettings {
  tajweedEnabled: boolean;
  fontSize: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  tajweedEnabled: true,
  fontSize: 28,
};

export async function getSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(KEYS.SETTINGS);
  return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
  const current = await getSettings();
  await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify({ ...current, ...settings }));
}
