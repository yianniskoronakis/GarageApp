const mongoose = require('mongoose');

const garageSchema = new mongoose.Schema({
  price: { type: Number, required: true },
  address: { type: String, required: true },
  squaremeter:{type: Number, required: true},
  garagetype:{type: Boolean, required: true},
  maxheight:{type: Number, required: false},
  description:{type: String, required: false},
  latitude: { type: Number, required: true},  
  longitude: { type: Number, required: true }, 
  photos: { type: [String], required: true },
  availableHours: [String],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const Garage = mongoose.model('Garage', garageSchema);
module.exports = Garage;