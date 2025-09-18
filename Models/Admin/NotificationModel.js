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
  notificationType: {
    type: String,
    enum: ['order', 'offerOnProduct', 'offerOnCategory', 'updation'],
    // required: true
  },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
  subCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: "subCategoryId", default: null },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
  isRead: { type: Boolean, default: false },
  isBroadcast: { type: Boolean, default: false },
  image: {
        type:String
    }
},
{timestamps: true}
);

module.exports = mongoose.model("Notification", notificationSchema);
