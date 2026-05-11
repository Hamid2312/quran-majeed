import { create } from 'zustand';
import { ActiveSession, MarkType, ReciterProfile, PdfActiveSession, PdfMark } from '../models/Session';
import { generateId, nowISO } from '../utils/dateHelpers';
import { createSession, savePdfMark, deletePdfMark, updatePdfMarkPosition } from '../services/SessionService';

interface SessionState {
  // ── Legacy word-based session ──────────────────────────────────────────────
  activeSession: ActiveSession | null;
  startSession: (reciter: ReciterProfile, surahNumber: number, surahName: string) => Promise<void>;
  addMark: (ayahNumber: number, wordIndex: number, wordText: string, type: MarkType) => void;
  removeMark: (ayahNumber: number, wordIndex: number, type: MarkType) => void;
  setCurrentPage: (index: number) => void;
  clearSession: () => void;

  // ── PDF session ────────────────────────────────────────────────────────────
  pdfActiveSession: PdfActiveSession | null;
  startPdfSession: (
    reciter: ReciterProfile,
    scopeType: 'surah' | 'parah',
    scopeNumber: number,
    scopeName: string,
    startPageNumber: number
  ) => Promise<void>;
  addPdfMark: (
    pageNumber: number,
    xPercent: number,
    yPercent: number,
    type: MarkType,
    label?: string
  ) => Promise<PdfMark | null>;
  removePdfMark: (markId: string) => Promise<void>;
  setCurrentPdfPage: (page: number) => void;
  clearPdfSession: () => void;
  updatePdfMark: (markId: string, xPercent: number, yPercent: number) => Promise<void>;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  activeSession: null,
  pdfActiveSession: null,

  // ── Legacy word-based session ──────────────────────────────────────────────

  startSession: async (reciter, surahNumber, surahName) => {
    const sessionId = generateId();
    const startedAt = nowISO();
    const session: ActiveSession = {
      sessionId,
      reciter,
      surahNumber,
      surahName,
      currentPageIndex: 0,
      marks: {},
      startedAt,
    };
    await createSession({
      id: sessionId,
      reciterId: reciter.id,
      reciterName: reciter.name,
      surahNumber,
      surahName,
      startedAt,
      status: 'active',
      marks: [],
    });
    set({ activeSession: session });
  },

  addMark: (ayahNumber, wordIndex, _wordText, type) => {
    const session = get().activeSession;
    if (!session) return;
    const key = `${ayahNumber}-${wordIndex}`;
    const existing = session.marks[key] ?? { atka: 0, ghalti: 0 };
    set({
      activeSession: {
        ...session,
        marks: { ...session.marks, [key]: { ...existing, [type]: existing[type] + 1 } },
      },
    });
  },

  removeMark: (ayahNumber, wordIndex, type) => {
    const session = get().activeSession;
    if (!session) return;
    const key = `${ayahNumber}-${wordIndex}`;
    const existing = session.marks[key];
    if (!existing) return;
    set({
      activeSession: {
        ...session,
        marks: { ...session.marks, [key]: { ...existing, [type]: Math.max(0, existing[type] - 1) } },
      },
    });
  },

  setCurrentPage: (index) => {
    const session = get().activeSession;
    if (!session) return;
    set({ activeSession: { ...session, currentPageIndex: index } });
  },

  clearSession: () => set({ activeSession: null }),

  // ── PDF session ────────────────────────────────────────────────────────────

  startPdfSession: async (reciter, scopeType, scopeNumber, scopeName, startPageNumber) => {
    const sessionId = generateId();
    const startedAt = nowISO();
    const pdfSession: PdfActiveSession = {
      sessionId,
      reciter,
      scopeType,
      scopeNumber,
      scopeName,
      startPageNumber,
      currentPageNumber: startPageNumber,
      marks: [],
      startedAt,
    };
    await createSession({
      id: sessionId,
      reciterId: reciter.id,
      reciterName: reciter.name,
      surahNumber: scopeType === 'surah' ? scopeNumber : 0,
      surahName: scopeName,
      startedAt,
      status: 'active',
      marks: [],
      scopeType,
      scopeNumber,
      scopeName,
    });
    set({ pdfActiveSession: pdfSession });
  },

  addPdfMark: async (pageNumber, xPercent, yPercent, type, label) => {
    const session = get().pdfActiveSession;
    if (!session) return null;

    const mark: PdfMark = {
      id: generateId(),
      sessionId: session.sessionId,
      pageNumber,
      xPercent,
      yPercent,
      type,
      label,
      createdAt: nowISO(),
      isCleared: false,
    };

    // Persist to SQLite immediately
    await savePdfMark(mark);

    set({
      pdfActiveSession: {
        ...session,
        marks: [...session.marks, mark],
      },
    });
    return mark;
  },

  removePdfMark: async (markId) => {
    const session = get().pdfActiveSession;
    if (!session) return;
    await deletePdfMark(markId);
    set({
      pdfActiveSession: {
        ...session,
        marks: session.marks.filter(m => m.id !== markId),
      },
    });
  },

  setCurrentPdfPage: (page) => {
    const session = get().pdfActiveSession;
    if (!session) return;
    set({ pdfActiveSession: { ...session, currentPageNumber: page } });
  },

  clearPdfSession: () => set({ pdfActiveSession: null }),
  updatePdfMark: async (markId, xPct, yPct) => {
    const session = get().pdfActiveSession;
    if (!session) return;
    
    // Update DB
    await updatePdfMarkPosition(markId, xPct, yPct);

    // Update state
    set({
      pdfActiveSession: {
        ...session,
        marks: session.marks.map(m => m.id === markId ? { ...m, xPercent: xPct, yPercent: yPct } : m),
      },
    });
  },
}));
