const express = require('express');
const router = express.Router();
const categoryController = require('../../../Controllers/Admin/Category/Categoycontroller')
const verifyToken = require('../../../Middlewares/jwtConfig')
const multerConfig=require('../../../Middlewares/MulterConfig')


// create category

router.post('/create',verifyToken(['admin']),multerConfig.single('image'),categoryController.createCategory)
// get category
router.get('/view',verifyToken(['admin']),categoryController.getCategories)
// view by id
router.get('/view/:id',verifyToken(['admin']),categoryController.getCategoryById)
// update category
router.patch('/update/:id',verifyToken(['admin']),multerConfig.single('image'),categoryController.updateCategory)
// delete category
router.delete('/delete/:id',verifyToken(['admin']),categoryController.deleteCategory)



module.exports=router