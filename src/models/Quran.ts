import { TajweedRuleId } from '../constants/tajweed';

// ─── Tajweed ────────────────────────────────────────────────────────────────

export interface TajweedSpan {
  start: number;        // char index within word text (inclusive)
  end: number;          // char index within word text (exclusive)
  rule: TajweedRuleId;
}

export interface TajweedWord {
  id?: number;
  text: string;
  spans: TajweedSpan[];
  lineNumber: number;
  pageNumber: number;
  ayahNumber: number;
  wordIndexInAyah: number;
}

export interface QuranLine {
  lineNumber: number;
  words: TajweedWord[];
}

export interface QuranPage {
  pageNumber: number;
  lines: QuranLine[];
}

export interface Ayah {
  number: number;         // within surah (1-based)
  globalNumber: number;   // 1–6236
  text: string;           // raw Arabic text
  words: TajweedWord[];   // each space-separated word with tajweed data
  juz: number;
  page: number;
}

export interface Surah {
  number: number;         // 1–114
  name: string;           // Arabic name e.g. الفاتحة
  nameEn: string;         // English e.g. Al-Fatihah
  totalAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
  ayahs: Ayah[];
  pages: QuranPage[];     // Words grouped by exact 16-line layout
}

export interface QuranData {
  surahs: Surah[];
  totalAyahs: number;
}
