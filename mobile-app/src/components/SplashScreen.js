import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ onAnimationComplete }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startAnimation = () => {
      // Background fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      // Logo scale and fade animation
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          delay: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          delay: 300,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Text fade in
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 600,
        delay: 800,
        useNativeDriver: true,
      }).start();

      // Auto hide after animation
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(logoOpacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(textOpacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onAnimationComplete();
        });
      }, 2000);
    };

    startAnimation();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Background Gradient Effect */}
      <View style={styles.gradientBackground} />
      
      {/* Logo Container */}
      <Animated.View 
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo Image */}
        <View style={styles.logoCircle}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        
        {/* Logo Rings */}
        <View style={styles.logoRing1} />
        <View style={styles.logoRing2} />
      </Animated.View>

      {/* App Name */}
      <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
        <Text style={styles.appName}>CHATLI</Text>
        <Text style={styles.tagline}>Connect • Share • Chat</Text>
      </Animated.View>

      {/* Decorative Elements */}
      <View style={styles.decorativeElements}>
        <View style={[styles.dot, styles.dot1]} />
        <View style={[styles.dot, styles.dot2]} />
        <View style={[styles.dot, styles.dot3]} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    opacity: 0.9,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ffffff',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  logoRing1: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoRing2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  textContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 4,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 1,
    fontWeight: '300',
  },
  decorativeElements: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  dot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  dot1: {
    top: '20%',
    left: '15%',
  },
  dot2: {
    top: '30%',
    right: '20%',
  },
  dot3: {
    bottom: '25%',
    left: '25%',
  },
});

export default SplashScreen; 