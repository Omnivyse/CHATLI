const axios = require('axios');

class PushNotificationService {
  constructor() {
    this.expoPushUrl = 'https://exp.host/--/api/v2/push/send';
  }

  // Send push notification to a single user
  async sendPushNotification(pushToken, title, body, data = {}) {
    try {
      if (!pushToken) {
        console.log('⚠️ No push token provided, skipping notification');
        return false;
      }

      const message = {
        to: pushToken,
        sound: 'default',
        title,
        body,
        data,
        priority: 'high',
      };

      const response = await axios.post(this.expoPushUrl, message, {
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
      });

      if (response.data && response.data.data && response.data.data.status === 'ok') {
        console.log('✅ Push notification sent successfully:', { title, body, data });
        return true;
      } else {
        console.log('❌ Push notification failed:', response.data);
        return false;
      }
    } catch (error) {
      console.error('❌ Error sending push notification:', error.message);
      return false;
    }
  }

  // Send push notification to multiple users
  async sendPushNotificationToMultiple(pushTokens, title, body, data = {}) {
    try {
      if (!pushTokens || pushTokens.length === 0) {
        console.log('⚠️ No push tokens provided, skipping notifications');
        return [];
      }

      const messages = pushTokens.map(pushToken => ({
        to: pushToken,
        sound: 'default',
        title,
        body,
        data,
        priority: 'high',
      }));

      const response = await axios.post(this.expoPushUrl, messages, {
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
      });

      if (response.data && Array.isArray(response.data.data)) {
        const results = response.data.data.map((result, index) => ({
          token: pushTokens[index],
          success: result.status === 'ok',
          error: result.status !== 'ok' ? result.message : null,
        }));

        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;

        console.log(`📱 Push notifications sent: ${successCount} success, ${failureCount} failed`);
        return results;
      } else {
        console.log('❌ Push notifications failed:', response.data);
        return [];
      }
    } catch (error) {
      console.error('❌ Error sending push notifications:', error.message);
      return [];
    }
  }

  // Send chat notification
  async sendChatNotification(recipientToken, senderName, message, chatId) {
    const title = `💬 ${senderName}`;
    const body = message.length > 50 ? `${message.substring(0, 50)}...` : message;
    const data = {
      type: 'chat',
      chatId,
      senderName,
      message,
    };

    return await this.sendPushNotification(recipientToken, title, body, data);
  }

  // Send like notification
  async sendLikeNotification(recipientToken, likerName, postId, postContent) {
    const title = `❤️ ${likerName}`;
    const body = 'Таны постыг лайк дарлаа';
    const data = {
      type: 'like',
      postId,
      likerName,
      postContent: postContent ? (postContent.length > 50 ? `${postContent.substring(0, 50)}...` : postContent) : '',
    };

    return await this.sendPushNotification(recipientToken, title, body, data);
  }

  // Send comment notification
  async sendCommentNotification(recipientToken, commenterName, postId, comment, postContent) {
    const title = `💭 ${commenterName}`;
    const body = comment.length > 50 ? `${comment.substring(0, 50)}...` : comment;
    const data = {
      type: 'comment',
      postId,
      commenterName,
      comment,
      postContent: postContent ? (postContent.length > 50 ? `${postContent.substring(0, 50)}...` : postContent) : '',
    };

    return await this.sendPushNotification(recipientToken, title, body, data);
  }

  // Send follow notification
  async sendFollowNotification(recipientToken, followerName, followerId) {
    const title = `👤 ${followerName}`;
    const body = 'Таныг дагаж эхэллээ';
    const data = {
      type: 'follow',
      userId: followerId,
      followerName,
    };

    return await this.sendPushNotification(recipientToken, title, body, data);
  }

  // Send custom notification
  async sendCustomNotification(recipientToken, title, body, data = {}) {
    return await this.sendPushNotification(recipientToken, title, body, data);
  }

  // Validate push token format
  validatePushToken(pushToken) {
    if (!pushToken || typeof pushToken !== 'string') {
      return false;
    }
    
    // Expo push tokens start with ExponentPushToken[ or ExpoPushToken[
    return pushToken.startsWith('ExponentPushToken[') || pushToken.startsWith('ExpoPushToken[');
  }

  // Clean up invalid push tokens (optional - can be called periodically)
  async cleanupInvalidTokens(pushTokens) {
    const validTokens = pushTokens.filter(token => this.validatePushToken(token));
    const invalidTokens = pushTokens.filter(token => !this.validatePushToken(token));
    
    if (invalidTokens.length > 0) {
      console.log(`🧹 Cleaned up ${invalidTokens.length} invalid push tokens`);
    }
    
    return validTokens;
  }
}

// Create singleton instance
const pushNotificationService = new PushNotificationService();

module.exports = pushNotificationService; 