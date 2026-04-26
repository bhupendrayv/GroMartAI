const mongoose = require('mongoose');

const ShoppingListSchema = new mongoose.Schema({
  list_name: { type: String, required: true },
  group_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  budget: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('ShoppingList', ShoppingListSchema);
