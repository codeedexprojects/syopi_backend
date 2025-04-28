const Brand = require('../../../Models/Admin/BrandModel');

// Get all brands (Vendor Side)
exports.getAllBrands = async (req, res) => {
    try {
        const brands = await Brand.find().sort({ createdAt: -1 }); // No populate needed for vendor side unless required
        res.status(200).json(brands);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching brands', error: err.message });
    }
};

// Get a single brand by ID (Vendor Side)
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
};
