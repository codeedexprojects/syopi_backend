const Cart = require('../../../Models/User/cartModel');
const validateCoupon = require('../../../utils/validateCoupon'); 
const Product=require('../../../Models/Admin/productModel')


// create cart or add new product to cart
exports.createOrUpdateCart = async (req, res) => {
  const { userId, productId, quantity, color, colorName, size } = req.body;

  if (!userId || !productId || !quantity || !color || !size || !colorName) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    // Validate product existence
    const product = await Product.findById(productId).select('variants');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Validate variant existence
    const variant = product.variants.find(v => v.color === color);
    if (!variant) {
      return res.status(404).json({ success: false, message: `Variant with color ${color} ${colorName}not found` });
    }

    // Validate size existence
    const sizeDetails = variant.sizes.find(s => s.size === size);
    if (!sizeDetails) {
      return res.status(404).json({ success: false, message: `Size ${size} not found for variant with color ${color}` });
    }

    // Check stock availability
  // Show "Out of Stock" if stock is 0
  if (sizeDetails.stock === 0) {
    return res.status(400).json({ 
      success: false, 
      message: `Out of Stock for size ${size} with color ${colorName}` 
    });
  }

  // Check stock availability
  if (sizeDetails.stock < quantity) {
    return res.status(400).json({ 
      success: false, 
      message: `Only ${sizeDetails.stock} items available in stock for size ${size} with color ${colorName}`
    });
  }

    // Find or create the user's cart
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // Check if the product already exists in the cart
    const existingItemIndex = cart.items.findIndex(
      item =>
        item.productId.toString() === productId.toString() &&
        item.color === color &&
        item.size === size
    );

    if (existingItemIndex > -1) {
      // Check if updating quantity exceeds stock
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      if (newQuantity > sizeDetails.stock) {
        return res.status(400).json({ 
          success: false, 
          message: `Only ${sizeDetails.stock} items available in stock`
        });
      }

      // Update quantity for existing product in the cart
      cart.items[existingItemIndex].quantity = newQuantity;

      if (cart.items[existingItemIndex].quantity <= 0) {
        // Remove item if quantity becomes 0 or negative
        cart.items.splice(existingItemIndex, 1);
      }
    } else if (quantity > 0) {
      // Add new product to the cart
      cart.items.push({
        productId,
        quantity,
        color,
        colorName, 
        size,
      });
    } else {
      return res.status(400).json({ success: false, message: 'Quantity must be greater than zero' });
    }

    // Save the cart
    await cart.save();

    // Send updated cart response
    res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update cart',
    });
  }
};


  

// Get Cart for User
exports.getCart = async (req, res) => {
  const { userId } = req.params;

  try {
    let cart = await Cart.findOne({ userId })
      .populate('items.productId', 'name images variants offers status')
      .exec();

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    let updatedSubtotal = 0;

    // Remove items where product does not exist in DB anymore
    cart.items = cart.items.filter(item => {
      if (!item.productId || item.productId === null) {
        return false; // remove this item
      }
      return true;
    });

    for (const item of cart.items) {
      const product = item.productId;
      if (!product) continue;

      // If product inactive
      if (product.status !== "active") {
        item.status = "inactive";
        item.price = 0;
        continue;
      }

      // Match variant
      const variant = product.variants.find(v => v.color === item.color);
      if (!variant) continue;

      // Check offer
      const hasOffer = Array.isArray(product.offers) && product.offers.length > 0;
      const effectivePrice =
        hasOffer && variant.offerPrice && variant.offerPrice > 0
          ? variant.offerPrice
          : variant.price;

      item.price = effectivePrice;
      item.status = product.status;

      updatedSubtotal += item.price * item.quantity;
    }

    cart.subtotal = updatedSubtotal;
    cart.totalPrice = updatedSubtotal - (cart.discount || 0);

    await cart.save();

    res.status(200).json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get cart',
    });
  }
};


// increment or decrement quantity
exports.updateCartQuantity = async (req, res) => {
  const { userId, itemId, action } = req.body;

  if (!userId || !itemId || !action) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  if (!['increment', 'decrement'].includes(action)) {
    return res.status(400).json({ success: false, message: 'Invalid action' });
  }

  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Product not found in cart' });
    }

    // Fetch the product to check stock availability
    const product = await Product.findById(item.productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Find the variant and size to get actual stock
    const variant = product.variants.find(v => v.color === item.color);
    if (!variant) {
      return res.status(404).json({ success: false, message: 'Product variant not found' });
    }

    const sizeObj = variant.sizes.find(s => s.size === item.size);
    if (!sizeObj) {
      return res.status(404).json({ success: false, message: 'Product size not found' });
    }

    if (action === 'increment') {
      if (item.quantity + 1 > sizeObj.stock) {
        return res.status(400).json({ success: false, message: 'Insufficient stock available' });
      }
      item.quantity += 1;
    } else if (action === 'decrement') {
      item.quantity -= 1;
      if (item.quantity <= 0) {
        item.remove();
      }
    }

    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Product quantity updated successfully',
      cart,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to update product quantity', error: error.message });
  }
};




// Remove Product from Cart
exports.removeProductFromCart = async (req, res) => {
  const { userId, itemId } = req.body; // Using itemId to identify the cart item

  if (!userId || !itemId) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    // Find the user's cart
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    // Find the index of the item to remove
    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Product not found in cart' });
    }

    // Remove the item from the cart
    cart.items.splice(itemIndex, 1);

    // Save the updated cart
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Product removed from cart successfully',
      cart,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to remove product from cart' });
  }
};



// delete cart
exports.deleteCart = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ success: false, message: "User ID is required" });
  }

  try {
    const cart = await Cart.findOneAndDelete({ userId });

    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    res.status(200).json({ success: true, message: "Cart deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete cart" });
  }
};



module.exports

