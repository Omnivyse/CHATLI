import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import apiService from '../services/api';
import socketService from '../services/socket';

const ChatScreen = ({ route, navigation }) => {
  const { chatId, chatTitle, user } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadMessages();
    
    // Join chat room
    socketService.joinChat(chatId);
    
    // Listen for new messages
    socketService.on('new_message', handleNewMessage);
    
    return () => {
      socketService.leaveChat(chatId);
      socketService.off('new_message', handleNewMessage);
    };
  }, [chatId]);

  const loadMessages = async () => {
    try {
      const response = await apiService.getMessages(chatId);
      if (response.success) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error('Load messages error:', error);
      Toast.show({
        type: 'error',
        text1: 'Алдаа',
        text2: 'Мессеж ачаалахад алдаа гарлаа',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (data) => {
    if (data.chatId === chatId) {
      setMessages(prev => [...prev, data.message]);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const response = await apiService.sendMessage(chatId, {
        type: 'text',
        content: { text: messageText }
      });

      if (response.success) {
        const message = response.data.message;
        setMessages(prev => [...prev, message]);
        socketService.sendMessage(chatId, message);
      }
    } catch (error) {
      console.error('Send message error:', error);
      Toast.show({
        type: 'error',
        text1: 'Алдаа',
        text2: 'Мессеж илгээхэд алдаа гарлаа',
      });
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item: message }) => {
    const isOwnMessage = message.sender._id === user._id;
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble
        ]}>
          {!isOwnMessage && (
            <Text style={styles.senderName}>{message.sender.name}</Text>
          )}
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {message.content.text}
          </Text>
          <Text style={[
            styles.messageTime,
            isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
          ]}>
            {new Date(message.createdAt).toLocaleTimeString('mn-MN', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Messages List */}
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item._id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          inverted={false}
        />

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Мессеж бичих..."
            placeholderTextColor="#999999"
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={newMessage.trim() && !sending ? "#ffffff" : "#cccccc"} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    marginVertical: 4,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  ownBubble: {
    backgroundColor: '#000000',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#f5f5f5',
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#ffffff',
  },
  otherMessageText: {
    color: '#000000',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  ownMessageTime: {
    color: '#cccccc',
  },
  otherMessageTime: {
    color: '#999999',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    backgroundColor: '#ffffff',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: '#000000',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#f5f5f5',
  },
});

export default ChatScreen; 