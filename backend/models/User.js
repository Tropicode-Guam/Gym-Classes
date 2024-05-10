const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Define your user schema fields here
  name: { type: String, required: true },
  phone: { type: String, required: true },
  insurance: { type: String },
  // Add more fields as needed
});

const User = mongoose.model('User', userSchema);

module.exports = User;
