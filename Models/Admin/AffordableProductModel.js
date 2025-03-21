const mongoose = require("mongoose");

const AffordableProductsSchema = new mongoose.Schema({
    image: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        trim: true,
    },
    affordablePrice: {
        type: Number,
        required: true,
        min: 0
    }
}, { timestamps: true });

module.exports = mongoose.model("AffordableProducts", AffordableProductsSchema);
