const mongoose = require("mongoose");

const LowestProductsSchema = new mongoose.Schema({
    image: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        trim: true,
    },
    startingPrice: {
        type: Number,
        required: true,
        min: 0
    }
}, { timestamps: true });

module.exports = mongoose.model("LowestProducts", LowestProductsSchema);
