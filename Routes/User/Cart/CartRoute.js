const express = require('express');
const router = express.Router();
const cartController = require('../../../Controllers/User/Cart/cartController')
const verifyToken = require('../../../Middlewares/jwtConfig')



// create or add new product to cart
router.post('/add',verifyToken(['customer']),cartController.createOrUpdateCart)

// view cart
router.get('/view/:userId',verifyToken(['customer']),cartController.getCart)

// increment or decrement qauntity from cart
router.patch('/update/quantity',verifyToken(['customer']),cartController.updateCartQuantity)

// removeproduct
router.delete('/remove/product',verifyToken(['customer']),cartController.removeProductFromCart)

// delete cart
router.delete('/delete/:userId',verifyToken(['customer']),cartController.deleteCart)



module.exports=router