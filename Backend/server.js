const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
require('dotenv').config();  // Φορτώνουμε τις μεταβλητές από το .env αρχείο

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/garageapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('MongoDB connected');
});

// Εισάγουμε το router από το auth.js σωστά
const { router: authRoutes } = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Εισάγουμε το router από το garage.js
const { router: garageRoutes } = require('./routes/garage');
app.use('/api/garages', garageRoutes);

// Σημείο που επιτρέπει την πρόσβαση στις εικόνες
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
