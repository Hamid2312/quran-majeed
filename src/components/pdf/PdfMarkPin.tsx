import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, PanResponder, Animated } from 'react-native';
import { MarkType } from '../../models/Session';

interface Props {
  id: string;
  xPercent: number;     // 0–100
  yPercent: number;     // 0–100
  type: MarkType;
  count?: number;
  onPress: () => void;
  onMove: (id: string, xPct: number, yPct: number) => void;
  containerWidth: number;
  containerHeight: number;
  isHighlight?: boolean;
}

const LINE_WIDTH = 44;
const LINE_HEIGHT = 4;
const TOUCH_AREA_SIZE = 40; 

export default function PdfMarkPin({
  id, xPercent, yPercent, type, count = 1, onPress, onMove, containerWidth, containerHeight, isHighlight
}: Props) {
  const pan = useRef(new Animated.ValueXY()).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    pan.setValue({
      x: (xPercent / 100) * containerWidth - LINE_WIDTH / 2,
      y: (yPercent / 100) * containerHeight - LINE_HEIGHT / 2,
    });
  }, [xPercent, yPercent, containerWidth, containerHeight]);

  useEffect(() => {
    if (isHighlight) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.5, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isHighlight]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          // @ts-ignore
          x: pan.x._value,
          // @ts-ignore
          y: pan.y._value
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (e, gestureState) => {
        pan.flattenOffset();
        if (Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5) {
          onPress();
        } else {
          // @ts-ignore
          const finalX = pan.x._value + LINE_WIDTH / 2;
          // @ts-ignore
          const finalY = pan.y._value + LINE_HEIGHT / 2;
          const newXPct = Math.max(0, Math.min(100, (finalX / containerWidth) * 100));
          const newYPct = Math.max(0, Math.min(100, (finalY / containerHeight) * 100));
          onMove(id, newXPct, newYPct);
        }
      },
    })
  ).current;

  const isGhalti = type === 'ghalti';
  const color     = isGhalti ? '#FF4444' : '#FFB800';

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.touchArea,
        { transform: [{ translateX: pan.x }, { translateY: pan.y }] },
      ]}
    >
      {isHighlight && (
        <Animated.View 
          style={[
            styles.highlightCircle, 
            { backgroundColor: color, transform: [{ scale: pulseAnim }] }
          ]} 
        />
      )}
      <View style={[styles.line, { backgroundColor: color }]}>
        {count > 1 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{count}</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  touchArea: {
    position: 'absolute',
    width: LINE_WIDTH,
    height: TOUCH_AREA_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  highlightCircle: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    opacity: 0.3,
  },
  line: {
    width: LINE_WIDTH,
    height: 4, 
    borderRadius: 2,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 10,
  },
  badge: {
    position: 'absolute',
    top: -16,
    right: -10,
    backgroundColor: '#fff',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#333',
  },
});
