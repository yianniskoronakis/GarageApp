const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const cron = require('node-cron'); 
require('dotenv').config();  

const Garage = require('./models/Garage');  
const Reservation = require('./models/Reservation');  

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/garageapp')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));


const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('MongoDB connected');
});


const { router: authRoutes } = require('./routes/auth');
app.use('/api/auth', authRoutes);


const { router: garageRoutes } = require('./routes/garage');
app.use('/api/garages', garageRoutes);

const reservationRoutes = require('./routes/reservation');
app.use('/api/reservations', reservationRoutes);

const reviewRoutes = require('./routes/review');
app.use('/api/review', reviewRoutes);

const reportRoutes = require('./routes/report');
app.use('/api/report', reportRoutes);



app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



cron.schedule('1 0 * * * *', async () => {
  try {
    const currentTime = new Date();
    const currentHour = `${currentTime.getHours().toString().padStart(2, '0')}:00`;

    const garages = await Garage.find();
    for (const garage of garages) {
      if (garage.availableHours) {
        garage.availableHours = garage.availableHours.filter(hour => hour >= currentHour);
        await garage.save();
      }
    }

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
