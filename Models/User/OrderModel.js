const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  checkoutId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Checkout',
    required: true
  },
  razorpayOrderId: { 
    type: String,
    select: false // Hide in general queries
  },
  addressId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Address', 
    required: true 
  },
  products: [{
    productId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product', 
      required: true 
    },
    quantity: { 
      type: Number, 
      required: true,
      min: [1, 'Quantity cannot be less than 1']
    },
    price: { 
      type: Number, 
      required: true,
      min: [0, 'Price cannot be negative']
    },
    color: { type: String, required: true },
    size: { type: String, required: true },
  }],
  totalPrice: { 
    type: Number, 
    // required: true,
    min: [0, 'Total price cannot be negative'] 
  },
  deliveryCharge: { 
    type: Number, 
    default: 0 
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: {
      values: ['Cash on Delivery', 'Card', 'UPI', 'Net Banking','RazorPay'],
      message: 'Invalid payment method'
    }
  },
  trackingId: {  // Renamed from TrackId for consistency
    type: String,
    index: true
  },
  status: {
    type: String,
    default: 'Pending',
    enum: {
      values: ['Pending', 'Processing', 'In-Transit', 'Delivered', 'Cancelled', 'Returned'],
      message: 'Invalid order status'
    }
  },
  discountedAmount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative']
  },
  finalPayableAmount: {
    type: Number,
    // required: true,
    min: [0, 'Payable amount cannot be negative']
  },
  coupon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon',
  }
  
  
}, {
  timestamps: true, // Replaces manual createdAt/updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});



// Pre-save hook to populate from Checkout
orderSchema.pre('save', async function (next) {
  try {
    if (this.isNew) {
      const checkout = await mongoose.model('Checkout')
        .findById(this.checkoutId)
        .populate('items.productId')
        .lean();
        
        console.log('Checkout Items:', checkout.items);

      
      if (!checkout) {
        throw new Error('Associated checkout not found');
      }

      if (checkout.isProcessed) {
        throw new Error('Checkout has already been processed');
      }

      if (!checkout.items || !checkout.items.length) {
        throw new Error('Checkout items are missing');
      }

      this.products = checkout.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        color: item.color,
        size: item.size
      }));

      this.totalPrice = checkout.subtotal || 0;
      this.discountedAmount = checkout.ReducedDiscount || 0;
      this.deliveryCharge = this.deliveryCharge || 0;
      this.finalPayableAmount = (checkout.finalTotal || 0) + this.deliveryCharge;
      this.coupon = checkout.coupon;

      if (!this.finalPayableAmount || this.finalPayableAmount <= 0 || !this.totalPrice || this.totalPrice <= 0) {
        const error = new Error('Order validation failed: finalPayableAmount and totalPrice must be greater than 0');
        error.name = 'ValidationError';  
        throw error;
      }

      // Mark checkout as processed
      await mongoose.model('Checkout').findByIdAndUpdate(
        this.checkoutId,
        { isProcessed: true }
      );

   

    }

    next();
  } catch (error) {
    next(error);
  }
});



// Indexes for frequent queries
orderSchema.index({ userId: 1, status: 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;