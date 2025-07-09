const Product = require("../../../Models/Admin/productModel");
const Category = require("../../../Models/Admin/CategoryModel");
const SubCategory = require("../../../Models/Admin/SubCategoryModel");
const Admin = require("../../../Models/Admin/AdminModel");
const Vendor = require("../../../Models/Admin/VendorModel");
const fs = require("fs");
const path = require("path");

// Create a new product with variants
exports.createProduct = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "At least one product image is required" });
    }

    const imagePaths = req.files.map((file) => file.filename);

    const {
      name,
      productType,
      description,
      brand,
      type,
      isReturnable,
      returnWithinDays,
      CODAvailable,
      features,
      variants,
      cost 
    } = req.body;

    // Parse variants
    let parsedVariants = [];
    try {
      parsedVariants = Array.isArray(JSON.parse(variants)) ? JSON.parse(variants) : [];
    } catch (error) {
      return res.status(400).json({ message: "Invalid JSON format for variants", error: error.message });
    }

    // Parse features
    let parsedFeatures = {};
    try {
      parsedFeatures = features ? JSON.parse(features) : {};
    } catch (error) {
      return res.status(400).json({ message: "Invalid JSON format for features", error: error.message });
    }

    // Attach images to variants
    const variantImageMap = {};
    req.files.forEach(file => {
      const match = file.fieldname.match(/^variantImages\[(\d+)]$/);
      if (match) {
        const index = match[1];
        if (!variantImageMap[index]) variantImageMap[index] = [];
        variantImageMap[index].push(file.filename);
      }
    });

    parsedVariants = parsedVariants.map((variant, index) => ({
      ...variant,
      images: variantImageMap[index] || []
    }));

    // Determine ownerType
    let ownerType = null;
    const admin = await Admin.findById(req.body.owner);
    if (admin) {
      ownerType = admin.role;
    } else {
      const vendor = await Vendor.findById(req.body.owner);
      if (vendor) {
        ownerType = vendor.role || "vendor";
      } else {
        return res.status(400).json({ message: "Invalid owner ID" });
      }
    }

    // Validate category & subcategory
    if (req.body.category && !(await Category.findById(req.body.category))) {
      return res.status(400).json({ message: "Invalid category ID" });
    }
    if (req.body.subcategory && !(await SubCategory.findById(req.body.subcategory))) {
      return res.status(400).json({ message: "Invalid subcategory ID" });
    }

    // ✅ Create product with cost
    const newProduct = new Product({
      name,
      productType,
      images: imagePaths,
      category: req.body.category,
      subcategory: req.body.subcategory,
      description,
      brand,
      type,
      isReturnable,
      returnWithinDays,
      CODAvailable,
      cost,
      variants: parsedVariants,
      features: parsedFeatures,
      owner: req.body.owner,
      ownerType,
    });

    await newProduct.save();

    res.status(201).json({ message: "Product created successfully", product: newProduct });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};

     
// Get all products with variants
exports.getProducts = async (req, res) => {
  try {
    const { productType, brand, minPrice, maxPrice, size } = req.query;

    const matchStage = {};

    if (productType) matchStage.productType = productType;
    if (brand) matchStage.brand = brand;

    // Initial DB filter (basic productType and brand match)
    let products = await Product.find(matchStage)
      .populate("brand", "name")
      .populate("category", "name")
      .populate("subcategory", "name");

    // In-memory filter for variants.0.offerPrice
    if (minPrice || maxPrice) {
      const min = minPrice ? Number(minPrice) : 0;
      const max = maxPrice ? Number(maxPrice) : Number.MAX_VALUE;

      products = products.filter(
        (product) =>
          product.variants?.[0]?.offerPrice >= min &&
          product.variants?.[0]?.offerPrice <= max
      );
    }

    // In-memory filter for size
    if (size) {
      const sizes = size.split(',').map((s) => s.trim()).filter(Boolean);
      if (sizes.length > 0) {
        products = products.filter((product) =>
          product.variants?.some((variant) =>
            variant.sizes?.some((s) => sizes.includes(s.size))
          )
        );
      } else {
        return res.status(400).json({ message: "Invalid size provided" });
      }
    }

    if (!products || products.length === 0) {
      return res.status(404).json({ message: "No products found" });
    }

    res.status(200).json({
      message: "Products fetched successfully",
      total: products.length,
      products,
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching products", error: err.message });
  }
};


// Get a product by ID (with variants)
exports.getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findById(id)
      .populate("category")
      .populate("subcategory")
      .populate("brand");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Populate owner details
    const ownerDetails = await (product.ownerType === "vendor"
      ? Vendor.findById(product.owner).select("-password")
      : Admin.findById(product.owner).select("-password"));

    if (ownerDetails) {
      product.owner = ownerDetails;
    }

    res.status(200).json(product);
  } catch (err) {
    res.status(500).json({ message: "Error fetching product", error: err.message });
  }
};


// update product
exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const {
      name,
      productType,
      description,
      brand,
      type,
      isReturnable,
      returnWithinDays,
      CODAvailable,
      features,
      variants,
      cost,
      category,
      subcategory,
    } = req.body;

    // ✅ Update primitive fields if present
    if (name) product.name = name;
    if (productType) product.productType = productType;
    if (description) product.description = description;
    if (brand) product.brand = brand;
    if (type) product.type = type;
    if (cost !== undefined) product.cost = cost;
    if (isReturnable !== undefined) product.isReturnable = isReturnable;
    if (returnWithinDays !== undefined) product.returnWithinDays = returnWithinDays;
    if (CODAvailable !== undefined) product.CODAvailable = CODAvailable;
    if (category) product.category = category;
    if (subcategory) product.subcategory = subcategory;
    if (features) {
      try {
        product.features = typeof features === "string" ? JSON.parse(features) : features;
      } catch (err) {
        return res.status(400).json({ message: "Invalid features JSON" });
      }
    }

    // ✅ Parse variantImages[0], variantImages[1], ...
    const variantImageMap = {};
    req.files?.forEach((file) => {
      const match = file.fieldname.match(/^variantImages\[(\d+)]$/);
      if (match) {
        const index = Number(match[1]);
        if (!variantImageMap[index]) variantImageMap[index] = [];
        variantImageMap[index].push(file.filename);
      }
    });

    // ✅ Append images to existing variants (safe way)
    product.variants = product.variants.map((variant, index) => {
      const newImages = variantImageMap[index] || [];
      return {
        ...variant.toObject(), // ensure full raw variant object with required fields
        images: [...(variant.images || []), ...newImages],
      };
    });

    product.markModified("variants"); // 💡 Ensure Mongoose tracks the nested changes
    const updated = await product.save();

    return res.status(200).json({ message: "Product updated successfully", product: updated });
  } catch (err) {
    console.error("Product Update Failed:", err);
    return res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};


  

// Delete a product
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Delete images
    const basePath = "./uploads/admin/product";
    product.images.forEach((image) => {
      const imagePath = path.join(basePath, image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    });

    await Product.findByIdAndDelete(id);
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting product", error: err.message });
  }
};

// Delete a specific image by name
exports.deleteProductImage = async (req, res) => {
  try {
    const { id } = req.params; 
    const { imageName } = req.body;   
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    const updatedImages = product.images.filter((img) => {
      const imgFileName = img.split("\\").pop().split("/").pop(); 
      return imgFileName !== imageName;
    });
    if (updatedImages.length === product.images.length) {
      return res.status(400).json({ message: "Image not found in product" });
    }
    
    const updatedProduct = await Product.findByIdAndUpdate(id,{ images: updatedImages },{ new: true });
    if(!updatedProduct){
      return res.status(404).json({ message: "Failed to delete image" })
    }
    res.status(200).json({ message: "Image deleted successfully", images: updatedProduct.images });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};