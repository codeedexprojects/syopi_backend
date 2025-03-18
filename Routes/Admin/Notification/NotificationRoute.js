const express = require('express');
const router = express.Router();
const notificationController = require('../../../Controllers/Admin/Notification/NotificationController');
const verifyToken = require('../../../Middlewares/jwtConfig');
const multerConfig = require('../../../Middlewares/MulterConfig');
const { verify } = require('jsonwebtoken');

//create notification
router.post('/create',verifyToken(['admin']),multerConfig.single('image'),notificationController.createNotification);

//get notifications
router.get('/get',verifyToken(['admin']),notificationController.getNotifications);

//get notifications by id
router.get('/get/:id',verifyToken(['admin']),notificationController.getNotificationById);

// update notification
router.patch('/update/:id',verifyToken(['admin']),multerConfig.single('image'),notificationController.updateNotification);

// delete notification
router.delete('/delete/:id',verifyToken(['admin']),notificationController.deleteNotification);

// search notifications
router.get('/search',verifyToken(['admin']),notificationController.searchNotifications);

module.exports = router;