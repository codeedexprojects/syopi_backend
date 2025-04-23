const express = require('express');
const router = express.Router();
const notificationController = require('../../../Controllers/User/Notification/notificationController')
const verifyToken = require('../../../Middlewares/jwtConfig')

// create or add new product to cart
router.post('/save-player-id',verifyToken(['customer']),notificationController.updatePlayerId)



module.exports=router