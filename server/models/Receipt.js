const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
  billNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  list_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ShoppingList',
    required: true
  },
  listName: {
    type: String,
    required: true
  },
  items: [{
    name: String,
    quantity: String,
    category: String,
    price: Number
  }],
  subtotal: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['Cash on Delivery', 'Online Payment'],
    default: 'Cash on Delivery'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Receipt', receiptSchema);
