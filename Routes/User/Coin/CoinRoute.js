const express = require('express');
const router = express.Router();
const CoinController = require('../../../Controllers/User/Coin/CoinController')



router.get('/view',CoinController.getCoinSettings)



module.exports=router