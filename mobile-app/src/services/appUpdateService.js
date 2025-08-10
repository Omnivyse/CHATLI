import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

class AppUpdateService {
  constructor() {
    // Get current version from app.json
    this.currentVersion = Constants.expoConfig?.version || '1.1.4';
    this.buildNumber = Platform.OS === 'ios' 
      ? Constants.expoConfig?.ios?.buildNumber || '16'
      : Constants.expoConfig?.android?.versionCode || '9';
    
    // App Store URLs (replace with your actual URLs)
    this.appStoreUrl = 'https://apps.apple.com/app/chatli/id6749570514'; // Updated with actual App Store ID
    this.playStoreUrl = 'https://play.google.com/store/apps/details?id=com.chatli.mobile';
    
    // Update check settings
    this.updateCheckInterval = 24 * 60 * 60 * 1000; // 24 hours
    this.forceUpdateKey = 'forceUpdateVersion';
    this.lastCheckKey = 'lastUpdateCheck';
    this.skipUpdateKey = 'skipUpdateVersion';
    this.updateShownKey = 'updateShownForVersion';
    
    // TestFlight detection
    this.isTestFlight = this.detectTestFlight();
    
    console.log('🔍 AppUpdateService initialized:', {
      currentVersion: this.currentVersion,
      buildNumber: this.buildNumber,
      platform: Platform.OS,
      isTestFlight: this.isTestFlight,
      isDevelopment: __DEV__
    });
  }

  // Detect if this is a TestFlight build
  detectTestFlight() {
    if (Platform.OS !== 'ios') return false;
    
    // Check if this is a TestFlight build
    // TestFlight builds have specific characteristics
    const isTestFlightBuild = !__DEV__ && Platform.OS === 'ios';
    
    console.log('🔍 TestFlight detection:', {
      isDev: __DEV__,
      platform: Platform.OS,
      isTestFlightBuild
    });
    
    return isTestFlightBuild;
  }

  // Get current app version
  getCurrentVersion() {
    return {
      version: this.currentVersion,
      buildNumber: this.buildNumber,
      platform: Platform.OS,
      isTestFlight: this.isTestFlight
    };
  }

  // Check if update is required by comparing versions
  isUpdateRequired(latestVersion, currentVersion = this.currentVersion) {
    try {
      const current = this.parseVersion(currentVersion);
      const latest = this.parseVersion(latestVersion);
      
      console.log('🔍 Version comparison:', {
        current,
        latest,
        currentVersion,
        latestVersion
      });
      
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
      
      // For TestFlight builds, we'll use a different approach
      if (this.isTestFlight) {
        console.log('🔍 TestFlight build detected, using TestFlight update logic');
        return await this.checkTestFlightUpdates();
      }
      
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

  // Special update check for TestFlight builds
  async checkTestFlightUpdates() {
    try {
      console.log('🔍 Checking TestFlight updates...');
      
      // For TestFlight, we'll check if we should show an update introduction
      // This could be based on build number, version, or a remote flag
      
      // Check if we've already shown the update for this version
      const updateShown = await this.hasShownUpdateForVersion(this.currentVersion);
      
      if (updateShown) {
        console.log('🔍 Update already shown for version:', this.currentVersion);
        return null;
      }
      
      // For TestFlight, we'll create a mock update to show the introduction
      // In a real scenario, you might fetch this from your backend
      const testFlightUpdateInfo = {
        currentVersion: this.currentVersion,
        latestVersion: this.currentVersion, // Same version for introduction
        updateDescription: 'Welcome to the latest CHATLI update! This version includes bug fixes, performance improvements, and new features to enhance your messaging experience.',
        isUpdateRequired: false, // Not required, just informational
        isForceUpdate: false,
        canSkip: true,
        updateType: 'introduction',
        isTestFlight: true
      };
      
      console.log('🔍 TestFlight update info created:', testFlightUpdateInfo);
      
      // Mark that we've shown this update
      await this.markUpdateShownForVersion(this.currentVersion);
      
      return testFlightUpdateInfo;
    } catch (error) {
      console.error('Error checking TestFlight updates:', error);
      return null;
    }
  }

  // Check if we've shown the update introduction for a specific version
  async hasShownUpdateForVersion(version) {
    try {
      const shownVersion = await AsyncStorage.getItem(this.updateShownKey);
      return shownVersion === version;
    } catch (error) {
      console.error('Error checking shown update version:', error);
      return false;
    }
  }

  // Mark that we've shown the update for a specific version
  async markUpdateShownForVersion(version) {
    try {
      await AsyncStorage.setItem(this.updateShownKey, version);
      console.log('🔍 Marked update as shown for version:', version);
    } catch (error) {
      console.error('Error marking update as shown:', error);
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
        this.skipUpdateKey,
        this.updateShownKey
      ]);
      console.log('🔍 Update data cleared');
    } catch (error) {
      console.error('Error clearing update data:', error);
    }
  }

  // Get update info for display
  async getUpdateInfo() {
    try {
      console.log('🔍 Getting update info...');
      console.log('🔍 Environment:', {
        isDev: __DEV__,
        isTestFlight: this.isTestFlight,
        platform: Platform.OS
      });
      
      let versionInfo;
      
      if (this.isTestFlight) {
        console.log('🔍 Using TestFlight update logic');
        versionInfo = await this.checkTestFlightUpdates();
      } else {
        console.log('🔍 Using regular update logic');
        versionInfo = await this.checkForUpdates();
      }
      
      if (!versionInfo) {
        console.log('🔍 No version info available');
        return null;
      }

      const { latestVersion, updateDescription, isForceUpdate } = versionInfo;
      const updateCheck = this.isUpdateRequired(latestVersion);
      
      console.log('🔍 Update check result:', updateCheck);
      
      if (!updateCheck.required && !versionInfo.isTestFlight) {
        console.log('🔍 No update required');
        return null;
      }

      // Check if user has skipped this version
      const hasSkipped = await this.hasSkippedVersion(latestVersion);
      
      const updateInfo = {
        currentVersion: this.currentVersion,
        latestVersion,
        updateDescription,
        isUpdateRequired: updateCheck.required || versionInfo.isTestFlight,
        isForceUpdate: isForceUpdate || updateCheck.type === 'force',
        canSkip: !isForceUpdate && !hasSkipped && (updateCheck.type === 'recommended' || versionInfo.isTestFlight),
        updateType: updateCheck.type || 'introduction',
        isTestFlight: versionInfo.isTestFlight || false
      };
      
      console.log('🔍 Final update info:', updateInfo);
      return updateInfo;
    } catch (error) {
      console.error('Error getting update info:', error);
      return null;
    }
  }

  // Get mock update info for testing
  getMockUpdateInfo() {
    return {
      currentVersion: this.currentVersion,
      latestVersion: '1.1.5',
      updateDescription: 'This is a mock update for testing purposes. In production, this would come from your backend API.',
      isUpdateRequired: true,
      isForceUpdate: false,
      canSkip: true,
      updateType: 'recommended',
      isTestFlight: false
    };
  }
}

export default new AppUpdateService(); 