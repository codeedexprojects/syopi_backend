const mongoose = require("mongoose");

const DeliverySettingSchema = new mongoose.Schema({
    minAmountForFreeDelivery: { type: Number, required: true },
    deliveryCharge: { type: Number, required: true },
});

module.exports = mongoose.model("DeliverySetting", DeliverySettingSchema);
