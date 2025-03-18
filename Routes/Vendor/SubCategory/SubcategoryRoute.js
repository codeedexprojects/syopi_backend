const express = require('express');
const router = express.Router();
const subcategoryController = require('../../../Controllers/Vendor/Subcategory/SubcategoryController');
const verifyToken = require('../../../Middlewares/jwtConfig');

// view subcategory
router.get('/view',verifyToken(['vendor']),subcategoryController.getSubcategories);

// view subcategory by id
router.get('/view/:id',verifyToken(['vendor']),subcategoryController.getSubCategoryById);

// view subcategory
router.get('/view/subcategory/:id',verifyToken(['vendor']),subcategoryController.getSubCategoryByCategory);

module.exports = router;