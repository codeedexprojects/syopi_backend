const express = require('express');
const router = express.Router();
const offerController = require('../../../Controllers/Vendor/Offer/OfferController');
const verifyAdminToken = require('../../../Middlewares/jwtConfig'); // Assuming middleware for checking admin role

// Create Offer (Admin only)
router.post('/create', verifyAdminToken(['vendor']), offerController.createOffer);

// Get All Offers
router.get('/get', verifyAdminToken(['vendor']), offerController.getOffers);

// get an offer  by id
router.get('/get/:id', verifyAdminToken(['vendor']), offerController.getOfferById);

// Update Offer
router.patch('/update/:id', verifyAdminToken(['vendor']), offerController.updateOffer);

// Delete Offer
router.delete('/delete/:id', verifyAdminToken(['vendor']), offerController.deleteOffer);

//expire
router.post("/trigger-cleanup", verifyAdminToken(['vendor']), offerController.triggerOfferCleanup)

module.exports = router;
 