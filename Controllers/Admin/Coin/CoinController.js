const CoinSettings = require("../../../Models/Admin/CoinModel");

// Get current coin settings (including referral coins for referrer & user)
exports.getCoinSettings = async (req, res) => {
  try {
    let settings = await CoinSettings.findOne();

    if (!settings) {
      settings = await CoinSettings.create({
        coinValue: 0.5,
        percentage: 4,
        minAmount: 100,
        maxOrderDiscountPercent: 5,
        referralCoins: 100,
        referralCoinsUser: 40
      });
    }

    res.json(settings);
  } catch (error) {
    console.error("Error fetching coin settings:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Update coin settings (including referral coins for referrer & user)
exports.updateCoinSettings = async (req, res) => {
  try {
    const {
      coinValue,
      percentage,
      minAmount,
      maxOrderDiscountPercent,
      referralCoins,
      referralCoinsUser
    } = req.body;

    let settings = await CoinSettings.findOne();

    if (!settings) {
      settings = new CoinSettings({
        coinValue,
        percentage,
        minAmount,
        maxOrderDiscountPercent,
        referralCoins,
        referralCoinsUser
      });
    } else {
      if (coinValue !== undefined) settings.coinValue = coinValue;
      if (percentage !== undefined) settings.percentage = percentage;
      if (minAmount !== undefined) settings.minAmount = minAmount;
      if (maxOrderDiscountPercent !== undefined)
        settings.maxOrderDiscountPercent = maxOrderDiscountPercent;
      if (referralCoins !== undefined) settings.referralCoins = referralCoins;
      if (referralCoinsUser !== undefined) settings.referralCoinsUser = referralCoinsUser;
    }

    await settings.save();

    res.json({ message: "Coin settings updated successfully", settings });
  } catch (error) {
    console.error("Error updating coin settings:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
