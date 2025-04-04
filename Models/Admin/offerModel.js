const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema(
  {
    offerName: {
      type: String,
      required: true,
      trim: true,
      minlength: [3, 'Offer name must be at least 3 characters'],
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
      ref: 'SubCategory',
      default: [],
    }],
    products: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: [],
    }],
    brands: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      default: [],
    }],
    status: {
      type: String,
      default: 'active',
      enum: ['active', 'inactive', 'expired'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "ownerType",
      // required: true, // Unique admin or vendor creating the offer
    },
    ownerType: {
      type: String,
      enum: ['admin', 'vendor'], // Explicitly distinguish admin vs. vendor
    },
    ownerId: { 
       type: mongoose.Schema.Types.ObjectId,
       refPath: "ownerType",
    },
  },
  { timestamps: true } 
);

module.exports = mongoose.model('Offer', offerSchema);
