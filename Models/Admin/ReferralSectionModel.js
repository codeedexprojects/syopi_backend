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
    }
}, { timestamps: true });

module.exports = mongoose.model("ReferralSection", ReferralSectionSchema);
