const Subcategory = require('../../../Models/Admin/SubCategoryModel');


//view subcategory
exports.getSubcategories = async(req,res) =>{
    try {
        const subcategory = await Subcategory.find();
        if(!subcategory){
            return res.status(401).json({ message: "subcategory not found" })
        }
        res.status(200).json(subcategory)
    } catch (error) {
        res.status(500).json({ message: 'Error fetching subcategory', error: error.message });
    }
}

// get category by id
exports.getSubCategoryById = async(req,res) => {
    const { id } = req.params;
    try {
        const subcategory = await Subcategory.findById(id);
        if(!subcategory){
            return res.status(404).json({ message: 'subcategory not found' })
        }
        res.status(200).json(subcategory)
    } catch (error) {
        res.status(500).json({ message: 'Error fetching subcategory', error: error.message });
    }
}

// get subcategory by category
exports.getSubCategoryByCategory = async(req,res) => {
    const { id } = req.params;
    try {
        const subcategories = await Subcategory.find({category: id}).populate('category');
        if(!subcategories){
            return res.status(404).json({ message: 'subcategories not found' })
        }
        res.status(200).json(subcategories)
    } catch (error) {
        res.status(500).json({ message: 'Error fetching subcategories', error: error.message });
    }
}