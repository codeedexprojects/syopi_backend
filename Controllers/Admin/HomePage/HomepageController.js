const AffordableProducts = require("../../../Models/Admin/AffordableProductModel");
const LowestPriceProducts = require("../../../Models/Admin/LowestProductModel");
const TopPicks = require("../../../Models//Admin/TopPicksModel")
const TopSaleSection = require("../../../Models/Admin/TopSaleSectionModel");
const ReferralSection = require("../../../Models/Admin/ReferralSectionModel");

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


// Create Top Pick Product
exports.createTopPickProduct = async (req, res) => {
    const { description, title } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: "Please upload an image" });
    }

    if (!title || title < 0) {
        return res.status(400).json({ message: "Top pick price is required and must be non-negative" });
    }

    try {
        const newProduct = new TopPicks({
            image: req.file.filename,
            description,
            title
        });

        await newProduct.save();
        res.status(201).json({ message: "Top pick product created successfully", newProduct });
    } catch (err) {
        res.status(500).json({ message: "Error creating product", error: err.message });
    }
};

// Get All Top Picks
exports.getAllTopPickProducts = async (req, res) => {
    try {
        const topPickProducts = await TopPicks.find().sort({ createdAt: -1 });
        res.status(200).json({ topPickProducts });
    } catch (err) {
        res.status(500).json({ message: "Error fetching products", error: err.message });
    }
};

// Update Top Pick Product
exports.updateTopPickProduct = async (req, res) => {
    const { id } = req.params;
    const { description, title } = req.body;

    try {
        const product = await TopPicks.findById(id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        if (description) product.description = description;
        if (title !== undefined) {
            if (title < 0) {
                return res.status(400).json({ message: "Top pick price must be non-negative" });
            }
            product.title = title;
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

// Delete Top Pick Product
exports.deleteTopPickProduct = async (req, res) => {
    const { id } = req.params;

    try {
        const product = await TopPicks.findById(id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const imagePath = `./uploads/top_picks/${product.image}`;
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        await TopPicks.findByIdAndDelete(id);
        res.status(200).json({ message: "Top pick product deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting product", error: err.message });
    }
};



// Create Top Sale Section Product
exports.createTopSaleSection = async (req, res) => {
    const { description, title } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: "Please upload an image" });
    }

    if (!title || title.trim() === "") {
        return res.status(400).json({ message: "Title is required" });
    }

    try {
        const newProduct = new TopSaleSection({
            image: req.file.filename,
            description,
            title
        });

        await newProduct.save();
        res.status(201).json({ message: "Top Sale Section product created successfully", newProduct });
    } catch (err) {
        res.status(500).json({ message: "Error creating Top Sale Section product", error: err.message });
    }
};

// Get All Top Sale Section Products
exports.getAllTopSaleSectionProducts = async (req, res) => {
    try {
        const topSaleSectionProducts = await TopSaleSection.find().sort({ createdAt: -1 });
        res.status(200).json({ topSaleSectionProducts });
    } catch (err) {
        res.status(500).json({ message: "Error fetching Top Sale Section products", error: err.message });
    }
};

// Update Top Sale Section Product
exports.updateTopSaleSectionProduct = async (req, res) => {
    const { id } = req.params;
    const { description, title } = req.body;

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
        res.status(500).json({ message: "Error updating Top Sale Section product", error: err.message });
    }
};

// Delete Top Sale Section Product
exports.deleteTopSaleSectionProduct = async (req, res) => {
    const { id } = req.params;

    try {
        const product = await TopSaleSection.findById(id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const imagePath = `./uploads/top_sale_section/${product.image}`;
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        await product.deleteOne();
        res.status(200).json({ message: "Top Sale Section product deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting Top Sale Section product", error: err.message });
    }
};

// Create Referral Section Product
exports.createReferralSection = async (req, res) => {
    const { description, title } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: "Please upload an image" });
    }

    if (!title || title.trim() === "") {
        return res.status(400).json({ message: "Title is required" });
    }

    try {
        const newProduct = new ReferralSection({
            image: req.file.filename,
            description,
            title
        });

        await newProduct.save();
        res.status(201).json({ message: "Referral Section product created successfully", newProduct });
    } catch (err) {
        res.status(500).json({ message: "Error creating Referral Section product", error: err.message });
    }
};

// Get All Referral Section Products
exports.getAllReferralSection = async (req, res) => {
    try {
        const referralSection = await ReferralSection.find().sort({ createdAt: -1 });
        res.status(200).json({ referralSection });
    } catch (err) {
        res.status(500).json({ message: "Error fetching Referral Section ", error: err.message });
    }
};

// Update Referral Section Product
exports.updateReferralSectionImages = async (req, res) => {
    const { id } = req.params;
    const { description, title } = req.body;

    try {
        const Images = await ReferralSection.findById(id);
        if (!Images) {
            return res.status(404).json({ message: "Images not found" });
        }

        if (description) Images.description = description;
        if (title !== undefined) {
            if (title.trim() === "") {
                return res.status(400).json({ message: "Title is required" });
            }
            Images.title = title;
        }

        if (req.file) {
            const oldImagePath = `./uploads/referral_section/${Images.image}`;
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
            Images.image = req.file.filename;
        }

        await Images.save();
        res.status(200).json({ message: "Referral Section Images updated successfully", Images });
    } catch (err) {
        res.status(500).json({ message: "Error updating Referral Section product", error: err.message });
    }
};

// Delete Referral Section Product
exports.deleteReferralSectionImages = async (req, res) => {
    const { id } = req.params;

    try {
        const Images = await ReferralSection.findById(id);
        if (!Images) {
            return res.status(404).json({ message: "Images not found" });
        }

        const imagePath = `./uploads/referral_section/${Images.image}`;
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        await Images.deleteOne();
        res.status(200).json({ message: "Referral Section Images deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting Referral Section Images", error: err.message });
    }
};
