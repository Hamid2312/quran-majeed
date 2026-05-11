import * as SQLite from 'expo-sqlite';
import { SessionRecord, WordMark, ReciterStats, SurahStat, PdfMark } from '../models/Session';

let db: SQLite.SQLiteDatabase | null = null;

async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('quran_sessions.db');
    await initSchema(db);
  }
  return db;
}

async function initSchema(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      reciter_id TEXT NOT NULL,
      reciter_name TEXT NOT NULL,
      surah_number INTEGER NOT NULL,
      surah_name TEXT NOT NULL,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      scope_type TEXT,
      scope_number INTEGER,
      scope_name TEXT
    );

    CREATE TABLE IF NOT EXISTS word_marks (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      ayah_number INTEGER NOT NULL,
      word_index INTEGER NOT NULL,
      word_text TEXT NOT NULL,
      mark_type TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 1,
      is_cleared INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pdf_marks (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      page_number INTEGER NOT NULL,
      x_percent REAL NOT NULL,
      y_percent REAL NOT NULL,
      mark_type TEXT NOT NULL,
      label TEXT,
      created_at TEXT NOT NULL,
      is_cleared INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_reciter ON sessions(reciter_id);
    CREATE INDEX IF NOT EXISTS idx_marks_session ON word_marks(session_id);
    CREATE INDEX IF NOT EXISTS idx_pdf_marks_session ON pdf_marks(session_id);
  `);

  // Safe migrations for existing databases
  const migrations = [
    `ALTER TABLE word_marks ADD COLUMN is_cleared INTEGER NOT NULL DEFAULT 0;`,
    `ALTER TABLE sessions ADD COLUMN scope_type TEXT;`,
    `ALTER TABLE sessions ADD COLUMN scope_number INTEGER;`,
    `ALTER TABLE sessions ADD COLUMN scope_name TEXT;`,
  ];
  for (const sql of migrations) {
    try { await database.execAsync(sql); } catch (_) { /* column already exists */ }
  }
}

// ─── Session CRUD ──────────────────────────────────────────────────────────

export async function createSession(session: SessionRecord): Promise<void> {
  const database = await getDB();
  await database.runAsync(
    `INSERT INTO sessions (id, reciter_id, reciter_name, surah_number, surah_name, started_at, status, scope_type, scope_number, scope_name)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [session.id, session.reciterId, session.reciterName,
     session.surahNumber, session.surahName, session.startedAt, session.status,
     session.scopeType ?? null, session.scopeNumber ?? null, session.scopeName ?? null]
  );
}

export async function finalizeSession(
  sessionId: string,
  endedAt: string,
  marks: WordMark[]
): Promise<void> {
  const database = await getDB();
  await database.runAsync(
    `UPDATE sessions SET ended_at = ?, status = 'completed' WHERE id = ?`,
    [endedAt, sessionId]
  );
  for (const mark of marks) {
    const markId = `${sessionId}-${mark.ayahNumber}-${mark.wordIndex}-${mark.type}`;
    await database.runAsync(
      `INSERT OR REPLACE INTO word_marks (id, session_id, ayah_number, word_index, word_text, mark_type, count, is_cleared)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [markId, sessionId, mark.ayahNumber, mark.wordIndex, mark.wordText, mark.type, mark.count, mark.isCleared ? 1 : 0]
    );
  }
}

// ─── PDF Session CRUD ───────────────────────────────────────────────────────

export async function savePdfMark(mark: PdfMark): Promise<void> {
  const database = await getDB();
  await database.runAsync(
    `INSERT OR REPLACE INTO pdf_marks (id, session_id, page_number, x_percent, y_percent, mark_type, label, created_at, is_cleared)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [mark.id, mark.sessionId, mark.pageNumber, mark.xPercent, mark.yPercent,
     mark.type, mark.label ?? null, mark.createdAt, mark.isCleared ? 1 : 0]
  );
}

export async function deletePdfMark(markId: string): Promise<void> {
  const database = await getDB();
  await database.runAsync(`DELETE FROM pdf_marks WHERE id = ?`, [markId]);
}

export async function clearPdfMark(markId: string): Promise<void> {
  const database = await getDB();
  await database.runAsync(`UPDATE pdf_marks SET is_cleared = 1 WHERE id = ?`, [markId]);
}

export async function updatePdfMarkPosition(markId: string, xPct: number, yPct: number): Promise<void> {
  const database = await getDB();
  await database.runAsync(
    `UPDATE pdf_marks SET x_percent = ?, y_percent = ? WHERE id = ?`,
    [xPct, yPct, markId]
  );
}

export async function getPdfMarksBySession(sessionId: string): Promise<PdfMark[]> {
  const database = await getDB();
  const rows = await database.getAllAsync<any>(
    `SELECT * FROM pdf_marks WHERE session_id = ? ORDER BY created_at ASC`,
    [sessionId]
  );
  return rows.map(r => ({
    id: r.id,
    sessionId: r.session_id,
    pageNumber: r.page_number,
    xPercent: r.x_percent,
    yPercent: r.y_percent,
    type: r.mark_type as 'atka' | 'ghalti',
    label: r.label ?? undefined,
    createdAt: r.created_at,
    isCleared: r.is_cleared === 1,
  }));
}

export async function finalizePdfSession(
  sessionId: string,
  endedAt: string,
  marks: PdfMark[]
): Promise<void> {
  const database = await getDB();
  await database.runAsync(
    `UPDATE sessions SET ended_at = ?, status = 'completed' WHERE id = ?`,
    [endedAt, sessionId]
  );
  for (const mark of marks) {
    await database.runAsync(
      `INSERT OR REPLACE INTO pdf_marks (id, session_id, page_number, x_percent, y_percent, mark_type, label, created_at, is_cleared)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [mark.id, sessionId, mark.pageNumber, mark.xPercent, mark.yPercent,
       mark.type, mark.label ?? null, mark.createdAt, mark.isCleared ? 1 : 0]
    );
  }
}

export async function markMistakeAsCleared(
  sessionId: string,
  ayahNumber: number,
  wordIndex: number,
  type: string
): Promise<void> {
  const database = await getDB();
  const markId = `${sessionId}-${ayahNumber}-${wordIndex}-${type}`;
  await database.runAsync(
    `UPDATE word_marks SET is_cleared = 1 WHERE id = ?`,
    [markId]
  );
}

export async function getSessionsByReciter(reciterId: string): Promise<SessionRecord[]> {
  const database = await getDB();
  const rows = await database.getAllAsync<any>(
    `SELECT * FROM sessions WHERE reciter_id = ? ORDER BY started_at DESC`,
    [reciterId]
  );

  const sessions: SessionRecord[] = [];
  for (const row of rows) {
    const markRows = await database.getAllAsync<any>(
      `SELECT * FROM word_marks WHERE session_id = ?`, [row.id]
    );
    const pdfMarkRows = await database.getAllAsync<any>(
      `SELECT * FROM pdf_marks WHERE session_id = ?`, [row.id]
    );
    sessions.push({
      id: row.id,
      reciterId: row.reciter_id,
      reciterName: row.reciter_name,
      surahNumber: row.surah_number,
      surahName: row.surah_name,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      status: row.status,
      scopeType: row.scope_type ?? undefined,
      scopeNumber: row.scope_number ?? undefined,
      scopeName: row.scope_name ?? undefined,
      marks: markRows.map((m: any) => ({
        wordIndex: m.word_index,
        wordText: m.word_text,
        ayahNumber: m.ayah_number,
        type: m.mark_type,
        count: m.count,
        isCleared: m.is_cleared === 1,
      })),
      pdfMarks: pdfMarkRows.map((m: any) => ({
        id: m.id,
        sessionId: m.session_id,
        pageNumber: m.page_number,
        xPercent: m.x_percent,
        yPercent: m.y_percent,
        type: m.mark_type as 'atka' | 'ghalti',
        label: m.label ?? undefined,
        createdAt: m.created_at,
        isCleared: m.is_cleared === 1,
      })),
    });
  }
  return sessions;
}

export async function getSessionById(sessionId: string): Promise<SessionRecord | null> {
  const database = await getDB();
  const row = await database.getFirstAsync<any>(
    `SELECT * FROM sessions WHERE id = ?`, [sessionId]
  );
  if (!row) return null;

  const markRows = await database.getAllAsync<any>(
    `SELECT * FROM word_marks WHERE session_id = ?`, [sessionId]
  );
  const pdfMarkRows = await database.getAllAsync<any>(
    `SELECT * FROM pdf_marks WHERE session_id = ?`, [sessionId]
  );
  return {
    id: row.id,
    reciterId: row.reciter_id,
    reciterName: row.reciter_name,
    surahNumber: row.surah_number,
    surahName: row.surah_name,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    status: row.status,
    scopeType: row.scope_type ?? undefined,
    scopeNumber: row.scope_number ?? undefined,
    scopeName: row.scope_name ?? undefined,
    marks: markRows.map((m: any) => ({
      wordIndex: m.word_index,
      wordText: m.word_text,
      ayahNumber: m.ayah_number,
      type: m.mark_type,
      count: m.count,
      isCleared: m.is_cleared === 1,
    })),
    pdfMarks: pdfMarkRows.map((m: any) => ({
      id: m.id,
      sessionId: m.session_id,
      pageNumber: m.page_number,
      xPercent: m.x_percent,
      yPercent: m.y_percent,
      type: m.mark_type as 'atka' | 'ghalti',
      label: m.label ?? undefined,
      createdAt: m.created_at,
      isCleared: m.is_cleared === 1,
    })),
  };
}

export async function deleteSession(sessionId: string): Promise<void> {
  const database = await getDB();
  await database.runAsync(`DELETE FROM sessions WHERE id = ?`, [sessionId]);
}

// ─── Analytics Queries ─────────────────────────────────────────────────────

export async function getReciterStats(reciterId: string): Promise<ReciterStats | null> {
  const sessions = await getSessionsByReciter(reciterId);
  if (sessions.length === 0) return null;

  let totalMistakes = 0;
  let totalStuck = 0;
  let totalTimeMinutes = 0;
  const surahMap: Record<number, SurahStat> = {};

  for (const session of sessions) {
    if (session.endedAt) {
      const start = new Date(session.startedAt).getTime();
      const end = new Date(session.endedAt).getTime();
      totalTimeMinutes += (end - start) / (1000 * 60);
    }

    // Count word marks
    for (const mark of session.marks) {
      if (!mark.isCleared) {
        if (mark.type === 'ghalti') totalMistakes += mark.count;
        if (mark.type === 'atka') totalStuck += mark.count;
      }
    }

    // Count PDF marks
    for (const mark of (session.pdfMarks ?? [])) {
      if (!mark.isCleared) {
        if (mark.type === 'ghalti') totalMistakes += 1;
        if (mark.type === 'atka') totalStuck += 1;
      }
    }

    const surahNum = session.surahNumber || session.scopeNumber || 0;
    const surahName = session.surahName || session.scopeName || '';

    if (!surahMap[surahNum]) {
      surahMap[surahNum] = {
        surahNumber: surahNum,
        surahName,
        totalMistakes: 0,
        totalStuck: 0,
        sessionCount: 0,
      };
    }
    const stat = surahMap[surahNum];
    stat.sessionCount += 1;
    for (const mark of session.marks) {
      if (!mark.isCleared) {
        if (mark.type === 'ghalti') stat.totalMistakes += mark.count;
        if (mark.type === 'atka') stat.totalStuck += mark.count;
      }
    }
    for (const mark of (session.pdfMarks ?? [])) {
      if (!mark.isCleared) {
        if (mark.type === 'ghalti') stat.totalMistakes += 1;
        if (mark.type === 'atka') stat.totalStuck += 1;
      }
    }
  }

  return {
    reciterId,
    reciterName: sessions[0].reciterName,
    totalSessions: sessions.length,
    totalMistakes,
    totalStuck,
    totalTimeMinutes: Math.round(totalTimeMinutes),
    surahStats: Object.values(surahMap).sort(
      (a, b) => (b.totalMistakes + b.totalStuck) - (a.totalMistakes + a.totalStuck)
    ),
    recentSessions: sessions.slice(0, 7),
  };
}
