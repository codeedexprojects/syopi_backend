const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    offerName: {
        type:String,
        required: true,
        trim: true,
        minlength: [3,'Offer name must be at least 3 characters'],
    },
    offerType: {
        type: String,
        required: true,
        enum: ['percentage', 'fixed', 'buy_one_get_one', 'free_shipping'],
    },
    amount: {
      type: Number,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    expireDate: {
      type: Date,
      required: true,
    },
    category: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: [],
    }],
    subcategory: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubCategory'
    }],
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        default: [],
    }],
    status: {
        type: String,
        default: 'active',
        enum: ['active', 'inactive', 'expired'],
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true,
    },
},{timestamps: true});

module.exports = mongoose.model('VendorOffer',offerSchema);