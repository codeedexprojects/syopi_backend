const mongoose = require('mongoose');

const deletedUserSchema = new mongoose.Schema({
  phone: String,
  email: String,
  referralCode: String,
  deletedAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('DeletedUser', deletedUserSchema);
