import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

interface Props {
  label: string;
  value: number;
  max: number;
  color?: string;
}

export default function ProgressBar({ label, value, max, color = Colors.accent }: Props) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4, marginBottom: 10 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: Colors.textSecondary, fontSize: 13 },
  value: { color: Colors.textPrimary, fontWeight: '700', fontSize: 13 },
  track: {
    height: 8,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
