const mongoose = require('mongoose'); 

const brandSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        unique: true, 
        index: true 
    },
    logo: {
        type: String, 
        required: true,
    },
    image: {
        type: String, 
        required: false,
    },
    description: {
        type: String,
    },
    discount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Offer',
        required: false,
    }
},
{ timestamps: true });

const Brand = mongoose.model('Brand', brandSchema);
module.exports = Brand;
