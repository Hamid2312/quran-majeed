import React from 'react';
import {
  Text,
  StyleSheet,
  Pressable,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { Colors } from '../../constants/colors';

interface PremiumButtonProps {
  title: string;
  onPress: () => void;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function PremiumButton({
  title,
  onPress,
  icon,
  variant = 'primary',
  style,
  textStyle,
}: PremiumButtonProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
    opacity.value = withTiming(0.9, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    opacity.value = withTiming(1, { duration: 150 });
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return [styles.secondaryBtn, style];
      case 'outline':
        return [styles.outlineBtn, style];
      case 'primary':
      default:
        return [styles.primaryBtn, style];
    }
  };

  const getTextStyles = () => {
    switch (variant) {
      case 'secondary':
        return [styles.secondaryBtnText, textStyle];
      case 'outline':
        return [styles.outlineBtnText, textStyle];
      case 'primary':
      default:
        return [styles.primaryBtnText, textStyle];
    }
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.baseBtn, getVariantStyles(), animatedStyle]}
      android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
    >
      {icon && icon}
      <Text style={getTextStyles()}>{title}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  baseBtn: {
    flexDirection: 'row',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  primaryBtnText: {
    color: Colors.primaryDark,
    fontSize: 17,
    fontWeight: '800',
  },
  secondaryBtn: {
    backgroundColor: Colors.primaryLight,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  secondaryBtnText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  outlineBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
  },
  outlineBtnText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
});
