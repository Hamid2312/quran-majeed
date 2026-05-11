import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';
import { SurahMeta } from '../../constants/quran';

interface Props {
  surah: SurahMeta;
  onPress: () => void;
}

function SurahCard({ surah, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      {/* Number circle */}
      <View style={styles.numberBadge}>
        <Text style={styles.numberText}>{surah.number}</Text>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.nameEn}>{surah.nameEn}</Text>
        <Text style={styles.meta}>
          {surah.type} · {surah.totalAyahs} Ayahs
        </Text>
      </View>

      {/* Arabic name */}
      <Text style={styles.nameAr}>{surah.name}</Text>
    </TouchableOpacity>
  );
}

export default memo(SurahCard);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginVertical: 5,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  numberBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    color: Colors.accent,
    fontWeight: '700',
    fontSize: 13,
  },
  info: { flex: 1 },
  nameEn: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  meta: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  nameAr: {
    color: Colors.accent,
    fontSize: 20,
    fontFamily: 'System',
  },
});
