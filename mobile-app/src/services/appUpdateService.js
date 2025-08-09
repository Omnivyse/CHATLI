import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

class AppUpdateService {
  constructor() {
    this.currentVersion = Constants.expoConfig?.version || '1.0.9';
    this.buildNumber = Platform.OS === 'ios' 
      ? Constants.expoConfig?.ios?.buildNumber || '11'
      : Constants.expoConfig?.android?.versionCode || '4';
    
    // App Store URLs (replace with your actual URLs)
    this.appStoreUrl = 'https://apps.apple.com/app/chatli/id1234567890'; // Replace with your App Store ID
    this.playStoreUrl = 'https://play.google.com/store/apps/details?id=com.chatli.mobile';
    
    // Update check settings
    this.updateCheckInterval = 24 * 60 * 60 * 1000; // 24 hours
    this.forceUpdateKey = 'forceUpdateVersion';
    this.lastCheckKey = 'lastUpdateCheck';
    this.skipUpdateKey = 'skipUpdateVersion';
  }

  // Get current app version
  getCurrentVersion() {
    return {
      version: this.currentVersion,
      buildNumber: this.buildNumber,
      platform: Platform.OS
    };
  }

  // Check if update is required by comparing versions
  isUpdateRequired(latestVersion, currentVersion = this.currentVersion) {
    try {
      const current = this.parseVersion(currentVersion);
      const latest = this.parseVersion(latestVersion);
      
      // Compare major version
      if (latest.major > current.major) {
        return { required: true, type: 'force' };
      }
      
      // Compare minor version
      if (latest.minor > current.minor) {
        return { required: true, type: 'recommended' };
      }
      
      // Compare patch version
      if (latest.patch > current.patch) {
        return { required: true, type: 'recommended' };
      }
      
      return { required: false, type: 'none' };
    } catch (error) {
      console.error('Error comparing versions:', error);
      return { required: false, type: 'none' };
    }
  }

  // Parse version string (e.g., "1.2.3" -> {major: 1, minor: 2, patch: 3})
  parseVersion(versionString) {
    const parts = versionString.split('.').map(part => parseInt(part, 10));
    return {
      major: parts[0] || 0,
      minor: parts[1] || 0,
      patch: parts[2] || 0
    };
  }

  // Check for updates from server
  async checkForUpdates() {
    try {
      const lastCheck = await this.getLastCheckTime();
      const now = Date.now();
      
      // Don't check too frequently
      if (lastCheck && (now - lastCheck) < this.updateCheckInterval) {
        console.log('🔍 Update check skipped - too recent');
        return null;
      }

      console.log('🔍 Checking for app updates...');
      
      // Make API call to your server to get latest version info
      const response = await fetch('https://chatli-production.up.railway.app/api/app/version', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch version info');
      }

      const versionInfo = await response.json();
      
      // Save last check time
      await this.setLastCheckTime(now);
      
      return versionInfo;
    } catch (error) {
      console.error('Error checking for updates:', error);
      return null;
    }
  }

  // Get the appropriate store URL based on platform
  getStoreUrl() {
    return Platform.OS === 'ios' ? this.appStoreUrl : this.playStoreUrl;
  }

  // Check if user has skipped this version
  async hasSkippedVersion(version) {
    try {
      const skippedVersion = await AsyncStorage.getItem(this.skipUpdateKey);
      return skippedVersion === version;
    } catch (error) {
      console.error('Error checking skipped version:', error);
      return false;
    }
  }

  // Mark version as skipped
  async skipVersion(version) {
    try {
      await AsyncStorage.setItem(this.skipUpdateKey, version);
      console.log('🔍 Version skipped:', version);
    } catch (error) {
      console.error('Error skipping version:', error);
    }
  }

  // Check if force update is required
  async isForceUpdateRequired() {
    try {
      const forceUpdateVersion = await AsyncStorage.getItem(this.forceUpdateKey);
      if (forceUpdateVersion) {
        const updateInfo = this.isUpdateRequired(forceUpdateVersion);
        return updateInfo.required;
      }
      return false;
    } catch (error) {
      console.error('Error checking force update:', error);
      return false;
    }
  }

  // Set force update version
  async setForceUpdateVersion(version) {
    try {
      await AsyncStorage.setItem(this.forceUpdateKey, version);
      console.log('🔍 Force update version set:', version);
    } catch (error) {
      console.error('Error setting force update version:', error);
    }
  }

  // Get last check time
  async getLastCheckTime() {
    try {
      const lastCheck = await AsyncStorage.getItem(this.lastCheckKey);
      return lastCheck ? parseInt(lastCheck, 10) : null;
    } catch (error) {
      console.error('Error getting last check time:', error);
      return null;
    }
  }

  // Set last check time
  async setLastCheckTime(timestamp) {
    try {
      await AsyncStorage.setItem(this.lastCheckKey, timestamp.toString());
    } catch (error) {
      console.error('Error setting last check time:', error);
    }
  }

  // Clear update data (for testing)
  async clearUpdateData() {
    try {
      await AsyncStorage.multiRemove([
        this.forceUpdateKey,
        this.lastCheckKey,
        this.skipUpdateKey
      ]);
      console.log('🔍 Update data cleared');
    } catch (error) {
      console.error('Error clearing update data:', error);
    }
  }

  // Get update info for display
  async getUpdateInfo() {
    try {
      const versionInfo = await this.checkForUpdates();
      if (!versionInfo) {
        return null;
      }

      const { latestVersion, updateDescription, isForceUpdate } = versionInfo;
      const updateCheck = this.isUpdateRequired(latestVersion);
      
      if (!updateCheck.required) {
        return null;
      }

      // Check if user has skipped this version
      const hasSkipped = await this.hasSkippedVersion(latestVersion);
      
      return {
        currentVersion: this.currentVersion,
        latestVersion,
        updateDescription,
        isUpdateRequired: updateCheck.required,
        isForceUpdate: isForceUpdate || updateCheck.type === 'force',
        canSkip: !isForceUpdate && !hasSkipped && updateCheck.type === 'recommended',
        updateType: updateCheck.type
      };
    } catch (error) {
      console.error('Error getting update info:', error);
      return null;
    }
  }

  // Mock version info for testing (remove in production)
  getMockUpdateInfo() {
    return {
      currentVersion: this.currentVersion,
      latestVersion: '1.1.0',
      updateDescription: 'This update includes bug fixes, performance improvements, and new features to enhance your CHATLI experience.',
      isUpdateRequired: true,
      isForceUpdate: false,
      canSkip: true,
      updateType: 'recommended'
    };
  }
}

export default new AppUpdateService(); 