const Category = require('../../../Models/Admin/CategoryModel')

const fs = require('fs');
const path = require('path');


// create a new category
exports.createCategory = async (req, res) => {
        const { name,description } = req.body;

        if(!req.file){
            return res.status(400).json({ message: 'Category image is required'});
        }
        try {
            const newCategory = new Category(
                { name: name, image: req.file.filename,description: description }
            );
            await newCategory.save();
            res.status(201).json({ message: 'Category created successfully' , category: newCategory});
        } catch (err) {
            res.status(500).json({ message: 'Error creating category', error: err.message });
            
        } 
    }


// get all categories

exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        res.status(200).json(categories);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching categories', error: err.message });
    }
}

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

exports.updateCategory = async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    try {
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Update name and description if provided
        if (name) category.name = name;
        if (description) category.description = description;

        // Update image if a new image is uploaded
        if (req.file) {
            const oldImagePath = path.join(__dirname, `../uploads/admin/category/${category.image}`);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath); // Remove old image if exists
            }
            category.image = req.file.filename; // Update to new image filename
        }

        await category.save(); // Save the updated category
        res.status(200).json({ message: 'Category updated successfully', category });
    } catch (err) {
        res.status(500).json({ message: 'Error updating category', error: err.message });
    }
};

exports.deleteCategory = async (req,res) => {
    const { id } = req.params;

    try {
        const category = await Category.findById(id);
        if(!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        const imagePath = `./uploads/category/${category.image}`
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }
        await Category.findByIdAndDelete(id);
        res.status(200).json({ message: 'Category deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting category', error: err.message });
    }
};

// search category by name
exports.searchCategory = async (req, res) => {
    const { name } = req.query;
    try {
        const query = {};
        if(name) {
            query.name = { $regex: name, $options: 'i' }; 
        }
        const categories = await Category.find(query);
        res.status(200).json(categories);
    } catch (err) {
        res.status(500).json({ message: 'Error searching categories', error: err.message });
    }
};