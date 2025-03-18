const Banner = require('../../../Models/Admin/BannerModel');
const fs = require('fs');

// Create Banner
exports.createBanner = async (req, res) => {
    const { title, link } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: "Please upload an image" });
    }

    try {
        const newBanner = new Banner({
            title,
            link,
            image: req.file.filename,
            ownerId: req.user.id,
            role: req.user.role
        });

        await newBanner.save();
        res.status(201).json({ message: "Banner created successfully", newBanner });
    } catch (err) {
        res.status(500).json({ message: 'Error creating banner', error: err.message });
    }
}

// Get all banners
exports.getAllBanners = async (req, res) => {
    try {
        const banners = await Banner.find();
        res.status(200).json(banners);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching banners', error: err.message });
    }
}

// Get a banner by ID
exports.getBannerById = async (req, res) => {
    const { id } = req.params;
    try {
        const banner = await Banner.findById(id);
        if (!banner) {
            return res.status(404).json({ message: "Banner not found" });
        }
        res.status(200).json(banner);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching banner', error: err.message });
    }
}

// Update banner
exports.updateBanner = async (req, res) => {
    const { id } = req.params;
    const { title, link, isActive } = req.body;

    try {
        const banner = await Banner.findById(id);
        if (!banner) {
            return res.status(404).json({ message: "Banner not found" });
        }

        if (title) banner.title = title;
        if (link) banner.link = link;
        if (isActive !== undefined) banner.isActive = isActive;

        if (req.file) {
            const oldImagePath = `./uploads/banners/${banner.image}`;
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
            banner.image = req.file.filename;
        }

        await banner.save();
        res.status(200).json({ message: 'Banner updated successfully', banner });
    } catch (err) {
        res.status(500).json({ message: 'Error updating banner', error: err.message });
    }
}

// Delete a banner
exports.deleteBanner = async (req, res) => {
    const { id } = req.params;

    try {
        const banner = await Banner.findById(id);
        if (!banner) {
            return res.status(404).json({ message: "Banner not found" });
        }

        const imagePath = `./uploads/banners/${banner.image}`;
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        await banner.deleteOne();
        res.status(200).json({ message: 'Banner deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting banner', error: err.message });
    }
}


