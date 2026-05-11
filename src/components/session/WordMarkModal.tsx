import React from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, Pressable
} from 'react-native';
import { Colors } from '../../constants/colors';
import { MarkType } from '../../models/Session';

interface Props {
  visible: boolean;
  wordText: string;
  wordIndex: number;
  currentMarks: { atka: number; ghalti: number };
  onMark: (type: MarkType) => void;
  onUnmark: (type: MarkType) => void;
  onClose: () => void;
}

export default function WordMarkModal({
  visible, wordText, currentMarks, onMark, onUnmark, onClose
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet}>
          {/* Word display */}
          <Text style={styles.wordLabel}>{wordText}</Text>
          <Text style={styles.subtitle}>Mark this word:</Text>

          <View style={styles.actionsRow}>
            {/* Atka */}
            <View style={styles.markGroup}>
              <Text style={styles.markTitle}>⏸ Atka (Stuck)</Text>
              <Text style={styles.markCount}>{currentMarks.atka}</Text>
              <View style={styles.markBtns}>
                <TouchableOpacity
                  style={[styles.markBtn, styles.addBtn]}
                  onPress={() => onMark('atka')}
                >
                  <Text style={styles.markBtnText}>+1</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.markBtn, styles.removeBtn]}
                  onPress={() => onUnmark('atka')}
                  disabled={currentMarks.atka === 0}
                >
                  <Text style={styles.markBtnText}>−1</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Ghalti */}
            <View style={styles.markGroup}>
              <Text style={styles.markTitle}>❌ Ghalti (Mistake)</Text>
              <Text style={styles.markCount}>{currentMarks.ghalti}</Text>
              <View style={styles.markBtns}>
                <TouchableOpacity
                  style={[styles.markBtn, styles.addBtnRed]}
                  onPress={() => onMark('ghalti')}
                >
                  <Text style={styles.markBtnText}>+1</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.markBtn, styles.removeBtn]}
                  onPress={() => onUnmark('ghalti')}
                  disabled={currentMarks.ghalti === 0}
                >
                  <Text style={styles.markBtnText}>−1</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Done</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  wordLabel: {
    color: Colors.textArabic,
    fontSize: 32,
    marginBottom: 4,
    textAlign: 'right',
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 13,
    marginBottom: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 24,
    width: '100%',
  },
  markGroup: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  markTitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  markCount: {
    color: Colors.textPrimary,
    fontSize: 36,
    fontWeight: '800',
  },
  markBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  markBtn: {
    width: 48,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtn: { backgroundColor: Colors.markAtka },
  addBtnRed: { backgroundColor: Colors.markGhalti },
  removeBtn: { backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border },
  markBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  divider: {
    width: 1,
    backgroundColor: Colors.border,
    alignSelf: 'stretch',
  },
  closeBtn: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  closeBtnText: {
    color: Colors.accent,
    fontWeight: '700',
    fontSize: 16,
  },
});
