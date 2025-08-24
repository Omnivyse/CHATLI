const axios = require('axios');

class PushNotificationService {
  constructor() {
    this.expoPushUrl = 'https://exp.host/--/api/v2/push/send';
    this.soundSettings = {
      message: 'message_notification',
      like: 'like_notification',
      comment: 'comment_notification',
      follow: 'follow_notification',
      general: 'general_notification'
    };
  }

  // Send push notification to a single user with custom sound
  async sendPushNotification(pushToken, title, body, data = {}, soundType = 'general') {
    try {
      if (!pushToken) {
        console.log('⚠️ No push token provided, skipping notification');
        return false;
      }

      console.log('🔔 Sending push notification:', {
        title,
        body,
        data,
        soundType,
        tokenLength: pushToken.length,
        tokenPrefix: pushToken.substring(0, 20) + '...'
      });

      const sound = this.getSoundForType(soundType);

      const message = {
        to: pushToken,
        sound: sound,
        title,
        body,
        data,
        priority: 'high',
        channelId: this.getChannelId(soundType),
      };

      console.log('📤 Push notification payload:', message);

      const response = await axios.post(this.expoPushUrl, message, {
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      });

      console.log('📥 Push notification response:', response.data);

      if (response.data && response.data.data && response.data.data.status === 'ok') {
        console.log('✅ Push notification sent successfully:', { title, body, data, sound });
        return true;
      } else {
        console.log('❌ Push notification failed:', response.data);
        return false;
      }
    } catch (error) {
      console.error('❌ Error sending push notification:', error.message);
      console.error('❌ Error details:', {
        code: error.code,
        response: error.response?.data,
        status: error.response?.status
      });
      return false;
    }
  }

  // Send push notification to multiple users
  async sendPushNotificationToMultiple(pushTokens, title, body, data = {}, soundType = 'general') {
    try {
      if (!pushTokens || pushTokens.length === 0) {
        console.log('⚠️ No push tokens provided, skipping notifications');
        return false;
      }

      const sound = this.getSoundForType(soundType);
      const channelId = this.getChannelId(soundType);

      const messages = pushTokens.map(token => ({
        to: token,
        sound: sound,
        title,
        body,
        data,
        priority: 'high',
        channelId: channelId,
      }));

      const response = await axios.post(this.expoPushUrl, messages, {
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
      });

      if (response.data && response.data.data) {
        const results = response.data.data;
        const successCount = results.filter(result => result.status === 'ok').length;
        console.log(`✅ Push notifications sent: ${successCount}/${pushTokens.length} successful`);
        return successCount > 0;
      } else {
        console.log('❌ Push notifications failed:', response.data);
        return false;
      }
    } catch (error) {
      console.error('❌ Error sending push notifications:', error.message);
      return false;
    }
  }

  // Get sound file for notification type
  getSoundForType(type) {
    // Use the uploaded nottif.mp3 for all notification types
    return 'nottif';
  }

  // Get Android channel ID for notification type
  getChannelId(type) {
    switch (type) {
      case 'message':
        return 'messages';
      case 'like':
        return 'likes';
      case 'comment':
        return 'comments';
      case 'follow':
        return 'follows';
      case 'general':
      default:
        return 'general';
    }
  }

  // Send message notification
  async sendMessageNotification(pushToken, senderName, messageContent, chatId, senderId, recipientId) {
    console.log('💬 Sending message notification:', {
      senderName,
      messageContent: messageContent.substring(0, 50) + (messageContent.length > 50 ? '...' : ''),
      chatId,
      senderId,
      recipientId,
      tokenLength: pushToken?.length || 0
    });
    
    const result = await this.sendPushNotification(
      pushToken,
      `New message from ${senderName}`,
      messageContent.length > 50 ? messageContent.substring(0, 50) + '...' : messageContent,
      {
        type: 'message',
        chatId: chatId,
        senderName: senderName,
        messageContent: messageContent,
        senderId: senderId,
        recipientId: recipientId // Include recipientId for proper filtering
      },
      'message'
    );
    
    console.log('💬 Message notification result:', result);
    return result;
  }

  // Send like notification
  async sendLikeNotification(pushToken, likerName, postId, postContent) {
    return this.sendPushNotification(
      pushToken,
      `${likerName} liked your post`,
      postContent.length > 50 ? postContent.substring(0, 50) + '...' : postContent,
      {
        type: 'like',
        postId: postId,
        likerName: likerName,
        postContent: postContent
      },
      'like'
    );
  }

  // Send comment notification
  async sendCommentNotification(pushToken, commenterName, postId, commentContent, postContent) {
    return this.sendPushNotification(
      pushToken,
      `${commenterName} commented on your post`,
      commentContent.length > 50 ? commentContent.substring(0, 50) + '...' : commentContent,
      {
        type: 'comment',
        postId: postId,
        commenterName: commenterName,
        commentContent: commentContent,
        postContent: postContent
      },
      'comment'
    );
  }

  // Send follow notification
  async sendFollowNotification(pushToken, followerName, followerId) {
    return this.sendPushNotification(
      pushToken,
      `${followerName} started following you`,
      'Tap to view their profile',
      {
        type: 'follow',
        followerId: followerId,
        followerName: followerName
      },
      'follow'
    );
  }

  // Send general notification
  async sendGeneralNotification(pushToken, title, body, data = {}) {
    return this.sendPushNotification(
      pushToken,
      title,
      body,
      {
        type: 'general',
        ...data
      },
      'general'
    );
  }

  // Send event notification
  async sendEventNotification(pushToken, eventTitle, eventDescription, eventId) {
    return this.sendPushNotification(
      pushToken,
      `New event: ${eventTitle}`,
      eventDescription.length > 50 ? eventDescription.substring(0, 50) + '...' : eventDescription,
      {
        type: 'event',
        eventId: eventId,
        eventTitle: eventTitle,
        eventDescription: eventDescription
      },
      'general'
    );
  }

  // Send verification notification
  async sendVerificationNotification(pushToken, title, body) {
    return this.sendPushNotification(
      pushToken,
      title,
      body,
      {
        type: 'verification'
      },
      'general'
    );
  }
}

module.exports = new PushNotificationService(); 