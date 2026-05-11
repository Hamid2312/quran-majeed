import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ayah } from '../../models/Quran';
import TajweedRenderer from './TajweedRenderer';
import { Colors } from '../../constants/colors';

interface Props {
  ayah: Ayah;
  fontSize?: number;
  tajweedEnabled?: boolean;
}

function AyahView({ ayah, fontSize = 28, tajweedEnabled = true }: Props) {
  return (
    <View style={styles.container}>
      {/* Ayah number badge */}
      <View style={styles.header}>
        <View style={styles.numberBadge}>
          <Text style={styles.numberText}>{ayah.number}</Text>
        </View>
      </View>

      {/* Arabic text — RTL flex-wrap */}
      <View style={styles.textContainer}>
        <Text style={[styles.arabicText, { fontSize }]} textBreakStrategy="simple">
          {ayah.words.map((word, i) => (
            <React.Fragment key={i}>
              <TajweedRenderer
                word={word}
                fontSize={fontSize}
                tajweedEnabled={tajweedEnabled}
              />
              {i < ayah.words.length - 1 && <Text style={{ fontSize }}> </Text>}
            </React.Fragment>
          ))}
          {/* End-of-ayah marker ۝ */}
          <Text style={[styles.ayahMark, { fontSize: fontSize * 0.85 }]}>
            {' '}﴿{ayah.number}﴾
          </Text>
        </Text>
      </View>
    </View>
  );
}

export default memo(AyahView);

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  numberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    color: Colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  textContainer: {
    direction: 'rtl',
  },
  arabicText: {
    color: Colors.textArabic,
    textAlign: 'right',
    lineHeight: 58,
    writingDirection: 'rtl',
  },
  ayahMark: {
    color: Colors.accent,
    fontWeight: '400',
  },
});
