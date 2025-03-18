const express = require('express');
const router = express.Router();
const categoryController = require('../../../Controllers/User/Category/CategoryController')
const verifyToken = require('../../../Middlewares/jwtConfig')
const multerConfig=require('../../../Middlewares/MulterConfig')



// get category
router.get('/view',categoryController.getCategories)
// view by id
router.get('/view/:id',categoryController.getCategoryById)



module.exports=router