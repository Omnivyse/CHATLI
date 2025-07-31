const mongoose = require('mongoose');

const privacySettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  isPrivateAccount: {
    type: Boolean,
    default: false
  },
  showProfileInSearch: {
    type: Boolean,
    default: true
  },
  allowMessagesFromStrangers: {
    type: Boolean,
    default: true
  },
  showOnlineStatus: {
    type: Boolean,
    default: true
  },
  showLastSeen: {
    type: Boolean,
    default: true
  },
  allowProfileViews: {
    type: Boolean,
    default: true
  },
  allowPostComments: {
    type: Boolean,
    default: true
  },
  allowEventInvites: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PrivacySettings', privacySettingsSchema); 