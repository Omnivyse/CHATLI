import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Modal,
  Animated,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../utils/themeUtils';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ImageViewerModal = ({
  images = [],
  initialIndex = 0,
  onClose,
  visible = false
}) => {
  // All hooks must be called before any early return!
  const pan = useRef(new Animated.ValueXY()).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2,
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 80) {
          onClose();
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  // Only return null after all hooks are declared
  if (!visible || images.length === 0) return null;

  const currentImage = images[initialIndex];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {/* Overlay Header */}
        <View style={styles.overlayHeader} pointerEvents="box-none">
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.counter}>
            {initialIndex + 1} / {images.length}
          </Text>
        </View>
        {/* Centered and Movable Image */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Animated.View
            style={{
              transform: pan.getTranslateTransform(),
            }}
            {...panResponder.panHandlers}
          >
            <Image
              source={{ uri: currentImage.url }}
              style={{
                width: screenWidth,
                height: screenHeight * 0.95,
              }}
              resizeMode="contain"
            />
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 40, // for status bar
    paddingBottom: 8,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
  },
  counter: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginRight: 8,
  },
});

export default ImageViewerModal; 