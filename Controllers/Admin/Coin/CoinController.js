const CoinSettings = require("../../../Models/Admin/CoinModel");

// Get current coin settings
exports.getCoinSettings = async (req, res) => {
  try {
    const settings = await CoinSettings.findOne();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Update coin settings
exports.updateCoinSettings = async (req, res) => {
  try {
    const { percentage, minAmount } = req.body;

    let settings = await CoinSettings.findOne();
    if (!settings) {
      settings = new CoinSettings({ percentage, minAmount });
    } else {
      settings.percentage = percentage;
      settings.minAmount = minAmount;
      settings.updatedAt = Date.now();
    }
    await settings.save();

    res.json({ message: "Coin settings updated successfully", settings });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
