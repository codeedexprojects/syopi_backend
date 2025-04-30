const AffordableProducts = require("../../../Models/Admin/AffordableProductModel");
const LowestPriceProducts = require("../../../Models/Admin/LowestProductModel");
const TopPicks = require("../../../Models//Admin/TopPicksModel")
const TopSaleSection = require("../../../Models/Admin/TopSaleSectionModel");
const OfferSection = require("../../../Models/Admin/OfferSectionModel");
const Category = require('../../../Models/Admin/CategoryModel');  
const Subcategory = require('../../../Models/Admin/SubCategoryModel');  
const fs = require("fs");
const CoinSettings = require('../../../Models/Admin/CoinModel')

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


exports.createTopPickProduct = async (req, res) => {
    const { description, title, categoryId, subcategoryId } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: "Please upload an image" });
    }

    if (!title || title.trim() === "") {
        return res.status(400).json({ message: "Title is required" });
    }

    if (!categoryId || !subcategoryId) {
        return res.status(400).json({ message: "Category and Subcategory IDs are required" });
    }

    try {
        // Ensure the category ID is valid
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        // Ensure the subcategory ID is valid and belongs to the category
        const subcategory = await Subcategory.findById(subcategoryId);
        if (!subcategory) {
            return res.status(404).json({ message: "Subcategory not found" });
        }
        if (!subcategory.category.equals(categoryId)) {
            return res.status(400).json({ message: "Subcategory does not belong to the specified category" });
        }

        const newProduct = new TopPicks({
            image: req.file.filename,
            description,
            title,
            category: categoryId,
            subcategory: subcategoryId  // Store subcategory ID
        });

        await newProduct.save();
        res.status(201).json({ message: "Top pick product created successfully", newProduct });
    } catch (err) {
        res.status(500).json({ message: "Error creating product", error: err.message });
    }
};

// -------------------- Update Top Pick Product --------------------

// Update Top Pick Product with Category and Subcategory
exports.updateTopPickProduct = async (req, res) => {
    const { id } = req.params;
    const { description, title, categoryId, subcategoryId } = req.body;

    try {
        const product = await TopPicks.findById(id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        if (description) product.description = description;
        if (title !== undefined) {
            if (title.trim() === "") {
                return res.status(400).json({ message: "Title is required" });
            }
            product.title = title;
        }

        if (categoryId) {
            const category = await Category.findById(categoryId);
            if (!category) {
                return res.status(404).json({ message: "Category not found" });
            }
            product.category = categoryId;
        }

        if (subcategoryId) {
            const subcategory = await Subcategory.findById(subcategoryId);
            if (!subcategory) {
                return res.status(404).json({ message: "Subcategory not found" });
            }
            if (!subcategory.category.equals(product.category)) {
                return res.status(400).json({ message: "Subcategory does not belong to the specified category" });
            }
            product.subcategory = subcategoryId;
        }

        if (req.file) {
            const oldImagePath = `./uploads/top_picks/${product.image}`;
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
            product.image = req.file.filename;
        }

        await product.save();
        res.status(200).json({ message: "Top pick product updated successfully", product });
    } catch (err) {
        res.status(500).json({ message: "Error updating product", error: err.message });
    }
};

// -------------------- Get All Top Pick Products --------------------

// Get all Top Picks with category and subcategory information
exports.getAllTopPickProducts = async (req, res) => {
    try {
        const topPickProducts = await TopPicks.find()
            .populate('category') // Populate category details
            .populate('subcategory') // Populate subcategory details
            .sort({ createdAt: -1 });
        res.status(200).json({ topPickProducts });
    } catch (err) {
        res.status(500).json({ message: "Error fetching products", error: err.message });
    }
};

// -------------------- Create Top Sale Section Product --------------------

// Create Top Sale Section Product with Category and Subcategory
exports.createTopSaleSection = async (req, res) => {
    const { description, title, categoryId, subcategoryId } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: "Please upload an image" });
    }

    if (!title || title.trim() === "") {
        return res.status(400).json({ message: "Title is required" });
    }

    if (!categoryId || !subcategoryId) {
        return res.status(400).json({ message: "Category and Subcategory IDs are required" });
    }

    try {
        // Ensure the category ID is valid
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        // Ensure the subcategory ID is valid and belongs to the category
        const subcategory = await Subcategory.findById(subcategoryId);
        if (!subcategory) {
            return res.status(404).json({ message: "Subcategory not found" });
        }
        if (!subcategory.category.equals(categoryId)) {
            return res.status(400).json({ message: "Subcategory does not belong to the specified category" });
        }

        const newProduct = new TopSaleSection({
            image: req.file.filename,
            description,
            title,
            category: categoryId,
            subcategory: subcategoryId  // Store subcategory ID
        });

        await newProduct.save();
        res.status(201).json({ message: "Top Sale Section product created successfully", newProduct });
    } catch (err) {
        res.status(500).json({ message: "Error creating product", error: err.message });
    }
};

// -------------------- Update Top Sale Section Product --------------------

// Update Top Sale Section Product with Category and Subcategory
exports.updateTopSaleSectionProduct = async (req, res) => {
    const { id } = req.params;
    const { description, title, categoryId, subcategoryId } = req.body;

    try {
        const product = await TopSaleSection.findById(id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        if (description) product.description = description;
        if (title !== undefined) {
            if (title.trim() === "") {
                return res.status(400).json({ message: "Title is required" });
            }
            product.title = title;
        }

        if (categoryId) {
            const category = await Category.findById(categoryId);
            if (!category) {
                return res.status(404).json({ message: "Category not found" });
            }
            product.category = categoryId;
        }

        if (subcategoryId) {
            const subcategory = await Subcategory.findById(subcategoryId);
            if (!subcategory) {
                return res.status(404).json({ message: "Subcategory not found" });
            }
            if (!subcategory.category.equals(product.category)) {
                return res.status(400).json({ message: "Subcategory does not belong to the specified category" });
            }
            product.subcategory = subcategoryId;
        }

        if (req.file) {
            const oldImagePath = `./uploads/top_sale_section/${product.image}`;
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
            product.image = req.file.filename;
        }

        await product.save();
        res.status(200).json({ message: "Top Sale Section product updated successfully", product });
    } catch (err) {
        res.status(500).json({ message: "Error updating product", error: err.message });
    }
};

// -------------------- Get All Top Sale Section Products --------------------

// Get all Top Sale Section products with category and subcategory information
exports.getAllTopSaleSectionProducts = async (req, res) => {
    try {
        const topSaleSectionProducts = await TopSaleSection.find()
            .populate('category') // Populate category details
            .populate('subcategory') // Populate subcategory details
            .sort({ createdAt: -1 });
        res.status(200).json({ topSaleSectionProducts });
    } catch (err) {
        res.status(500).json({ message: "Error fetching products", error: err.message });
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
