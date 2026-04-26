const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const authController = require('./controllers/authController');
const itemController = require('./controllers/itemController');
const listController = require('./controllers/listController');
const receiptController = require('./controllers/receiptController');
const auth = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/grocerio')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Auth routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);

// List routes
app.get('/api/lists', auth, listController.getLists);
app.post('/api/lists', auth, listController.createList);
app.put('/api/lists/:id', auth, listController.updateList);

// Item routes
app.get('/api/items', auth, itemController.getItems);
app.post('/api/items', auth, itemController.addItem);
app.post('/api/items/bulk', auth, itemController.addItemBulk);
app.put('/api/items/:id', auth, itemController.updateItem);
app.delete('/api/items/:id', auth, itemController.deleteItem);

// Receipt routes
app.get('/api/receipts', auth, receiptController.getReceipts);
app.post('/api/receipts', auth, receiptController.saveReceipt);
app.get('/api/receipts/:billNumber', auth, receiptController.getReceiptByCode);

// SSE route
app.get('/api/events', auth, itemController.eventsHandler);

// Payment route
app.post('/api/payment/create-checkout-session', auth, async (req, res) => {
  try {
    const { total, listId } = req.body;
    
    // Create a Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: 'Grocery Order',
            },
            unit_amount: Math.round(total * 100), // convert to paise
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `http://localhost:5173/?payment_success=true&listId=${listId}`,
      cancel_url: `http://localhost:5173/`,
    });

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// Status check (DB)
app.get('/api/status', (req, res) => {
  res.json({ 
    server: 'running', 
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' 
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
