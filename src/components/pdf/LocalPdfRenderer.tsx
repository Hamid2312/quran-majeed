import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system/legacy';

interface Props {
  fileName: string;
  page: number;
  scrollEnabled?: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export default function LocalPdfRenderer({ fileName, page, onSwipeLeft, onSwipeRight }: Props) {
  const html = useMemo(() => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
  <style>
    body { 
      margin: 0; padding: 0; background-color: #fff; 
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; overflow: hidden;
    }
    #canvas-container {
      width: 100%; height: 100vh;
      display: flex; justify-content: center; align-items: center;
      overflow: hidden;
    }
    canvas { 
      width: 112%; height: auto; margin-top: -2%;
      opacity: 0; transition: opacity 0.2s ease-in;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    canvas.ready { opacity: 1; }
    #error { color: red; padding: 20px; font-family: sans-serif; position: absolute; z-index: 100; font-size: 12px; }
  </style>
</head>
<body>
  <div id="canvas-container"><canvas id="pdf-canvas"></canvas></div>
  <div id="error"></div>
  <script>
    (function() {
      let touchstartX = 0;
      let touchstartY = 0;

      document.addEventListener('touchstart', e => {
        touchstartX = e.changedTouches[0].screenX;
        touchstartY = e.changedTouches[0].screenY;
      }, false);

      document.addEventListener('touchend', e => {
        let touchendX = e.changedTouches[0].screenX;
        let touchendY = e.changedTouches[0].screenY;
        let xDiff = touchendX - touchstartX;
        let yDiff = touchendY - touchstartY;

        if (Math.abs(xDiff) > Math.abs(yDiff) && Math.abs(xDiff) > 60) {
          if (touchendX < touchstartX) {
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'swipe', direction: 'left' }));
          }
          if (touchendX > touchstartX) {
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'swipe', direction: 'right' }));
          }
        }
      }, false);

      const WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
      pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_URL;

      const url = '${fileName}';
      
      function renderPage() {
        pdfjsLib.getDocument({
          url: url,
          cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/cmaps/',
          cMapPacked: true,
        }).promise.then(function(pdf) {
          return pdf.getPage(${page});
        }).then(function(pageObj) {
          const scale = 1.5; 
          const viewport = pageObj.getViewport({ scale: scale });
          const canvas = document.getElementById('pdf-canvas');
          const context = canvas.getContext('2d');
          
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          };
          
          return pageObj.render(renderContext).promise;
        }).then(function() {
          document.getElementById('pdf-canvas').classList.add('ready');
        }).catch(function(err) {
          document.getElementById('error').innerText = "Load Error: " + err.message;
          console.error(err);
        });
      }

      if (window.pdfjsLib) {
        renderPage();
      } else {
        setTimeout(renderPage, 100);
      }
    })();
  </script>
</body>
</html>
  `, [fileName, page]);

  return (
    <View style={styles.container}>
      <WebView
        source={{
          html,
          baseUrl: FileSystem.documentDirectory ?? undefined
        }}
        style={styles.webview}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'swipe') {
              if (data.direction === 'left' && onSwipeLeft) onSwipeLeft();
              if (data.direction === 'right' && onSwipeRight) onSwipeRight();
            }
          } catch (e) {}
        }}
        originWhitelist={['*']}
        startInLoadingState={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  webview: { flex: 1, backgroundColor: 'transparent' },
});
