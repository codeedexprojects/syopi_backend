const Product = require('../../../Models/Admin/productModel');
const Checkout = require('../../../Models/User/CheckoutModel')
const Cart = require('../../../Models/User/cartModel')
const Coupon = require('../../../Models/Admin/couponModel')
const User=require('../../../Models/User/UserModel')
const mongoose=require('mongoose')
const CoinSettings = require("../../../Models/Admin/CoinModel");
const DeliverySetting = require('../../../Models/Admin/DeliveryChargeModel')

// create checkout
exports.createCheckout = async (req, res) => {
    const { cartId } = req.body;
    // console.log(cartId)
    const userId=req.user.id
    try {
        if (!userId || !cartId) {
            return res.status(400).json({ message: 'User ID and Cart ID are required.' });
        }
        const cart = await Cart.findById(cartId).populate('items.productId');
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found.' });
        }
        if (String(cart.userId) !== userId) {
            return res.status(403).json({ message: 'Unauthorized: Cart does not belong to the user.' });
        }
         // Fetch delivery settings from admin
         const deliverySetting = await DeliverySetting.findOne();
         if (!deliverySetting) {
             return res.status(500).json({ message: "Delivery settings not found" });
         }
          // Calculate subtotal
        const subtotal = cart.subtotal;

        // Determine delivery charge based on minAmountForFreeDelivery
        const deliveryCharge = subtotal >= deliverySetting.minAmountForFreeDelivery ? 0 : deliverySetting.deliveryCharge;

        // Final total = Subtotal + Delivery Charge
        const finalTotal = subtotal + deliveryCharge;

        const newCheckout = new Checkout({
            userId,
            cartId,
            subtotal,
            deliveryCharge,
            finalTotal
        });
        await newCheckout.save();
        res.status(201).json({
            message: 'Checkout created successfully.',
            checkout: newCheckout,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Internal server error.',
            error: error.message || error,
        });
    }
};


exports.createBuyNowCheckout = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      productId, quantity, color, size, colorName,
      price
    } = req.body;

    const product = await Product.findById(productId)
    if (!product) return res.status(404).json({ message: 'Product not found' });


    const itemTotal = price * quantity;
        // Fetch delivery settings from admin
        const deliverySetting = await DeliverySetting.findOne();
        if (!deliverySetting) {
            return res.status(500).json({ message: "Delivery settings not found" });
        }
        // Calculate subtotal
        const subtotal =itemTotal

        // Determine delivery charge based on minAmountForFreeDelivery
        const deliveryCharge = subtotal >= deliverySetting.minAmountForFreeDelivery ? 0 : deliverySetting.deliveryCharge;

        // Final total = Subtotal + Delivery Charge
        const finalTotal = subtotal + deliveryCharge;
    // Create a dummy cart document to make your pre-save hook logic work
    const dummyCart = await new Cart({
      userId,
      items: [{
        productId: product._id,
        quantity,
        color,
        size,
        colorName
      }]
    }).save();

    const checkout = new Checkout({
      userId,
      cartId: dummyCart._id,
      subtotal,
      deliveryCharge: 0, // Optional or calculate if needed
      items: [], // Will be filled by pre-save logic
      finalTotal // Will be recalculated in pre-save
    });

    await checkout.save(); // Triggers your pre-save logic

    res.status(201).json({ checkout: checkout });

  } catch (err) {
    console.error('Buy Now Checkout Error:', err);
    // res.status(500).json({ message: 'Failed to create Buy Now checkout' });
    res.status(500).json({
        updatedMessage: 'Failed to create Buy Now checkout',
        error: err.message,
      });
  }
};


//get Checkout
exports.getCheckout = async (req, res) => {
    const { checkoutId } = req.params;

    try {
        if (!checkoutId) {
            return res.status(400).json({ message: 'Checkout ID is required' });
        }

        // Find the checkout and ensure it belongs to the logged-in user
        const userCheckout = await Checkout.findById(checkoutId).populate('items.productId', 'name images category').populate('coupon')
        console.log(userCheckout)

        if (!userCheckout) {
            return res.status(404).json({ message: 'Checkout not found' });
        }
        console.log(req.user.id)
        // Validate that the checkout belongs to the logged-in user
        if (userCheckout.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'You are not authorized to access this checkout' });
        }

        res.status(200).json(userCheckout);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// delete checkout
exports.deleteCheckout = async (req, res) => {
    const { checkoutId } = req.params;

    try {
        if (!checkoutId) {
            return res.status(400).json({ message: 'Checkout ID is required' });
        }

        // Find the checkout document
        const userCheckout = await Checkout.findById(checkoutId);

        if (!userCheckout) {
            return res.status(404).json({ message: 'Checkout not found' });
        }

        // Validate that the logged-in user is the owner of the checkout
        if (userCheckout.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'You are not authorized to delete this checkout' });
        }

        // Delete the checkout
        await Checkout.findByIdAndDelete(checkoutId);

        res.status(200).json({ message: 'Checkout deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// apply coupon
exports.applyCoupon = async (req, res) => {
    const { checkoutId, couponCode } = req.body;
    const userId = req.user.id
    try {
        // Validate required fields
        if (!userId || !checkoutId || !couponCode) {
            return res.status(400).json({ message: 'User ID, Checkout ID, and Coupon code are required.' });
        }

        // Fetch the checkout document
        const checkout = await Checkout.findById(checkoutId);
        if (!checkout) {
            return res.status(404).json({ message: 'Checkout not found.' });
        }

        // Check if the checkout belongs to the user
        if (String(checkout.userId) !== userId) {
            return res.status(403).json({ message: 'Unauthorized: Checkout does not belong to the user.' });
        }

        // Fetch the coupon
        const coupon = await Coupon.findOne({ code: couponCode });
        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found.' });
        }

        //   const updatedcheckout = await Checkout.findByIdAndUpdate(
        //     checkoutId, 
        //     { coupon: couponId }, 
        //     { new: true }
        //   );

        checkout.coupon = coupon._id
        await checkout.save()

        res.status(200).json({
            message: 'Coupon applied successfully.',
            checkout,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Internal server error.',
            error: error.message || error,
        });
    }
};

// get available coupons
exports.getAvailableCoupons = async(req,res) => {
    const {checkoutId} = req.params;
    try {
        if (!checkoutId) {
            return res.status(400).json({ message: 'Checkout ID is required' });
        }

        // Fetch checkout details
        const checkout = await Checkout.findById(checkoutId).populate('items.productId');

        if (!checkout) {
            return res.status(404).json({ message: 'Checkout not found' });
        }

        const products = checkout.items.map((item) => item.productId);

        // Extract product details
        const productIds = products.map(product => product._id);
        const categoryIds = products.map(product => product.category);
        const subcategoryIds = products.map(product => product.subcategory);
        const ownerId = products.map(product => product.owner);




        const coupons = await Coupon.find({
            $and: [
                { createdBy: { $in: ownerId } },
                {
                    $or: [
                        { applicableCategories: { $in: categoryIds } },
                        { applicableSubcategories: { $in: subcategoryIds } },
                        { applicableProducts: { $in: productIds } },
                    ],
                },

            ],
            status: 'active',
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() },
        });

        if(!coupons || coupons.length === 0){
            return res.status(404).json({ message: "No avaliable coupons" })
        }

        // Convert startDate and endDate to standard date format (YYYY-MM-DD)
        const formattedCoupons = coupons.map((coupon) => ({
        ...coupon.toObject(), // Convert Mongoose document to plain JavaScript object
        startDate: coupon.startDate.toISOString().split('T')[0].split('-').reverse().join('-'), // Format: YYYY-MM-DD
        endDate: coupon.endDate.toISOString().split('T')[0].split('-').reverse().join('-'), // Format: YYYY-MM-DD
        }));
        
        return res.status(200).json({
            message: 'Available coupons fetched successfully',
            total: formattedCoupons.length,
            coupons: formattedCoupons,
        });
    } catch (error) {
        return res.status(500).json({ message: 'Internal Server Error', error:error.message });
    }
}

// apply coins
exports.applyCoins = async (req, res) => {
    // const { checkoutId, coins } = req.body;
    const { checkoutId } = req.body;
    const userId = req.user.id;

    try {
        // Validate required fields
        if (!userId || !checkoutId ) {
            return res.status(400).json({ message: 'User ID, Checkout ID are required.' });
        }

        // Fetch the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Fetch the checkout document
        const checkout = await Checkout.findById(checkoutId);
        if (!checkout) {
            return res.status(404).json({ message: 'Checkout not found.' });
        }
        
        // Check if the checkout belongs to the user
        if (String(checkout.userId) !== userId) {
            return res.status(403).json({ message: 'Unauthorized: Checkout does not belong to the user.' });
        }

         //fetch the coin details
         const coin=await CoinSettings.findOne()
         if (!coin) {
            return res.status(500).json({ message: 'Coin settings not found.' });
        }

        // Check if subtotal meets the minimum amount to apply coins
         if(checkout.subtotal<coin.minAmount){
            return res.status(400).json({ message: `Coins can only be applied for orders above ₹${coin.minAmount}.` });

         }

         // Determine maximum coins that can be applied
        const maxCoinsApplicable = Math.min(user.coins, checkout.finalTotal);

        if (maxCoinsApplicable <= 0) {
            return res.status(400).json({ message: 'No coins can be applied.' });
        }

        // Apply coins to checkout
        checkout.coinsApplied = maxCoinsApplicable;

        // Save checkout and deduct coins in a **transaction**
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            await checkout.save({ session });

            // Deduct coins from user
            user.coins -= maxCoinsApplicable;
            await user.save({ session });

            // Commit transaction
            await session.commitTransaction();
            session.endSession();

            res.status(200).json({
                message: `₹${maxCoinsApplicable} worth of coins applied successfully.`,
                checkout,
                remainingCoins: user.coins,
            });
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Internal server error.',
            error: error.message || error,
        });
    }
};
