import React, { useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal,
} from 'react-native';
import { PdfMark } from '../../models/Session';
import { Colors } from '../../constants/colors';

interface Props {
  visible: boolean;
  marks: PdfMark[];
  onClearMark: (markId: string) => void;
  onDeleteMark: (markId: string) => void;
  onGoToMark: (mark: PdfMark) => void;
  onClose: () => void;
}

export default function MarksListSheet({ visible, marks, onClearMark, onDeleteMark, onGoToMark, onClose }: Props) {
  // Group marks by page number
  const grouped = useMemo(() => {
    const map: Record<number, PdfMark[]> = {};
    for (const m of marks) {
      if (!map[m.pageNumber]) map[m.pageNumber] = [];
      map[m.pageNumber].push(m);
    }
    return Object.entries(map)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([page, items]) => ({ page: Number(page), items }));
  }, [marks]);

  const totalAtka    = marks.filter(m => m.type === 'atka'   && !m.isCleared).length;
  const totalGhalti  = marks.filter(m => m.type === 'ghalti' && !m.isCleared).length;
  const totalCleared = marks.filter(m => m.isCleared).length;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Session Marks</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Summary row */}
          <View style={styles.summaryRow}>
            <View style={[styles.summaryChip, styles.atkaChip]}>
              <Text style={styles.summaryNum}>{totalAtka}</Text>
              <Text style={styles.summaryLabel}>اٹکا / Stuck</Text>
            </View>
            <View style={[styles.summaryChip, styles.ghaltiChip]}>
              <Text style={styles.summaryNum}>{totalGhalti}</Text>
              <Text style={styles.summaryLabel}>غلطی / Mistake</Text>
            </View>
            <View style={[styles.summaryChip, styles.clearedChip]}>
              <Text style={styles.summaryNum}>{totalCleared}</Text>
              <Text style={styles.summaryLabel}>Cleared</Text>
            </View>
          </View>

          {marks.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No marks yet.</Text>
              <Text style={styles.emptySubtext}>
                Switch to Mark Mode and tap on the PDF to record mistakes or stucks.
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {grouped.map(({ page, items }) => (
                <View key={page} style={styles.group}>
                  <View style={styles.groupHeader}>
                    <Text style={styles.groupPageLabel}>Page {page}</Text>
                    <Text style={styles.groupCount}>{items.length} mark{items.length > 1 ? 's' : ''}</Text>
                  </View>
                  {items.map(mark => (
                    <View key={mark.id} style={[styles.markRow, mark.isCleared && styles.markRowCleared]}>
                      <TouchableOpacity 
                        style={styles.markClickArea} 
                        onPress={() => onGoToMark(mark)}
                        activeOpacity={0.7}
                      >
                        {/* Type badge */}
                        <View style={[
                          styles.typeLine,
                          mark.type === 'ghalti' ? styles.ghaltiLine : styles.atkaLine,
                          mark.isCleared && styles.clearedLine,
                        ]}>
                          <Text style={styles.typeLineText}>
                            {mark.type === 'ghalti' ? '✗' : '〰'}
                          </Text>
                        </View>

                        {/* Info */}
                        <View style={styles.markInfo}>
                          <Text style={[styles.markType, mark.isCleared && styles.strikethrough]}>
                            {mark.type === 'ghalti' ? 'غلطی  Mistake' : 'اٹکا  Stuck'}
                          </Text>
                          <Text style={styles.markPos}>
                            Tap to view on Page {mark.pageNumber}
                          </Text>
                          {mark.isCleared && (
                            <Text style={styles.clearedTag}>✓ Cleared</Text>
                          )}
                        </View>
                      </TouchableOpacity>

                      {/* Actions */}
                      <View style={styles.markActions}>
                        {!mark.isCleared && (
                          <TouchableOpacity
                            style={styles.actionClear}
                            onPress={() => onClearMark(mark.id)}
                          >
                            <Text style={styles.actionClearText}>Clear</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          style={styles.actionDelete}
                          onPress={() => onDeleteMark(mark.id)}
                        >
                          <Text style={styles.actionDeleteText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              ))}
              <View style={{ height: 32 }} />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: '#13131F',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  summaryChip: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 2,
  },
  atkaChip: { backgroundColor: 'rgba(255,184,0,0.15)', borderWidth: 1, borderColor: '#FFB800' },
  ghaltiChip: { backgroundColor: 'rgba(255,68,68,0.15)', borderWidth: 1, borderColor: '#FF4444' },
  clearedChip: { backgroundColor: 'rgba(100,200,100,0.15)', borderWidth: 1, borderColor: '#64C864' },
  summaryNum: { color: '#fff', fontSize: 20, fontWeight: '800' },
  summaryLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600', textAlign: 'center' },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  emptySubtext: { color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  list: { paddingHorizontal: 20 },
  group: { marginBottom: 20 },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  groupPageLabel: { color: '#C8A84B', fontSize: 13, fontWeight: '800' },
  groupCount: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  markRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  markClickArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  markRowCleared: { opacity: 0.5 },
  typeLine: {
    width: 32,
    height: 4,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  atkaLine: { backgroundColor: 'rgba(255,184,0,0.25)', borderWidth: 1.5, borderColor: '#FFB800' },
  ghaltiLine: { backgroundColor: 'rgba(255,68,68,0.25)', borderWidth: 1.5, borderColor: '#FF4444' },
  clearedLine: { borderColor: '#64C864', backgroundColor: 'rgba(100,200,100,0.15)' },
  typeLineText: { fontSize: 8, color: '#fff', fontWeight: '900' },
  markInfo: { flex: 1 },
  markType: { color: '#fff', fontSize: 13, fontWeight: '700' },
  markLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 },
  markPos: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 },
  clearedTag: { color: '#64C864', fontSize: 11, fontWeight: '700', marginTop: 2 },
  strikethrough: { textDecorationLine: 'line-through', color: 'rgba(255,255,255,0.4)' },
  markActions: { flexDirection: 'row', gap: 6 },
  actionClear: {
    backgroundColor: 'rgba(100,200,100,0.2)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#64C864',
  },
  actionClearText: { color: '#64C864', fontSize: 11, fontWeight: '700' },
  actionDelete: {
    backgroundColor: 'rgba(255,68,68,0.15)',
    borderRadius: 8,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionDeleteText: { color: '#FF6666', fontSize: 12, fontWeight: '700' },
});
