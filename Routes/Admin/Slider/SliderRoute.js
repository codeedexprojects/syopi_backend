const express = require('express');
const router = express.Router();
const sliderController = require('../../../Controllers/Admin/Slider/SliderController');
const verifyToken = require('../../../Middlewares/jwtConfig');
const multerConfig = require('../../../Middlewares/MulterConfig');

//create new slider
router.post('/create',verifyToken(['admin']),multerConfig.single('image'),sliderController.createslider);

// get all slider
router.get('/get',verifyToken(['admin']),sliderController.getAllSlider);

//get a slider
router.get('/get/:id',verifyToken(['admin']),sliderController.getSliderById);

// update slider
router.patch('/update/:id',verifyToken(['admin']),multerConfig.single('image'),sliderController.updateSlider);

// delete slider
router.delete('/delete/:id',verifyToken(['admin']),sliderController.deleteSlider);

//search sliders
router.get('/search',verifyToken(['admin']),sliderController.searchSliders);

module.exports = router;