const Slider = require('../../../Models/Admin/SliderModel');
const fs = require('fs');

// create slider
exports.createslider = async (req,res) => {
    const { title,link,category } = req.body;

    if(!req.file){
        return res.status(400).json({ message: "Please upload a image" });
    }
    let role;
    if(req.user.role === "vendor"){
        role = "Vendor"
    }

    try {
        const newSlider = new Slider({
            title,
            link,
            category,
            image: req.file.filename,
            ownerId: req.user.id,
            role
        })
        await newSlider.save();
        res.status(201).json({ message: "Slider created successfully", newSlider });
    } catch (err) {
        res.status(500).json({ message: 'Error creating slider', error: err.message });
    }
}

// get all sliders
exports.getAllSlider = async(req,res) => {
    const vendorId = req.user.id;
    try {
        const sliders = await Slider.find({ ownerId: vendorId, role: "Vendor" }).populate('category');
        res.status(200).json(sliders);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching sliders', error: err.message });
    }
}

// get a slider by id
exports.getSliderById = async(req,res) => {
    const { id } = req.params;
    try {
        const slider = await Slider.findById(id).populate('category','ownerId');
        if(!slider){
            return res.status(400).json({ message: "Slider not found" })
        }
        res.status(200).json(slider)
    } catch (err) {
        res.status(500).json({message: 'Error fetching slider',error: err.message});
    }
} 

// update slider
exports.updateSlider = async (req,res) => {
    const { id } = req.params;

    const { title,link,category,isActive } =req.body;

    try {
        const slider = await Slider.findById(id);
        if(!slider){
            return res.status(404).json({ message: "Slider not found" });
        }

        if(title) slider.title = title;
        if(link) slider.link = link;
        if(category) slider.category = category;
        if(isActive !== undefined) slider.isActive = isActive;

        if(req.file){
            const oldImagePath = `./uploads/category/${slider.image}`;
            if(fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
            slider.image = req.file.filename;
        }
        await slider.save();

        res.status(200).json({ message: 'Slider updated successfully', slider });
    } catch (err) {
        res.status(500).json({ message: 'Error updating slider', error: err.message });
    }
}

// delete a slider
exports.deleteSlider = async (req,res) => {
    const { id } = req.params;

    try {
        const slider = await Slider.findById(id);
        if(!slider) {
            return res.status(404).json({ message: "Slider not found" });
        }
        const imagePath = `./uploads/category/${slider.image}`;
        if(fs.existsSync(imagePath)){
            fs.unlinkSync(imagePath);
        }
        await slider.deleteOne();
        res.status(200).json({ message: 'Slider deleted successfully' })
    } catch (err) {
        res.status(500).json({ message: 'Error deleting slider', error: err.message })
    }
}

//search sliders
exports.searchSliders = async (req,res) => {
    const { title } = req.query;
    const ownerId = req.user.id;

    try {
        const query = { ownerId };
        if(title) {
            query.title = { $regex: title, $options: 'i' }
        }
        const slider =  await Slider.find(query);
        res.status(200).json(slider);
    } catch (err) {
        res.status(500).json({ message: 'Error searching Slider', error: err.message });
    }
}