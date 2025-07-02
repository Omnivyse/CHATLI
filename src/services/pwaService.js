class PWAService {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.isStandalone = false;
    this.registration = null;
    
    this.init();
  }

  init() {
    // Check if app is running in standalone mode
    this.isStandalone = this.checkStandaloneMode();
    
    // Check if app is already installed
    this.isInstalled = this.checkInstallationStatus();
    
    // Listen for beforeinstallprompt event
    this.setupInstallPromptListener();
    
    // Register service worker
    this.registerServiceWorker();
    
    // Setup app update listener
    this.setupUpdateListener();
    
    console.log('🚀 PWA Service initialized', {
      isStandalone: this.isStandalone,
      isInstalled: this.isInstalled
    });
  }

  checkStandaloneMode() {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://')
    );
  }

  checkInstallationStatus() {
    // Check various indicators that app might be installed
    return (
      this.isStandalone ||
      localStorage.getItem('pwa-installed') === 'true' ||
      window.navigator.standalone === true
    );
  }

  setupInstallPromptListener() {
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('📱 PWA: Install prompt available');
      
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      
      // Save the event so it can be triggered later
      this.deferredPrompt = e;
      
      // Update UI to notify the user they can install the PWA
      this.notifyInstallAvailable();
    });

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      console.log('✅ PWA: App installed successfully');
      this.isInstalled = true;
      localStorage.setItem('pwa-installed', 'true');
      this.notifyInstallSuccess();
      this.deferredPrompt = null;
    });
  }

  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.warn('⚠️ PWA: Service Workers not supported');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      this.registration = registration;
      console.log('✅ PWA: Service Worker registered successfully');
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        console.log('🔄 PWA: New service worker version found');
        this.handleServiceWorkerUpdate(registration);
      });
      
      return true;
    } catch (error) {
      console.error('❌ PWA: Service Worker registration failed:', error);
      return false;
    }
  }

  handleServiceWorkerUpdate(registration) {
    const newWorker = registration.installing;
    
    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // New service worker available
        console.log('🆕 PWA: New version available');
        this.notifyUpdateAvailable();
      }
    });
  }

  setupUpdateListener() {
    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SW_UPDATE_AVAILABLE') {
        this.notifyUpdateAvailable();
      }
    });
  }

  async showInstallPrompt() {
    if (!this.deferredPrompt) {
      console.log('⚠️ PWA: No install prompt available');
      return false;
    }

    try {
      // Show the install prompt
      this.deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await this.deferredPrompt.userChoice;
      
      console.log(`📱 PWA: Install prompt result: ${outcome}`);
      
      if (outcome === 'accepted') {
        console.log('✅ PWA: User accepted the install prompt');
        return true;
      } else {
        console.log('❌ PWA: User dismissed the install prompt');
        return false;
      }
    } catch (error) {
      console.error('❌ PWA: Install prompt error:', error);
      return false;
    } finally {
      this.deferredPrompt = null;
    }
  }

  async updateServiceWorker() {
    if (!this.registration) {
      console.warn('⚠️ PWA: No service worker registration found');
      return false;
    }

    try {
      // Skip waiting and activate new service worker
      if (this.registration.waiting) {
        this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        return true;
      }
      
      // Check for updates
      await this.registration.update();
      console.log('🔄 PWA: Checked for service worker updates');
      return true;
    } catch (error) {
      console.error('❌ PWA: Service worker update failed:', error);
      return false;
    }
  }

  isInstallable() {
    return !!this.deferredPrompt && !this.isInstalled;
  }

  isUpdateAvailable() {
    return this.registration && this.registration.waiting;
  }

  // Event callbacks - to be overridden by components
  notifyInstallAvailable() {
    console.log('📱 PWA: Install available notification');
    // Override this method to show UI notification
    this.onInstallAvailable?.();
  }

  notifyInstallSuccess() {
    console.log('✅ PWA: Install success notification');
    // Override this method to show success message
    this.onInstallSuccess?.();
  }

  notifyUpdateAvailable() {
    console.log('🔄 PWA: Update available notification');
    // Override this method to show update notification
    this.onUpdateAvailable?.();
  }

  // Request notification permission
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.warn('⚠️ PWA: Notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('🔔 PWA: Notification permission:', permission);
      return permission === 'granted';
    } catch (error) {
      console.error('❌ PWA: Notification permission error:', error);
      return false;
    }
  }

  // Subscribe to push notifications (would need backend setup)
  async subscribeToPushNotifications() {
    if (!this.registration) {
      console.warn('⚠️ PWA: No service worker registration for push notifications');
      return null;
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          // You would need to replace this with your VAPID public key
          'YOUR_VAPID_PUBLIC_KEY_HERE'
        )
      });
      
      console.log('🔔 PWA: Push subscription created', subscription);
      return subscription;
    } catch (error) {
      console.error('❌ PWA: Push subscription failed:', error);
      return null;
    }
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Analytics tracking
  trackPWAEvent(event, data = {}) {
    console.log('📊 PWA Event:', event, data);
    
    // You can integrate with your analytics service here
    if (window.gtag) {
      window.gtag('event', event, {
        event_category: 'PWA',
        ...data
      });
    }
  }

  // Get installation instructions for different platforms
  getInstallInstructions() {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      return {
        platform: 'iOS',
        instructions: [
          'Safari хөтчийг нээнэ үү',
          'Хуваалцах товчийг дарна уу (⬆️)',
          '"Нүүр дэлгэцэнд нэмэх" сонголтыг сонгоно уу',
          '"Нэмэх" товчийг дарна уу'
        ]
      };
    } else if (userAgent.includes('android')) {
      return {
        platform: 'Android',
        instructions: [
          'Chrome хөтчийг нээнэ үү',
          'Цэсний товчийг дарна уу (⋮)',
          '"Нүүр дэлгэцэнд суулгах" сонголтыг сонгоно уу',
          '"Суулгах" товчийг дарна уу'
        ]
      };
    } else {
      return {
        platform: 'Desktop',
        instructions: [
          'Chrome эсвэл Edge хөтчийг ашиглана уу',
          'Хаягийн мөрөн дэх суулгах товчийг дарна уу',
          'Эсвэл цэсээс "Суулгах" сонголтыг сонгоно уу'
        ]
      };
    }
  }
}

// Create singleton instance
const pwaService = new PWAService();

export default pwaService; 