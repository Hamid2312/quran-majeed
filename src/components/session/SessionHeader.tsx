import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

interface Props {
  reciterName: string;
  surahName: string;
  ayahIndex: number;
  totalAyahs: number;
  totalMarks: number;
  currentPage: number;
  totalPages: number;
  onEndSession: () => void;
}

export default function SessionHeader({
  reciterName, surahName, ayahIndex, totalAyahs, totalMarks, currentPage, totalPages, onEndSession,
}: Props) {
  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.reciterLabel}>🎙️ Reciter</Text>
          <Text style={styles.reciterName}>{reciterName}</Text>
        </View>
        <TouchableOpacity style={styles.endBtn} onPress={onEndSession}>
          <Text style={styles.endBtnText}>End Session</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>{surahName}</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillText}>Page {currentPage + 1} / {totalPages}</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillText}>Ayah {ayahIndex + 1} / {totalAyahs}</Text>
        </View>
        <View style={[styles.pill, styles.pillMarks]}>
          <Text style={styles.pillText}>📝 {totalMarks} marks</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.surface,
    padding: 16,
    paddingTop: 52,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reciterLabel: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  reciterName: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  endBtn: {
    backgroundColor: Colors.error,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  endBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  pill: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillMarks: {
    borderColor: Colors.accent,
  },
  pillText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
});
