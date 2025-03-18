const Notification = require('../../../Models/Admin/NotificationModel');
const fs = require('fs');

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
            role: req.user.role === "vendor" ? "Vendor" : "Admin",
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
    const vendorId = req.user.id;
    try {
        const notifications = await Notification.find({ ownerId: vendorId, role: "Vendor" });
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
    const { title,description } = req.body;

    try {
        const notification = await Notification.findById(id);
        if(!notification){
            return res.status(404).json({ message: 'Notification not found' })
        }
        if(title) notification.title = title;
        if(description) notification.description = description;
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

    try {
        const notification = await Notification.findById(id);
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
    const ownerId = req.user.id;

    try {
        const query = { ownerId };
        if(title){
            query.title = { $regex: title, $options: 'i' };
        }

        const notification = await Notification.find(query);
        res.status(200).json(notification);
    } catch (err) {
        res.status(500).json({ message: 'Error searching Notification', error: err.message });
    }
}