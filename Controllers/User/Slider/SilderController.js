const Slider = require('../../../Models/Admin/SliderModel');

// get all sliders
exports.getAllSlider = async(req,res) => {
    try {
        const sliders = await Slider.find().populate('category');
        res.status(200).json(sliders);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching sliders', error: err.message });
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