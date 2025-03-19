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
    description: {
        type: String,
    },
},
{ timestamps: true });

const brand = mongoose.model('Brand', brandSchema);
module.exports = brand