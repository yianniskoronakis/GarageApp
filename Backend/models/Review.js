const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  garage: { type: mongoose.Schema.Types.ObjectId, ref: 'Garage', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true },
  comment: { type: String },
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
