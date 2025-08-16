const AffordableProducts = require("../../../Models/Admin/AffordableProductModel");
const LowestPriceProducts = require("../../../Models/Admin/LowestProductModel");
const TopPicks = require("../../../Models//Admin/TopPicksModel")
const TopSaleSection = require("../../../Models/Admin/TopSaleSectionModel");
const OfferSection = require("../../../Models/Admin/OfferSectionModel");
const Category = require('../../../Models/Admin/CategoryModel');  
const Subcategory = require('../../../Models/Admin/SubCategoryModel');  
const fs = require("fs");
const CoinSettings = require('../../../Models/Admin/CoinModel')
const InfoSection = require("../../../Models//Admin/InfoSection");
const Product = require('../../../Models/Admin/productModel')
const mongoose = require('mongoose')


// Create Affordable Product
exports.createAffordableProduct = async (req, res) => {
    const { description, affordablePrice } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: "Please upload an image" });
    }

    if (!affordablePrice || affordablePrice < 0) {
        return res.status(400).json({ message: "Affordable price is required and must be non-negative" });
    }

    try {
        const newProduct = new AffordableProducts({
            image: req.file.filename,
            description,
            affordablePrice
        });

        await newProduct.save();
        res.status(201).json({ message: "Affordable product created successfully", newProduct });
    } catch (err) {
        res.status(500).json({ message: "Error creating product", error: err.message });
    }
};

// Get all Affordable Products
exports.getAllProducts = async (req, res) => {
    try {
        const affordableProducts = await AffordableProducts.find().sort({ createdAt: -1 });
        res.status(200).json({ affordableProducts });
    } catch (err) {
        res.status(500).json({ message: "Error fetching products", error: err.message });
    }
};

// Get Affordable Product by ID


// Update Affordable Product
exports.updateAffordableProduct = async (req, res) => {
    const { id } = req.params;
    const { description, affordablePrice } = req.body;

    try {
        const product = await AffordableProducts.findById(id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        if (description) product.description = description;
        if (affordablePrice !== undefined) {
            if (affordablePrice < 0) {
                return res.status(400).json({ message: "Affordable price must be non-negative" });
            }
            product.affordablePrice = affordablePrice;
        }

        // If a new image is uploaded, delete the old one and update
        if (req.file) {
            const oldImagePath = `./uploads/affordable_products/${product.image}`;
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
            product.image = req.file.filename;
        }

        await product.save();
        res.status(200).json({ message: "Affordable product updated successfully", product });
    } catch (err) {
        res.status(500).json({ message: "Error updating product", error: err.message });
    }
};

// Delete Affordable Product
exports.deleteAffordableProduct = async (req, res) => {
    const { id } = req.params;

    try {
        const product = await AffordableProducts.findById(id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const imagePath = `./uploads/affordable_products/${product.image}`;
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        await product.deleteOne();
        res.status(200).json({ message: "Affordable product deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting product", error: err.message });
    }
};

// Get Lowest Price Product

exports.getLowestPriceProducts = async (req, res) => {
    try {
        const lowestPriceProducts = await LowestPriceProducts.find().sort({ createdAt: -1 });
        res.status(200).json({ lowestPriceProducts });
    } catch (err) {
        res.status(500).json({ message: "Error fetching products", error: err.message });
    }
};
// Create Lowest Price Product
exports.createLowestPriceProduct = async (req, res) => {
    const { description, startingPrice } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: "Please upload an image" });
    }

    if (!startingPrice || startingPrice < 0) {
        return res.status(400).json({ message: "Lowest price is required and must be non-negative" });
    }

    try {
        const newProduct = new LowestPriceProducts({
            image: req.file.filename,
            description,
            startingPrice
        });

        await newProduct.save();
        res.status(201).json({ message: "Lowest price product created successfully", newProduct });
    } catch (err) {
        res.status(500).json({ message: "Error creating product", error: err.message });
    }
};

// Get all Lowest Price Products



// Update Lowest Price Product
exports.updateLowestPriceProduct = async (req, res) => {
    const { id } = req.params;
    const { description, lowestPrice } = req.body;

    try {
        const product = await LowestPriceProducts.findById(id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        if (description) product.description = description;
        if (lowestPrice !== undefined) {
            if (lowestPrice < 0) {
                return res.status(400).json({ message: "Lowest price must be non-negative" });
            }
            product.lowestPrice = lowestPrice;
        }

        // If a new image is uploaded, delete the old one and update
        if (req.file) {
            const oldImagePath = `./uploads/lowest_price_products/${product.image}`;
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
            product.image = req.file.filename;
        }

        await product.save();
        res.status(200).json({ message: "Lowest price product updated successfully", product });
    } catch (err) {
        res.status(500).json({ message: "Error updating product", error: err.message });
    }
};

// Delete Lowest Price Product
exports.deleteLowestPriceProduct = async (req, res) => {
    const { id } = req.params;

    try {
        const product = await LowestPriceProducts.findById(id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const imagePath = `./uploads/lowest_price_products/${product.image}`;
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        await product.deleteOne();
        res.status(200).json({ message: "Lowest price product deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting product", error: err.message });
    }
};

// -------------------- Create Top Pick --------------------
exports.createTopPickProduct = async (req, res) => {
    const { description, title, productIds } = req.body;

    // Check image
    if (!req.file) {
        return res.status(400).json({ message: "Please upload an image" });
    }

    // Check title
    if (!title || title.trim() === "") {
        return res.status(400).json({ message: "Title is required" });
    }

    // Check productIds
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({ message: "At least one product ID is required" });
    }

    // Validate each product ID
    for (const id of productIds) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: `Invalid product ID: ${id}` });
        }
    }

    try {
        // Ensure all product IDs exist
        const existingProducts = await Product.find({ _id: { $in: productIds } }).select("_id");
        if (existingProducts.length !== productIds.length) {
            return res.status(404).json({ message: "Some product IDs do not exist" });
        }

        const newTopPick = new TopPicks({
            image: req.file.filename,
            description,
            title,
            productIds
        });

        await newTopPick.save();
        res.status(201).json({ message: "Top pick created successfully", newTopPick });
    } catch (err) {
        res.status(500).json({ message: "Error creating top pick", error: err.message });
    }
};

// -------------------- Update Top Pick --------------------
exports.updateTopPickProduct = async (req, res) => {
    const { id } = req.params;
    const { description, title, productIds } = req.body;

    try {
        const topPick = await TopPicks.findById(id);
        if (!topPick) {
            return res.status(404).json({ message: "Top pick not found" });
        }

        if (description) topPick.description = description;

        if (title !== undefined) {
            if (title.trim() === "") {
                return res.status(400).json({ message: "Title is required" });
            }
            topPick.title = title;
        }

        if (productIds) {
            if (!Array.isArray(productIds) || productIds.length === 0) {
                return res.status(400).json({ message: "At least one product ID is required" });
            }

            for (const pid of productIds) {
                if (!mongoose.Types.ObjectId.isValid(pid)) {
                    return res.status(400).json({ message: `Invalid product ID: ${pid}` });
                }
            }

            const existingProducts = await Product.find({ _id: { $in: productIds } }).select("_id");
            if (existingProducts.length !== productIds.length) {
                return res.status(404).json({ message: "Some product IDs do not exist" });
            }

            topPick.productIds = productIds;
        }

        if (req.file) {
            const oldImagePath = `./uploads/top_picks/${topPick.image}`;
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
            topPick.image = req.file.filename;
        }

        await topPick.save();
        res.status(200).json({ message: "Top pick updated successfully", topPick });
    } catch (err) {
        res.status(500).json({ message: "Error updating top pick", error: err.message });
    }
};

// -------------------- Get All Top Picks --------------------
exports.getAllTopPickProducts = async (req, res) => {
    try {
        const topPickProducts = await TopPicks.find()
            .populate("productIds") // Populate product details
            .sort({ createdAt: -1 });

        res.status(200).json({ topPickProducts });
    } catch (err) {
        res.status(500).json({ message: "Error fetching top picks", error: err.message });
    }
};

// -------------------- Delete Top Pick --------------------
exports.deleteTopPickProduct = async (req, res) => {
    const { id } = req.params;

    try {
        const topPick = await TopPicks.findById(id);
        if (!topPick) {
            return res.status(404).json({ message: "Top pick not found" });
        }

        // Delete image file if exists
        const imagePath = `./uploads/top_picks/${topPick.image}`;
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        // Delete from DB
        await TopPicks.findByIdAndDelete(id);

        res.status(200).json({ message: "Top pick deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting top pick", error: err.message });
    }
};


// -------------------- Create --------------------
exports.createTopSaleSection = async (req, res) => {
    const { description, title, productIds } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: "Please upload an image" });
    }

    if (!title || title.trim() === "") {
        return res.status(400).json({ message: "Title is required" });
    }

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({ message: "At least one product ID is required" });
    }

    try {
        // Validate all product IDs exist
        const products = await Product.find({ _id: { $in: productIds } });
        if (products.length !== productIds.length) {
            return res.status(400).json({ message: "Some product IDs are invalid" });
        }

        const newSection = new TopSaleSection({
            image: req.file.filename,
            description,
            title,
            productIds
        });

        await newSection.save();
        res.status(201).json({ message: "Top Sale Section created successfully", newSection });
    } catch (err) {
        res.status(500).json({ message: "Error creating section", error: err.message });
    }
};

// -------------------- Update --------------------
exports.updateTopSaleSection = async (req, res) => {
    const { id } = req.params;
    const { description, title, productIds } = req.body;

    try {
        const section = await TopSaleSection.findById(id);
        if (!section) {
            return res.status(404).json({ message: "Section not found" });
        }

        if (description) section.description = description;
        if (title !== undefined) {
            if (title.trim() === "") {
                return res.status(400).json({ message: "Title is required" });
            }
            section.title = title;
        }

        if (productIds && Array.isArray(productIds)) {
            const products = await Product.find({ _id: { $in: productIds } });
            if (products.length !== productIds.length) {
                return res.status(400).json({ message: "Some product IDs are invalid" });
            }
            section.productIds = productIds;
        }

        if (req.file) {
            const oldImagePath = `./uploads/top_sale_section/${section.image}`;
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
            section.image = req.file.filename;
        }

        await section.save();
        res.status(200).json({ message: "Top Sale Section updated successfully", section });
    } catch (err) {
        res.status(500).json({ message: "Error updating section", error: err.message });
    }
};

// -------------------- Get All --------------------
exports.getAllTopSaleSections = async (req, res) => {
    try {
        const sections = await TopSaleSection.find()
            .populate("productIds")
            .sort({ createdAt: -1 });

        res.status(200).json({ sections });
    } catch (err) {
        res.status(500).json({ message: "Error fetching sections", error: err.message });
    }
};

// -------------------- Delete --------------------
exports.deleteTopSaleSection = async (req, res) => {
    const { id } = req.params;

    try {
        const section = await TopSaleSection.findById(id);
        if (!section) {
            return res.status(404).json({ message: "Section not found" });
        }

        // Delete image file if exists
        const imagePath = `./uploads/top_sale_section/${section.image}`;
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        // Delete from DB
        await TopSaleSection.findByIdAndDelete(id);

        res.status(200).json({ message: "Top Sale Section deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting section", error: err.message });
    }
};


// Create Offer Section 
exports.createOfferSection = async (req, res) => {
    const { description, title, coin } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: "Please upload an image" });
    }

    if (!title || title.trim() === "") {
        return res.status(400).json({ message: "Title is required" });
    }

    try {
        // Validate the coin reference
        const coinSettings = await CoinSettings.findById(coin);
        if (!coinSettings) {
            return res.status(400).json({ message: "Invalid coin settings reference" });
        }

        const newOfferSection = new OfferSection({
            image: req.file.filename,
            description,
            title,
            coin: coinSettings._id, // Reference to the CoinSettings model
        });
        console.log(newOfferSection);
        
        await newOfferSection.save();
        res.status(201).json({ message: "Offer Section created successfully", newOfferSection });
    } catch (err) {
        res.status(500).json({ message: "Error creating Offer Section", error: err.message });
    }
};

// Get All Offer Section Products
exports.getAllOfferSection = async (req, res) => {
    try {
        const offerSections = await OfferSection.find().populate('coin').sort({ createdAt: -1 });
        res.status(200).json({ offerSections });
    } catch (err) {
        res.status(500).json({ message: "Error fetching Offer Section", error: err.message });
    }
};

// Update Offer Section Product
exports.updateOfferSectionImages = async (req, res) => {
    const { id } = req.params;
    const { description, title, coin } = req.body;

    try {
        const offerSection = await OfferSection.findById(id).populate('coin');
        if (!offerSection) {
            return res.status(404).json({ message: "Offer Section not found" });
        }

        if (description) offerSection.description = description;
        if (title !== undefined) {
            if (title.trim() === "") {
                return res.status(400).json({ message: "Title is required" });
            }
            offerSection.title = title;
        }

        if (coin) {
            // Validate the coin reference
            const coinSettings = await CoinSettings.findById(coin);
            if (!coinSettings) {
                return res.status(400).json({ message: "Invalid coin settings reference" });
            }
            offerSection.coin = coinSettings._id; // Update the coin reference
        }

        if (req.file) {
            const oldImagePath = `./uploads/offer_section/${offerSection.image}`;
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
            offerSection.image = req.file.filename;
        }

        await offerSection.save();
        res.status(200).json({ message: "Offer Section updated successfully", offerSection });
    } catch (err) {
        res.status(500).json({ message: "Error updating Offer Section", error: err.message });
    }
};

// Delete Offer Section Product
exports.deleteOfferSectionImages = async (req, res) => {
    const { id } = req.params;

    try {
        const offerSection = await OfferSection.findById(id);
        if (!offerSection) {
            return res.status(404).json({ message: "Offer Section not found" });
        }

        const imagePath = `./uploads/offer_section/${offerSection.image}`;
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        await offerSection.deleteOne();
        res.status(200).json({ message: "Offer Section deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting Offer Section", error: err.message });
    }
};


// Create
exports.createInfoSection = async (req, res) => {
  try {
    const { description, referralId } = req.body;
    const imageFile = req.file ? req.file.filename : null;

    if (!referralId) {
      return res.status(400).json({ message: "ReferralSection ID is required" });
    }

    const newEntry = new InfoSection({
      description,
      image: imageFile,
      referralId,
    });

    await newEntry.save();
    res.status(201).json({ message: "Info section entry created", data: newEntry });
  } catch (error) {
    console.error("Error creating InfoSection:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Get all
exports.getInfoSection = async (req, res) => {
  try {
    const entries = await InfoSection.find().populate("referralId", 'title');
    res.status(200).json(entries);
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Update
exports.updateInfoSection = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, referralId } = req.body;
    const imageFile = req.file ? req.file.filename : undefined;

    const updatedEntry = await InfoSection.findByIdAndUpdate(
      id,
      {
        ...(description && { description }),
        ...(imageFile && { image: imageFile }),
        ...(referralId && { referralId }),
      },
      { new: true }
    );

    if (!updatedEntry) {
      return res.status(404).json({ message: "Entry not found" });
    }

    res.status(200).json({ message: "Info section updated", data: updatedEntry });
  } catch (error) {
    console.error("Error updating InfoSection:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Delete
exports.deleteInfoSection = async (req, res) => {
  try {
    const { id } = req.params;
    await InfoSection.findByIdAndDelete(id);
    res.status(200).json({ message: "Entry deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};