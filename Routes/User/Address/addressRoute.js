const express = require('express');
const router = express.Router();
const addressController = require('../../../Controllers/User/Address/addressController');
const verifyToken = require('../../../Middlewares/jwtConfig');

// Add a new address
router.post('/add',verifyToken(['customer']),addressController.addAddress);

// Get all addresses for a user
router.get('/view',verifyToken(['customer']),addressController.getAddressesByUserId);

// get defaultaddress true address
router.get('/default',verifyToken(['customer']),addressController.getDefaultAddress);

// Update an address by ID
router.patch('/update/:id',verifyToken(['customer']),addressController.updateAddress);

// Delete an address by ID
router.delete('/delete/:id',verifyToken(['customer']),addressController.deleteAddress);



module.exports = router;