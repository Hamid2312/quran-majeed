import React, { useEffect } from 'react';
import {
  View, FlatList, StyleSheet, SafeAreaView,
  Text, TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RootStackNavProp, SurahDetailRouteProp } from '../navigation/types';
import { useQuranStore } from '../stores/quranStore';
import PageView from '../components/quran/PageView';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import EmptyState from '../components/shared/EmptyState';
import { Colors } from '../constants/colors';
import { QuranPage } from '../models/Quran';

export default function SurahDetailScreen() {
  const navigation = useNavigation<RootStackNavProp>();
  const route = useRoute<SurahDetailRouteProp>();
  const { surahNumber } = route.params;

  const { loadSurah, loadedSurahs, loading, error } = useQuranStore();
  const surah = loadedSurahs[surahNumber];

  useEffect(() => {
    loadSurah(surahNumber);
  }, [surahNumber]);

  useEffect(() => {
    if (surah) {
      navigation.setOptions({ title: `${surah.nameEn}  ·  ${surah.name}` });
    }
  }, [surah]);

  if (loading && !surah) return <LoadingSpinner message="Loading Surah 16-Line Pages…" />;
  if (error) return <EmptyState icon="⚠️" title="Failed to load" subtitle={error} />;
  if (!surah) return null;

  const renderPage = ({ item }: { item: QuranPage }) => (
    <PageView 
      page={item} 
      surahNameAr={surah.name}
      fontSize={20} 
      tajweedEnabled={false}
    />
  );

  const ListHeader = () => (
    <View style={styles.surahHeader}>
      <Text style={styles.surahNameAr}>{surah.name}</Text>
      <Text style={styles.surahNameEn}>{surah.nameEn}</Text>
      <Text style={styles.meta}>{surah.revelationType} · {surah.totalAyahs} Ayahs · {surah.pages.length} Pages</Text>
      {surah.number !== 9 && (
        <Text style={styles.basmala}>بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ</Text>
      )}
      <Text style={styles.textModeNote}>Pure text-mode Mushaf preview — no Tajweed color highlighting.</Text>
    </View>
  );

  const ListFooter = () => (
    <View style={styles.footerContainer}>
      <TouchableOpacity
        style={styles.startSessionBtn}
        onPress={() => navigation.navigate('SessionSetup', { surahNumber })}
      >
        <Text style={styles.startSessionText}>🎙️ Start Session on this Surah</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={surah.pages}
        renderItem={renderPage}
        keyExtractor={item => String(item.pageNumber)}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        initialNumToRender={2}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  list: { paddingBottom: 40 },
  surahHeader: {
    alignItems: 'center',
    padding: 24,
    gap: 6,
  },
  surahNameAr: {
    color: Colors.accent,
    fontSize: 32,
    fontWeight: '700',
  },
  surahNameEn: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  meta: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  basmala: {
    color: Colors.textArabic,
    fontSize: 22,
    marginTop: 12,
    textAlign: 'center',
  },
  footerContainer: {
    margin: 16,
    padding: 16,
  },
  textModeNote: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  startSessionBtn: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  startSessionText: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
});
