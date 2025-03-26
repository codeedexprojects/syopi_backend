const Category=require('../../../Models/Admin/CategoryModel')


// get categories
exports.getCategories = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20; // Default limit set to 20
        const skip = (page - 1) * limit;

        const categories = await Category.find()
            .skip(skip)
            .limit(limit);

        const totalCategories = await Category.countDocuments();

        res.status(200).json({
            categories,
            totalPages: Math.ceil(totalCategories / limit),
            currentPage: page,
            totalCategories
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching categories', error: err.message });
    }
};


// get a category by Id

exports.getCategoryById = async (req, res)=> {
    const { id } = req.params;

    try {
        const category = await Category.findById(id);
        if(!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.status(200).json(category);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching category', error: err.message });
    }
}