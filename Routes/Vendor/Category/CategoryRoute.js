const express = require('express');
const router = express.Router();
const categoryController = require('../../../Controllers/Vendor/Category/CategoryController');
const verifyToken = require('../../../Middlewares/jwtConfig');

// get all categories
router.get('/view',verifyToken(['vendor']),categoryController.getAllCategories);

// get category by id
router.get('/view/:id',verifyToken(['vendor']),categoryController.getCategoryById);

module.exports = router;