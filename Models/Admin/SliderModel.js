const mongoose = require('mongoose');

const sliderSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        required: true,
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    productIds: [  
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        }
    ],
    isActive: {
        type: Boolean,
        default: true,
    }
}, { timestamps: true });

module.exports = mongoose.model('Slider', sliderSchema);
