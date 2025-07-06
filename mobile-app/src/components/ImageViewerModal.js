import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  StatusBar,
  Alert,
  Share,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../utils/themeUtils';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ImageViewerModal = ({ 
  images = [], 
  initialIndex = 0, 
  onClose, 
  visible = false 
}) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
      setScale(1);
      StatusBar.setHidden(true);
    } else {
      StatusBar.setHidden(false);
    }
  }, [visible, initialIndex]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setScale(1);
    }
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setScale(1);
    }
  };

  const handleZoomIn = () => {
    const newScale = Math.min(scale * 1.5, 5);
    setScale(newScale);
  };

  const handleZoomOut = () => {
    const newScale = Math.max(scale / 1.5, 0.5);
    setScale(newScale);
  };

  const handleDoubleTap = () => {
    if (scale > 1) {
      setScale(1);
    } else {
      setScale(2);
    }
  };

  const handleDownload = async () => {
    const currentImage = images[currentIndex];
    if (!currentImage || !currentImage.url) return;

    try {
      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Зөвшөөрөл', 'Зургийг хадгалахын тулд зөвшөөрөл шаардлагатай');
        return;
      }

      // Download the image
      const fileUri = FileSystem.documentDirectory + `image_${Date.now()}.jpg`;
      const downloadResult = await FileSystem.downloadAsync(currentImage.url, fileUri);
      
      if (downloadResult.status === 200) {
        // Save to media library
        const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
        await MediaLibrary.createAlbumAsync('CHATLI', asset, false);
        Alert.alert('Амжилттай', 'Зураг галерейд хадгалагдлаа');
      } else {
        Alert.alert('Алдаа', 'Зураг татахад алдаа гарлаа');
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Алдаа', 'Зураг татахад алдаа гарлаа');
    }
  };

  const handleShare = async () => {
    const currentImage = images[currentIndex];
    if (!currentImage || !currentImage.url) return;

    try {
      await Share.share({
        url: currentImage.url,
        message: 'CHATLI-с зургийг хуваалцаж байна',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  if (!visible || images.length === 0) return null;

  const currentImage = images[currentIndex];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <Text style={[styles.counter, { color: colors.text }]}>
            {currentIndex + 1} / {images.length}
          </Text>
          
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
              <Ionicons name="share-outline" size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDownload} style={styles.headerButton}>
              <Ionicons name="download-outline" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Image Container */}
        <View style={styles.imageContainer}>
          <TouchableOpacity 
            onPress={handleDoubleTap}
            activeOpacity={1}
            style={styles.imageWrapper}
          >
            <Image
              source={{ uri: currentImage.url }}
              style={[
                styles.image,
                {
                  transform: [{ scale }]
                }
              ]}
              resizeMode="contain"
            />
          </TouchableOpacity>
          
          {/* Navigation Buttons */}
          {images.length > 1 && (
            <>
              <TouchableOpacity
                style={[styles.navButton, styles.navButtonLeft]}
                onPress={handlePrevious}
                disabled={currentIndex === 0}
              >
                <Ionicons 
                  name="chevron-back" 
                  size={24} 
                  color={currentIndex === 0 ? colors.textSecondary : colors.text} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.navButton, styles.navButtonRight]}
                onPress={handleNext}
                disabled={currentIndex === images.length - 1}
              >
                <Ionicons 
                  name="chevron-forward" 
                  size={24} 
                  color={currentIndex === images.length - 1 ? colors.textSecondary : colors.text} 
                />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Controls */}
        <View style={[styles.controls, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            onPress={handleZoomOut}
            style={[styles.controlButton, { backgroundColor: colors.surfaceVariant }]}
            disabled={scale <= 0.5}
          >
            <Ionicons 
              name="remove" 
              size={20} 
              color={scale <= 0.5 ? colors.textSecondary : colors.text} 
            />
          </TouchableOpacity>
          
          <Text style={[styles.zoomText, { color: colors.text }]}>
            {Math.round(scale * 100)}%
          </Text>
          
          <TouchableOpacity
            onPress={handleZoomIn}
            style={[styles.controlButton, { backgroundColor: colors.surfaceVariant }]}
            disabled={scale >= 5}
          >
            <Ionicons 
              name="add" 
              size={20} 
              color={scale >= 5 ? colors.textSecondary : colors.text} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
  },
  counter: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  imageWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  image: {
    width: screenWidth,
    height: screenHeight * 0.7,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -20 }],
    padding: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  navButtonLeft: {
    left: 16,
  },
  navButtonRight: {
    right: 16,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  controlButton: {
    padding: 12,
    borderRadius: 24,
  },
  zoomText: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'center',
  },
});

export default ImageViewerModal; 