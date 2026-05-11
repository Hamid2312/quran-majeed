import React, { useEffect, useRef, useState, memo, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  ActivityIndicator, TextInput, FlatList, ViewToken, Dimensions, StatusBar, Platform
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { Colors } from '../constants/colors';
import { usePdfStore } from '../stores/pdfStore';
import { TOTAL_PDF_PAGES, PDF_OFFSET } from '../constants/pdfMapping';
import LocalPdfRenderer from '../components/pdf/LocalPdfRenderer';
import PdfMarkPin from '../components/pdf/PdfMarkPin';

type PdfViewerRouteProp = RouteProp<RootStackParamList, 'PdfViewer'>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Memoized Page Item ──────────────────────────────────────────────
const PdfPageItem = memo(({ 
  pageNumber, 
  fileName, 
  marks = [],
  highlightMarkId
}: { 
  pageNumber: number; 
  fileName: string; 
  marks?: any[];
  highlightMarkId?: string | null;
}) => {
  const [overlaySize, setOverlaySize] = useState({ width: 1, height: 1 });

  return (
    <View style={styles.pageContainer}>
      <View style={styles.mushafFrame}>
        <LocalPdfRenderer 
          fileName={fileName} 
          page={pageNumber + PDF_OFFSET} 
        />
        {marks.length > 0 && (
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
                containerWidth={overlaySize.width}
                containerHeight={overlaySize.height}
                // Read-only mode for review
                onPress={() => {}} 
                onMove={() => {}}
                isHighlight={mark.id === highlightMarkId}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
});

export default function PdfViewerScreen() {
  const navigation = useNavigation();
  const route = useRoute<PdfViewerRouteProp>();
  const { pageNumber: initialPage, title, reviewMarks, highlightMarkId: initialHighlightId } = route.params;

  const { localPdfUri, isPdfReady, isLoading: pdfLoading, initPdf } = usePdfStore();

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageInput, setPageInput] = useState(String(initialPage));
  const [showPageInput, setShowPageInput] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(initialHighlightId || null);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => { initPdf(); }, []);

  useEffect(() => {
    setPageInput(String(currentPage));
    // Clear highlight if we move far away? No, keep it if it's on this page.
  }, [currentPage]);

  const jumpToPage = () => {
    const n = parseInt(pageInput, 10);
    if (!isNaN(n) && n >= 1 && n <= TOTAL_PDF_PAGES) {
      flatListRef.current?.scrollToIndex({ index: n - 1, animated: false });
      setCurrentPage(n);
    }
    setShowPageInput(false);
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      const page = viewableItems[0].index! + 1;
      setCurrentPage(page);
    }
  }).current;

  if (pdfLoading || !isPdfReady || !localPdfUri) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>Preparing Mushaf…</Text>
      </View>
    );
  }

  const fileName = localPdfUri.split('/').pop() ?? 'complete_Quran.pdf';
  const pages = Array.from({ length: TOTAL_PDF_PAGES }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* ── TOP BAR ────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <SafeAreaView />
        <View style={styles.topBarContent}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.topTitle} numberOfLines={1}>{title}</Text>
            <Text style={styles.subTitle}>16 Line Indo-Pak Mushaf</Text>
          </View>
          <TouchableOpacity 
            style={styles.pageBadge} 
            onPress={() => setShowPageInput(true)}
          >
            <Text style={styles.pageBadgeText}>{currentPage}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── SWIPE LIST ─────────────────────────────────────────────── */}
      <View style={styles.listWrapper}>
        <FlatList
          ref={flatListRef}
          data={pages}
          keyExtractor={(item) => item.toString()}
          horizontal
          inverted
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialPage - 1}
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
          renderItem={({ item }) => (
            <PdfPageItem 
              pageNumber={item} 
              fileName={fileName} 
              marks={reviewMarks?.filter(m => m.pageNumber === item)}
              highlightMarkId={highlightId}
            />
          )}
        />
      </View>

      {/* ── BOTTOM NAV ─────────────────────────────────────────────── */}
      <View style={styles.navBar}>
        <SafeAreaView edges={['bottom']} />
        <View style={styles.navBarContent}>
          <TouchableOpacity
            style={[styles.navBtn, currentPage >= TOTAL_PDF_PAGES && styles.navBtnDisabled]}
            onPress={() => flatListRef.current?.scrollToIndex({ index: currentPage, animated: true })}
          >
            <Text style={styles.navIcon}>◀</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.jumpTrigger} onPress={() => setShowPageInput(s => !s)}>
            <Text style={styles.jumpText}>Page {currentPage} of {TOTAL_PDF_PAGES}</Text>
            <Text style={styles.jumpSub}>Tap to jump</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navBtn, currentPage <= 1 && styles.navBtnDisabled]}
            onPress={() => flatListRef.current?.scrollToIndex({ index: currentPage - 2, animated: true })}
          >
            <Text style={styles.navIcon}>▶</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── PAGE JUMP OVERLAY ───────────────────────────────────────── */}
      {showPageInput && (
        <View style={styles.overlayContainer}>
          <TouchableOpacity style={styles.overlayClose} onPress={() => setShowPageInput(false)} />
          <View style={styles.jumpCard}>
            <Text style={styles.jumpTitle}>Jump to Page</Text>
            <TextInput
              style={styles.jumpInput}
              value={pageInput}
              onChangeText={setPageInput}
              keyboardType="number-pad"
              placeholder={`1 – ${TOTAL_PDF_PAGES}`}
              placeholderTextColor={Colors.textMuted}
              onSubmitEditing={jumpToPage}
              autoFocus
              selectTextOnFocus
            />
            <View style={styles.jumpActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowPageInput(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.goBtn} onPress={jumpToPage}>
                <Text style={styles.goBtnText}>Jump</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
  },
  topBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: { color: Colors.textPrimary, fontSize: 18, fontWeight: '400' },
  headerTitleContainer: { flex: 1 },
  topTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '800' },
  subTitle: { color: Colors.textMuted, fontSize: 11, fontWeight: '600', marginTop: 2 },
  pageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.accent,
  },
  pageBadgeText: { color: Colors.primaryDark, fontWeight: '900', fontSize: 14 },

  listWrapper: { flex: 1 },
  pageContainer: {
    width: SCREEN_WIDTH,
    padding: 12,
    justifyContent: 'center',
  },
  mushafFrame: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },

  navBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingBottom: Platform.OS === 'ios' ? 25 : 15,
  },
  navBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navIcon: { color: Colors.accent, fontSize: 18, fontWeight: '800' },
  navBtnDisabled: { opacity: 0.2 },
  jumpTrigger: { alignItems: 'center' },
  jumpText: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700' },
  jumpSub: { color: Colors.textMuted, fontSize: 10, marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 },

  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  overlayClose: { ...StyleSheet.absoluteFillObject },
  jumpCard: {
    width: '80%',
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    gap: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  jumpTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  jumpInput: {
    backgroundColor: Colors.surfaceElevated,
    height: 60,
    borderRadius: 16,
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  jumpActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { color: Colors.textMuted, fontSize: 16, fontWeight: '700' },
  goBtn: { flex: 1, backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  goBtnText: { color: Colors.primaryDark, fontSize: 16, fontWeight: '800' },
});
