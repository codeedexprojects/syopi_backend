const mongoose = require("mongoose");
const Vendor = require("../Admin/VendorModel");
const Category = require("../Admin/CategoryModel");
const Admin = require("../Admin/AdminModel");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  productCode: { type: String, unique: true },
  productType: { type: String, enum: ["Dress", "Chappal"], required: true },
  images: { type: [String], required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  subcategory: { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory" },
  brand: { type: String, required: true },
  variants: [
    { 
      color: { type: String, required: true },
      colorName: { type: String, required: true }, // Example: "Blue"
      price: { type: Number, required: true }, // Example: 600
      wholesalePrice: { type: Number, required: true }, // Example: 500
      offerPrice: { type: Number, default: null }, 
      salesCount: { type: Number, default: 0 }, // Track sales per variant
      sizes: [
        {
          size: { type: String, required: true }, // Example: "L", "M"
          stock: { type: Number, default: 0, required: true }, // Stock for this size
          salesCount: { type: Number, default: 0 }, // Track sales per size
        },
      ],
    },
  ],
  description: { type: String, required: true },
  features: {
    netWeight: { type: String },
    material: { type: String }, // For Dress
    soleMaterial: { type: String }, // For Chappal
    fit: { type: String },
    sleevesType: { type: String },
    length: { type: String },
    occasion: { type: String },
  },
  owner: { type: mongoose.Schema.Types.ObjectId, refPath: "ownerType", required: true },
  ownerType: { type: String, required: true },
  supplierName: { type: String },
  totalStock: { type: Number, default: 0 },
  totalSales: { type: Number, default: 0 }, // Track total sales for the product
  offers: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offer',
    default: null,
  },
  coupon: { type: Number },
  status: { type: String, enum: ["approved", "pending", "rejected"], default: "pending" },
}, { timestamps: true });


// Pre-save hook to generate product code, populate supplierName, and calculate total stock
productSchema.pre("save", async function (next) {
  if (this.isNew) {


    const ownerId = this.owner;
    const productType = this.productType;
    const ownerType = this.ownerType.trim().toUpperCase(); // Ensure ownerType is uppercase

    const productTypeCode = productType === "Dress" ? "D" : "C"; // 'D' for Dress, 'C' for Chappal
    let ownerInitials = '';

    // Generate owner initials (use vendor or admin initials for the product code)
    if (this.ownerType === "vendor") {
      const vendor = await Vendor.findById(ownerId);
      if (vendor) {
        ownerInitials = vendor.businessname ? vendor.businessname.slice(0, 2).toUpperCase() : vendor.ownername.slice(0, 2).toUpperCase();
      } else {
        return next(new Error("Vendor not found for the provided owner ID"));
      }
    } else if (this.ownerType === "admin") {
      const admin = await Admin.findById(ownerId);
      if (admin) {
        ownerInitials = admin.role.slice(0, 2).toUpperCase(); // Using the first two letters of admin's name
      } else {
        return next(new Error("Admin not found for the provided owner ID"));
      }
    }

    // Generate the sequential number (e.g., 001, 002)
    const lastProduct = await this.constructor.findOne({ owner: ownerId, productType })
      .sort({ createdAt: -1 })
      .limit(1);

    let sequentialNumber = 1;

    // Check if there is a previous product and handle the split logic
    if (lastProduct && lastProduct.productCode) {
      const lastProductCode = lastProduct.productCode;
      const lastSeqNum = parseInt(lastProductCode.split("-").pop()); // Get the last part of the product code
      sequentialNumber = isNaN(lastSeqNum) ? 1 : lastSeqNum + 1; // Handle NaN case
    }
    // Generate product code in the format: {ProductType}-{OwnerInitials}-{SequentialNumber}
    this.productCode = `${productTypeCode}-${ownerInitials}-${String(sequentialNumber).padStart(3, "0")}`;

    // Populate supplierName
    if (this.ownerType === "vendor") {
      const vendor = await Vendor.findById(ownerId);
      if (vendor) {
        this.supplierName = vendor.businessname || vendor.ownername;
      } else {
        return next(new Error("Vendor not found for the provided owner ID"));
      }
    } else if (this.ownerType === "admin") {
      const admin = await Admin.findById(ownerId);
      if (admin) {
        this.supplierName = "Admin"; // Default name for admin products
      } else {
        return next(new Error("Admin not found for the provided owner ID"));
      }
    }
    // Initialize `offerPrice` as the same value as `price` for each variant
    if (this.variants && this.variants.length > 0) {
      this.variants.forEach((variant) => {
        if (!variant.offerPrice) {
          variant.offerPrice = variant.price; // Set offerPrice to price if it's not explicitly set
        }
      });
    }

    // Calculate the total stock from all variants
    if (this.isNew || this.isModified("variants")) {
      const totalStock = this.variants.reduce((total, variant) => {
        const sizeStock = variant.sizes.reduce((sizeTotal, size) => sizeTotal + size.stock, 0);
        return total + sizeStock;
      }, 0);
    
      this.totalStock = totalStock;
    }
  }
  next();
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;