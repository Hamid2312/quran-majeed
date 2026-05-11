import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, RouteProp } from '@react-navigation/native';

// ─── Root Stack ─────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Home: undefined;
  MainTabs: undefined;

  // ── Quran Browse ──────────────────────────────────────────────────────────
  QuranIndex: undefined;
  PdfViewer: { 
    pageNumber: number; 
    title: string; 
    reviewMarks?: any[]; 
    highlightMarkId?: string;
  };

  // ── Session ───────────────────────────────────────────────────────────────
  SessionSetup: { surahNumber?: number } | undefined;
  PdfSession: {
    scopeType: 'surah' | 'parah';
    scopeNumber: number;
    scopeName: string;
    startPage: number;
    reciterId: string;
  };
  SessionSummary: { sessionId: string };

  // ── Legacy (kept for backward compat) ────────────────────────────────────
  SurahDetail: { surahNumber: number };
  Recitation: { surahNumber: number; reciterId: string };
  PdfRecitation: { surahNumber: number; reciterId: string; pdfUri?: string };
};

// ─── Bottom Tabs ─────────────────────────────────────────────────────────────

export type TabParamList = {
  Quran: undefined;
  Sessions: undefined;
  Analytics: undefined;
  Reciters: undefined;
};

// ─── Composite nav types ─────────────────────────────────────────────────────

export type RootStackNavProp = NativeStackNavigationProp<RootStackParamList>;

export type TabNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

// ─── Route prop helpers ──────────────────────────────────────────────────────

export type SurahDetailRouteProp   = RouteProp<RootStackParamList, 'SurahDetail'>;
export type RecitationRouteProp    = RouteProp<RootStackParamList, 'Recitation'>;
export type PdfRecitationRouteProp = RouteProp<RootStackParamList, 'PdfRecitation'>;
export type SessionSetupRouteProp  = RouteProp<RootStackParamList, 'SessionSetup'>;
export type SessionSummaryRouteProp= RouteProp<RootStackParamList, 'SessionSummary'>;
export type PdfViewerRouteProp     = RouteProp<RootStackParamList, 'PdfViewer'>;
export type PdfSessionRouteProp    = RouteProp<RootStackParamList, 'PdfSession'>;
