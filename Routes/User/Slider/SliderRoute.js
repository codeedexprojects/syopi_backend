const express = require('express');
const router = express.Router();
const sliderController = require('../../../Controllers/User/Slider/SilderController');

// get all slider
router.get('/get',sliderController.getAllSlider);

//get a slider by id
router.get('/get/:id',sliderController.getSliderById);

module.exports = router;