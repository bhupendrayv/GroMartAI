const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/grocerio');
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log('Users in database:', JSON.stringify(users, null, 2));
    await mongoose.connection.close();
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
  }
}

checkUsers();
