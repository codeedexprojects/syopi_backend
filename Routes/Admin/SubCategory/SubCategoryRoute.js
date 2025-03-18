const express = require('express');
const router = express.Router();
const subCategoryController = require('../../../Controllers/Admin/SubCategory/SubCategorycontroller')
const verifyToken = require('../../../Middlewares/jwtConfig');
const multerConfig = require('../../../Middlewares/MulterConfig');

// create new subcategory
router.post('/create',verifyToken(['admin']),multerConfig.single('image'),subCategoryController.createSubCategory);

// get all subcategories
router.get('/get',verifyToken(['admin']),subCategoryController.getSubCategories);

// get a subcategory by id
router.get('/get/:id',verifyToken(['admin']),subCategoryController.getSubCategoryById);

// view subcategory by categoryId
router.get('/view/subcategory/:id',verifyToken(['admin']),subCategoryController.getSubCategoryByCategory);

// update subcategory
router.patch('/update/:id',verifyToken(['admin']),multerConfig.single('image'),subCategoryController.updateSubCategory);

// delete subcategory
router.delete('/delete/:id',verifyToken(['admin']),subCategoryController.deleteSubCategory);

// search subcategory
router.get('/search',verifyToken(['admin']),subCategoryController.searchSubCategory);



module.exports = router; 