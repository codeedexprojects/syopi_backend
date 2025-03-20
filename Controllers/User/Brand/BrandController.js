const Brand = require('../../../Models/Admin/BrandModel');

// Get all brands
exports.getBrands = async (req, res) => {
    try {
        const brands = await Brand.find();
        res.status(200).json(brands);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching brands', error: err.message });
    }
}

// Get a brand by ID
exports.getBrandById = async (req, res) => {
    const { id } = req.params;

    try {
        const brand = await Brand.findById(id);
        if (!brand) {
            return res.status(404).json({ message: 'Brand not found' });
        }
        res.status(200).json(brand);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching brand', error: err.message });
    }
}
