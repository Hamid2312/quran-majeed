import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

interface Props {
  x: number;         // absolute pixel position within overlay
  y: number;
  onAtka: () => void;
  onGhalti: () => void;
  onCancel: () => void;
}

export default function MarkPopup({ x, y, onAtka, onGhalti, onCancel }: Props) {
  // Keep popup within bounds (rough estimate)
  const adjustedX = Math.max(10, Math.min(x - 70, 9999));
  const adjustedY = y > 200 ? y - 120 : y + 30;

  return (
    <View style={[styles.container, { left: adjustedX, top: adjustedY }]}>
      <Text style={styles.title}>Mark This Position</Text>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.btn, styles.atkaBtn]} onPress={onAtka} activeOpacity={0.8}>
          <Text style={styles.btnIcon}>〰️</Text>
          <Text style={styles.btnText}>اٹکا{'\n'}Stuck</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.ghaltiBtn]} onPress={onGhalti} activeOpacity={0.8}>
          <Text style={styles.btnIcon}>✗</Text>
          <Text style={styles.btnText}>غلطی{'\n'}Mistake</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: '#1C1C2E',
    borderRadius: 16,
    padding: 14,
    width: 180,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    zIndex: 999,
  },
  title: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  btn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 4,
  },
  atkaBtn: {
    backgroundColor: 'rgba(255,184,0,0.2)',
    borderWidth: 1.5,
    borderColor: '#FFB800',
  },
  ghaltiBtn: {
    backgroundColor: 'rgba(255,68,68,0.2)',
    borderWidth: 1.5,
    borderColor: '#FF4444',
  },
  btnIcon: {
    fontSize: 16,
  },
  btnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 15,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  cancelText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: '600',
  },
});
