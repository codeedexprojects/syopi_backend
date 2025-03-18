const Coupon = require('../../../Models/Admin/couponModel')
const Vendor = require('../../../Models/Admin/VendorModel');
const validateCouponLogic = require('../../../utils/validateCoupon');

//create coupon
exports.createCoupon = async (req, res) => {
    const {
      code, type, value, startDate, endDate,
      applicableCategories,
      applicableSubcategories, applicableProducts,
    } = req.body;
  
    try {
      // Ensure that the user role is either 'admin' or 'vendor'
      let createdByRole;
      if (req.user.role === 'admin') {
        createdByRole = 'Admin';
      } else if (req.user.role === 'vendor') {
        createdByRole = 'Vendor';
      } else {
        return res.status(403).json({ message: 'Unauthorized: Invalid role' });
      }
  
      // Create a new coupon with the relevant details
      const newCoupon = new Coupon({
        code,
        type,
        value,
        startDate,
        endDate,
        applicableCategories,
        applicableSubcategories,
        applicableProducts,
        createdBy: req.user.id, // Set the creator's ID from authenticated user
        createdByRole, // Set the creator's role
      });
  
      // Save the coupon to the database
      await newCoupon.save();
      res.status(201).json({ message: 'Coupon created successfully', coupon: newCoupon });
    } catch (error) {
      res.status(500).json({ message: 'Error creating coupon', error: error.message });
    }
  };
  

//get all coupons
exports.getCoupons = async (req, res) => {
    try {
      const coupons = await Coupon.find({createdBy:req.user.id})
        .populate('applicableCategories', 'name')
        .populate('applicableSubcategories', 'name')
        .populate('applicableProducts', 'name')
        .populate('createdBy', 'role')
        .sort({ createdAt: -1 });
  
      res.status(200).json(coupons);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching coupons', error: error.message });
    }
  };

// get coupon by id
exports.getCouponById = async (req, res) => {
    const { id } = req.params;
  
    try {
      const coupon = await Coupon.findById(id)
        .populate('applicableCategories', 'name')
        .populate('applicableSubcategories', 'name')
        .populate('applicableProducts', 'name')
        .populate('createdBy', 'role')
  
      if (!coupon) {
        return res.status(404).json({ message: 'Coupon not found' });
      }
  
      res.status(200).json(coupon);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching coupon', error: error.message });
    }
  };

// update a coupon
exports.updateCoupon = async(req,res) =>{
    const { id } = req.params;
    const { code, type, value, startDate, endDate,
        applicableCategories, 
        applicableSubcategories, applicableProducts, } = req.body;
    try {
        const coupon = await Coupon.findById(id);
        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }
        const updatedCoupon = await Coupon.findByIdAndUpdate(id,{
            ...(code && {code}),
            ...(type && {type}),
            ...(value && {value}),
            ...(startDate && {startDate}),
            ...(endDate && {endDate}),
            ...(applicableCategories && {applicableCategories}),
            ...(applicableSubcategories && {applicableSubcategories}),
            ...(applicableProducts && {applicableProducts}),
        },{ new: true });
        if (!updatedCoupon) {
            return res.status(404).json({ message: 'Offer not found' });
        }
        res.status(200).json({ message: 'Coupon updated successfully', coupon: updatedCoupon });
    } catch (error) {
        res.status(500).json({ message: 'Error updating Coupon', error: error.message });
    }
}

// delete coupon
exports.deleteCoupon = async (req, res) =>{
    const { id } = req.params;
    
    try {
        const coupon = await Coupon.findByIdAndDelete(id);

        if(!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }
        res.status(200).json({ message: 'Coupon deleted successfully' })
    } catch (error) {
        res.status(500).json({ message: 'Error deleting coupon' , error: error.message });
    }
  };

// toggle isActive
exports.toggleCouponStatus = async (req, res ) => {
    const { id } = req.params;
    

    try {
        const coupon = await Coupon.findById(id);
        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        coupon.status = coupon.status === 'inactive' ? 'active' : 'inactive';
        await coupon.save();

        res.status(200).json({ message: 'coupon status toggled', coupon});
    } catch (error) {
        res.status(500).json({ message: 'error updating coupon status', error: error.message})
    }
  }

// validate coupon
exports.validateCoupon = async (req, res) => {
    const { code } = req.body;

    if (!code) {
        return res.status(400).json({ message: "Coupon code is required" });
    }

    try {
        const coupon = await Coupon.findOne({ code }).populate('applicableCategories', 'name');
        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        const validation = validateCouponLogic(coupon); // Use the imported function
        if (!validation.valid) {
            return res.status(400).json({ message: 'Invalid coupon', errors: validation.errors });
        }

        res.status(200).json({ message: 'Coupon is valid', coupon });
    } catch (error) {
        res.status(500).json({ message: 'Error validating coupon', error: error.message });
    }
};