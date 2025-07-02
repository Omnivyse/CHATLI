import apiService from './api';

class AnalyticsService {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    this.currentPage = window.location.pathname;
    this.isTracking = false;
    this.queue = [];
    this.flushInterval = null;
  }

  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  init() {
    if (this.isTracking) return;
    
    this.isTracking = true;
    this.trackPageView();
    this.setupEventListeners();
    this.startPeriodicFlush();
    
    // Track session duration on page unload
    window.addEventListener('beforeunload', () => {
      this.trackSessionEnd();
      this.flush();
    });
  }

  setupEventListeners() {
    // Track page navigation
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    
    window.history.pushState = (...args) => {
      originalPushState.apply(window.history, args);
      this.handlePageChange();
    };
    
    window.history.replaceState = (...args) => {
      originalReplaceState.apply(window.history, args);
      this.handlePageChange();
    };
    
    window.addEventListener('popstate', () => {
      this.handlePageChange();
    });

    // Track clicks on important elements
    document.addEventListener('click', (event) => {
      const target = event.target;
      
      // Track button clicks
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        this.trackEvent('button_click', {
          buttonText: target.textContent?.trim().substring(0, 50),
          page: this.currentPage
        });
      }
      
      // Track link clicks
      if (target.tagName === 'A' || target.closest('a')) {
        const link = target.closest('a');
        this.trackEvent('link_click', {
          href: link.href,
          text: link.textContent?.trim().substring(0, 50),
          page: this.currentPage
        });
      }
    });
  }

  handlePageChange() {
    const newPage = window.location.pathname;
    if (newPage !== this.currentPage) {
      this.currentPage = newPage;
      this.trackPageView();
    }
  }

  startPeriodicFlush() {
    // Flush events every 30 seconds
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 30000);
  }

  getDeviceInfo() {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const language = navigator.language;
    
    // Simple browser detection
    let browser = 'Unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    
    // Simple mobile detection
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    return {
      platform,
      browser,
      browserVersion: this.getBrowserVersion(userAgent, browser),
      isMobile,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      language
    };
  }

  getBrowserVersion(userAgent, browser) {
    const match = userAgent.match(new RegExp(`${browser}/([\\d.]+)`));
    return match ? match[1] : 'Unknown';
  }

  getPerformanceMetrics() {
    if (!window.performance) return {};
    
    const navigation = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');
    
    return {
      loadTime: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0,
      renderTime: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
      networkLatency: navigation ? navigation.responseStart - navigation.requestStart : 0
    };
  }

  getCurrentUser() {
    // Get current user from localStorage or context
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.userId;
      }
    } catch (error) {
      console.debug('Could not get user from token:', error);
    }
    return null;
  }

  trackEvent(eventType, metadata = {}) {
    if (!this.isTracking) return;
    
    const event = {
      eventType,
      userId: this.getCurrentUser(),
      userAgent: navigator.userAgent,
      ipAddress: null, // Will be set by server
      page: this.currentPage,
      referrer: document.referrer,
      sessionId: this.sessionId,
      deviceInfo: this.getDeviceInfo(),
      performanceMetrics: this.getPerformanceMetrics(),
      metadata,
      timestamp: new Date().toISOString()
    };
    
    this.queue.push(event);
    
    // Flush immediately for important events
    if (['user_login', 'user_register', 'error_occurred'].includes(eventType)) {
      this.flush();
    }
  }

  trackPageView() {
    this.trackEvent('page_view');
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

  trackPostLiked() {
    this.trackEvent('post_liked');
  }

  trackFileUpload() {
    this.trackEvent('file_upload');
  }

  trackChatCreated() {
    this.trackEvent('chat_created');
  }

  trackUserSearch(query) {
    this.trackEvent('user_search', { query: query?.substring(0, 100) });
  }

  trackReportSubmitted() {
    this.trackEvent('report_submitted');
  }

  trackError(error, additionalInfo = {}) {
    this.trackEvent('error_occurred', {
      message: error.message?.substring(0, 200),
      stack: error.stack?.substring(0, 500),
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...additionalInfo
    });
  }

  trackSessionEnd() {
    const sessionDuration = Math.floor((Date.now() - this.sessionStartTime) / 1000);
    this.trackEvent('session_end', {
      sessionDuration,
      pagesVisited: this.queue.filter(e => e.eventType === 'page_view').length
    });
  }

  async flush() {
    if (this.queue.length === 0) return;
    
    const events = [...this.queue];
    this.queue = [];
    
    try {
      // Send events to analytics endpoint (non-admin endpoint)
      await fetch(`${apiService.baseURL}/analytics/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ events })
      });
    } catch (error) {
      console.debug('Analytics tracking failed:', error);
      // Re-queue events on failure
      this.queue.unshift(...events);
    }
  }

  stop() {
    this.isTracking = false;
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flush();
  }
}

// Create singleton instance
const analyticsService = new AnalyticsService();

// Global error tracking
window.addEventListener('error', (event) => {
  analyticsService.trackError(event.error || new Error(event.message), {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

// Unhandled promise rejection tracking
window.addEventListener('unhandledrejection', (event) => {
  analyticsService.trackError(new Error(event.reason), {
    type: 'unhandled_promise_rejection'
  });
});

export default analyticsService; 