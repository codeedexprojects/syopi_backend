const SubCategory=require('../../../Models/Admin/SubCategoryModel')

// get all Subcategories
exports.getSubCategories = async (req,res) => {
    try {
        const subCategories = await SubCategory.find().populate('category')
        res.status(200).json({subCategories});
    } catch (err) {
        res.status(500).json({message: 'Error fetching categories', error:err.message})
    }
}

// get a subCategory by id 

exports.getSubCategoryById = async(req,res) => {
    const { id } = req.params;
    try {
        const subCategory = await SubCategory.findById(id).populate('category')
        if(!subCategory){
            return res.status(404).json({ message: "SubCategory not found" });
        }
        res.status(200).json(subCategory);
    } catch (err) {
        res.status(500).json({message: 'Error fetching subcategory',error: err.message});
    }
}

// get a subcategorieds by category
exports.getSubCategoryByCategory = async(req,res) => {
    const { id } = req.params;
    try {
        const subCategory = await SubCategory.find({category:id}).populate('category')
        if(!subCategory){
            return res.status(404).json({ message: "SubCategory not found" });
        }
        res.status(200).json(subCategory);
    } catch (err) {
        res.status(500).json({message: 'Error fetching subcategory',error: err.message});
    }
}