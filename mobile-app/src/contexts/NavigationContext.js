import React, { createContext, useContext, useState, useEffect } from 'react';

const NavigationContext = createContext();

export const useNavigationState = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigationState must be used within a NavigationProvider');
  }
  return context;
};

export const NavigationProvider = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState(null);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [isInChat, setIsInChat] = useState(false);

  const updateNavigationState = (screen, chatId = null) => {
    setCurrentScreen(screen);
    setCurrentChatId(chatId);
    setIsInChat(screen === 'Chat' && chatId !== null);
    
    console.log('🧭 Navigation state updated:', {
      screen,
      chatId,
      isInChat: screen === 'Chat' && chatId !== null
    });
  };

  const isChatOpen = (chatId) => {
    return isInChat && currentChatId === chatId;
  };

  const shouldShowNotification = (notificationData) => {
    // If it's a chat/message notification and the user is already in that chat, don't show
    if (notificationData?.type === 'message' || notificationData?.type === 'chat') {
      const notificationChatId = notificationData?.chatId;
      if (notificationChatId && isChatOpen(notificationChatId)) {
        console.log('🔔 Suppressing notification - user already in chat:', notificationChatId);
        return false;
      }
    }
    
    // For other notification types, always show
    return true;
  };

  return (
    <NavigationContext.Provider value={{
      currentScreen,
      currentChatId,
      isInChat,
      updateNavigationState,
      isChatOpen,
      shouldShowNotification
    }}>
      {children}
    </NavigationContext.Provider>
  );
}; 