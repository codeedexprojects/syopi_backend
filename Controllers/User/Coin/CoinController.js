const CoinSettings = require("../../../Models/Admin/CoinModel");

// Get current coin settings (including referral coins for referrer & user)
exports.getCoinSettings = async (req, res) => {
  try {
    let settings = await CoinSettings.findOne();

    res.json(settings);
  } catch (error) {
    console.error("Error fetching coin settings:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};