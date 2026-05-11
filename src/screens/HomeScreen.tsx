import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, StatusBar, SafeAreaView, Image, Platform, Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavProp } from '../navigation/types';
import { Colors } from '../constants/colors';
import PremiumButton from '../components/shared/PremiumButton';
import { Feather, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation<RootStackNavProp>();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={styles.container}>
        {/* Decorative background elements */}
        <View style={styles.topDecor} />
        <View style={styles.bottomDecor} />

        {/* Header */}
        <Animated.View entering={FadeInDown.duration(800).delay(100)} style={styles.header}>
          <Text style={styles.bismillah}>بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ</Text>
          <Text style={styles.appTitle}>Quran Majeed</Text>
          <Text style={styles.appSubtitle}>Read · Learn · Recite</Text>
        </Animated.View>

        {/* Logo */}
        <Animated.View entering={FadeInUp.duration(1000).delay(300)} style={styles.iconContainer}>
          <Image source={require('../../assets/Quran_logo.jpeg')} style={styles.logoImage} />
          <View style={styles.logoOverlay} />
        </Animated.View>

        {/* CTA Buttons */}
        <View style={styles.ctaContainer}>
          <Animated.View entering={FadeInUp.duration(800).delay(500)}>
            <PremiumButton
              title="Read Quran"
              icon={<Feather name="book-open" size={20} color={Colors.primaryDark} />}
              onPress={() => navigation.navigate('QuranIndex')}
              variant="primary"
            />
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(800).delay(650)}>
            <PremiumButton
              title="Start Recitation Session"
              icon={<Ionicons name="mic-outline" size={22} color={Colors.textPrimary} />}
              onPress={() => navigation.navigate('SessionSetup', {})}
              variant="secondary"
            />
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(800).delay(800)}>
            <PremiumButton
              title="View Analytics"
              icon={<Ionicons name="bar-chart-outline" size={20} color={Colors.textSecondary} />}
              onPress={() => navigation.navigate('MainTabs', { screen: 'Analytics' })}
              variant="outline"
            />
          </Animated.View>
        </View>

        {/* Footer */}
        <Animated.Text entering={FadeInUp.duration(800).delay(1000)} style={styles.footer}>
          Designed with ❤️ for the Ummah
        </Animated.Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 28,
    paddingVertical: height > 800 ? 40 : 20,
  },
  topDecor: {
    position: 'absolute',
    top: -100,
    right: -50,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: Colors.primaryLight,
    opacity: 0.1,
  },
  bottomDecor: {
    position: 'absolute',
    bottom: -150,
    left: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: Colors.accent,
    opacity: 0.05,
  },
  header: { alignItems: 'center', gap: 10, marginTop: 20 },
  bismillah: {
    color: Colors.accent,
    fontSize: 22,
    textAlign: 'center',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  appTitle: {
    color: Colors.textPrimary,
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: 1.2,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  appSubtitle: {
    color: Colors.textMuted,
    fontSize: 14,
    letterSpacing: 3,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOpacity: 0.4,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 8 },
    elevation: 15,
    overflow: 'hidden',
    marginVertical: 20,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  logoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(212, 175, 55, 0.1)', // Subtle gold tint
  },
  ctaContainer: { width: '100%', gap: 16, marginBottom: 20 },
  footer: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
