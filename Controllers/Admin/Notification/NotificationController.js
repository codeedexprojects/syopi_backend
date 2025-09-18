const Notification = require('../../../Models/Admin/NotificationModel');
const fs = require('fs');
const axios = require('axios');
const UserModel = require('../../../Models/User/UserModel');
const NotificationModel = require('../../../Models/Admin/NotificationModel');


//create new notification
exports.createNotification = async (req,res) => {
    const { title,description } = req.body;

    if(!req.file){
        return res.status(400).json({ message: "Notification Image is required" })
    }

    try {
        const newNotification = new Notification({
            title,
            image: req.file.filename,
            description,
            ownerId: req.user.id,
            role: req.user.role === "admin" ? "Admin": "Vendor",
        })
        console.log(newNotification);
        await newNotification.save();
        res.status(201).json({ message: 'Notification created successfully', notification:newNotification })
    } catch (err) {
        res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
}

// get all notifications
exports.getNotifications = async (req,res) => {
    try {
        const notifications = await Notification.find();
        if(!notifications){
            return res.status(404).json({ message: "Notifications not found" })
        }
        res.status(200).json(notifications);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching Notification', error:err.message })
    }
}

// get notification by id
exports.getNotificationById = async (req,res) => {
    const { id } = req.params;

    try {
        const notification = await Notification.findById(id).populate("ownerId");
        if(!notification){
            return res.status(404).json({ message: "Notification not found" })
        }
        res.status(200).json(notification)
    } catch (err) {
        res.status(500).json({ message: 'Error fetching Notification',error: err.message })
    }
}

// update notification
exports.updateNotification = async (req,res) => {
    const { id } = req.params;
    const { title,description,date,time } = req.body;

    try {
        const notification = await Notification.findById(id);
        if(!notification){
            return res.status(404).json({ message: 'Notification not found' })
        }
        if(title) notification.title = title;
        if(description) notification.description = description;
        if(date) notification.date = date;
        if(time) notification.time = time;
        if(req.file){
            const imagePath = `./uploads/notification/${notification.image}`;
            if(fs.existsSync(imagePath)){
                fs.unlinkSync(imagePath)
            }
            notification.image = req.file.filename;
        }
        await notification.save();
        res.status(200).json({ message: 'Notification updated successfully', notification })
    } catch (err) {
        res.status(500).json({ message: 'Error updating Notification', error: err.message });
    }
}

// delete notification
exports.deleteNotification = async(req,res) => {
    const { id } = req.params;
    console.log(id);

    try {
        const notification = await Notification.findById(id);
        console.log(notification);
        if(!notification){
            return res.status(404).json({ message: 'Notification not found' })
        }
        const oldImagePath = `./uploads/notification/${notification.image}`;
        if(fs.existsSync(oldImagePath)){
            fs.unlinkSync(oldImagePath)
        }
        await notification.deleteOne();
        res.status(200).json({ message: 'Notification deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting Notification', error: err.message });
    }
}

//search notifications
exports.searchNotifications = async (req,res) => {
    const { title } = req.query;

    try {
        const query = {};
        if(title){
            query.title = { $regex: title, $options: 'i' };
        }

        const notification = await Notification.find(query);
        res.status(200).json(notification);
    } catch (err) {
        res.status(500).json({ message: 'Error searching Notification', error: err.message });
    }
}

const sendNotification = async (userId, title, message, data = {}, image) => {
  const imageUrl = image ? `${process.env.SERVER_URL}/uploads/${image}` : null;

  const payload = {
    app_id: process.env.ONESIGNAL_APP_ID,
    include_external_user_ids: Array.isArray(userId) ? userId : [userId],
    headings: { en: title },
    contents: { en: message },
    data
  };

  if (imageUrl) {
    payload.big_picture = imageUrl;
    payload.ios_attachments = {
      id1: imageUrl 
    };
  }

  await axios.post('https://onesignal.com/api/v1/notifications', payload, {
    headers: {
      Authorization: `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });
};

exports.notifyUser = async (req, res) => {
  try {
    const { userId, title, message, orderId, productId, categoryId, subCategoryId, notificationType } = req.body;
    const image = req.file ? req.file.filename : null;
    const imageUrl = image ? `${process.env.SERVER_URL}/uploads/${image}` : null;

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Build custom data object
    const customData = {};
    if (orderId) customData.orderId = orderId;
    if (productId) customData.productId = productId;
    if (categoryId) customData.categoryId = categoryId;
    if (subCategoryId) customData.subCategoryId = subCategoryId;

    // Send the notification
    await sendNotification(userId, title, message, customData, image);

    // Store the notification once
    await NotificationModel.create({
      userId,
      title,
      message,
      orderId: orderId || null,
      productId: productId || null,
      categoryId: categoryId || null,
      subCategoryId: subCategoryId || null,
      notificationType,
      image: imageUrl,
      isBroadcast: false
    });

    res.status(200).json({ message: 'Notification sent to user and stored once' });
  } catch (error) {
    console.error('Error sending user notification:', error.message);
    res.status(500).json({ message: 'Failed to send notification', error: error.message });
  }
};




const sendBroadcastNotification = async (title, message, data = {}, image) => {
  const imageUrl = image ? `${process.env.SERVER_URL}/uploads/${image}` : null;

  const payload = {
    app_id: process.env.ONESIGNAL_APP_ID,
    included_segments: ["All"],
    headings: { en: title },
    contents: { en: message },
    data
  };

  if (imageUrl) {
    payload.big_picture = imageUrl;
  }

  await axios.post("https://onesignal.com/api/v1/notifications", payload, {
    headers: {
      Authorization: `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
      "Content-Type": "application/json",
    },
  });
};

exports.notifyAllUsers = async (req, res) => {
  try {
    const { title, message, productId, categoryId, subCategoryId, notificationType } = req.body;
    const image = req.file ? req.file.filename : null;
    const imageUrl = image ? `${process.env.SERVER_URL}/uploads/${image}` : null;

    const customData = {};
    if (productId) customData.productId = productId;
    if (categoryId) customData.categoryId = categoryId;
    if (subCategoryId) customData.subCategoryId = subCategoryId;

    await sendBroadcastNotification(title, message, customData, image);

    await NotificationModel.create({
      title,
      message,
      productId: productId || null,
      categoryId: categoryId || null,
      subCategoryId: subCategoryId || null,
      notificationType,
      image: imageUrl,
      isBroadcast: true  
    });

    res.status(200).json({ message: "Broadcast notification sent & stored once" });
  } catch (error) {
    console.error("Error sending broadcast notification:", error.message);
    res.status(500).json({ message: "Failed to send broadcast notification", error: error.message });
  }
};

exports.resendNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await NotificationModel.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Build custom data
    const customData = {};
    if (notification.orderId) customData.orderId = notification.orderId;
    if (notification.productId) customData.productId = notification.productId;
    if (notification.categoryId) customData.categoryId = notification.categoryId;
    if (notification.subCategoryId) customData.subCategoryId = notification.subCategoryId;

    // Image URL if exists
    const imageUrl = notification.image || null;

    // Decide between user-specific or broadcast
    if (notification.isBroadcast) {
      // Broadcast
      await sendBroadcastNotification(notification.title, notification.message, customData, imageUrl);
    } else if (notification.userId) {
      // User-specific
      await sendNotification(notification.userId, notification.title, notification.message, customData, imageUrl);
    }

    res.status(200).json({ message: "Notification resent successfully" });
  } catch (error) {
    console.error("Error resending notification:", error);
    res.status(500).json({ message: "Failed to resend notification", error: error.message });
  }
};
