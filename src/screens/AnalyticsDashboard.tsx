import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  SafeAreaView, TouchableOpacity, StatusBar, Platform,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { RootStackNavProp } from '../navigation/types';
import { useAnalyticsStore } from '../stores/analyticsStore';
import StatCard from '../components/analytics/StatCard';
import SurahDifficultyList from '../components/analytics/SurahDifficultyList';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import EmptyState from '../components/shared/EmptyState';
import { Colors } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function AnalyticsDashboard() {
  const navigation = useNavigation<RootStackNavProp>();
  const { reciters, selectedReciterId, stats, loading, loadReciters, selectReciter } =
    useAnalyticsStore();

  useFocusEffect(
    React.useCallback(() => {
      loadReciters();
    }, [])
  );

  if (loading) return <LoadingSpinner message="Loading analytics…" />;

  if (reciters.length === 0) {
    return (
      <EmptyState
        icon="people"
        title="No Reciters Yet"
        subtitle="Start a recitation session to see analytics here."
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        <Animated.View entering={FadeInDown.duration(400)}>
          <View style={styles.headerRow}>
            <Ionicons name="bar-chart" size={30} color={Colors.accent} />
            <Text style={styles.pageTitle}>Analytics Dashboard</Text>
          </View>
        </Animated.View>

        {/* ── Reciter selector ── */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.reciterRow}
            contentContainerStyle={{ gap: 12, paddingHorizontal: 4 }}
          >
            {reciters.map(r => (
              <TouchableOpacity
                key={r.id}
                style={[
                  styles.reciterTab,
                  selectedReciterId === r.id && styles.reciterTabActive,
                ]}
                onPress={() => selectReciter(r.id)}
              >
                <View style={[styles.avatar, { backgroundColor: r.avatarColor }]}>
                  <Text style={styles.avatarText}>{r.name.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={[
                  styles.reciterTabName,
                  selectedReciterId === r.id && styles.reciterTabNameActive,
                ]}>
                  {r.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {!stats && (
          <Animated.View entering={FadeInUp.duration(400).delay(200)}>
            <EmptyState
              icon="document-text"
              title="No sessions yet"
              subtitle="Complete a recitation session to see stats."
            />
          </Animated.View>
        )}

        {stats && (
          <>
            {/* ── Summary stats ── */}
            <Animated.View entering={FadeInUp.duration(400).delay(200)} style={styles.statsRow}>
              <StatCard
                label="Sessions"
                value={stats.totalSessions}
                icon="🎙️"
                color={Colors.info}
              />
              <StatCard
                label="Time (min)"
                value={stats.totalTimeMinutes}
                icon="⏱️"
                color={Colors.primary}
              />
              <StatCard
                label="Mistakes"
                value={stats.totalMistakes}
                icon="❌"
                color={Colors.markGhalti}
              />
              <StatCard
                label="Stuck"
                value={stats.totalStuck}
                icon="⏸"
                color={Colors.markAtka}
              />
            </Animated.View>

            {/* ── Accuracy estimate ── */}
            {stats.totalSessions > 0 && (
              <Animated.View entering={FadeInUp.duration(400).delay(300)} style={styles.accuracyCard}>
                <Ionicons name="ribbon" size={24} color={Colors.success} style={styles.accuracyIcon} />
                <Text style={styles.accuracyLabel}>Accuracy Score</Text>
                <Text style={styles.accuracyValue}>
                  {Math.max(0, 100 - Math.round(
                    ((stats.totalMistakes + stats.totalStuck) / Math.max(stats.totalSessions * 10, 1)) * 100
                  ))}%
                </Text>
                <Text style={styles.accuracyHint}>Based on mistakes and stuck points per session</Text>
              </Animated.View>
            )}

            {/* ── Surah difficulty chart ── */}
            <Animated.View entering={FadeInUp.duration(400).delay(400)}>
              <SurahDifficultyList surahStats={stats.surahStats} />
            </Animated.View>

            {/* ── Recent sessions ── */}
            <Animated.View entering={FadeInUp.duration(400).delay(500)} style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Sessions</Text>
              {stats.recentSessions.length === 0 && (
                <Text style={styles.emptyText}>No sessions yet.</Text>
              )}
              {stats.recentSessions.map(s => {
                const mistakes = (s.marks?.filter(m => m.type === 'ghalti').reduce((a, m) => a + m.count, 0) || 0) + 
                               (s.pdfMarks?.filter(m => m.type === 'ghalti').length || 0);
                const stucks = (s.marks?.filter(m => m.type === 'atka').reduce((a, m) => a + m.count, 0) || 0) + 
                             (s.pdfMarks?.filter(m => m.type === 'atka').length || 0);

                return (
                  <TouchableOpacity 
                    key={s.id} 
                    style={styles.sessionRow}
                    onPress={() => navigation.navigate('SessionSummary', { sessionId: s.id })}
                    activeOpacity={0.8}
                  >
                    <View style={styles.sessionInfo}>
                      <Text style={styles.sessionSurah}>{s.scopeName ?? s.surahName}</Text>
                      <View style={styles.sessionDateRow}>
                        <Ionicons name="calendar-outline" size={12} color={Colors.textMuted} />
                        <Text style={styles.sessionDate}>
                          {new Date(s.startedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.sessionMarks}>
                      <View style={[styles.markBadgeContainer, { backgroundColor: 'rgba(244,67,54,0.1)', borderColor: 'rgba(244,67,54,0.3)' }]}>
                        <Text style={[styles.markBadge, { color: Colors.markGhalti }]}>❌ {mistakes}</Text>
                      </View>
                      <View style={[styles.markBadgeContainer, { backgroundColor: 'rgba(255,152,0,0.1)', borderColor: 'rgba(255,152,0,0.3)' }]}>
                        <Text style={[styles.markBadge, { color: Colors.markAtka }]}>⏸ {stucks}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </Animated.View>
          </>
        )}

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
  container: { padding: 20, gap: 18, paddingBottom: 40 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 8,
  },
  pageTitle: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  reciterRow: { marginVertical: 4 },
  reciterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  reciterTabActive: { 
    borderColor: Colors.accent,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  avatar: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  reciterTabName: { color: Colors.textSecondary, fontWeight: '600', fontSize: 15 },
  reciterTabNameActive: { color: Colors.accent },
  statsRow: { flexDirection: 'row', gap: 12 },
  accuracyCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    gap: 4,
  },
  accuracyIcon: {
    position: 'absolute',
    top: 16,
    right: 20,
    opacity: 0.8,
  },
  accuracyLabel: { color: Colors.textSecondary, fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  accuracyValue: { color: Colors.success, fontSize: 52, fontWeight: '800', textShadowColor: 'rgba(76, 175, 80, 0.2)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  accuracyHint: { color: Colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 4 },
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
    gap: 12,
  },
  sectionTitle: { color: Colors.textSecondary, fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  emptyText: { color: Colors.textMuted, fontSize: 14, fontStyle: 'italic' },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sessionInfo: { gap: 6, flex: 1 },
  sessionSurah: { color: Colors.textPrimary, fontWeight: '700', fontSize: 15 },
  sessionDateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sessionDate: { color: Colors.textMuted, fontSize: 12, fontWeight: '500' },
  sessionMarks: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  markBadgeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  markBadge: { fontWeight: '800', fontSize: 12 },
});
