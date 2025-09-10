const express = require('express');
const router = express.Router();
const DeliveryCharge = require('../../../Controllers/Admin/DeliveryCharge/DeliveryCharge')
const verifyToken = require('../../../Middlewares/jwtConfig')


router.get('/view',verifyToken(['admin']),DeliveryCharge.getDeliverySettings)
router.put('/update',verifyToken(['admin']),DeliveryCharge.updateDeliverySettings)
router.get('/delivery-total', verifyToken(['admin']), DeliveryCharge.getTotalDeliveryCharges)



module.exports=router