const Product = require("../../../Models/Admin/productModel");
const Category = require("../../../Models/Admin/CategoryModel");
const SubCategory = require("../../../Models/Admin/SubCategoryModel");
const Admin = require("../../../Models/Admin/AdminModel");
const Vendor = require("../../../Models/Admin/VendorModel");
const fs = require("fs");
const path = require("path");
const mongoose = require('mongoose');

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
        features, // Additional features like material/soleMaterial
        variants, // Nested variants as JSON
      } = req.body;
  
      // Parse variants as JSON
      let parsedVariants = [];
      try {
        parsedVariants = Array.isArray(JSON.parse(variants)) ? JSON.parse(variants) : [];
      } catch (error) {
        return res.status(400).json({ message: "Invalid JSON format for variants", error: error.message });
      }

      let parsedFeatures = {};
    try {
      parsedFeatures = features ? JSON.parse(features) : {};
    } catch (error) {
      return res.status(400).json({ message: "Invalid JSON format for features", error: error.message });
    }

      // Group images by variant index
      const variantImageMap = {};
      req.files.forEach(file => {
        const match = file.fieldname.match(/^variantImages\[(\d+)]$/);
        if (match) {
          const index = match[1];
          if (!variantImageMap[index]) variantImageMap[index] = [];
          variantImageMap[index].push(file.filename);
        }
      });

      // Attach images to each corresponding variant
      parsedVariants = parsedVariants.map((variant, index) => ({
        ...variant,
        images: variantImageMap[index] || []
      }));

      // Determine ownerType based on the owner ID
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
  
      // Validate category and subcategory
      if (req.body.category && !(await Category.findById(req.body.category))) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      if (req.body.subcategory && !(await SubCategory.findById(req.body.subcategory))) {
        return res.status(400).json({ message: "Invalid subcategory ID" });
      }
  
      // Create product
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
        variants: parsedVariants, // Add parsed variants here
        features: parsedFeatures, // Add parsed features here
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

    const matchStage = { owner: req.user.id };

    if (productType) matchStage.productType = productType;
    if (brand) matchStage.brand = brand;

    let products = await Product.find(matchStage)
      .populate("brand", "name")
      .populate("category", "name")
      .populate("subcategory", "name");

    // Filter by offerPrice (first variant only)
    if (minPrice || maxPrice) {
      const min = minPrice ? Number(minPrice) : 0;
      const max = maxPrice ? Number(maxPrice) : Number.MAX_VALUE;
      products = products.filter(
        (product) =>
          product.variants?.[0]?.offerPrice >= min &&
          product.variants?.[0]?.offerPrice <= max
      );
    }

    // Filter by size
    if (size) {
      const sizes = size.split(',').map((s) => s.trim()).filter(Boolean);
      if (sizes.length > 0) {
        products = products.filter(product =>
          product.variants?.some(variant =>
            variant.sizes?.some(s => sizes.includes(s.size))
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

  

// // Get all products with variants
// exports.getProducts = async (req, res) => {
//   try {
//     const { page = 1, limit = 10, productType, ownerType, brand, category, subcategory } = req.query;

//     const query = {};
//     if (productType) query.productType = productType;
//     if (ownerType) query.ownerType = ownerType;
//     if (brand) query.brand = brand;
//     if (category) query.category = category;
//     if (subcategory) query.subcategory = subcategory;

//     const products = await Product.find(query)
//       .skip((page - 1) * limit)
//       .limit(Number(limit))
//       .sort({ createdAt: -1 });

//     const totalCount = await Product.countDocuments(query);

//     res.status(200).json({
//       message: "Products fetched successfully",
//       products,
//       pagination: {
//         currentPage: page,
//         totalPages: Math.ceil(totalCount / limit),
//         totalItems: totalCount,
//       },
//     });
//   } catch (err) {
//     res.status(500).json({ message: "Error fetching products", error: err.message });
//   }
// };

// Get a product by ID (with variants)
exports.getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findById(id)
    .populate("brand", "name")
    .populate("category", "name")
    .populate("subcategory", "name");

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
      category,
      subcategory,
      cost,
      newVariants,
      updatedVariants,
    } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // ✅ Parse features
    const parsedFeatures =
      typeof features === "string" ? JSON.parse(features) : features;

    // ✅ Parse newVariants
    let parsedNewVariants = [];
    if (newVariants) {
      try {
        parsedNewVariants = Array.isArray(JSON.parse(newVariants))
          ? JSON.parse(newVariants)
          : [];
      } catch (error) {
        return res.status(400).json({
          message: "Invalid JSON format for newVariants",
          error: error.message,
        });
      }
    }

    // ✅ Parse updatedVariants
    let parsedUpdatedVariants = [];
    if (updatedVariants) {
      try {
        parsedUpdatedVariants = Array.isArray(JSON.parse(updatedVariants))
          ? JSON.parse(updatedVariants)
          : [];
      } catch (error) {
        return res.status(400).json({
          message: "Invalid JSON format for updatedVariants",
          error: error.message,
        });
      }
    }

    // ✅ Map images
    const variantImageMapByColorName = {};
    const variantImageMapById = {};

    req.files?.forEach((file) => {
      const matchColor = file.fieldname.match(/^variantImages\[(.+)]$/);
      if (matchColor) {
        const key = matchColor[1];
        if (/^[0-9a-fA-F]{24}$/.test(key)) {
          if (!variantImageMapById[key]) variantImageMapById[key] = [];
          variantImageMapById[key].push(file.filename);
        } else {
          if (!variantImageMapByColorName[key]) variantImageMapByColorName[key] = [];
          variantImageMapByColorName[key].push(file.filename);
        }
      }
    });

    // ✅ Update existing variants with new images
    product.variants.forEach((variant) => {
      const images = variantImageMapById[variant._id.toString()];
      if (images?.length) {
        variant.images = [...(variant.images || []), ...images];
      }
    });

    // ✅ Update existing variant fields
    parsedUpdatedVariants.forEach((variantUpdate) => {
      const existingVariant = product.variants.id(variantUpdate._id);
      if (existingVariant) {
        Object.keys(variantUpdate).forEach((key) => {
          if (key !== "_id") {
            existingVariant[key] = variantUpdate[key];
          }
        });
      }
    });

    // ✅ Add new variants
    if (parsedNewVariants.length > 0) {
      const mappedNewVariants = parsedNewVariants.map((variant) => ({
        ...variant,
        images: variantImageMapByColorName[variant.colorName] || [],
      }));
      product.variants.push(...mappedNewVariants);
    }

    // ✅ Update product fields
    if (name) product.name = name;
    if (productType) product.productType = productType;
    if (description) product.description = description;
    if (brand) product.brand = brand;
    if (type) product.type = type;
    if (typeof cost !== "undefined") product.cost = cost;
    if (typeof isReturnable !== "undefined") product.isReturnable = isReturnable;
    if (typeof CODAvailable !== "undefined") product.CODAvailable = CODAvailable;
    if (typeof returnWithinDays !== "undefined") product.returnWithinDays = returnWithinDays;
    if (features) product.features = parsedFeatures;
    if (category) product.category = category;
    if (subcategory) product.subcategory = subcategory;

    await product.save();

    res.status(200).json({ message: "Product updated successfully", product });
  } catch (err) {
    console.error("Product Update Error:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
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
    const { imageName, variantId } = req.body; 

    if (!imageName) {
      return res.status(400).json({ message: "Image name is required" });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let imageFound = false;


    if (!variantId) {
      const filteredImages = product.images.filter(img => path.basename(img) !== imageName);

      if (filteredImages.length !== product.images.length) {
        product.images = filteredImages;
        imageFound = true;
      }
    }

    if (variantId) {
      const variant = product.variants.id(variantId);
      if (!variant) {
        return res.status(404).json({ message: "Variant not found" });
      }

      const originalLength = variant.images.length;
      variant.images = variant.images.filter(img => path.basename(img) !== imageName);
      if (variant.images.length !== originalLength) {
        imageFound = true;
      }
    }

    if (!imageFound) {
      return res.status(400).json({ message: "Image not found in product or variant" });
    }

    await product.save();

    const filePath = path.join(__dirname, "../../../uploads", imageName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);      
    }

    res.status(200).json({ message: "Image deleted successfully", images: product.images });
  } catch (error) {
    console.error("Error deleting product image:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Delete a specific variant from a product
exports.deleteVariantFromProduct = async (req, res) => {
  try {
    const { productId, variantId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const variant = product.variants.id(variantId);
    if (!variant) {
      return res.status(404).json({ message: "Variant not found" });
    }

    // Delete variant images from filesystem
    const basePath = "../../../uploads/";
    variant.images?.forEach((image) => {
      const imagePath = path.join(basePath, image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    });

    // Remove the variant
    product.variants.pull({ _id: variantId });

    await product.save();

    res.status(200).json({ message: "Variant deleted successfully", product });
  } catch (err) {
    console.error("Error deleting variant:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};