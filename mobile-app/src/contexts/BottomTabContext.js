import React, { createContext, useContext, useState, useRef } from 'react';
import { Animated } from 'react-native';

const BottomTabContext = createContext();

export const useBottomTab = () => {
  const context = useContext(BottomTabContext);
  if (!context) {
    throw new Error('useBottomTab must be used within a BottomTabProvider');
  }
  return context;
};

export const BottomTabProvider = ({ children }) => {
  const [isBottomTabVisible, setIsBottomTabVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const translateY = useRef(new Animated.Value(0)).current;

  const updateBottomTabVisibility = (currentScrollY) => {
    // Check if currentScrollY is a valid number
    if (typeof currentScrollY !== 'number' || isNaN(currentScrollY)) {
      return;
    }
    
    // Simple scroll direction detection without threshold for immediate response
    if (currentScrollY > lastScrollY) {
      // Scrolling down - hide bottom tab immediately
      hideBottomTab();
    } else if (currentScrollY < lastScrollY) {
      // Scrolling up - show bottom tab immediately
      showBottomTab();
    }
    
    setLastScrollY(currentScrollY);
  };

  const showBottomTab = () => {
    if (!isBottomTabVisible) {
      setIsBottomTabVisible(true);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 150, // Very fast animation for responsiveness
        useNativeDriver: true,
      }).start();
    }
  };

  const hideBottomTab = () => {
    if (isBottomTabVisible) {
      setIsBottomTabVisible(false);
      Animated.timing(translateY, {
        toValue: 120, // Increased to ensure complete hiding
        duration: 150, // Fast hide animation too
        useNativeDriver: true,
      }).start();
    }
  };

  return (
    <BottomTabContext.Provider value={{
      isBottomTabVisible,
      updateBottomTabVisibility,
      showBottomTab,
      hideBottomTab,
      translateY,
    }}>
      {children}
    </BottomTabContext.Provider>
  );
};
