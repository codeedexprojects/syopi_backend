const express = require('express');
const router = express.Router();
const CoinController = require('../../../Controllers/Admin/Coin/CoinController')
const verifyToken = require('../../../Middlewares/jwtConfig')


router.get('/view',verifyToken(['admin']),CoinController.getCoinSettings)
router.put('/update',verifyToken(['admin']),CoinController.updateCoinSettings)



module.exports=router