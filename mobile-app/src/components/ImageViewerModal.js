import React, { useRef, useState, useCallback } from 'react';
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
  visible = false,
  post = null,
  user = null,
  onPostUpdate = null
}) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const [localPost, setLocalPost] = useState(post);
  const [currentImageIndex, setCurrentImageIndex] = useState(initialIndex);
  const modalRef = useRef(null);
  
  // All hooks must be called before any early return!
  const pan = useRef(new Animated.ValueXY()).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const backgroundOpacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const dismissHintOpacity = useRef(new Animated.Value(0)).current;
  
  // Define navigation functions early to avoid reference issues
  const goToNextImage = useCallback(() => {
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  }, [currentImageIndex, images.length]);

  const goToPreviousImage = useCallback(() => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  }, [currentImageIndex]);

  const canGoNext = currentImageIndex < images.length - 1;
  const canGoPrevious = currentImageIndex > 0;
  
  // Clean up animations when modal closes
  React.useEffect(() => {
    // Always call this effect, but only reset when modal closes
    if (!visible) {
      // Reset animation values
      pan.setValue({ x: 0, y: 0 });
      opacity.setValue(1);
      backgroundOpacity.setValue(1);
      scale.setValue(1);
      dismissHintOpacity.setValue(0);
    }
  }, [visible]);
  
  // Show dismiss hint when modal opens
  React.useEffect(() => {
    if (visible) {
      // Show hint briefly
      Animated.sequence([
        Animated.timing(dismissHintOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.delay(2000), // Show for 2 seconds
        Animated.timing(dismissHintOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        })
      ]).start();
    }
  }, [visible]);

  // Test function for debugging dismiss gesture
  const testDismissGesture = () => {
    console.log('🧪 Testing dismiss gesture manually');
    Animated.parallel([
      Animated.timing(pan, {
        toValue: { x: 0, y: screenHeight * 0.3 },
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(backgroundOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(scale, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: false,
      })
    ]).start(() => {
      console.log('✅ Test dismiss completed');
      onClose();
    });
  };
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true, // Always respond to start
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (!visible) return false; // Don't respond if modal is not visible
        // Respond to any significant movement
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        console.log('🔍 PanResponder granted - gesture started');
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { 
          useNativeDriver: false,
          listener: (_, gestureState) => {
            console.log('🔍 Gesture move:', { dx: gestureState.dx, dy: gestureState.dy });
            
            // Enhanced dismiss gesture with better visual feedback
            if (gestureState.dy > 0) {
              // Calculate dismiss progress (0 to 1)
              const dismissProgress = Math.min(gestureState.dy / 200, 1);
              
              // Animate opacity based on downward movement
              const newOpacity = 1 - dismissProgress * 0.5;
              const newBackgroundOpacity = 1 - dismissProgress * 0.8;
              const newScale = 1 - dismissProgress * 0.1; // Slight scale down effect
              
              opacity.setValue(newOpacity);
              backgroundOpacity.setValue(newBackgroundOpacity);
              scale.setValue(newScale);
              
              // Add resistance as user drags down
              if (gestureState.dy > 100) {
                const resistance = 0.3;
                pan.y.setValue(gestureState.dy * resistance + 100 * (1 - resistance));
              }
            } else if (gestureState.dy < 0) {
              // Slight resistance for upward movement
              const resistance = 0.5;
              pan.y.setValue(gestureState.dy * resistance);
            }
            
            // Handle horizontal movement for navigation
            if (Math.abs(gestureState.dx) > Math.abs(gestureState.dy)) {
              // Allow horizontal movement for navigation
              pan.x.setValue(gestureState.dx);
            }
          }
        }
      ),
      onPanResponderRelease: (_, gestureState) => {
        console.log('🔍 PanResponder released:', { 
          dx: gestureState.dx, 
          dy: gestureState.dy, 
          vx: gestureState.vx, 
          vy: gestureState.vy 
        });
        
        pan.flattenOffset();
        
        // Enhanced dismiss threshold detection
        const dismissThreshold = 80; // Reduced threshold for easier dismissal
        const velocityThreshold = 0.3; // Reduced velocity threshold
        
        // Handle horizontal navigation (left/right swipes)
        if (Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 50) {
          console.log('🔄 Horizontal navigation detected');
          if (gestureState.dx > 0 && canGoPrevious) {
            // Swipe right - go to previous image
            goToPreviousImage();
          } else if (gestureState.dx < 0 && canGoNext) {
            // Swipe left - go to next image
            goToNextImage();
          }
          
          // Reset position with smooth animation
          Animated.parallel([
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: false,
              tension: 100,
              friction: 8,
            }),
            Animated.spring(opacity, {
              toValue: 1,
              useNativeDriver: false,
              tension: 100,
              friction: 8,
            }),
            Animated.spring(backgroundOpacity, {
              toValue: 1,
              useNativeDriver: false,
              tension: 100,
              friction: 8,
            }),
            Animated.spring(scale, {
              toValue: 1,
              useNativeDriver: false,
              tension: 100,
              friction: 8,
            })
          ]).start();
          return;
        }
        
        // Handle vertical dismiss (downward swipes) with enhanced logic
        if (gestureState.dy > dismissThreshold || gestureState.vy > velocityThreshold) {
          console.log('📱 Dismiss gesture detected - closing modal');
          // Close the modal with enhanced animation
          Animated.parallel([
            Animated.timing(pan, {
              toValue: { x: 0, y: screenHeight * 0.3 }, // Move down more for better effect
              duration: 300,
              useNativeDriver: false,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: false,
            }),
            Animated.timing(backgroundOpacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: false,
            }),
            Animated.timing(scale, {
              toValue: 0.8,
              duration: 300,
              useNativeDriver: false,
            })
          ]).start(() => {
            console.log('✅ Modal closed via swipe down');
            onClose();
          });
        } else {
          console.log('🔄 Gesture cancelled - snapping back');
          // Snap back to center with enhanced spring animation
          Animated.parallel([
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: false,
              tension: 120,
              friction: 9,
            }),
            Animated.spring(opacity, {
              toValue: 1,
              useNativeDriver: false,
              tension: 120,
              friction: 9,
            }),
            Animated.spring(backgroundOpacity, {
              toValue: 1,
              useNativeDriver: false,
              tension: 120,
              friction: 9,
            }),
            Animated.spring(scale, {
              toValue: 1,
              useNativeDriver: false,
              tension: 120,
              friction: 9,
            })
          ]).start();
        }
      },
      onPanResponderTerminate: () => {
        console.log('🔍 PanResponder terminated');
        pan.flattenOffset();
        // Enhanced reset animation
        Animated.parallel([
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
            tension: 120,
            friction: 9,
          }),
          Animated.spring(opacity, {
            toValue: 1,
            useNativeDriver: false,
            tension: 120,
            friction: 9,
          }),
          Animated.spring(backgroundOpacity, {
            toValue: 1,
            useNativeDriver: false,
            tension: 120,
            friction: 9,
          }),
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: false,
            tension: 120,
            friction: 9,
          })
        ]).start();
      },
    })
  ).current;

  // Update local post when post prop changes
  React.useEffect(() => {
    if (post) {
      setLocalPost(post);
    }
  }, [post]);

  // Reset state when modal becomes visible/invisible
  React.useEffect(() => {
    if (visible) {
      // Reset states when modal opens
      setCurrentImageIndex(initialIndex);
      // Ensure we have the latest post data when modal opens
      if (post) {
        setLocalPost(post);
      }
    }
  }, [visible, initialIndex, post]);

  // Clean up when modal closes
  React.useEffect(() => {
    if (!visible) {
      // Reset animation values when modal closes
      pan.setValue({ x: 0, y: 0 });
      opacity.setValue(1);
      backgroundOpacity.setValue(1);
      scale.setValue(1);
    }
  }, [visible]);

  const currentImage = images[currentImageIndex];
  
  // Memoize the current image to prevent unnecessary re-renders
  const memoizedCurrentImage = React.useMemo(() => currentImage, [currentImage?.url, currentImageIndex]);

  // Only return null after all hooks are declared
  if (!visible || images.length === 0) return null;

  return (
    <Modal
      ref={modalRef}
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
      hardwareAccelerated={true}
    >
      <Animated.View 
        style={{ 
          flex: 1, 
          backgroundColor: '#000',
          opacity: backgroundOpacity
        }}
        {...panResponder.panHandlers}
      >
        {/* Overlay Header */}
        <View style={styles.overlayHeader} pointerEvents="box-none">
          <TouchableOpacity 
            onPress={onClose}
            style={styles.headerButton}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.counter}>
            {typeof currentImageIndex === 'number' ? String(currentImageIndex + 1) : '1'} / {Array.isArray(images) ? String(images.length) : '0'}
          </Text>
          {/* Debug button - remove in production */}
          <TouchableOpacity 
            onPress={testDismissGesture}
            style={styles.headerButton}
          >
            <Ionicons name="arrow-down" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {/* Centered and Movable Image */}
        <Animated.View 
          style={{ 
            flex: 1, 
            justifyContent: 'center', 
            alignItems: 'center',
            transform: [
              ...pan.getTranslateTransform(),
              { scale: scale }
            ],
            opacity: opacity,
          }}
          pointerEvents="box-none"
        >
          <Image
            source={{ uri: memoizedCurrentImage.url }}
            style={{
              width: screenWidth,
              height: screenHeight * 0.95,
            }}
            resizeMode="contain"
            key={`image-${currentImageIndex}-${memoizedCurrentImage.url}`}
            pointerEvents="none"
          />
          
          {/* Navigation Buttons */}
          {images.length > 1 && (
            <>
              {/* Previous Button */}
              {canGoPrevious && (
                <TouchableOpacity
                  style={[styles.navButton, styles.navButtonLeft]}
                  onPress={goToPreviousImage}
                  pointerEvents="auto"
                >
                  <Ionicons name="chevron-back" size={30} color="#fff" />
                </TouchableOpacity>
              )}
              
              {/* Next Button */}
              {canGoNext && (
                <TouchableOpacity
                  style={[styles.navButton, styles.navButtonRight]}
                  onPress={goToNextImage}
                  pointerEvents="auto"
                >
                  <Ionicons name="chevron-forward" size={30} color="#fff" />
                </TouchableOpacity>
              )}
            </>
          )}
        </Animated.View>
        
        {/* Dismiss Hint (shows briefly when modal opens) */}
        <Animated.View 
          style={[
            styles.dismissHint,
            {
              opacity: dismissHintOpacity,
              transform: [{ translateY: dismissHintOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0]
              })}]
            }
          ]}
          pointerEvents="none"
        >
          <Text style={styles.dismissHintText}>
            {typeof 'Swipe down to dismiss' === 'string' ? 'Swipe down to dismiss' : 'Tap to dismiss'}
          </Text>
        </Animated.View>
      </Animated.View>
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
  navButton: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -25 }],
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  navButtonLeft: {
    left: 20,
  },
  navButtonRight: {
    right: 20,
  },
  dismissHint: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  dismissHintText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
});

export default ImageViewerModal; 