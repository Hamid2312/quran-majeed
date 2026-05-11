import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView, Alert, FlatList, StatusBar, Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RootStackNavProp, SessionSetupRouteProp } from '../navigation/types';
import { Colors } from '../constants/colors';
import { useSessionStore } from '../stores/sessionStore';
import { usePdfStore } from '../stores/pdfStore';
import { getReciters, saveReciter } from '../services/StorageService';
import { ReciterProfile } from '../models/Session';
import { generateId, nowISO, randomAvatarColor } from '../utils/dateHelpers';
import { SURAHS } from '../constants/quran';
import { PDF_SURAH_PAGES, PDF_PARAH_PAGES, PARAH_NAMES } from '../constants/pdfMapping';
import PremiumButton from '../components/shared/PremiumButton';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

type ScopeType = 'surah' | 'parah';

export default function SessionSetupScreen() {
  const navigation = useNavigation<RootStackNavProp>();
  const route = useRoute<SessionSetupRouteProp>();
  const preselectedSurah = route.params?.surahNumber;

  const [reciterName, setReciterName] = useState('');
  const [reciters, setReciters] = useState<ReciterProfile[]>([]);
  const [selectedReciter, setSelectedReciter] = useState<ReciterProfile | null>(null);

  const [scopeType, setScopeType] = useState<ScopeType>('surah');
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(preselectedSurah ?? 1);
  const [selectedParahNumber, setSelectedParahNumber] = useState<number>(1);
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(false);

  const { startPdfSession } = useSessionStore();
  const { isPdfReady, initPdf } = usePdfStore();

  useEffect(() => {
    loadReciters();
    initPdf();   // ensure PDF is ready
  }, []);

  const loadReciters = async () => {
    const r = await getReciters();
    setReciters(r);
  };

  const createNewReciter = async () => {
    const name = reciterName.trim();
    if (!name) {
      Alert.alert('Name required', "Please enter the reciter's name.");
      return;
    }
    const profile: ReciterProfile = {
      id: generateId(),
      name,
      createdAt: nowISO(),
      avatarColor: randomAvatarColor(),
    };
    await saveReciter(profile);
    await loadReciters();
    setSelectedReciter(profile);
    setReciterName('');
  };

  // ── Surah list with search ─────────────────────────────────────────────────
  const filteredSurahs = useMemo(() => {
    if (!search.trim()) return [...SURAHS];
    const q = search.toLowerCase();
    return SURAHS.filter(
      s => s.nameEn.toLowerCase().includes(q) ||
           s.name.includes(search) ||
           String(s.number).includes(q)
    );
  }, [search]);

  // ── Parah list with search ─────────────────────────────────────────────────
  const parahs = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      number: i + 1,
      arabic: PARAH_NAMES[i + 1]?.arabic ?? '',
    })), []);

  const filteredParahs = useMemo(() => {
    if (!search.trim()) return parahs;
    const q = search.toLowerCase();
    return parahs.filter(
      p => String(p.number).includes(q) || p.arabic.includes(search)
    );
  }, [search, parahs]);

  const selectedSurah = SURAHS[selectedSurahNumber - 1];
  const selectedParahArabic = PARAH_NAMES[selectedParahNumber]?.arabic ?? '';

  const handleStart = async () => {
    if (!selectedReciter) {
      Alert.alert('Select Reciter', 'Please select or create a reciter first.');
      return;
    }
    if (!isPdfReady) {
      Alert.alert('PDF Loading', 'Quran PDF is still loading. Please wait a moment and try again.');
      return;
    }

    let startPage: number;
    let scopeNumber: number;
    let scopeName: string;

    if (scopeType === 'surah') {
      scopeNumber = selectedSurahNumber;
      scopeName = `${selectedSurah.name} — ${selectedSurah.nameEn}`;
      startPage = PDF_SURAH_PAGES[selectedSurahNumber] ?? 1;
    } else {
      scopeNumber = selectedParahNumber;
      scopeName = `Parah ${selectedParahNumber} — ${selectedParahArabic}`;
      startPage = PDF_PARAH_PAGES[selectedParahNumber] ?? 1;
    }

    setLoading(true);
    await startPdfSession(selectedReciter, scopeType, scopeNumber, scopeName, startPage);
    setLoading(false);

    navigation.navigate('PdfSession', {
      scopeType,
      scopeNumber,
      scopeName,
      startPage,
      reciterId: selectedReciter.id,
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400)}>
          <View style={styles.headerRow}>
            <Ionicons name="mic-circle" size={32} color={Colors.accent} />
            <Text style={styles.pageTitle}>New Recitation Session</Text>
          </View>
        </Animated.View>

        {/* PDF Status Banner */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <View style={[styles.pdfBanner, isPdfReady ? styles.pdfBannerReady : styles.pdfBannerLoading]}>
            <Ionicons 
              name={isPdfReady ? "checkmark-circle" : "hourglass"} 
              size={20} 
              color={isPdfReady ? "#64C864" : Colors.accent} 
              style={styles.bannerIcon} 
            />
            <Text style={styles.pdfBannerText}>
              {isPdfReady ? 'Quran PDF ready' : 'Loading Quran PDF…'}
            </Text>
          </View>
        </Animated.View>

        {/* ── Add Reciter ──────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.section}>
          <Text style={styles.sectionTitle}>Add New Reciter</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Reciter's name..."
              placeholderTextColor={Colors.textMuted}
              value={reciterName}
              onChangeText={setReciterName}
            />
            <TouchableOpacity style={styles.addBtn} onPress={createNewReciter}>
              <Ionicons name="add" size={20} color={Colors.textPrimary} />
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ── Select Reciter ───────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.section}>
          <Text style={styles.sectionTitle}>Select Reciter</Text>
          {reciters.length === 0 && (
            <Text style={styles.emptyNote}>No reciters yet. Add one above.</Text>
          )}
          <View style={styles.reciterGrid}>
            {reciters.map(r => (
              <TouchableOpacity
                key={r.id}
                style={[
                  styles.reciterChip,
                  selectedReciter?.id === r.id && styles.reciterChipSelected,
                ]}
                onPress={() => setSelectedReciter(r)}
              >
                <View style={[styles.avatar, { backgroundColor: r.avatarColor }]}>
                  <Text style={styles.avatarText}>{r.name.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.reciterChipName}>{r.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* ── Scope Type Toggle ────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(400).delay(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>Session Scope</Text>
          <View style={styles.scopeRow}>
            <TouchableOpacity
              style={[styles.scopeBtn, scopeType === 'surah' && styles.scopeBtnActive]}
              onPress={() => { setScopeType('surah'); setShowPicker(false); setSearch(''); }}
            >
              <Ionicons name="book" size={18} color={scopeType === 'surah' ? Colors.textPrimary : Colors.textMuted} />
              <Text style={[styles.scopeBtnText, scopeType === 'surah' && styles.scopeBtnTextActive]}>
                By Surah
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.scopeBtn, scopeType === 'parah' && styles.scopeBtnActive]}
              onPress={() => { setScopeType('parah'); setShowPicker(false); setSearch(''); }}
            >
              <Ionicons name="layers" size={18} color={scopeType === 'parah' ? Colors.textPrimary : Colors.textMuted} />
              <Text style={[styles.scopeBtnText, scopeType === 'parah' && styles.scopeBtnTextActive]}>
                By Parah
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ── Surah / Parah Picker ─────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(400).delay(500)} style={styles.section}>
          <Text style={styles.sectionTitle}>
            {scopeType === 'surah' ? 'Select Surah' : 'Select Parah'}
          </Text>

          {/* Selected display */}
          <TouchableOpacity
            style={styles.selectedDisplay}
            onPress={() => { setShowPicker(p => !p); setSearch(''); }}
          >
            <View style={styles.selectedDisplayInfo}>
              {scopeType === 'surah' ? (
                <>
                  <Text style={styles.selectedAr}>{selectedSurah.name}</Text>
                  <Text style={styles.selectedEn}>
                    {selectedSurah.nameEn} · {selectedSurah.totalAyahs} ayahs · pg {PDF_SURAH_PAGES[selectedSurahNumber]}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.selectedAr}>{selectedParahArabic}</Text>
                  <Text style={styles.selectedEn}>
                    Parah {selectedParahNumber} · pg {PDF_PARAH_PAGES[selectedParahNumber]}
                  </Text>
                </>
              )}
            </View>
            <Ionicons name={showPicker ? "chevron-up" : "chevron-down"} size={20} color={Colors.textMuted} />
          </TouchableOpacity>

          {/* Dropdown */}
          {showPicker && (
            <View style={styles.dropdown}>
              <View style={styles.dropdownSearchContainer}>
                <Ionicons name="search" size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.dropdownSearch}
                  placeholder="Search…"
                  placeholderTextColor={Colors.textMuted}
                  value={search}
                  onChangeText={setSearch}
                />
              </View>
              {scopeType === 'surah' ? (
                <FlatList
                  data={filteredSurahs}
                  keyExtractor={item => String(item.number)}
                  style={{ maxHeight: 280 }}
                  showsVerticalScrollIndicator
                  nestedScrollEnabled={true}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.dropdownItem,
                        item.number === selectedSurahNumber && styles.dropdownItemSelected,
                      ]}
                      onPress={() => {
                        setSelectedSurahNumber(item.number);
                        setShowPicker(false);
                        setSearch('');
                      }}
                    >
                      <Text style={styles.dropdownNum}>{item.number}.</Text>
                      <Text style={styles.dropdownName}>{item.nameEn}</Text>
                      <Text style={styles.dropdownAr}>{item.name}</Text>
                    </TouchableOpacity>
                  )}
                />
              ) : (
                <FlatList
                  data={filteredParahs}
                  keyExtractor={item => String(item.number)}
                  style={{ maxHeight: 280 }}
                  showsVerticalScrollIndicator
                  nestedScrollEnabled={true}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.dropdownItem,
                        item.number === selectedParahNumber && styles.dropdownItemSelected,
                      ]}
                      onPress={() => {
                        setSelectedParahNumber(item.number);
                        setShowPicker(false);
                        setSearch('');
                      }}
                    >
                      <Text style={styles.dropdownNum}>{item.number}.</Text>
                      <Text style={styles.dropdownName}>Parah {item.number}</Text>
                      <Text style={styles.dropdownAr}>{item.arabic}</Text>
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          )}
        </Animated.View>

        {/* ── Start Button ─────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(400).delay(600)}>
          <PremiumButton 
            title={loading ? 'Starting…' : 'Start Session'}
            icon={<Ionicons name="play" size={20} color={Colors.primaryDark} />}
            onPress={handleStart}
            variant="primary"
          />
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0,
  },
  container: { padding: 20, gap: 16, paddingBottom: 48 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  pageTitle: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  pdfBanner: {
    flexDirection: 'row',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  bannerIcon: {
    marginRight: 10,
  },
  pdfBannerReady: {
    backgroundColor: 'rgba(100,200,100,0.1)',
    borderColor: 'rgba(100,200,100,0.3)',
  },
  pdfBannerLoading: {
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderColor: 'rgba(212,175,55,0.3)',
  },
  pdfBannerText: { color: Colors.textPrimary, fontWeight: '600', fontSize: 14 },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    gap: 16,
  },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputRow: { flexDirection: 'row', gap: 10 },
  input: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    color: Colors.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 4,
  },
  addBtnText: { color: Colors.textPrimary, fontWeight: '700' },
  emptyNote: { color: Colors.textMuted, fontSize: 13, fontStyle: 'italic' },
  reciterGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  reciterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reciterChipSelected: {
    borderColor: Colors.accent,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  avatar: {
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  reciterChipName: { color: Colors.textPrimary, fontWeight: '600' },
  scopeRow: { flexDirection: 'row', gap: 10 },
  scopeBtn: {
    flex: 1, flexDirection: 'row', paddingVertical: 14, borderRadius: 12,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  scopeBtnActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)', borderColor: Colors.accent,
  },
  scopeBtnText: { color: Colors.textMuted, fontWeight: '700', fontSize: 14 },
  scopeBtnTextActive: { color: Colors.textPrimary },
  selectedDisplay: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surfaceElevated, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  selectedDisplayInfo: { flex: 1 },
  selectedAr: { color: Colors.accent, fontSize: 22, textAlign: 'right', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  selectedEn: { color: Colors.textMuted, fontSize: 13, marginTop: 4, fontWeight: '500' },
  dropdown: {
    backgroundColor: Colors.surfaceElevated, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
    marginTop: -8,
  },
  dropdownSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownSearch: {
    flex: 1,
    height: 44, paddingHorizontal: 12, color: Colors.textPrimary,
    fontSize: 14,
  },
  dropdownItem: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 8,
  },
  dropdownItemSelected: { backgroundColor: 'rgba(45, 106, 79, 0.5)' },
  dropdownNum: { color: Colors.textMuted, fontSize: 13, width: 30, fontWeight: '600' },
  dropdownName: { color: Colors.textPrimary, flex: 1, fontSize: 15, fontWeight: '500' },
  dropdownAr: { color: Colors.accent, fontSize: 18, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
});
