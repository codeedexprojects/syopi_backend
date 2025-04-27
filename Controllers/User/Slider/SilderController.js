const Slider = require('../../../Models/Admin/SliderModel');
const CategorySlider = require('../../../Models/Admin/CategorySlider');
const BrandSlider = require('../../../Models/Admin/BrandSlider');

// Get all Sliders (Product, Category, and Brand)
exports.getAllSliders = async (req, res) => {
    try {
        // Fetch all Product Sliders
        const productSliders = await Slider.find();

        // Fetch all Category Sliders
        const categorySliders = await CategorySlider.find();

        // Fetch all Brand Sliders
        const brandSliders = await BrandSlider.find();

        // Return a combined response with all sliders
        res.status(200).json({
            productSliders,
            categorySliders,
            brandSliders
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching all sliders', error: err.message });
    }
}


// get a slider by id
exports.getSliderById = async(req,res) => {
    const { id } = req.params;
    try {
        const slider = await Slider.findById(id).populate('category');
        if(!slider){
            return res.status(400).json({ message: "Slider not found" })
        }
        res.status(200).json(slider)
    } catch (err) {
        res.status(500).json({message: 'Error fetching slider',error: err.message});
    }
} 