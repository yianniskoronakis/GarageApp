const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  garage: { type: mongoose.Schema.Types.ObjectId, ref: 'Garage', required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Report = mongoose.model('Report', reportSchema);
module.exports = Report;
