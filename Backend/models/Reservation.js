const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
    garage: { type: mongoose.Schema.Types.ObjectId, ref: 'Garage', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startHour: { type: String, required: true }, 
    endHour: { type: String, required: true }, 
    status: { type: String, default: 'active' }
});

const Reservation = mongoose.model('Reservation', reservationSchema);
module.exports = Reservation;
