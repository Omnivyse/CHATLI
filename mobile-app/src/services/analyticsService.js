class AnalyticsService {
  constructor() {
    this.isTracking = false;
    this.queue = [];
  }

  init() {
    if (this.isTracking) return;
    this.isTracking = true;
    console.log('Analytics service initialized');
  }

  trackEvent(eventType, metadata = {}) {
    if (!this.isTracking) return;
    
    const event = {
      eventType,
      metadata,
      timestamp: new Date().toISOString()
    };
    
    this.queue.push(event);
    console.log('Analytics event:', event);
  }

  trackUserLogin() {
    this.trackEvent('user_login');
  }

  trackUserLogout() {
    this.trackEvent('user_logout');
  }

  trackUserRegister() {
    this.trackEvent('user_register');
  }

  trackMessageSent() {
    this.trackEvent('message_sent');
  }

  trackPostCreated() {
    this.trackEvent('post_created');
  }

  trackError(error, additionalInfo = {}) {
    this.trackEvent('error_occurred', {
      error: error.message || error,
      ...additionalInfo
    });
  }

  stop() {
    this.isTracking = false;
    console.log('Analytics service stopped');
  }
}

const analyticsService = new AnalyticsService();
export default analyticsService; 