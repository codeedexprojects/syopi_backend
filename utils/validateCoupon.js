const Product = require('../Models/Admin/productModel');

const validateCouponLogic = async (coupon, checkout) => {
    const now = new Date();

    // Basic coupon validation
    if (coupon.status !== 'active') return { valid: false, errors: ['Coupon is inactive or invalid'] };
    if (now < coupon.startDate) return { valid: false, errors: ['Coupon is not yet valid'] };
    if (now > coupon.endDate) return { valid: false, errors: ['Coupon has expired'] };

    const { applicableCategories = [], applicableSubcategories = [], applicableProducts = [] } = coupon;

    // Determine if this is a global coupon
    const isGlobalCoupon = applicableCategories.length === 0 && applicableSubcategories.length === 0 && applicableProducts.length === 0;

    let applicableProductsList = [];

    // Iterate through checkout items to find applicable products
    for (const item of checkout.items) {
        const product = await Product.findById(item.productId).select('category subcategory owner');
        if (!product) return { valid: false, errors: [`Product with ID ${item.productId} does not exist`] };

        let matches = false;

        if (isGlobalCoupon) {
            matches = true; // Global coupon applies to all products
        } else {
            // Check if the product owner matches the coupon creator
            if (coupon.createdBy.toString() !== product.owner.toString()) continue;

            // Check if the product matches any of the coupon's criteria
            const matchesCategory = applicableCategories.some(cat => cat._id.toString() === product.category?.toString());
            const matchesSubcategory = applicableSubcategories.some(sub => sub._id.toString() === product.subcategory?.toString());
            const matchesProduct = applicableProducts.some(pro => pro._id.toString() === product._id.toString());

            matches = matchesCategory || matchesSubcategory || matchesProduct;
        }

        if (matches) {
            applicableProductsList.push({
                productId: product._id,
                price: item.price,
                quantity: item.quantity,
            });
        }
    }

    // If no applicable products found, return error
    if (applicableProductsList.length === 0) {
        return { valid: false, errors: ['Coupon does not apply to any products in your checkout'] };
    }

    // Return validation result and applicable products
    return { valid: true, applicableProducts: applicableProductsList };
};
module.exports = validateCouponLogic;