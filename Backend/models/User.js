
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  firstname: { type: String },
  lastname: { type: String },
  likedGarages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Garage' }] 
});

module.exports = mongoose.model('User', UserSchema);
