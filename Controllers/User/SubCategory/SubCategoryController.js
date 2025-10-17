const SubCategory=require('../../../Models/Admin/SubCategoryModel')

// get all Subcategories
exports.getSubCategories = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20; // Default limit set to 20
        const skip = (page - 1) * limit;

        const subCategories = await SubCategory.find()
            .populate('category')
            .skip(skip)
            .limit(limit);

        const totalSubCategories = await SubCategory.countDocuments();

        res.status(200).json({
            subCategories,
            totalPages: Math.ceil(totalSubCategories / limit),
            currentPage: page,
            totalSubCategories
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching subcategories', error: err.message });
    }
};


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
exports.getSubCategoryByCategory = async (req, res) => {
    const { id } = req.params;
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20; // Default limit 20
        const skip = (page - 1) * limit;

        const subCategories = await SubCategory.find({ category: id })
            .populate('category')
            .skip(skip)
            .limit(limit);

        const totalSubCategories = await SubCategory.countDocuments({ category: id });

        if (!subCategories.length) {
            return res.status(404).json({ message: "SubCategories not found" });
        }

        res.status(200).json({
            subCategories,
            totalPages: Math.ceil(totalSubCategories / limit),
            currentPage: page,
            totalSubCategories
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching subcategories', error: err.message });
    }
};

exports.getSubCategoriesByIds = async (req, res) => {
  try {
    const { ids } = req.body; // Expecting an array of subcategory IDs in request body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Please provide an array of subcategory IDs" });
    }

    const validIds = ids.filter(id => /^[0-9a-fA-F]{24}$/.test(id));
    if (validIds.length === 0) {
      return res.status(400).json({ message: "No valid SubCategory IDs provided" });
    }

    const subCategories = await SubCategory.find({ _id: { $in: validIds } })
      .populate("category");

    if (!subCategories.length) {
      return res.status(404).json({ message: "No subcategories found for the provided IDs" });
    }

    res.status(200).json({
      success: true,
      count: subCategories.length,
      subCategories
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching subcategories by IDs",
      error: err.message
    });
  }
};