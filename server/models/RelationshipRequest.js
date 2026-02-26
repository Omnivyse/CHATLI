const mongoose = require('mongoose');

const relationshipRequestSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// One pending request per sender (from)
relationshipRequestSchema.index({ from: 1, status: 1 });
relationshipRequestSchema.index({ to: 1, status: 1 });

module.exports = mongoose.model('RelationshipRequest', relationshipRequestSchema);
