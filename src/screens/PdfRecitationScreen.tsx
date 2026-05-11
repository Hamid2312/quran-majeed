import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RootStackNavProp, PdfRecitationRouteProp } from '../navigation/types';
import { useSessionStore } from '../stores/sessionStore';
import { useQuranStore } from '../stores/quranStore';
import SessionHeader from '../components/session/SessionHeader';
import WordChip from '../components/session/WordChip';
import WordMarkModal from '../components/session/WordMarkModal';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { Colors } from '../constants/colors';
import { finalizeSession } from '../services/SessionService';
import { nowISO } from '../utils/dateHelpers';
import { WordMark, MarkType } from '../models/Session';
import { TajweedWord } from '../models/Quran';

export default function PdfRecitationScreen() {
  const navigation = useNavigation<RootStackNavProp>();
  const route = useRoute<PdfRecitationRouteProp>();
  const { surahNumber, pdfUri: initialPdfUri } = route.params;

  const { activeSession, addMark, removeMark, setCurrentPage, clearSession } = useSessionStore();
  const { loadedSurahs, loadSurah, loading } = useQuranStore();

  const [pdfUri, setPdfUri] = useState<string | null>(initialPdfUri ?? null);
  const [pdfUrlInput, setPdfUrlInput] = useState('');
  const [selectedWord, setSelectedWord] = useState<TajweedWord | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const surah = loadedSurahs[surahNumber];
  const currentPageIndex = activeSession?.currentPageIndex ?? 0;
  const currentPage = surah?.pages[currentPageIndex];
  const currentAyah = currentPage ? Math.max(...currentPage.lines.flatMap(l => l.words.map(w => w.ayahNumber))) : 0;

  useEffect(() => {
    if (!surah) loadSurah(surahNumber);
  }, [surahNumber]);

  const pickPdf = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' }) as any;
    if (result?.type === 'success' && typeof result.uri === 'string') {
      setPdfUri(result.uri);
    }
  }, []);

  const applyPdfUrl = useCallback(() => {
    const trimmed = pdfUrlInput.trim();
    if (!trimmed) {
      Alert.alert('Enter PDF URL', 'Paste the remote Quran PDF URL before importing.');
      return;
    }
    setPdfUri(trimmed);
  }, [pdfUrlInput]);

  const handleWordPress = useCallback((word: TajweedWord) => {
    setSelectedWord(word);
    setModalVisible(true);
  }, []);

  const handleMark = useCallback((type: MarkType) => {
    if (!selectedWord) return;
    addMark(selectedWord.ayahNumber, selectedWord.wordIndexInAyah, selectedWord.text, type);
  }, [selectedWord, addMark]);

  const handleUnmark = useCallback((type: MarkType) => {
    if (!selectedWord) return;
    removeMark(selectedWord.ayahNumber, selectedWord.wordIndexInAyah, type);
  }, [selectedWord, removeMark]);

  const handleEndSession = () => {
    Alert.alert(
      'End Session',
      'Save and end this recitation session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Session',
          style: 'destructive',
          onPress: async () => {
            if (!activeSession || !surah) return;
            const endedAt = nowISO();
            const marks: WordMark[] = Object.entries(activeSession.marks).flatMap(([key, counts]) => {
              const [ayahNum, wordIdx] = key.split('-').map(Number);
              const results: WordMark[] = [];
              let wordText = '';
              for (const p of surah.pages) {
                for (const l of p.lines) {
                  const w = l.words.find(x => x.ayahNumber === ayahNum && x.wordIndexInAyah === wordIdx);
                  if (w) { wordText = w.text; break; }
                }
                if (wordText) break;
              }
              if (counts.atka > 0) {
                results.push({ wordIndex: wordIdx, wordText, ayahNumber: ayahNum, type: 'atka', count: counts.atka });
              }
              if (counts.ghalti > 0) {
                results.push({ wordIndex: wordIdx, wordText, ayahNumber: ayahNum, type: 'ghalti', count: counts.ghalti });
              }
              return results;
            });

            await finalizeSession(activeSession.sessionId, endedAt, marks);
            const sid = activeSession.sessionId;
            clearSession();
            navigation.replace('SessionSummary', { sessionId: sid });
          },
        },
      ]
    );
  };

  const goNextPage = () => {
    if (!surah || currentPageIndex >= surah.pages.length - 1) return;
    setCurrentPage(currentPageIndex + 1);
  };

  const goPrevPage = () => {
    if (currentPageIndex === 0) return;
    setCurrentPage(currentPageIndex - 1);
  };

  const totalMarks = activeSession
    ? Object.values(activeSession.marks).reduce((sum, m) => sum + m.atka + m.ghalti, 0)
    : 0;

  if (loading || !surah || !activeSession) {
    return <LoadingSpinner message="Loading PDF recitation session…" />;
  }

  const wordMarksForWord = (word: TajweedWord) => {
    const key = `${word.ayahNumber}-${word.wordIndexInAyah}`;
    return activeSession.marks[key] ?? { atka: 0, ghalti: 0 };
  };

  const selectedWordText = selectedWord?.text ?? '';
  const selectedWordMarks = selectedWord
    ? wordMarksForWord(selectedWord)
    : { atka: 0, ghalti: 0 };

  const wordsForCurrentAyah = useMemo(() => {
    if (!currentPage) return [] as TajweedWord[];
    return currentPage.lines.flatMap(line => line.words).filter(word => word.ayahNumber === currentAyah);
  }, [currentPage, currentAyah]);

  return (
    <SafeAreaView style={styles.safe}>
      <SessionHeader
        reciterName={activeSession.reciter.name}
        surahName={activeSession.surahName}
        ayahIndex={currentAyah - 1}
        totalAyahs={surah.totalAyahs}
        totalMarks={totalMarks}
        currentPage={currentPageIndex}
        totalPages={surah.pages.length}
        onEndSession={handleEndSession}
      />

      {!pdfUri ? (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateTitle}>Import a Quran PDF to start</Text>
          <Text style={styles.emptyStateSubtitle}>Choose your 16-line Mushaf PDF or paste a direct PDF URL.</Text>
          <TouchableOpacity style={styles.pdfButton} onPress={pickPdf}>
            <Text style={styles.pdfButtonText}>Select PDF File</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.pdfUrlInput}
            placeholder="https://example.com/quran.pdf"
            placeholderTextColor={Colors.textMuted}
            value={pdfUrlInput}
            onChangeText={setPdfUrlInput}
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.pdfApplyButton} onPress={applyPdfUrl}>
            <Text style={styles.pdfApplyButtonText}>Use PDF URL</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.pdfWrapper}>
          <WebView
            originWhitelist={['*']}
            source={{ uri: pdfUri }}
            style={styles.webview}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={Colors.primary} />
              </View>
            )}
          />
        </View>
      )}

      <View style={styles.controlsContainer}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Ayah {currentAyah}</Text>
          <TouchableOpacity style={styles.pdfAction} onPress={pickPdf}>
            <Text style={styles.pdfActionText}>{pdfUri ? 'Change PDF' : 'Import PDF'}</Text>
          </TouchableOpacity>
        </View>
        {pdfUri ? (
          <Text style={styles.pdfSourceText}>Loaded from: {pdfUri}</Text>
        ) : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.wordsRow} contentContainerStyle={styles.wordsRowContent}>
          {wordsForCurrentAyah.map(word => (
            <WordChip
              key={word.id || `${word.ayahNumber}-${word.wordIndexInAyah}`}
              word={word}
              marks={wordMarksForWord(word)}
              onPress={handleWordPress}
              fontSize={18}
            />
          ))}
        </ScrollView>

        <View style={styles.navBar}>
          <TouchableOpacity
            style={[styles.navBtn, currentPageIndex === 0 && styles.navBtnDisabled]}
            onPress={goPrevPage}
            disabled={currentPageIndex === 0}
          >
            <Text style={styles.navBtnText}>◀ Prev Page</Text>
          </TouchableOpacity>
          <Text style={styles.navProgress}>{currentPageIndex + 1} / {surah.pages.length}</Text>
          <TouchableOpacity
            style={[styles.navBtn, currentPageIndex >= surah.pages.length - 1 && styles.navBtnDisabled]}
            onPress={goNextPage}
            disabled={currentPageIndex >= surah.pages.length - 1}
          >
            <Text style={styles.navBtnText}>Next ▶</Text>
          </TouchableOpacity>
        </View>
      </View>

      <WordMarkModal
        visible={modalVisible}
        wordText={selectedWordText}
        wordIndex={selectedWord?.wordIndexInAyah ?? 0}
        currentMarks={selectedWordMarks}
        onMark={handleMark}
        onUnmark={handleUnmark}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyStateTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptyStateSubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  pdfButton: {
    backgroundColor: Colors.primaryLight,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  pdfButtonText: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  pdfUrlInput: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.textPrimary,
    marginTop: 12,
  },
  pdfApplyButton: {
    backgroundColor: Colors.primaryLight,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  pdfApplyButtonText: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  pdfWrapper: {
    height: 340,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 12,
  },
  webview: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  controlsContainer: {
    padding: 16,
    gap: 12,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  panelTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  pdfAction: {
    padding: 10,
  },
  pdfActionText: {
    color: Colors.info,
    fontWeight: '700',
  },
  pdfSourceText: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 6,
  },
  wordsRow: {
    minHeight: 80,
  },
  wordsRowContent: {
    gap: 10,
    paddingVertical: 10,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  navBtn: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  navBtnDisabled: { opacity: 0.3 },
  navBtnText: { color: Colors.textPrimary, fontWeight: '700' },
  navProgress: {
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
});
