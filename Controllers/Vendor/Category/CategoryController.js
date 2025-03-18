const Category = require('../../../Models/Admin/CategoryModel');

//view categories
exports.getAllCategories = async (req,res) => {
    try {
        const categories = await Category.find();
        if(!categories){
            return res.status(401).json({ message: "Categories not found" })
        }
        res.status(200).json(categories)
    } catch (error) {
        res.status(500).json({ message: 'Error fetching categories', error: error.message });
    }
}

// get category by id
exports.getCategoryById = async(req,res) => {
    const { id } = req.params;
    try {
        const category = await Category.findById(id);
        if(!category){
            return res.status(404).json({ message: 'Category not found' })
        }
        res.status(200).json(category)
    } catch (error) {
        res.status(500).json({ message: 'Error fetching category', error: error.message });
    }
}