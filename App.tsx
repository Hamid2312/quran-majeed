import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import RootNavigator from './src/navigation/RootNavigator';
import { usePdfStore } from './src/stores/pdfStore';

function AppContent() {
  const initPdf = usePdfStore(state => state.initPdf);

  // Kick off PDF copy-to-documentDirectory on app start
  useEffect(() => {
    initPdf();
  }, []);

  return <RootNavigator />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <AppContent />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
