const express = require('express');
const router = express.Router();

// App version information
const appVersions = {
  ios: {
    latestVersion: '1.1.0',
    minimumVersion: '1.0.0',
    forceUpdateVersion: '1.0.0', // Versions below this require force update
    updateDescription: 'This update includes bug fixes, performance improvements, and new features to enhance your CHATLI experience.',
    isForceUpdate: false,
    appStoreUrl: 'https://apps.apple.com/app/chatli/id1234567890' // Replace with your actual App Store ID
  },
  android: {
    latestVersion: '1.1.0',
    minimumVersion: '1.0.0',
    forceUpdateVersion: '1.0.0',
    updateDescription: 'This update includes bug fixes, performance improvements, and new features to enhance your CHATLI experience.',
    isForceUpdate: false,
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.chatli.mobile'
  }
};

// Get app version information
router.get('/version', (req, res) => {
  try {
    const platform = req.query.platform || 'ios'; // Default to iOS
    const currentVersion = req.query.currentVersion || '1.0.9';
    
    const versionInfo = appVersions[platform] || appVersions.ios;
    
    // Check if update is required
    const isUpdateRequired = compareVersions(versionInfo.latestVersion, currentVersion) > 0;
    const isForceUpdate = compareVersions(versionInfo.forceUpdateVersion, currentVersion) > 0;
    
    res.json({
      success: true,
      data: {
        latestVersion: versionInfo.latestVersion,
        minimumVersion: versionInfo.minimumVersion,
        updateDescription: versionInfo.updateDescription,
        isUpdateRequired,
        isForceUpdate,
        storeUrl: platform === 'ios' ? versionInfo.appStoreUrl : versionInfo.playStoreUrl,
        platform
      }
    });
  } catch (error) {
    console.error('Error getting app version:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get app version information'
    });
  }
});

// Update app version information (admin only)
router.put('/version', (req, res) => {
  try {
    const { platform, latestVersion, minimumVersion, forceUpdateVersion, updateDescription, isForceUpdate } = req.body;
    
    if (!platform || !latestVersion) {
      return res.status(400).json({
        success: false,
        message: 'Platform and latest version are required'
      });
    }
    
    if (!appVersions[platform]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid platform'
      });
    }
    
    // Update version information
    appVersions[platform] = {
      ...appVersions[platform],
      latestVersion,
      minimumVersion: minimumVersion || appVersions[platform].minimumVersion,
      forceUpdateVersion: forceUpdateVersion || appVersions[platform].forceUpdateVersion,
      updateDescription: updateDescription || appVersions[platform].updateDescription,
      isForceUpdate: isForceUpdate || false
    };
    
    console.log(`App version updated for ${platform}:`, appVersions[platform]);
    
    res.json({
      success: true,
      message: 'App version updated successfully',
      data: appVersions[platform]
    });
  } catch (error) {
    console.error('Error updating app version:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update app version'
    });
  }
});

// Get app status
router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'online',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  });
});

// Helper function to compare versions
function compareVersions(version1, version2) {
  const v1 = version1.split('.').map(Number);
  const v2 = version2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
    const num1 = v1[i] || 0;
    const num2 = v2[i] || 0;
    
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  
  return 0;
}

module.exports = router; 