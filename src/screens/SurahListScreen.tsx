import React, { useState, useCallback } from 'react';
import {
  View, FlatList, TextInput, StyleSheet,
  StatusBar, SafeAreaView, Text, TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavProp } from '../navigation/types';
import { SurahMeta } from '../constants/quran';
import { getAllSurahsMeta } from '../services/QuranService';
import SurahCard from '../components/quran/SurahCard';
import { Colors } from '../constants/colors';

const ALL_SURAHS = getAllSurahsMeta();

export default function SurahListScreen() {
  const navigation = useNavigation<RootStackNavProp>();
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? ALL_SURAHS.filter(
        (s: SurahMeta) =>
          s.nameEn.toLowerCase().includes(query.toLowerCase()) ||
          s.name.includes(query) ||
          String(s.number).includes(query)
      )
    : ALL_SURAHS;

  const handlePress = useCallback(
    (surahNumber: number) => {
      navigation.navigate('SurahDetail', { surahNumber });
    },
    [navigation]
  );

  const renderItem = useCallback(
    ({ item }: { item: SurahMeta }) => (
      <SurahCard surah={item} onPress={() => handlePress(item.number)} />
    ),
    [handlePress]
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>القرآن الكريم</Text>
        <Text style={styles.subtitle}>114 Surahs</Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search surah…"
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={setQuery}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered as SurahMeta[]}
        renderItem={renderItem}
        keyExtractor={item => String(item.number)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        initialNumToRender={20}
        maxToRenderPerBatch={20}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
    alignItems: 'center',
    gap: 4,
  },
  title: {
    color: Colors.accent,
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    letterSpacing: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  clearBtn: { padding: 6 },
  clearText: { color: Colors.textMuted, fontSize: 14 },
  list: { paddingBottom: 24 },
});
