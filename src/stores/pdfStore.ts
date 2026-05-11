import { create } from 'zustand';
import * as FileSystem from 'expo-file-system/legacy';

interface PdfStoreState {
  localPdfUri: string | null;
  isPdfReady: boolean;
  isLoading: boolean;
  error: string | null;
  initPdf: () => Promise<void>;
}

const LOCAL_PDF_NAME = 'complete_Quran.pdf';

// The bundled asset URI in Expo managed workflow
// require() resolves to the local file during development and the bundled path in production
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDF_ASSET = require('../../assets/complete_Quran.pdf');

export const usePdfStore = create<PdfStoreState>((set, get) => ({
  localPdfUri: null,
  isPdfReady: false,
  isLoading: false,
  error: null,

  initPdf: async () => {
    if (get().isPdfReady) return; // already ready
    set({ isLoading: true, error: null });
    try {
      const docDir = FileSystem.documentDirectory;
      if (!docDir) throw new Error('documentDirectory is unavailable');

      const destUri = docDir + LOCAL_PDF_NAME;

      // Check if already copied
      const fileInfo = await FileSystem.getInfoAsync(destUri);
      if (!fileInfo.exists) {
        // In Expo managed, we use expo-asset to resolve the bundled asset URI
        // then copy it to the writable document directory
        const { Asset } = await import('expo-asset');
        const [asset] = await Asset.loadAsync(PDF_ASSET);
        const sourceUri = asset.localUri ?? asset.uri;
        if (!sourceUri) throw new Error('Could not resolve PDF asset URI');
        await FileSystem.copyAsync({ from: sourceUri, to: destUri });
      }

      set({ localPdfUri: destUri, isPdfReady: true, isLoading: false });
    } catch (err: any) {
      // Fallback: try to use the asset URI directly (works in Expo Go dev mode)
      try {
        const { Asset } = await import('expo-asset');
        const [asset] = await Asset.loadAsync(PDF_ASSET);
        const uri = asset.localUri ?? asset.uri;
        if (uri) {
          set({ localPdfUri: uri, isPdfReady: true, isLoading: false });
          return;
        }
      } catch (_) { /* ignore fallback failure */ }
      set({ error: err?.message ?? 'Failed to load Quran PDF', isLoading: false });
    }
  },
}));
