const express = require('express');
const router = express.Router();
const offerController = require('../../../Controllers/Admin/offer/offerController');
const verifyAdminToken = require('../../../Middlewares/jwtConfig'); // Assuming middleware for checking admin role

// Create Offer (Admin only)
router.post('/create', verifyAdminToken(['admin']), offerController.createOffer);

// Get All Offers
router.get('/get', offerController.getOffers);

// get an offer  by id
router.get('/get/:id', offerController.getOfferById);

// Update Offer
router.patch('/update/:id', verifyAdminToken(['admin']), offerController.updateOffer);

// Delete Offer
router.delete('/delete/:id', verifyAdminToken(['admin']), offerController.deleteOffer);

//expire
router.post("/trigger-cleanup", verifyAdminToken(['admin']), offerController.triggerOfferCleanup)

module.exports = router;
 