const express = require('express');
const router = express.Router();
const SubcategoryController = require('../../../Controllers/User/SubCategory/SubCategoryController')
const verifyToken = require('../../../Middlewares/jwtConfig')
const multerConfig=require('../../../Middlewares/MulterConfig')



// get category
router.get('/view',SubcategoryController.getSubCategories)
// view by id
router.get('/view/:id',SubcategoryController.getSubCategoryById)
// view by category
router.get('/view/subcategory/:id',SubcategoryController.getSubCategoryByCategory)




module.exports=router