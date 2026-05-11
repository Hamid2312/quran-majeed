import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SurahStat } from '../../models/Session';
import ProgressBar from './ProgressBar';
import { Colors } from '../../constants/colors';

interface Props {
  surahStats: SurahStat[];
}

export default function SurahDifficultyList({ surahStats }: Props) {
  if (surahStats.length === 0) {
    return <Text style={styles.empty}>No data yet.</Text>;
  }

  const top5 = surahStats.slice(0, 5);
  const maxErrors = Math.max(...top5.map(s => s.totalMistakes + s.totalStuck), 1);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>⚠️ Most Difficult Surahs</Text>
      {top5.map(stat => (
        <View key={stat.surahNumber} style={styles.row}>
          <Text style={styles.surahName}>{stat.surahName}</Text>
          <ProgressBar
            label={`${stat.totalMistakes} mistakes · ${stat.totalStuck} stuck`}
            value={stat.totalMistakes + stat.totalStuck}
            max={maxErrors}
            color={Colors.markGhalti}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  row: { gap: 4 },
  surahName: {
    color: Colors.accent,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  empty: { color: Colors.textMuted, textAlign: 'center', marginTop: 8 },
});
