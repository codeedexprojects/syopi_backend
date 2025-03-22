const AdminSettings = require('../../../Models/Admin/CommissionModel');

exports.updateCommissionRate = async (req, res) => {
    try {
        const { commissionRate } = req.body;
        
        if (!commissionRate || commissionRate < 0) {
            return res.status(400).json({ error: 'Invalid commission rate' });
        }

        let settings = await AdminSettings.findOne();
        if (!settings) {
            settings = new AdminSettings();
        }
        settings.commissionRate = commissionRate;
        await settings.save();

        res.status(200).json({ message: 'Commission rate updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

// Get current commission settings
exports.getCommissionSettings = async (req, res) => {
  try {
    const settings = await AdminSettings.findOne();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

