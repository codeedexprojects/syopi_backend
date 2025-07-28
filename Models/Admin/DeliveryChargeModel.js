const mongoose = require("mongoose");

const DeliverySettingSchema = new mongoose.Schema({
  minAmountForCharge: { type: Number, required: true, default: 1000 }, 
  deliveryCharge: { type: Number, required: true, default: 40 },       
});

module.exports = mongoose.model("DeliverySetting", DeliverySettingSchema);
