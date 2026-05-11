import React, { useEffect, useState, useCallback } from 'react';
import {
  View, ScrollView, StyleSheet, SafeAreaView,
  Text, TouchableOpacity, Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RootStackNavProp, RecitationRouteProp } from '../navigation/types';
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

export default function RecitationScreen() {
  const navigation = useNavigation<RootStackNavProp>();
  const route = useRoute<RecitationRouteProp>();
  const { surahNumber } = route.params;

  const { activeSession, addMark, removeMark, setCurrentPage, clearSession } = useSessionStore();
  const { loadedSurahs, loadSurah, loading } = useQuranStore();

  const [selectedWord, setSelectedWord] = useState<TajweedWord | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const surah = loadedSurahs[surahNumber];
  const currentPageIndex = activeSession?.currentPageIndex ?? 0;
  const currentPage = surah?.pages[currentPageIndex];
  const currentAyah = currentPage ? Math.max(...currentPage.lines.flatMap(l => l.words.map(w => w.ayahNumber))) : 0;

  useEffect(() => {
    if (!surah) loadSurah(surahNumber);
  }, [surahNumber]);

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
            if (!activeSession) return;
            const endedAt = nowISO();

            // Flatten marks from store into WordMark[]
            const marks: WordMark[] = Object.entries(activeSession.marks).flatMap(([key, counts]) => {
              const [ayahNum, wordIdx] = key.split('-').map(Number);
              const results: WordMark[] = [];
              let wordText = '';
              // find word text efficiently
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
    ? Object.values(activeSession.marks).reduce(
        (sum, m) => sum + m.atka + m.ghalti, 0
      )
    : 0;

  if (loading || !surah || !activeSession) {
    return <LoadingSpinner message="Loading recitation pages…" />;
  }

  const wordMarksForWord = (word: TajweedWord) => {
    const key = `${word.ayahNumber}-${word.wordIndexInAyah}`;
    return activeSession.marks[key] ?? { atka: 0, ghalti: 0 };
  };

  const selectedWordText = selectedWord?.text ?? '';
  const selectedWordMarks = selectedWord
    ? wordMarksForWord(selectedWord)
    : { atka: 0, ghalti: 0 };

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

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* 16-line Page Container */}
        <View style={styles.pageContainer}>
          <View style={styles.innerBorder}>
            
            <View style={styles.mushafHeader}>
              <Text style={styles.headerText}>{/* Juz could go here */}</Text>
              <Text style={styles.pageLabel}>— {currentPage?.pageNumber} —</Text>
              <Text style={styles.headerText}>{surah?.name ? `سورة ${surah.name}` : ''}</Text>
            </View>

            {currentPage?.lines.map((line, lineIdx) => (
              <View key={lineIdx} style={styles.lineContainer}>
                {line.words.map((word) => (
                  <WordChip
                    key={word.id || `${word.ayahNumber}-${word.wordIndexInAyah}`}
                    word={word}
                    marks={wordMarksForWord(word)}
                    onPress={handleWordPress}
                    fontSize={20} // Slightly smaller to fit lines
                  />
                ))}
              </View>
            ))}

          </View>
        </View>

        <Text style={styles.tapHint}>Tap any word to mark Atka / Ghalti</Text>
      </ScrollView>

      {/* Prev / Next navigation */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={[styles.navBtn, currentPageIndex === 0 && styles.navBtnDisabled]}
          onPress={goPrevPage}
          disabled={currentPageIndex === 0}
        >
          <Text style={styles.navBtnText}>◀ Prev Page</Text>
        </TouchableOpacity>

        <Text style={styles.navProgress}>
          {currentPageIndex + 1} / {surah.pages.length}
        </Text>

        <TouchableOpacity
          style={[
            styles.navBtn,
            currentPageIndex >= surah.pages.length - 1 && styles.navBtnDisabled,
          ]}
          onPress={goNextPage}
          disabled={currentPageIndex >= surah.pages.length - 1}
        >
          <Text style={styles.navBtnText}>Next ▶</Text>
        </TouchableOpacity>
      </View>

      {/* Mark modal */}
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
  content: {
    padding: 10,
    paddingBottom: 40,
    alignItems: 'center',
  },
  pageContainer: {
    backgroundColor: '#FFF8EB', // Authentic physical page color
    width: '100%',
    padding: 4,
    borderRadius: 2,
    borderWidth: 2,
    borderColor: '#8B2C46',     // Deep maroon border like the image
    elevation: 4,
  },
  innerBorder: {
    borderWidth: 1,
    borderColor: '#8B2C46',
    paddingHorizontal: 8,
    paddingBottom: 16,
    paddingTop: 4,
  },
  mushafHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#8B2C46',
    paddingBottom: 4,
    paddingHorizontal: 8,
  },
  headerText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontFamily: 'IndoPak', // Custom font if provided
  },
  pageLabel: {
    color: '#1A1A1A',
    fontSize: 14,
    fontWeight: '700',
  },
  lineContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 2,
  },
  tapHint: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.surface,
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
