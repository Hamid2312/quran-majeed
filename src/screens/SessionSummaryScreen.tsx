import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, StatusBar, Platform,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList, RootStackNavProp } from '../navigation/types';
import { Colors } from '../constants/colors';
import { SessionRecord, PdfMark } from '../models/Session';
import { getSessionById } from '../services/SessionService';

type SummaryRouteProp = RouteProp<RootStackParamList, 'SessionSummary'>;

export default function SessionSummaryScreen() {
  const navigation = useNavigation<RootStackNavProp>();
  const route = useRoute<SummaryRouteProp>();
  const { sessionId } = route.params;

  const [session, setSession] = useState<SessionRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSessionById(sessionId).then(s => {
      setSession(s);
      setLoading(false);
    });
  }, [sessionId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator style={{ flex: 1 }} size="large" color={Colors.accent} />
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Session not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Compute PDF Mark stats ─────────────────────────────────────────────────
  const pdfMarks = session.pdfMarks ?? [];
  const totalAtka   = pdfMarks.filter(m => m.type === 'atka'   && !m.isCleared).length;
  const totalGhalti = pdfMarks.filter(m => m.type === 'ghalti' && !m.isCleared).length;
  const totalCleared = pdfMarks.filter(m => m.isCleared).length;

  // Group by page
  const byPage: Record<number, PdfMark[]> = {};
  for (const m of pdfMarks) {
    if (!byPage[m.pageNumber]) byPage[m.pageNumber] = [];
    byPage[m.pageNumber].push(m);
  }
  const pages = Object.keys(byPage).map(Number).sort((a, b) => a - b);

  // Duration
  let durationText = '—';
  if (session.endedAt && session.startedAt) {
    const mins = Math.round(
      (new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 60000
    );
    durationText = mins < 1 ? '<1 min' : `${mins} min`;
  }

  const isPdfSession = pdfMarks.length > 0 || session.scopeType != null;

  const handleShare = async () => {
    if (!session) return;
    try {
      const duration = durationText;
      const report = `Quran Session Report\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Scope: ${session.scopeName ?? session.surahName}\n` +
        `Reciter: ${session.reciterName}\n` +
        `Duration: ${duration}\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `📊 Summary:\n` +
        `- Total Mistakes (غلطی): ${totalGhalti}\n` +
        `- Total Stuck (اٹکا): ${totalAtka}\n` +
        `- Cleared Marks: ${totalCleared}\n\n` +
        (pdfMarks.length > 0 ? `📄 Mark Details:\n` + 
          pdfMarks.map(m => ` • Page ${m.pageNumber}: ${m.type === 'ghalti' ? 'Mistake' : 'Stuck'} ${m.isCleared ? '[Cleared]' : ''}`).join('\n') 
          : `🌟 Perfect Session! No mistakes recorded.`);

      const fileUri = FileSystem.documentDirectory + `Session_Report_${session.id}.txt`;
      await FileSystem.writeAsStringAsync(fileUri, report);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { dialogTitle: 'Share Session Report' });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (err) {
      Alert.alert('Error', 'Could not share session report');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* ── Top Card ─────────────────────────────────────────────────────── */}
        <View style={styles.topCard}>
          <Text style={styles.checkmark}>✅</Text>
          <Text style={styles.doneTitle}>Session Complete</Text>
          <Text style={styles.sessionName}>{session.scopeName ?? session.surahName}</Text>
          <Text style={styles.reciterName}>Reciter: {session.reciterName}</Text>
          <Text style={styles.duration}>⏱ Duration: {durationText}</Text>
        </View>

        {/* ── Stats Row ────────────────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <View style={[styles.statChip, styles.atkaChip]}>
            <Text style={styles.statNum}>{totalAtka}</Text>
            <Text style={styles.statLabel}>اٹکا{'\n'}Stuck</Text>
          </View>
          <View style={[styles.statChip, styles.ghaltiChip]}>
            <Text style={styles.statNum}>{totalGhalti}</Text>
            <Text style={styles.statLabel}>غلطی{'\n'}Mistake</Text>
          </View>
          <View style={[styles.statChip, styles.totalChip]}>
            <Text style={styles.statNum}>{pdfMarks.length}</Text>
            <Text style={styles.statLabel}>Total{'\n'}Marks</Text>
          </View>
          {totalCleared > 0 && (
            <View style={[styles.statChip, styles.clearedChip]}>
              <Text style={styles.statNum}>{totalCleared}</Text>
              <Text style={styles.statLabel}>Cleared</Text>
            </View>
          )}
        </View>

        {/* ── Marks List by Page ───────────────────────────────────────────── */}
        {isPdfSession && pdfMarks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Marks by Page</Text>
            {pages.map(page => (
              <View key={page} style={styles.pageGroup}>
                <View style={styles.pageGroupHeader}>
                  <Text style={styles.pageGroupLabel}>📄 Page {page}</Text>
                  <Text style={styles.pageGroupCount}>{byPage[page].length} mark(s)</Text>
                </View>
                {byPage[page].map(mark => (
                  <TouchableOpacity 
                    key={mark.id} 
                    style={[styles.markRow, mark.isCleared && styles.markRowCleared]}
                    onPress={() => navigation.navigate('PdfViewer', {
                      pageNumber: mark.pageNumber,
                      title: `Review Mark (Pg ${mark.pageNumber})`,
                      reviewMarks: pdfMarks,
                      highlightMarkId: mark.id
                    })}
                  >
                    <View style={[
                      styles.markLine,
                      mark.type === 'ghalti' ? styles.ghaltiLine : styles.atkaLine,
                    ]}>
                      <Text style={styles.markLineText}>
                        {mark.type === 'ghalti' ? '✗' : '〰'}
                      </Text>
                    </View>
                    <View style={styles.markInfo}>
                      <Text style={[styles.markType, mark.isCleared && styles.strikethrough]}>
                        {mark.type === 'ghalti' ? 'غلطی — Mistake' : 'اٹکا — Stuck'}
                      </Text>
                      {mark.label
                        ? <Text style={styles.markLabel}>{mark.label}</Text>
                        : <Text style={styles.markPos}>
                            Position: {mark.xPercent.toFixed(0)}%, {mark.yPercent.toFixed(0)}%
                          </Text>
                      }
                    </View>
                    {mark.isCleared && (
                      <View style={styles.clearedBadge}>
                        <Text style={styles.clearedBadgeText}>✓ Cleared</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* ── No marks message ─────────────────────────────────────────────── */}
        {isPdfSession && pdfMarks.length === 0 && (
          <View style={styles.noMarks}>
            <Text style={styles.noMarksIcon}>🌟</Text>
            <Text style={styles.noMarksText}>No mistakes recorded!</Text>
            <Text style={styles.noMarksSub}>A perfect session — MashAllah!</Text>
          </View>
        )}

        {/* ── Done Button ──────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.doneBtnText}>✓  Done</Text>
        </TouchableOpacity>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Text style={styles.shareBtnText}>📤 Share Report</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.newSessionBtn}
            onPress={() => navigation.navigate('SessionSetup', {})}
          >
            <Text style={styles.newSessionBtnText}>+ New Session</Text>
          </TouchableOpacity>
        </View>

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
  container: { padding: 20, gap: 20, paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: Colors.textMuted, fontSize: 16 },
  topCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  checkmark: { fontSize: 48 },
  doneTitle: { color: Colors.textPrimary, fontSize: 22, fontWeight: '800' },
  sessionName: { color: Colors.accent, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  reciterName: { color: Colors.textSecondary, fontSize: 14 },
  duration: { color: Colors.textMuted, fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  statChip: {
    flex: 1,
    minWidth: 70,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
  },
  atkaChip: {
    backgroundColor: 'rgba(255,184,0,0.12)',
    borderColor: '#FFB800',
  },
  ghaltiChip: {
    backgroundColor: 'rgba(255,68,68,0.12)',
    borderColor: '#FF4444',
  },
  totalChip: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  clearedChip: {
    backgroundColor: 'rgba(100,200,100,0.12)',
    borderColor: '#64C864',
  },
  statNum: { color: '#fff', fontSize: 26, fontWeight: '800' },
  statLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600', textAlign: 'center' },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  pageGroup: { gap: 6 },
  pageGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pageGroupLabel: { color: Colors.accent, fontWeight: '700', fontSize: 13 },
  pageGroupCount: { color: Colors.textMuted, fontSize: 12 },
  markRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  markRowCleared: { opacity: 0.5 },
  markLine: {
    width: 32, height: 4, borderRadius: 2,
    justifyContent: 'center', alignItems: 'center',
  },
  atkaLine: { backgroundColor: 'rgba(255,184,0,0.2)', borderWidth: 1, borderColor: '#FFB800' },
  ghaltiLine: { backgroundColor: 'rgba(255,68,68,0.2)', borderWidth: 1, borderColor: '#FF4444' },
  markLineText: { fontSize: 8, color: '#fff', fontWeight: '900' },
  markInfo: { flex: 1 },
  markType: { color: Colors.textPrimary, fontSize: 13, fontWeight: '700' },
  markLabel: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  markPos: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  strikethrough: { textDecorationLine: 'line-through', color: Colors.textMuted },
  clearedBadge: {
    backgroundColor: 'rgba(100,200,100,0.2)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#64C864',
  },
  clearedBadgeText: { color: '#64C864', fontSize: 11, fontWeight: '700' },
  noMarks: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noMarksIcon: { fontSize: 48 },
  noMarksText: { color: Colors.textPrimary, fontSize: 18, fontWeight: '800' },
  noMarksSub: { color: Colors.textMuted, fontSize: 14 },
  doneBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: Colors.accent,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  doneBtnText: { color: Colors.primaryDark, fontSize: 17, fontWeight: '800' },
  newSessionBtnText: { color: Colors.textSecondary, fontSize: 15, fontWeight: '700' },
  actionButtons: { flexDirection: 'row', gap: 12 },
  shareBtn: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(50, 150, 255, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(50, 150, 255, 0.3)',
  },
  shareBtnText: { color: '#3296FF', fontSize: 15, fontWeight: '700' },
  newSessionBtn: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
});
