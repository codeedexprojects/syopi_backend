const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
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
        ref: 'role'
    },
    image: {
        type: String,
        required: true,
    },
    link: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                return /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w.-]*)*\/?$/.test(v);
            }
        }
    },
    isActive: {
        type: Boolean,
        default: true,
    }
}, { timestamps: true });

// Prevent OverwriteModelError
const Banner = mongoose.models.Banner || mongoose.model('Banner', bannerSchema);

module.exports = Banner;
