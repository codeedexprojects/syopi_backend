const express = require('express');
const router = express.Router();
const sliderController = require('../../../Controllers/Admin/Slider/SliderController');
const categorySliderController = require('../../../Controllers/Admin/Slider/SliderController');
const brandSliderController = require('../../../Controllers/Admin/Slider/SliderController');
const verifyToken = require('../../../Middlewares/jwtConfig');
const multerConfig = require('../../../Middlewares/MulterConfig');

// --- Product Sliders  ---
router.post('/create', verifyToken(['admin']), multerConfig.single('image'), sliderController.createSlider);
router.get('/get', verifyToken(['admin']), sliderController.getAllSliders);
router.get('/get/:id', verifyToken(['admin']), sliderController.getSliderById);
router.patch('/update/:id', verifyToken(['admin']), multerConfig.single('image'), sliderController.updateSlider);
router.delete('/delete/:id', verifyToken(['admin']), sliderController.deleteSlider);
router.get('/search', verifyToken(['admin']), sliderController.searchSliders);

// --- Category Sliders ---
router.post('/category/create', verifyToken(['admin']), multerConfig.single('image'), categorySliderController.createCategorySlider);
router.get('/category/get', verifyToken(['admin']), categorySliderController.getAllCategorySliders);
router.get('/category/get/:id', verifyToken(['admin']), categorySliderController.getCategorySliderById);
router.patch('/category/update/:id', verifyToken(['admin']), multerConfig.single('image'), categorySliderController.updateCategorySlider);
router.delete('/category/delete/:id', verifyToken(['admin']), categorySliderController.deleteCategorySlider);

// --- Brand Sliders ---
router.post('/brand/create', verifyToken(['admin']), multerConfig.single('image'), brandSliderController.createBrandSlider);
router.get('/brand/get', verifyToken(['admin']), brandSliderController.getAllBrandSliders);
router.get('/brand/get/:id', verifyToken(['admin']), brandSliderController.getBrandSliderById);
router.patch('/brand/update/:id', verifyToken(['admin']), multerConfig.single('image'), brandSliderController.updateBrandSlider);
router.delete('/brand/delete/:id', verifyToken(['admin']), brandSliderController.deleteBrandSlider);

module.exports = router;
