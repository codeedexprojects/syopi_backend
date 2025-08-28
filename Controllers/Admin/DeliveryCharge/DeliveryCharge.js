const DeliverySetting = require('../../../Models/Admin/DeliveryChargeModel')
const Order = require('../../../Models/User/OrderModel');



//For updating delivery charge
exports.updateDeliverySettings = async (req, res) => {
    const { minAmountForFreeDelivery, deliveryCharge } = req.body;
  
    try {
      let settings = await DeliverySetting.findOne();
      if (!settings) {
        settings = new DeliverySetting({ minAmountForFreeDelivery, deliveryCharge });
      } else {
        settings.minAmountForFreeDelivery = minAmountForFreeDelivery;
        settings.deliveryCharge = deliveryCharge;
      }
      await settings.save();
  
      res.status(200).json({ message: "Delivery settings updated", settings });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };

  // Get current delivery settings
  exports.getDeliverySettings = async (req, res) => {
    try {
      const settings = await DeliverySetting.findOne();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
  

exports.getTotalDeliveryCharges = async (req, res) => {
  try {
    const totalDeliveryCharges = await Order.aggregate([
      { $match: { status: 'Delivered' } }, // Only count delivered orders
      {
        $group: {
          _id: null,
          totalDeliveryCharges: { $sum: '$deliveryCharge' },
          orderCount: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      totalDeliveryCharges: totalDeliveryCharges[0]?.totalDeliveryCharges || 0,
      totalOrdersWithDeliveryCharge: totalDeliveryCharges[0]?.orderCount || 0
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching delivery charges", error: error.message });
  }
};
