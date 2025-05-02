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
        CODAvailable,
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
    const { id } = req.params;
  
    try {
      const product = await Product.findById(id);
  
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
  
      // Handle new images
      const existingImages = product.images || [];
      const newImages = req.files ? req.files.map((file) => file.filename) : [];
      const updatedImages = [...existingImages, ...newImages];
  
      // Parse variants if provided
      let parsedVariants = [];
      if (req.body.variants) {
        try {
          parsedVariants = JSON.parse(req.body.variants);
        } catch (error) {
          return res.status(400).json({ message: "Invalid JSON format for variants", error: error.message });
        }
      }
  
      // Parse features if provided
      let parsedFeatures = {};
      if (req.body.features) {
        try {
          parsedFeatures = JSON.parse(req.body.features);
        } catch (error) {
          return res.status(400).json({ message: "Invalid JSON format for features", error: error.message });
        }
      }
  
      // Update product fields
      const updates = {
        name: req.body.name || product.name,
        productType: req.body.productType || product.productType,
        description: req.body.description || product.description,
        brand: req.body.brand || product.brand,
        images: updatedImages,
        category: req.body.category || product.category,
        subcategory: req.body.subcategory || product.subcategory,
        isReturnable:req.body.isReturnable || product.isReturnable,
        returnWithinDays:req.body.returnWithinDays || product.returnWithinDays,
        CODAvailable:req.body.CODAvailable || product.CODAvailable,
        features: Object.keys(parsedFeatures).length > 0 ? parsedFeatures : product.features,
        variants: parsedVariants.length > 0 ? parsedVariants : product.variants,
      };
  
      // Calculate new total stock if variants are updated
      if (parsedVariants.length > 0) {
        updates.totalStock = parsedVariants.reduce((total, variant) => {
          return total + variant.sizes.reduce((sum, size) => sum + size.stock, 0);
        }, 0);
      }
  
      const updatedProduct = await Product.findByIdAndUpdate(id, { $set: updates }, { new: true });
  
      res.status(200).json({ message: "Product updated successfully", product: updatedProduct });
    } catch (err) {
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