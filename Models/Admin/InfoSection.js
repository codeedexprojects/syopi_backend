const mongoose = require("mongoose");

const InfoSectionSchema = new mongoose.Schema({
  image: { type: String, required: true },
  description: { type: String, trim: true, required: true },
  referralId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ReferralSection", 
    required: true
  }

}, { timestamps: true });

module.exports = mongoose.model("InfoSection", InfoSectionSchema);
