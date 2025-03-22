const express = require('express');
const router = express.Router();
const CommissionController = require('../../../Controllers/Admin/Commission/CommissionController')
const verifyToken = require('../../../Middlewares/jwtConfig')


router.get('/view',verifyToken(['admin']),CommissionController.getCommissionSettings)
router.put('/update',verifyToken(['admin']),CommissionController.updateCommissionRate)



module.exports=router