// ─── Reciter ────────────────────────────────────────────────────────────────

export interface ReciterProfile {
  id: string;
  name: string;
  createdAt: string;      // ISO 8601
  avatarColor: string;    // random color for avatar circle
}

// ─── Marks ──────────────────────────────────────────────────────────────────

export type MarkType = 'atka' | 'ghalti';  // stuck | mistake

export interface WordMark {
  wordIndex: number;      // position within ayah words array (0-based)
  wordText: string;       // the Arabic word text (for display)
  ayahNumber: number;     // ayah number within surah
  type: MarkType;
  count: number;
  isCleared?: boolean;    // true if the user reviewed and cleared this mistake
}

// ─── PDF Marks (coordinate-based, page-aware) ────────────────────────────────

export interface PdfMark {
  id: string;
  sessionId: string;
  pageNumber: number;
  xPercent: number;     // 0–100 % of the PDF view width
  yPercent: number;     // 0–100 % of the PDF view height
  type: MarkType;       // 'atka' (stuck/yellow) | 'ghalti' (mistake/red)
  label?: string;
  createdAt: string;    // ISO 8601
  isCleared: boolean;
}

// ─── Session ────────────────────────────────────────────────────────────────

export type SessionStatus = 'active' | 'completed';

export interface SessionRecord {
  id: string;
  reciterId: string;
  reciterName: string;
  surahNumber: number;
  surahName: string;
  startedAt: string;      // ISO 8601
  endedAt?: string;
  status: SessionStatus;
  marks: WordMark[];
  pdfMarks?: PdfMark[];
  // PDF session metadata
  scopeType?: 'surah' | 'parah';
  scopeNumber?: number;
  scopeName?: string;
}

// ─── Analytics ──────────────────────────────────────────────────────────────

export interface SurahStat {
  surahNumber: number;
  surahName: string;
  totalMistakes: number;
  totalStuck: number;
  sessionCount: number;
}

export interface ReciterStats {
  reciterId: string;
  reciterName: string;
  totalSessions: number;
  totalMistakes: number;
  totalStuck: number;
  totalTimeMinutes: number;
  surahStats: SurahStat[];
  recentSessions: SessionRecord[];   // last 7
}

// ─── Active session state (in-memory) ───────────────────────────────────────

export interface ActiveSession {
  sessionId: string;
  reciter: ReciterProfile;
  surahNumber: number;
  surahName: string;
  currentPageIndex: number;
  // wordKey = `${ayahNumber}-${wordIndex}`
  marks: Record<string, { atka: number; ghalti: number }>;
  startedAt: string;
}

// ─── PDF Active Session (in-memory) ─────────────────────────────────────────

export interface PdfActiveSession {
  sessionId: string;
  reciter: ReciterProfile;
  scopeType: 'surah' | 'parah';
  scopeNumber: number;       // surah (1-114) or parah (1-30)
  scopeName: string;         // Arabic + English name
  startPageNumber: number;   // PDF page opened when session began
  currentPageNumber: number; // currently viewed PDF page
  marks: PdfMark[];
  startedAt: string;
}
