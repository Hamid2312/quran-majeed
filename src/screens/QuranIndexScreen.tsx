import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  FlatList, TextInput, StatusBar, Platform, Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavProp } from '../navigation/types';
import { Colors } from '../constants/colors';
import { SURAHS } from '../constants/quran';
import { PDF_SURAH_PAGES, PDF_PARAH_PAGES, PARAH_NAMES } from '../constants/pdfMapping';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

type TabType = 'surah' | 'parah';
const { width } = Dimensions.get('window');

export default function QuranIndexScreen() {
  const navigation = useNavigation<RootStackNavProp>();
  const [activeTab, setActiveTab] = useState<TabType>('surah');
  const [search, setSearch] = useState('');

  // ── Surah list ─────────────────────────────────────────────────────────────
  const filteredSurahs = useMemo(() => {
    if (!search.trim()) return [...SURAHS];
    const q = search.toLowerCase();
    return SURAHS.filter(
      s => s.nameEn.toLowerCase().includes(q) ||
           s.name.includes(search) ||
           String(s.number).includes(q)
    );
  }, [search]);

  // ── Parah list ─────────────────────────────────────────────────────────────
  const parahs = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      number: i + 1,
      arabic: PARAH_NAMES[i + 1]?.arabic ?? '',
      urdu: PARAH_NAMES[i + 1]?.urdu ?? '',
      page: PDF_PARAH_PAGES[i + 1] ?? 1,
    })), []);

  const filteredParahs = useMemo(() => {
    if (!search.trim()) return parahs;
    const q = search.toLowerCase();
    return parahs.filter(
      p => String(p.number).includes(q) ||
           p.arabic.includes(search) ||
           p.urdu.includes(search)
    );
  }, [search, parahs]);

  const openSurah = (surahNumber: number, surahName: string) => {
    const page = PDF_SURAH_PAGES[surahNumber] ?? 1;
    navigation.navigate('PdfViewer', {
      pageNumber: page,
      title: surahName,
    });
  };

  const openParah = (parahNumber: number, parahName: string) => {
    const page = PDF_PARAH_PAGES[parahNumber] ?? 1;
    navigation.navigate('PdfViewer', {
      pageNumber: page,
      title: `Parah ${parahNumber} — ${parahName}`,
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* ── Search ─────────────────────────────────────────────────────────── */}
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={activeTab === 'surah' ? 'Search Surahs...' : 'Search Parahs...'}
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} style={styles.clearIcon}>
              <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'surah' && styles.tabActive]}
          onPress={() => { setActiveTab('surah'); setSearch(''); }}
          activeOpacity={0.8}
        >
          <Ionicons name="book" size={16} color={activeTab === 'surah' ? Colors.primaryDark : Colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'surah' && styles.tabTextActive]}>Surah</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'parah' && styles.tabActive]}
          onPress={() => { setActiveTab('parah'); setSearch(''); }}
          activeOpacity={0.8}
        >
          <Ionicons name="layers" size={16} color={activeTab === 'parah' ? Colors.primaryDark : Colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'parah' && styles.tabTextActive]}>Parah</Text>
        </TouchableOpacity>
      </View>

      {/* ── Surah List ─────────────────────────────────────────────────────── */}
      {activeTab === 'surah' && (
        <FlatList
          data={filteredSurahs}
          keyExtractor={item => String(item.number)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          initialNumToRender={15}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.duration(400).delay(Math.min(index * 50, 500))}>
              <TouchableOpacity
                style={styles.card}
                onPress={() => openSurah(item.number, item.name)}
                activeOpacity={0.8}
              >
                <View style={styles.cardLeft}>
                  <View style={styles.numBadge}>
                    <Text style={styles.numText}>{item.number}</Text>
                  </View>
                  <View style={styles.rowInfo}>
                    <Text style={styles.nameEn}>{item.nameEn}</Text>
                    <Text style={styles.meta}>{item.totalAyahs} Ayahs • Pg {PDF_SURAH_PAGES[item.number]}</Text>
                  </View>
                </View>
                <View style={styles.cardRight}>
                  <Text style={styles.nameAr}>{item.name}</Text>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}
        />
      )}

      {/* ── Parah List ─────────────────────────────────────────────────────── */}
      {activeTab === 'parah' && (
        <FlatList
          data={filteredParahs}
          keyExtractor={item => String(item.number)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          initialNumToRender={15}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.duration(400).delay(Math.min(index * 50, 500))}>
              <TouchableOpacity
                style={styles.card}
                onPress={() => openParah(item.number, item.arabic)}
                activeOpacity={0.8}
              >
                <View style={styles.cardLeft}>
                  <View style={[styles.numBadge, styles.parahBadge]}>
                    <Text style={styles.numText}>{item.number}</Text>
                  </View>
                  <View style={styles.rowInfo}>
                    <Text style={styles.nameEn}>Parah {item.number}</Text>
                    <Text style={styles.meta}>Pg {item.page}</Text>
                  </View>
                </View>
                <View style={styles.cardRight}>
                  <Text style={styles.nameAr}>{item.arabic}</Text>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 16,
    height: '100%',
  },
  clearIcon: {
    padding: 4,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 8,
  },
  tabActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accentLight,
    shadowColor: Colors.accent,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  tabText: {
    color: Colors.textSecondary,
    fontWeight: '700',
    fontSize: 15,
  },
  tabTextActive: { 
    color: Colors.primaryDark,
  },
  listContent: { 
    paddingHorizontal: 20, 
    paddingBottom: 30,
    paddingTop: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 14,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  numBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.1)', // accent light overlay
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  parahBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  numText: { 
    color: Colors.accent, 
    fontWeight: '800', 
    fontSize: 14 
  },
  rowInfo: { 
    flex: 1, 
    justifyContent: 'center' 
  },
  nameEn: { 
    color: Colors.textPrimary, 
    fontSize: 16, 
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  meta: { 
    color: Colors.textMuted, 
    fontSize: 13, 
    marginTop: 4,
    fontWeight: '500',
  },
  nameAr: { 
    color: Colors.accent, 
    fontSize: 22, 
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
});
