// const mongoose = require('mongoose');

// const notificationSchema = new mongoose.Schema({
//     title: {
//         type: String,
//         required: true
//     },
//     role: {
//         type: String,
//         required: true,
//     },
//     ownerId: {
//         type: mongoose.Schema.Types.ObjectId,
//         required: true,
//         refPath: 'role'
//     },
//     image: {
//         type:String
//     },
//     description: {
//         type: String,
//         required: true
//     },
// },{ timestamps: true });

// const Notification = mongoose.model('Notification',notificationSchema);

// module.exports = Notification;

// models/NotificationModel.js
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Notification", notificationSchema);
