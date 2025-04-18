const Product = require("../../../Models/Admin/productModel");

// Get purchase cost details and profit calculation for Admin
exports.getAdminPurchaseData = async (req, res) => {
    try {
        
        const products = await Product.find({ ownerType: "admin" });

        let purchaseData = products.map(product => {
            let totalPurchaseCost = 0;
            let totalSalesRevenue = 0;
            let totalProfit = 0;

            product.variants.forEach(variant => {
                let costPrice = variant.wholesalePrice;
                let sellingPrice = variant.offerPrice || variant.price;
                let totalSales = variant.salesCount;

                let purchaseCost = costPrice * totalSales;
                let salesRevenue = sellingPrice * totalSales;
                let profit = salesRevenue - purchaseCost;

                totalPurchaseCost += purchaseCost;
                totalSalesRevenue += salesRevenue;
                totalProfit += profit;
            });

            return {
                productId: product._id,
                name: product.name,
                totalPurchaseCost,
                totalSalesRevenue,
                totalProfit
            };
        });

        res.status(200).json(purchaseData);
    } catch (error) {
        res.status(500).json({ message: "Error fetching purchase data", error: error.message });
    }
};


