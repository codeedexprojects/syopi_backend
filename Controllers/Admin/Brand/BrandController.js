const Brand = require('../../../Models/Admin/BrandModel');
const fs = require('fs');
const path = require('path');

// Create a new brand
exports.createBrand = async (req, res) => {
    const { name, description } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: 'Brand logo is required' });
    }

    try {
        // Check if brand name already exists
        const existingBrand = await Brand.findOne({ name });
        if (existingBrand) {
            return res.status(400).json({ message: 'Brand name already exists' });
        }

        const newBrand = new Brand({
            name,
            logo: req.file.filename,
            description
        });

        await newBrand.save();
        res.status(201).json({ message: 'Brand created successfully', brand: newBrand });
    } catch (err) {
        res.status(500).json({ message: 'Error creating brand', error: err.message });
    }
};

// Get all brands
exports.getBrands = async (req, res) => {
    try {
        const brands = await Brand.find().sort({ createdAt: -1 }); // Sort by newest first
        res.status(200).json(brands);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching brands', error: err.message });
    }
};

// Get a brand by ID
exports.getBrandById = async (req, res) => {
    let { id } = req.params;
    id = id.trim();
    
    try {
        const brand = await Brand.findById(id);
        console.log(brand);
        
        if (!brand) {
            return res.status(404).json({ message: 'Brand not found' });
        }
        res.status(200).json(brand);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching brand', error: err.message });
    }
};

// Update a brand
exports.updateBrand = async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    try {
        const brand = await Brand.findById(id);
        if (!brand) {
            return res.status(404).json({ message: 'Brand not found' });
        }

        // Check if name is being changed and if it already exists
        if (name && name !== brand.name) {
            const existingBrand = await Brand.findOne({ name });
            if (existingBrand) {
                return res.status(400).json({ message: 'Brand name already exists' });
            }
            brand.name = name;
        }

        if (description) brand.description = description;

        // Update logo if a new file is uploaded
        if (req.file) {
            const oldImagePath = path.join(__dirname, `../../../uploads/brand/${brand.logo}`);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath); // Remove old logo if exists
            }
            brand.logo = req.file.filename; // Update to new logo filename
        }

        await brand.save(); // Save the updated brand
        res.status(200).json({ message: 'Brand updated successfully', brand });
    } catch (err) {
        res.status(500).json({ message: 'Error updating brand', error: err.message });
    }
};

// Delete a brand
exports.deleteBrand = async (req, res) => {
    const { id } = req.params;

    try {
        const brand = await Brand.findById(id);
        if (!brand) {
            return res.status(404).json({ message: 'Brand not found' });
        }

        // Delete brand logo file
        const imagePath = path.join(__dirname, `../../../uploads/brand/${brand.logo}`);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        await Brand.findByIdAndDelete(id);
        res.status(200).json({ message: 'Brand deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting brand', error: err.message });
    }
};

// Search brand by name
exports.searchBrand = async (req, res) => {
    const { name } = req.query;
    try {
        const query = {};
        if (name) {
            query.name = { $regex: name, $options: 'i' };
        }
        const brands = await Brand.find(query);
        res.status(200).json(brands);
    } catch (err) {
        res.status(500).json({ message: 'Error searching brands', error: err.message });
    }
};
