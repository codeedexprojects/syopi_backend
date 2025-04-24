const NotificationModel = require("../../../Models/Admin/NotificationModel");
const UserModel = require("../../../Models/User/UserModel");

exports.updatePlayerId = async (req, res) => {
    const userId = req.user.id; // assuming you use JWT and decoded user is attached to req.user
    const { playerId } = req.body;
  
    try {
      const user = await UserModel.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
  
      user.playerId = playerId;
      await user.save();
  
      res.status(200).json({ message: "Player ID updated" });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };

  exports.getUserNotifications = async (req, res) => {
    try {
      const userId = req.user.id;
  
      const notifications = await NotificationModel.find({ userId })
        .sort({ createdAt: -1 });
  
      res.status(200).json({ notifications });
    } catch (error) {
      console.error("Error fetching notifications:", error.message);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  };
  