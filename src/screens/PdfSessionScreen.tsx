import React, { useCallback, useEffect, useRef, useState, memo } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  ActivityIndicator, Alert, StatusBar,
  Platform, Dimensions, FlatList, ViewToken
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList, RootStackNavProp } from '../navigation/types';
import { Colors } from '../constants/colors';
import { usePdfStore } from '../stores/pdfStore';
import { useSessionStore } from '../stores/sessionStore';
import { finalizePdfSession, clearPdfMark as dbClearPdfMark } from '../services/SessionService';
import { nowISO } from '../utils/dateHelpers';
import { TOTAL_PDF_PAGES, PDF_OFFSET } from '../constants/pdfMapping';
import PdfMarkPin from '../components/pdf/PdfMarkPin';
import MarksListSheet from '../components/pdf/MarksListSheet';
import LocalPdfRenderer from '../components/pdf/LocalPdfRenderer';
import { Ionicons, Feather } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

type PdfSessionRouteProp = RouteProp<RootStackParamList, 'PdfSession'>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Memoized Page Item ──────────────────────────────────────────────
const MushafPageItem = memo(({ 
  pageNumber, 
  fileName, 
  marks, 
  onPinPress, 
  onPinMove 
}: { 
  pageNumber: number;
  fileName: string;
  marks: any[];
  onPinPress: (id: string) => void;
  onPinMove: (id: string, x: number, y: number) => void;
}) => {
  const [overlaySize, setOverlaySize] = useState({ width: 1, height: 1 });

  return (
    <View style={styles.pageContainer}>
      <View style={styles.mushafFrame}>
        <LocalPdfRenderer 
          fileName={fileName} 
          page={pageNumber + PDF_OFFSET} 
        />
        <View
          style={styles.overlay}
          onLayout={(e) => setOverlaySize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
          pointerEvents="box-none"
        >
          {marks.map(mark => (
            <PdfMarkPin
              key={mark.id}
              id={mark.id}
              xPercent={mark.xPercent}
              yPercent={mark.yPercent}
              type={mark.type}
              onPress={() => onPinPress(mark.id)}
              onMove={onPinMove}
              containerWidth={overlaySize.width}
              containerHeight={overlaySize.height}
            />
          ))}
        </View>
      </View>
    </View>
  );
});

export default function PdfSessionScreen() {
  const navigation = useNavigation<RootStackNavProp>();
  const route = useRoute<PdfSessionRouteProp>();
  const { scopeName, startPage } = route.params;

  const { localPdfUri, isPdfReady, initPdf } = usePdfStore();
  const {
    pdfActiveSession,
    addPdfMark, removePdfMark, setCurrentPdfPage, clearPdfSession,
  } = useSessionStore();

  const [currentPage, setCurrentPage] = useState(startPage);
  const [showMarkOptions, setShowMarkOptions] = useState(false);
  const [showMarksSheet, setShowMarksSheet] = useState(false);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => { initPdf(); }, []);

  // ── Back Button Warning ───────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // If we've already ended the session (pdfActiveSession cleared), just let it happen
      if (!useSessionStore.getState().pdfActiveSession) return;

      e.preventDefault();
      Alert.alert(
        'End Session',
        'Do you want to end and save this session before leaving?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => {} },
          {
            text: 'Yes, End Session',
            style: 'destructive',
            onPress: async () => {
              const session = useSessionStore.getState().pdfActiveSession;
              if (session) {
                const endedAt = nowISO();
                await finalizePdfSession(session.sessionId, endedAt, session.marks);
                clearPdfSession();
              }
              navigation.dispatch(e.data.action);
            },
          },
          {
            text: 'Leave without Saving',
            style: 'destructive',
            onPress: () => {
              clearPdfSession();
              navigation.dispatch(e.data.action);
            },
          }
        ]
      );
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (pdfActiveSession) setCurrentPdfPage(currentPage);
  }, [currentPage]);

  const handleAddMark = useCallback(async (type: 'atka' | 'ghalti') => {
    await addPdfMark(currentPage, 50, 50, type);
    setShowMarkOptions(false);
  }, [currentPage, addPdfMark]);

  const handleClearMark = useCallback(async (markId: string) => {
    await dbClearPdfMark(markId);
    const session = useSessionStore.getState().pdfActiveSession;
    if (session) {
      useSessionStore.setState({
        pdfActiveSession: {
          ...session,
          marks: session.marks.map(m => m.id === markId ? { ...m, isCleared: true } : m),
        },
      });
    }
  }, []);

  const handleDeleteMark = useCallback(async (markId: string) => {
    await removePdfMark(markId);
  }, [removePdfMark]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      const page = viewableItems[0].index! + 1;
      setCurrentPage(page);
    }
  }).current;

  const handleEndSession = () => {
    Alert.alert(
      'End Session',
      'Save and end this recitation session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Session',
          style: 'destructive',
          onPress: async () => {
            if (!pdfActiveSession) return;
            const endedAt = nowISO();
            await finalizePdfSession(pdfActiveSession.sessionId, endedAt, pdfActiveSession.marks);
            const sid = pdfActiveSession.sessionId;
            clearPdfSession();
            navigation.replace('SessionSummary', { sessionId: sid });
          },
        },
      ]
    );
  };

  const handleGoToMark = useCallback((mark: any) => {
    flatListRef.current?.scrollToIndex({ index: mark.pageNumber - 1, animated: true });
    setSelectedPinId(mark.id);
    setShowMarksSheet(false);
  }, []);

  if (!isPdfReady || !localPdfUri || !pdfActiveSession) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>Preparing Mushaf Session…</Text>
      </View>
    );
  }

  const fileName = localPdfUri.split('/').pop() ?? 'complete_Quran.pdf';
  const pages = Array.from({ length: TOTAL_PDF_PAGES }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* ── TOP BAR ────────────────────────────────────────────────── */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.topBar}>
        <SafeAreaView />
        <View style={styles.topBarContent}>
          <View style={styles.headerInfo}>
            <Text style={styles.scopeName} numberOfLines={1}>{scopeName}</Text>
            <View style={styles.subHeaderRow}>
              <Ionicons name="person" size={12} color={Colors.textMuted} style={{ marginRight: 4 }} />
              <Text style={styles.subHeaderText}>{pdfActiveSession.reciter.name}</Text>
              <View style={styles.dot} />
              <Text style={styles.subHeaderText}>Pg {currentPage}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statPill, styles.atkaPill]}>
              <Text style={styles.statNum}>{pdfActiveSession.marks.filter(m => m.type === 'atka' && !m.isCleared).length}</Text>
              <Text style={styles.statLabel}>Stuck</Text>
            </View>
            <View style={[styles.statPill, styles.ghaltiPill]}>
              <Text style={styles.statNum}>{pdfActiveSession.marks.filter(m => m.type === 'ghalti' && !m.isCleared).length}</Text>
              <Text style={styles.statLabel}>Mistake</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.endBtn} onPress={handleEndSession}>
            <Text style={styles.endBtnText}>End</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ── SMOOTH BOOK SWIPE LIST ─────────────────────────────────── */}
      <View style={styles.listWrapper}>
        <FlatList
          ref={flatListRef}
          data={pages}
          keyExtractor={(item) => item.toString()}
          horizontal
          inverted // Traditional RTL Mushaf reading direction
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={startPage - 1}
          getItemLayout={(data, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
          windowSize={10}
          initialNumToRender={5}
          maxToRenderPerBatch={3}
          scrollEnabled={true} 
          onScrollBeginDrag={() => setSelectedPinId(null)}
          renderItem={({ item }) => (
            <MushafPageItem
              pageNumber={item}
              fileName={fileName}
              marks={pdfActiveSession.marks.filter(m => m.pageNumber === item)}
              onPinPress={(id) => setSelectedPinId(selectedPinId === id ? null : id)}
              onPinMove={(id, x, y) => useSessionStore.getState().updatePdfMark(id, x, y)}
            />
          )}
        />

        {/* Pin Action Popup */}
        {selectedPinId && (() => {
          const m = pdfActiveSession.marks.find(x => x.id === selectedPinId);
          if (!m || m.pageNumber !== currentPage) return null;
          return (
            <View style={[styles.floatingAction, { 
              left: (m.xPercent / 100) * (SCREEN_WIDTH - 20) - 40,
              top: (m.yPercent / 100) * (SCREEN_HEIGHT * 0.7) - 60
            }]}>
              <TouchableOpacity style={styles.pinClearBtn} onPress={() => { handleDeleteMark(m.id); setSelectedPinId(null); }}>
                <Text style={styles.pinActionText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pinCancelBtn} onPress={() => setSelectedPinId(null)}>
                <Ionicons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          );
        })()}
      </View>

      {/* ── BOTTOM TOOLBAR ─────────────────────────────────────────── */}
      <Animated.View entering={FadeInUp.duration(400)} style={styles.toolbar}>
        <SafeAreaView edges={['bottom']} />
        <View style={styles.toolbarContent}>
          <View style={styles.navSection}>
            <TouchableOpacity
              style={[styles.navBtn, currentPage >= TOTAL_PDF_PAGES && styles.navDisabled]}
              onPress={() => flatListRef.current?.scrollToIndex({ index: currentPage, animated: true })}
            >
              <Ionicons name="chevron-back" size={20} color={Colors.accent} />
            </TouchableOpacity>
            
            <View style={styles.pageIndicator}>
              <Text style={styles.pageText}>{currentPage} / {TOTAL_PDF_PAGES}</Text>
            </View>

            <TouchableOpacity
              style={[styles.navBtn, currentPage <= 1 && styles.navDisabled]}
              onPress={() => flatListRef.current?.scrollToIndex({ index: currentPage - 2, animated: true })}
            >
              <Ionicons name="chevron-forward" size={20} color={Colors.accent} />
            </TouchableOpacity>
          </View>

          <View style={styles.actionSection}>
            {showMarkOptions ? (
              <View style={styles.optionsContainer}>
                <TouchableOpacity style={[styles.optBtn, styles.atkaOpt]} onPress={() => handleAddMark('atka')}>
                  <Text style={styles.optText}>Stuck</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.optBtn, styles.ghaltiOpt]} onPress={() => handleAddMark('ghalti')}>
                  <Text style={styles.optText}>Mistake</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optCancel} onPress={() => setShowMarkOptions(false)}>
                  <Ionicons name="close-circle" size={26} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.markBtn}
                onPress={() => setShowMarkOptions(true)}
              >
                <Feather name="edit-2" size={16} color={Colors.textPrimary} />
                <Text style={styles.markText}>Mark</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.historyBtn}
              onPress={() => setShowMarksSheet(true)}
            >
              <Ionicons name="list" size={24} color={Colors.textPrimary} />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pdfActiveSession.marks.length}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      <MarksListSheet
        visible={showMarksSheet}
        marks={pdfActiveSession.marks}
        onClearMark={handleClearMark}
        onDeleteMark={handleDeleteMark}
        onGoToMark={handleGoToMark}
        onClose={() => setShowMarksSheet(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: { color: Colors.textSecondary, fontSize: 16, fontWeight: '600' },
  
  topBar: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
    zIndex: 100,
  },
  topBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  headerInfo: { flex: 1 },
  scopeName: { color: Colors.textPrimary, fontSize: 18, fontWeight: '800' },
  subHeaderRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  subHeaderText: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.textMuted, marginHorizontal: 8 },
  
  statsRow: { flexDirection: 'row', gap: 6 },
  statPill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 50,
  },
  atkaPill: { backgroundColor: 'rgba(255,152,0,0.1)', borderColor: 'rgba(255,152,0,0.3)' },
  ghaltiPill: { backgroundColor: 'rgba(244,67,54,0.1)', borderColor: 'rgba(244,67,54,0.3)' },
  statNum: { color: '#fff', fontSize: 14, fontWeight: '800' },
  statLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', marginTop: 1 },
  
  endBtn: {
    backgroundColor: 'rgba(244,67,54,0.85)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  endBtnText: { color: '#fff', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },

  listWrapper: { flex: 1 },
  pageContainer: {
    width: SCREEN_WIDTH,
    padding: 10,
    justifyContent: 'center',
  },
  mushafFrame: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 15,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },

  floatingAction: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C2E',
    borderRadius: 12,
    padding: 6,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 25,
    zIndex: 1000,
  },
  pinClearBtn: { backgroundColor: 'rgba(244,67,54,0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  pinCancelBtn: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  pinActionText: { color: '#fff', fontSize: 13, fontWeight: '800' },

  toolbar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
    zIndex: 100,
  },
  toolbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  
  navSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  navDisabled: { opacity: 0.3 },
  pageIndicator: {
    paddingHorizontal: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  pageText: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700' },

  actionSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
  },
  markBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  markText: { color: Colors.textPrimary, fontWeight: '800', fontSize: 14 },

  optionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 16,
    padding: 6,
    gap: 8,
  },
  optBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 75,
    alignItems: 'center',
  },
  atkaOpt: { backgroundColor: 'rgba(255,152,0,0.8)' },
  ghaltiOpt: { backgroundColor: 'rgba(244,67,54,0.8)' },
  optText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  optCancel: { padding: 4, paddingRight: 6 },

  historyBtn: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: Colors.accent,
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  badgeText: { color: Colors.primaryDark, fontSize: 11, fontWeight: '900' },
});
