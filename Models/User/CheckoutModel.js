const mongoose = require('mongoose');
const Coupon = require('../../Models/Admin/couponModel');
const Cart = require('../../Models/User/cartModel');
const User = require('../../Models/User/UserModel');
const validateCouponLogic = require('../../utils/validateCoupon');

const CheckoutSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cartId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cart', required: true },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        itemTotal: { type: Number, required: true },
        color: { type: String },
        size: { type: String },
        colorName: { type: String },
        DiscountedPrice: { type: Number, default: 0 },
        couponDiscountedValue: { type: Number, default: 0 },
        coinDiscountedValue: { type: Number, default: 0 },
        isCoupon: { type: Boolean, default: false },
      },
    ],
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },
    coinsApplied: { type: Number, default: 0 },
    subtotal: { type: Number, required: true },
    couponDiscount: { type: Number, default: 0 },
    coinDiscount: { type: Number, default: 0 },
    vendorCoinBreakdown: [{
      vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
      coinValue: { type: Number, default: 0 }
    }],
    ReducedDiscount: { type: Number, default: 0 },
    deliveryCharge: { type: Number, default: 0 },
    finalTotal: { type: Number, required: true },
    isProcessed: { type: Boolean, default: false },
    expiresAt: {
      type: Date,
      default: function () {
        return new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days
      },
      index: { expires: 0 },
    },
  },
  { timestamps: true }
);

// Pre-save middleware
CheckoutSchema.pre('save', async function (next) {
  try {
    let couponDiscount = 0;
    let vendorCoinBreakdown = {};

    const cart = await Cart.findById(this.cartId).populate('items.productId', 'price owner');
    if (!cart) throw new Error('Cart not found');

    let applicableProducts = [];

    // ===== COUPON LOGIC =====
    if (this.coupon) {
      const coupon = await Coupon.findById(this.coupon);
      if (!coupon) throw new Error('Coupon not found');

      const validation = await validateCouponLogic(coupon, { items: cart.items });
      if (!validation.valid) throw new Error(validation.errors.join(', '));

      applicableProducts = validation.applicableProducts;

      const totalApplicablePrice = applicableProducts.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      if (coupon.type === 'percentage') {
        couponDiscount = (totalApplicablePrice * coupon.value) / 100;
      } else if (coupon.type === 'flat') {
        couponDiscount = coupon.value;
      }

      const discountPerProduct = applicableProducts.length
        ? couponDiscount / applicableProducts.length
        : 0;
      this.couponDiscount = couponDiscount;

      this.items = cart.items.map((item) => {
        const isApplicable = applicableProducts.some(
          (p) => p.productId.toString() === item.productId._id.toString()
        );
        return {
          productId: item.productId._id,
          quantity: item.quantity,
          color: item.color,
          size: item.size,
          colorName: item.colorName,
          price: item.price,
          itemTotal: item.price * item.quantity,
          discountedPrice: isApplicable
            ? Math.max(item.price - discountPerProduct, 0)
            : item.price,
          couponDiscountedValue: isApplicable ? discountPerProduct : 0,
          isCoupon: isApplicable,
        };
      });
    } else {
      this.items = cart.items.map((item) => ({
        productId: item.productId._id,
        quantity: item.quantity,
        color: item.color,
        size: item.size,
        colorName: item.colorName,
        price: item.price,
        itemTotal: item.price * item.quantity,
        discountedPrice: item.price,
        couponDiscountedValue: 0,
        isCoupon: false,
      }));
    }

    // ===== COIN DISCOUNT LOGIC =====
    if (this.coinsApplied > 0) {
      const coinSettings = await mongoose.model('CoinSettings').findOne();
      if (!coinSettings) throw new Error('Coin settings not found');

      const coinValue = coinSettings.coinValue || 0.5;

      // Calculate coin discount without rounding
      const coinDiscount = this.coinsApplied * coinValue;
      this.coinDiscount = coinDiscount;

      const totalItemPrice = this.items.reduce((sum, item) => sum + item.itemTotal, 0);

      this.items = this.items.map((item) => {
        const cartItem = cart.items.find(
          (cItem) => cItem.productId._id.toString() === item.productId.toString()
        );
        const vendorId = cartItem.productId.owner.toString();

        const itemCoinDiscount = (item.itemTotal / totalItemPrice) * coinDiscount;
        const perUnitDiscount = itemCoinDiscount / item.quantity;
        const discountedPrice = Math.max(0, item.price - perUnitDiscount);

        if (!vendorCoinBreakdown[vendorId]) {
          vendorCoinBreakdown[vendorId] = 0;
        }
        vendorCoinBreakdown[vendorId] += itemCoinDiscount;

        return {
          ...item,
          coinDiscountedValue: itemCoinDiscount,
          discountedPrice: discountedPrice,
        };
      });

      this.vendorCoinBreakdown = Object.entries(vendorCoinBreakdown).map(
        ([vendorId, value]) => ({
          vendorId: new mongoose.Types.ObjectId(vendorId),
          coinValue: value, // no rounding here either
        })
      );

      this.finalTotal = Math.max(
        0,
        this.subtotal - this.couponDiscount - this.coinDiscount + this.deliveryCharge
      );
    } else {
      this.coinDiscount = 0;
      this.vendorCoinBreakdown = [];
      this.finalTotal = Math.max(
        0,
        this.subtotal - this.couponDiscount + this.deliveryCharge
      );
    }

    this.ReducedDiscount = this.couponDiscount + this.coinDiscount;
    next();
  } catch (error) {
    next(error);
  }
});

// Restore coins if order is deleted before processing
CheckoutSchema.post('findOneAndDelete', async function (doc) {
  if (!doc || doc.isProcessed) return;

  try {
    await User.findByIdAndUpdate(doc.userId, { $inc: { coins: doc.coinsApplied } });
    console.log(`Restored ${doc.coinsApplied} coins to User ${doc.userId}`);
  } catch (error) {
    console.error('Error restoring coins:', error);
  }
});

CheckoutSchema.post('deleteMany', async function (result) {
  if (result.deletedCount === 0) return;

  try {
    const deletedDocs = await this.model.find(result);
    const updates = deletedDocs
      .filter((doc) => !doc.isProcessed)
      .map((doc) => ({
        updateOne: {
          filter: { _id: doc.userId },
          update: { $inc: { coins: doc.coinsApplied } },
        },
      }));

    if (updates.length) {
      await User.bulkWrite(updates);
      console.log(`${updates.length} users had their coins restored.`);
    }
  } catch (error) {
    console.error('Error restoring coins after deleteMany:', error);
  }
});

module.exports = mongoose.model('Checkout', CheckoutSchema);
