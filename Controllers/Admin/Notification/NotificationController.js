const Notification = require('../../../Models/Admin/NotificationModel');
const fs = require('fs');
const axios = require('axios');
const UserModel = require('../../../Models/User/UserModel');


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

// ✅ Send notification to a specific user
exports.notifyUser = async (req, res) => {
    try {
      const { userId, title, message } = req.body;
  
      const user = await UserModel.findById(userId);
      if (!user || !user.playerId) {
        return res.status(404).json({ message: 'User or Player ID not found' });
      }
  
      await sendNotification(user.playerId, title, message);
  
      res.status(200).json({ message: 'Notification sent to user' });
    } catch (error) {
      console.error('Error sending notification:', error.message);
      res.status(500).json({ message: 'Failed to send notification', error: error.message });
    }
  };
  
  // ✅ Send notification to all users
  exports.notifyAllUsers = async (req, res) => {
    try {
      const { title, message } = req.body;
  
      const users = await UserModel.find({ playerId: { $exists: true, $ne: null } });
      const playerIds = users.map((user) => user.playerId);
  
      if (playerIds.length === 0) {
        return res.status(404).json({ message: 'No users with player IDs found' });
      }
  
      await sendNotification(playerIds, title, message);
  
      res.status(200).json({ message: 'Notification sent to all users' });
    } catch (error) {
      console.error('Error sending bulk notification:', error.message);
      res.status(500).json({ message: 'Failed to send bulk notification', error: error.message });
    }
  };

  const sendNotification = async (playerIds, title, message) => {
    const payload = {
      app_id: process.env.ONESIGNAL_APP_ID,
      include_player_ids: Array.isArray(playerIds) ? playerIds : [playerIds],
      headings: { en: title },
      contents: { en: message },
    };
  
    await axios.post('https://onesignal.com/api/v1/notifications', payload, {
      headers: {
        Authorization: `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
  };