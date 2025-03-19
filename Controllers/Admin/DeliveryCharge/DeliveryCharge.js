const DeliverySetting = require('../../../Models/Admin/DeliveryChargeModel')


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
  