const Slider = require('../../../Models/Admin/SliderModel');
const fs = require('fs');
const CategorySlider = require('../../../Models/Admin/CategorySlider');
const BrandSlider = require('../../../Models/Admin/BrandSlider');


// Create a slider
exports.createSlider = async (req, res) => {
    let { title, productIds } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: "Please upload an image" });
    }

     if (typeof productIds === 'string') {
            productIds = JSON.parse(productIds);
        }
    try {
        const newSlider = new Slider({
            title,
            productIds,
            image: req.file.filename,
            role: req.user.role,    // 'admin' or 'vendor'
            ownerId: req.user.id,   // authenticated user ID
        });

        await newSlider.save();
        res.status(201).json({ message: "Slider created successfully", newSlider });
    } catch (err) {
        res.status(500).json({ message: 'Error creating slider', error: err.message });
    }
};

// Get all sliders
exports.getAllSliders = async (req, res) => {
    try {
        const sliders = await Slider.find().populate('productIds');   // populate product
        res.status(200).json(sliders);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching sliders', error: err.message });
    }
};

// Get a slider by ID
exports.getSliderById = async (req, res) => {
    const { id } = req.params;

    try {
        const slider = await Slider.findById(id).populate('productIds');
        if (!slider) return res.status(404).json({ message: "Slider not found" });

        res.status(200).json(slider);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching slider', error: err.message });
    }
};

// Update slider
exports.updateSlider = async (req, res) => {
    const { id } = req.params;
    const { title, productIds, isActive } = req.body;

    try {
        const slider = await Slider.findById(id);
        if (!slider) return res.status(404).json({ message: "Slider not found" });

        if (title) slider.title = title;
        if (productIds) slider.productIds = productIds;
        if (typeof isActive === 'boolean') slider.isActive = isActive;

        if (req.file) {
            const oldImagePath = `./uploads/slider/${slider.image}`;
            if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
            slider.image = req.file.filename;
        }

        await slider.save();
        res.status(200).json({ message: 'Slider updated successfully', slider });
    } catch (err) {
        res.status(500).json({ message: 'Error updating slider', error: err.message });
    }
};

// Delete a slider
exports.deleteSlider = async (req, res) => {
    const { id } = req.params;

    try {
        const slider = await Slider.findById(id);
        if (!slider) return res.status(404).json({ message: "Slider not found" });

        const imagePath = `./uploads/slider/${slider.image}`;
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);

        await slider.deleteOne();
        res.status(200).json({ message: 'Slider deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting slider', error: err.message });
    }
};

// Search sliders by title
exports.searchSliders = async (req, res) => {
    const { title } = req.query;

    try {
        const query = {};
        if (title) query.title = { $regex: title, $options: 'i' };

        const sliders = await Slider.find(query).populate('productId');
        res.status(200).json(sliders);
    } catch (err) {
        res.status(500).json({ message: 'Error searching sliders', error: err.message });
    }
};

// Create a category slider
exports.createCategorySlider = async (req, res) => {
    const { title, categoryId, subCategoryId } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: "Please upload an image" });
    }

    try {
        const newSlider = new CategorySlider({
            title,
            categoryId,
            subCategoryId,
            image: req.file.filename,
            role: req.user.role,
            ownerId: req.user.id,
        });

        await newSlider.save();
        res.status(201).json({ message: "Category Slider created successfully", newSlider });
    } catch (err) {
        res.status(500).json({ message: 'Error creating category slider', error: err.message });
    }
};

// Get all category sliders
exports.getAllCategorySliders = async (req, res) => {
    try {
        const sliders = await CategorySlider.find()
            .populate('categoryId')
            .populate('subCategoryId');

        res.status(200).json(sliders);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching category sliders', error: err.message });
    }
};

// Get a category slider by ID
exports.getCategorySliderById = async (req, res) => {
    const { id } = req.params;

    try {
        const slider = await CategorySlider.findById(id)
            .populate('categoryId')
            .populate('subCategoryId');

        if (!slider) return res.status(404).json({ message: "Category Slider not found" });

        res.status(200).json(slider);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching category slider', error: err.message });
    }
};

// Update a category slider
exports.updateCategorySlider = async (req, res) => {
    const { id } = req.params;
    const { title, categoryId, subCategoryId, isActive } = req.body;

    try {
        const slider = await CategorySlider.findById(id);
        if (!slider) return res.status(404).json({ message: "Category Slider not found" });

        if (title) slider.title = title;
        if (categoryId) slider.categoryId = categoryId;
        if (subCategoryId) slider.subCategoryId = subCategoryId;
        if (typeof isActive === 'boolean') slider.isActive = isActive;

        if (req.file) {
            const oldImagePath = `./uploads/slider/${slider.image}`;
            if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
            slider.image = req.file.filename;
        }

        await slider.save();
        res.status(200).json({ message: 'Category Slider updated successfully', slider });
    } catch (err) {
        res.status(500).json({ message: 'Error updating category slider', error: err.message });
    }
};

// Delete a category slider
exports.deleteCategorySlider = async (req, res) => {
    const { id } = req.params;

    try {
        const slider = await CategorySlider.findById(id);
        if (!slider) return res.status(404).json({ message: "Category Slider not found" });

        const imagePath = `./uploads/slider/${slider.image}`;
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);

        await slider.deleteOne();
        res.status(200).json({ message: 'Category Slider deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting category slider', error: err.message });
    }
};



// Create a brand slider
exports.createBrandSlider = async (req, res) => {
    const { title, brandId } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: "Please upload an image" });
    }

    try {
        const newSlider = new BrandSlider({
            title,
            brandId, 
            image: req.file.filename,
            role: req.user.role,
            ownerId: req.user.id,
        });

        await newSlider.save();
        res.status(201).json({ message: "Brand Slider created successfully", newSlider });
    } catch (err) {
        res.status(500).json({ message: 'Error creating brand slider', error: err.message });
    }
};

// Get all brand sliders
exports.getAllBrandSliders = async (req, res) => {
    try {
        const sliders = await BrandSlider.find().populate('brandId'); // Populate brand details
        res.status(200).json(sliders);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching brand sliders', error: err.message });
    }
};

// Get a brand slider by ID
exports.getBrandSliderById = async (req, res) => {
    const { id } = req.params;

    try {
        const slider = await BrandSlider.findById(id).populate('brandId'); // Populate brand details
        if (!slider) return res.status(404).json({ message: "Brand Slider not found" });

        res.status(200).json(slider);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching brand slider', error: err.message });
    }
};

// Update a brand slider
exports.updateBrandSlider = async (req, res) => {
    const { id } = req.params;
    const { title, brandId, isActive } = req.body;

    try {
        const slider = await BrandSlider.findById(id);
        if (!slider) return res.status(404).json({ message: "Brand Slider not found" });

        // Update fields if provided
        if (title) slider.title = title;
        if (brandId) slider.brandId = brandId; // update brandId
        if (typeof isActive === 'boolean') slider.isActive = isActive;

        // If a new image is uploaded, replace the old image
        if (req.file) {
            const oldImagePath = `./uploads/slider/${slider.image}`;
            if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath); // Delete old image
            slider.image = req.file.filename; // Save new image filename
        }

        await slider.save();
        res.status(200).json({ message: 'Brand Slider updated successfully', slider });
    } catch (err) {
        res.status(500).json({ message: 'Error updating brand slider', error: err.message });
    }
};

// Delete a brand slider
exports.deleteBrandSlider = async (req, res) => {
    const { id } = req.params;

    try {
        const slider = await BrandSlider.findById(id);
        if (!slider) return res.status(404).json({ message: "Brand Slider not found" });

        // Delete the image from the file system
        const imagePath = `./uploads/slider/${slider.image}`;
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);

        // Delete the slider from the database
        await slider.deleteOne();
        res.status(200).json({ message: 'Brand Slider deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting brand slider', error: err.message });
    }
};