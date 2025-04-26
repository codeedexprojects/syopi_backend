const Slider = require('../../../Models/Admin/SliderModel');
const fs = require('fs');

// Create a slider
exports.createSlider = async (req, res) => {
    const { title, offerType, offerIds } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: "Please upload an image" });
    }

    try {
        const newSlider = new Slider({
            title,
            offerType,
            offerIds,
            image: req.file.filename,
            role: req.user.role,       // 'admin' or 'vendor'
            ownerId: req.user.id,      // authenticated user ID
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
        const sliders = await Slider.find().populate('offerIds');
        res.status(200).json(sliders);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching sliders', error: err.message });
    }
};

// Get a slider by ID
exports.getSliderById = async (req, res) => {
    const { id } = req.params;

    try {
        const slider = await Slider.findById(id).populate('offerIds');
        if (!slider) return res.status(404).json({ message: "Slider not found" });

        res.status(200).json(slider);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching slider', error: err.message });
    }
};

// Update slider
exports.updateSlider = async (req, res) => {
    const { id } = req.params;
    const { title, offerType, offerIds, isActive } = req.body;

    try {
        const slider = await Slider.findById(id);
        if (!slider) return res.status(404).json({ message: "Slider not found" });

        if (title) slider.title = title;
        if (offerType) slider.offerType = offerType;
        if (offerIds) slider.offerIds = offerIds;
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

        const sliders = await Slider.find(query).populate('offerIds');
        res.status(200).json(sliders);
    } catch (err) {
        res.status(500).json({ message: 'Error searching sliders', error: err.message });
    }
};
