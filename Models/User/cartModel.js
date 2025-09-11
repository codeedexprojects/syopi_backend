const mongoose = require('mongoose');
const validateCoupon  = require('../../utils/validateCoupon'); // Your coupon validator function
const Product=require('../../Models/Admin/productModel')

const CartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' ,required: [true, "User ID is required"]},
  items: [ {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, "Product ID is required"]
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity cannot be less than 1"]
    },
    price: {
      type: Number,
      
    },
    color: {
      type: String,
      required: [true, "Color is required"]
    },
    size: {
      type: String,
      required: [true, "Size is required"]
    },
    colorName:{
      type:String,
      required: [true, "colorName is required"]
    },
  

  }],
 
  subtotal:{type: Number, default: 0},
  discount: { type: Number, default: 0 },
  totalPrice: { type: Number, default: 0 },
  
},{timestamps:true});

CartSchema.pre('save', async function (next) {
  try {
    let subtotal = 0;

    for (const item of this.items) {
      // Fetch the product details
      const product = await Product.findById(item.productId).select('variants offers');
      if (!product) {
        throw new Error(`Product with ID ${item.productId} not found`);
      }

      // Find the matching variant by color
      const variant = product.variants.find(v => v.color === item.color);
      if (!variant) {
        throw new Error(`Variant with color '${item.color}' not found for product ID ${item.productId}`);
      }

      // Find the matching size details within the variant
      const sizeDetails = variant.sizes.find(s => s.size === item.size);
      if (!sizeDetails) {
        throw new Error(`Size '${item.size}' not found for product ID ${item.productId} with color '${item.color}'`);
      }

      // Determine the price based on offer availability
      if (product.offers && product.offers.length > 0 && variant.offerPrice && variant.offerPrice > 0) {
        item.price = variant.offerPrice;
      } else {
        item.price = variant.price;
      }

      // Calculate subtotal for this item
      subtotal += item.price * item.quantity;
    }

    // Update cart totals
    this.subtotal = subtotal;
    this.totalPrice = subtotal;

    next();
  } catch (error) {
    next(error);
  }
});




const Cart = mongoose.model('Cart', CartSchema);
module.exports = Cart;
