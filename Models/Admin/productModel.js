const mongoose = require("mongoose");
const Vendor = require("../Admin/VendorModel");
const Category = require("../Admin/CategoryModel");
const Admin = require("../Admin/AdminModel");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  productCode: { type: String, unique: true },
  productType: { type: String, enum: ["Dress", "Chappal", "Accessories"], required: true },
  images: { type: [String], required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  subcategory: { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory" },
  brand: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      validate: {
        validator: function (v) {
          return mongoose.Types.ObjectId.isValid(v) || typeof v === 'string';
        },
        message: 'Brand must be a valid ObjectId or a string',
      },
  },
  variants: [
    { 
      color: { type: String, required: true },
      colorName: { type: String, required: true }, // Example: "Blue"
      price: { type: Number, required: true }, // Example: 600
      wholesalePrice: { type: Number, required: true }, // Example: 500
      offerPrice: { type: Number, default: null }, 
      salesCount: { type: Number, default: 0 }, // Track sales per variant
      images: { type: [String], default: [] },
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
    pattern: { type: String },
    style: { type: String },
  },
  cost: { type: Number }, // Only for admin products
  owner: { type: mongoose.Schema.Types.ObjectId, refPath: "ownerType", required: true },
  ownerType: { type: String, required: true },
  supplierName: { type: String },
  totalStock: { type: Number, default: 0 },
  totalSales: { type: Number, default: 0 }, // Track total sales for the product
  averageRating: { type: Number, default: 2.5 },
  reviewCount: { type: Number, default: 0 },
  isReturnable: { type: Boolean, required: true }, 
  CODAvailable: { type: Boolean, default:true }, 
  returnWithinDays: { type: Number, min: 0 },
  offers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offer',
    default: null,
  }],
  coupon: { type: Number },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
}, { timestamps: true });


// Pre-save hook to generate product code, populate supplierName, and calculate total stock
// Define a reusable mapping
const productTypeMap = {
  Dress: "D",
  Chappal: "C",
  Accessories: "A"
};

// Virtual field for productTypeCode
productSchema.virtual("productTypeCode").get(function () {
  return productTypeMap[this.productType] || null;
});

// Ensure virtuals show up
productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

// Pre-save hook
productSchema.pre("save", async function (next) {
  if (this.isNew) {
    const ownerId = this.owner;
    const productType = this.productType;
    const ownerType = this.ownerType.trim().toUpperCase();

    // ✅ use map instead of if/else
    const productTypeCode = productTypeMap[productType];
    if (!productTypeCode) {
      return next(new Error(`Invalid productType: ${productType}`));
    }

    let ownerInitials = "";

    if (this.ownerType === "vendor") {
      const vendor = await Vendor.findById(ownerId);
      if (vendor) {
        ownerInitials = vendor.businessname
          ? vendor.businessname.slice(0, 2).toUpperCase()
          : vendor.ownername.slice(0, 2).toUpperCase();
      } else {
        return next(new Error("Vendor not found for the provided owner ID"));
      }
    } else if (this.ownerType === "admin") {
      const admin = await Admin.findById(ownerId);
      if (admin) {
        ownerInitials = admin.role.slice(0, 2).toUpperCase();
      } else {
        return next(new Error("Admin not found for the provided owner ID"));
      }
    }

    // Generate sequential number
    const lastProduct = await this.constructor.findOne({ owner: ownerId, productType })
      .sort({ createdAt: -1 })
      .limit(1);

    let sequentialNumber = 1;
    if (lastProduct && lastProduct.productCode) {
      const lastSeqNum = parseInt(lastProduct.productCode.split("-").pop());
      sequentialNumber = isNaN(lastSeqNum) ? 1 : lastSeqNum + 1;
    }

    // ✅ now code is always {TypeCode}-{OwnerInitials}-{Seq}
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
        this.supplierName = "Admin";
      } else {
        return next(new Error("Admin not found for the provided owner ID"));
      }
    }

    // Initialize offerPrice if missing
    if (this.variants?.length > 0) {
      this.variants.forEach((variant) => {
        if (!variant.offerPrice) {
          variant.offerPrice = variant.price;
        }
      });
    }

    // Calculate total stock
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