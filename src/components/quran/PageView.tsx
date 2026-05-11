import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { QuranPage } from '../../models/Quran';
import TajweedRenderer from './TajweedRenderer';

interface Props {
  page: QuranPage;
  surahNameAr?: string;
  juzNumber?: number;
  fontSize?: number;
  tajweedEnabled?: boolean;
}

function PageView({ page, surahNameAr, juzNumber, fontSize = 20, tajweedEnabled = false }: Props) {
  return (
    <View style={styles.outerBorder}>
      <View style={styles.innerBorder}>
        
        {/* Mushaf Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>{juzNumber ? `الجزء ${juzNumber}` : ''}</Text>
          <Text style={styles.pageText}>— {page.pageNumber} —</Text>
          <Text style={styles.headerText}>{surahNameAr ? `سورة ${surahNameAr}` : ''}</Text>
        </View>

        <View style={styles.pageContainer}>
          {page.lines.map((line, lineIdx) => (
            <View key={lineIdx} style={styles.lineContainer}>
              <Text style={[styles.arabicText, { fontSize }]} textBreakStrategy="simple" allowFontScaling={false}>
                {tajweedEnabled
                  ? line.words.map((word, wIdx) => (
                      <React.Fragment key={word.id || wIdx}>
                        <TajweedRenderer
                          word={word}
                          fontSize={fontSize}
                          tajweedEnabled={tajweedEnabled}
                        />
                        {wIdx < line.words.length - 1 && ' '}
                      </React.Fragment>
                    ))
                  : line.words.map(word => word.text).join(' ')}
              </Text>
            </View>
          ))}
        </View>

      </View>
    </View>
  );
}

export default memo(PageView);

const styles = StyleSheet.create({
  outerBorder: {
    backgroundColor: '#FFF8EB', // Authentic physical page color
    marginHorizontal: 10,
    marginVertical: 10,
    padding: 4,
    borderRadius: 2,
    borderWidth: 2,
    borderColor: '#8B2C46',     // Deep maroon border like the image
    elevation: 4,
  },
  innerBorder: {
    borderWidth: 1,
    borderColor: '#8B2C46',
    paddingHorizontal: 8,
    paddingBottom: 16,
    paddingTop: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#8B2C46',
    paddingBottom: 4,
    paddingHorizontal: 8,
  },
  headerText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontFamily: 'IndoPak', // Custom font if provided
  },
  pageText: {
    color: '#1A1A1A',
    fontSize: 14,
    fontWeight: '700',
  },
  pageContainer: {
    direction: 'rtl',
  },
  lineContainer: {
    width: '100%',
    paddingVertical: 1,
  },
  arabicText: {
    color: '#000000', // Solid black text as per Mushaf
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 32,
    width: '100%',
    letterSpacing: 0,
    includeFontPadding: false,
    fontFamily: 'IndoPak', // Custom font
  },
});
