const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: String, default: '1' },
  category: { 
    type: String, 
    required: true,
    enum: ['Vegetables', 'Fruits', 'Dairy', 'Meat', 'Bakery', 'Snacks', 'Beverages', 'Other'],
    default: 'Other'
  },
  purchased: { type: Boolean, default: false }, 
  billed: { type: Boolean, default: false },
  price: { type: Number, default: 0 },
  list_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ShoppingList', required: true },
  added_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Item', ItemSchema);
