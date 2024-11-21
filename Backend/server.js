const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const cron = require('node-cron'); // Προσθήκη του cron
require('dotenv').config();  // Φορτώνουμε τις μεταβλητές από το .env αρχείο

const Garage = require('./models/Garage');  // Εισαγωγή του μοντέλου Garage
const Reservation = require('./models/Reservation');  // Εισαγωγή του μοντέλου Reservation

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

const reservationRoutes = require('./routes/reservation');
app.use('/api/reservations', reservationRoutes);

const reviewRoutes = require('./routes/review');
app.use('/api/review', reviewRoutes);

const reportRoutes = require('./routes/report');
app.use('/api/report', reportRoutes);


// Σημείο που επιτρέπει την πρόσβαση στις εικόνες
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Προσθήκη cron job που τρέχει κάθε ώρα και ένα δευτερόλεπτο
cron.schedule('1 0 * * * *', async () => {
  try {
    const currentTime = new Date();
    const currentHour = `${currentTime.getHours().toString().padStart(2, '0')}:00`;

    // Διαγραφή παρελθοντικών ωρών από τα διαθέσιμα slots των γκαράζ
    const garages = await Garage.find();
    for (const garage of garages) {
      if (garage.availableHours) {
        garage.availableHours = garage.availableHours.filter(hour => hour >= currentHour);
        await garage.save();
      }
    }

    // Διαγραφή κρατήσεων που έχουν παρέλθει
    await Reservation.deleteMany({ 
      endHour: { $lt: currentHour }, 
      status: 'active' 
    });

    console.log('Successfully cleaned up old slots and reservations at', currentTime);

  } catch (error) {
    console.error('Error in cleaning up old slots and reservations:', error);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
