const mongoose = require("mongoose");

const TopSaleSectionSchema = new mongoose.Schema({
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
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',  // Referencing the Category model
        required: true
    },
    subcategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subcategory',  // Referencing the Subcategory model
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model("TopSaleSection", TopSaleSectionSchema);
