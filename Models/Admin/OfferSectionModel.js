const mongoose = require("mongoose");

const ReferralSectionSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    trim: true,
  },
  title: {
    type: String,
    required: true,
  },
  coin: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: "CoinSettings",  
  },
}, { timestamps: true });

module.exports = mongoose.model("ReferralSection", ReferralSectionSchema);
