const express = require('express');
const router = express.Router();
const notificationController = require('../../../Controllers/Vendor/Notification/NotificationController');
const multerConfig = require('../../../Middlewares/MulterConfig');
const verifyToken = require('../../../Middlewares/jwtConfig');

//create notification
router.post('/create',verifyToken(['vendor']),multerConfig.single('image'),notificationController.createNotification);

//get notifications
router.get('/get',verifyToken(['vendor']),notificationController.getNotifications);

//get notifications by id
router.get('/get/:id',verifyToken(['vendor']),notificationController.getNotificationById);

// update notification
router.patch('/update/:id',verifyToken(['vendor']),multerConfig.single('image'),notificationController.updateNotification);

// delete notification
router.delete('/delete/:id',verifyToken(['vendor']),notificationController.deleteNotification);

// search notifications
router.get('/search',verifyToken(['vendor']),notificationController.searchNotifications);

module.exports = router;