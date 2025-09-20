const SubCategory = require('../../../Models/Admin/SubCategoryModel');
const fs = require('fs');

// Create a new subcategory 
exports.createSubCategory = async (req, res) => {
    const { name, description, category, sizes } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: "SubCategory Image is required" });
    }

    try {
        const newSubCategory = new SubCategory({
            name,
            category,
            image: req.file.filename,
            description,
            sizes: sizes ? (Array.isArray(sizes) ? sizes : sizes.split(",").map(s => s.trim())) : []
        });

        await newSubCategory.save();
        res.status(201).json({ message: 'SubCategory created successfully', subCategory: newSubCategory });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error });
    }
}

// Get all subcategories
exports.getSubCategories = async (req, res) => {
    try {
        const subCategories = await SubCategory.find().populate('category');
        res.status(200).json({ subCategories });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching categories', error: err.message });
    }
}

// Get a subcategory by id 
exports.getSubCategoryById = async (req, res) => {
    const { id } = req.params;
    try {
        const subCategory = await SubCategory.findById(id);
        if (!subCategory) {
            return res.status(404).json({ message: "SubCategory not found" });
        }
        res.status(200).json(subCategory);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching subcategory', error: err.message });
    }
}

// Get subcategory by category
exports.getSubCategoryByCategory = async (req, res) => {
    const { id } = req.params;
    try {
        const subcategories = await SubCategory.find({ category: id }).populate('category');
        if (!subcategories || subcategories.length === 0) {
            return res.status(404).json({ message: 'Subcategories not found' });
        }
        res.status(200).json(subcategories);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching subcategories', error: error.message });
    }
}

// Update subcategory
exports.updateSubCategory = async (req, res) => {
    const { id } = req.params;
    const { name, description, category, sizes } = req.body;

    try {
        const subCategory = await SubCategory.findById(id);
        if (!subCategory) {
            return res.status(404).json({ message: 'SubCategory not found' });
        }

        if (name) subCategory.name = name;
        if (description) subCategory.description = description;
        if (category) subCategory.category = category;

        if (sizes) {
            subCategory.sizes = Array.isArray(sizes) ? sizes : sizes.split(",").map(s => s.trim());
        }

        if (req.file) {
            const oldImagePath = `./uploads/${subCategory.image}`;
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
            subCategory.image = req.file.filename;
        }

        await subCategory.save();
        res.status(200).json({ message: 'SubCategory updated successfully', subCategory });

    } catch (err) {
        res.status(500).json({ message: 'Error updating SubCategory', error: err.message });
    }
}

// Delete subcategory
exports.deleteSubCategory = async (req, res) => {
    const { id } = req.params;

    try {
        const subCategory = await SubCategory.findById(id);
        if (!subCategory) {
            return res.status(404).json({ message: 'SubCategory not found' });
        }

        const imagePath = `./uploads/${subCategory.image}`;
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        await SubCategory.findByIdAndDelete(id);
        res.status(200).json({ message: 'SubCategory deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting subcategory', error: err.message });
    }
}

// Search subcategory
exports.searchSubCategory = async (req, res) => {
    const { name } = req.query;

    try {
        const query = {};
        if (name) {
            query.name = { $regex: name, $options: 'i' };
        }

        const subCategory = await SubCategory.find(query);
        res.status(200).json(subCategory);
    } catch (err) {
        res.status(500).json({ message: 'Error searching SubCategories', error: err.message });
    }
}
