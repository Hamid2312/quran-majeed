import React, { memo, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, PanResponder } from 'react-native';
import { TajweedWord } from '../../models/Quran';
import TajweedRenderer from '../quran/TajweedRenderer';
import { Colors } from '../../constants/colors';

interface WordMarkState {
  atka: number;
  ghalti: number;
}

interface Props {
  word: TajweedWord;
  marks?: WordMarkState;
  onPress: (word: TajweedWord) => void;
  fontSize?: number;
}

function WordChip({ word, marks, onPress, fontSize = 26 }: Props) {
  const hasAtka = (marks?.atka ?? 0) > 0;
  const hasGhalti = (marks?.ghalti ?? 0) > 0;
  const isMarked = hasAtka || hasGhalti;
  const isEndOfAyah = word.text.includes('۝');

  // Vertical offset for the marks
  const translateY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dy: translateY }], { useNativeDriver: false }),
      onPanResponderRelease: () => {
        // We don't flatten offset because we want it to stay where it is
        // In a real app we might want to save this offset to the store
      },
    })
  ).current;

  return (
    <TouchableOpacity
      onPress={() => onPress(word)}
      activeOpacity={0.7}
      style={styles.wrapper}
    >
      {/* Word bubble or Ayah marker */}
      <View style={[
        isEndOfAyah ? styles.ayahMarkerChip : styles.chip, 
        isMarked && styles.chipMarked
      ]}>
        {isEndOfAyah ? (
          <Text style={[styles.ayahMarkerText, { fontSize: fontSize * 0.7 }]}>
            {word.text.replace(/۝/g, '').trim()}
          </Text>
        ) : (
          <TajweedRenderer word={word} fontSize={fontSize} tajweedEnabled />
        )}

        {/* Marker lines at the bottom */}
        {isMarked && !isEndOfAyah && (
          <Animated.View 
            {...panResponder.panHandlers}
            style={[
              styles.markerContainer,
              { transform: [{ translateY }] }
            ]}
          >
            {hasAtka && (
              <View style={[styles.line, styles.lineAtka]}>
                {marks!.atka > 1 && <Text style={styles.lineCount}>{marks!.atka}</Text>}
              </View>
            )}
            {hasGhalti && (
              <View style={[styles.line, styles.lineGhalti]}>
                {marks!.ghalti > 1 && <Text style={styles.lineCount}>{marks!.ghalti}</Text>}
              </View>
            )}
          </Animated.View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default memo(WordChip);

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    margin: 2, // Reduced margin to save space
  },
  chip: {
    backgroundColor: 'transparent', // Transparent background for a cleaner look
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'transparent',
    minWidth: 30,
    alignItems: 'center',
  },
  chipMarked: {
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  markerContainer: {
    position: 'absolute',
    bottom: -2,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 1,
    paddingVertical: 4, // Bigger hit area for dragging
    zIndex: 50,
  },
  line: {
    height: 2,
    width: '100%',
    borderRadius: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lineAtka: {
    backgroundColor: Colors.markAtka,
  },
  lineGhalti: {
    backgroundColor: Colors.markGhalti,
  },
  lineCount: {
    fontSize: 7,
    color: '#fff',
    fontWeight: '900',
    marginTop: -1,
  },
  ayahMarkerChip: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#C8A97E',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8EB',
    marginHorizontal: 2,
  },
  ayahMarkerText: {
    color: '#8B2C46',
    fontWeight: '700',
    fontFamily: 'IndoPak',
  },
});
