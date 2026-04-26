const mongoose = require('mongoose');

const GroupMemberSchema = new mongoose.Schema({
  group_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['Admin', 'Member'], default: 'Member' }
}, { timestamps: true });

module.exports = mongoose.model('GroupMember', GroupMemberSchema);
