const vendorOrder = require('../../../Models/Vendor/VendorOrderModel')

exports.getOrderByVendorId = async (req, res) => {
    try {
        const vendorId = req.user.id
        console.log(vendorId);
        
    const orders = await vendorOrder.find({vendorId})
    return res.status(200).json({success: true, orders})
    } catch (error) {
        console.error(error);

    }
}