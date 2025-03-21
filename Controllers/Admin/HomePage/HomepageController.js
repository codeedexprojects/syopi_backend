const AffordableProducts = require("../../../Models/Admin/AffordableProductModel");
const LowestPriceProducts = require("../../../Models/Admin/LowestProductModel");

const fs = require("fs");

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
        const lowestPriceProducts = await LowestPriceProducts.find().sort({ createdAt: -1 });
        res.status(200).json({ affordableProducts, lowestPriceProducts });
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
