const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
  group_name: { type: String, required: true },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Group', GroupSchema);
