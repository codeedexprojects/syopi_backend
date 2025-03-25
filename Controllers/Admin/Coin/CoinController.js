const CoinSettings = require("../../../Models/Admin/CoinModel");

// Get current coin settings (including referral coins)
exports.getCoinSettings = async (req, res) => {
  try {
    let settings = await CoinSettings.findOne();
    if (!settings) {
      settings = await CoinSettings.create({
        percentage: 0,
        minAmount: 0,
        referralCoins: 50, // Default referral coins
      });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Update coin settings (including referral coins)
exports.updateCoinSettings = async (req, res) => {
  try {
    const { percentage, minAmount, referralCoins } = req.body;

    let settings = await CoinSettings.findOne();
    if (!settings) {
      settings = new CoinSettings({ percentage, minAmount, referralCoins });
    } else {
      settings.percentage = percentage;
      settings.minAmount = minAmount;
      settings.referralCoins = referralCoins;
      settings.updatedAt = Date.now();
    }
    await settings.save();

    res.json({ message: "Coin settings updated successfully", settings });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
