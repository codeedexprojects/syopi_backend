const express = require('express');
const router = express.Router();
const sliderController = require('../../../Controllers/Vendor/Slider/SliderController');
const multerConfig = require('../../../Middlewares/MulterConfig');
const verifyToken = require('../../../Middlewares/jwtConfig');

//create new slider
router.post('/create',verifyToken(['vendor']),multerConfig.single('image'),sliderController.createslider);

// get all slider
router.get('/get',verifyToken(['vendor']),sliderController.getAllSlider);

//get a slider
router.get('/get/:id',verifyToken(['vendor']),sliderController.getSliderById);

// update slider
router.patch('/update/:id',verifyToken(['vendor']),multerConfig.single('image'),sliderController.updateSlider);

// delete slider
router.delete('/delete/:id',verifyToken(['vendor']),sliderController.deleteSlider);

//search sliders
router.get('/search',verifyToken(['vendor']),sliderController.searchSliders);


module.exports = router;