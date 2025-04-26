const mongoose = require('mongoose');

const sliderSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        required: true
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    offerIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Offer',
    }],
    offerType: {
        type: String,
        enum: ['productOffer', 'subcategoryOffer', 'brandOffer'],
        required: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    }
}, { timestamps: true });

module.exports = mongoose.model('Slider', sliderSchema);
