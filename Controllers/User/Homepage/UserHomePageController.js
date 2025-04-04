const getProduct = require('../../../utils/getProducts');
const Slider = require('../../../Models/Admin/SliderModel');
const Banner = require('../../../Models/Admin/BannerModel');
const affordableProductsModel= require('../../../Models/Admin/AffordableProductModel');
const LowestProductModel = require('../../../Models/Admin/LowestProductModel')
const OfferModel = require('../../../Models/Admin/offerModel')

exports.getHomePage = async (req, res) => {
    try {
        let userId;
        if (req.user && req.user.id) {
            userId = req.user.id;
        }

        // Fetch all products (ensure createdAt, salesCount, price, offerPrice, and rating fields are included)
        const allProducts = await getProduct(userId);

        if (!allProducts || allProducts.length === 0) {
            return res.status(404).json({ message: "No products found" });
        }

        // Sort products based on salesCount (highest to lowest)
        const sortedProducts = allProducts
            .filter(product => product.totalSales && product.totalSales > 0)
            .sort((a, b) => b.totalSales - a.totalSales);

        // Limit results (default to top 10)
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        const topSales = sortedProducts.slice(0, limit);

        // ** New Arrivals with Filtering (All, Men, Women, Kids, Sale) **
        let filteredNewArrivals = allProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Apply category filter if provided
        if (req.query.category) {
            const categoryFilter = req.query.category.toLowerCase();
            if (["men", "women", "kids"].includes(categoryFilter)) {
                filteredNewArrivals = filteredNewArrivals.filter(product => 
                    product.category.toLowerCase() === categoryFilter
                );
            }
        }

        // Apply sale filter (products with offerPrice lower than price)
        if (req.query.sale === "true") {
            filteredNewArrivals = filteredNewArrivals.filter(product =>
                product.variants.some(variant => variant.offerPrice !== null && variant.offerPrice < variant.price)
            );
        }

        // Limit results to the latest 10
        const newArrivals = filteredNewArrivals.slice(0, 10);

        // Section: Products under ₹1000
        const affordableProducts = await affordableProductsModel.find();

        // Section: Products sorted from lowest price to highest
        const lowToHighProducts = await LowestProductModel.find();

        const activeBrandOffers = await OfferModel.find({
            status: 'active',
            brand: { $ne: [] } // Ensure that there are brands associated with the offer
        });

        

        // "Your Top Picks in the Best Price" – combining best-selling and best-priced products
        const topPicksBestPrice = allProducts
            .filter(product => 
                product.totalSales > 0 && 
                product.variants.some(variant => variant.offerPrice !== null && variant.offerPrice < variant.price)
            )
            .sort((a, b) => {
                const maxDiscountA = Math.max(...a.variants.map(v => v.price - (v.offerPrice ?? v.price)));
                const maxDiscountB = Math.max(...b.variants.map(v => v.price - (v.offerPrice ?? v.price)));
                return maxDiscountB - maxDiscountA; // Sort by best discount
            })
            .slice(0, 10); // Limit to 10 products for this section

        // Fetch active sliders and banners
        const activeSliders = await Slider.find({ isActive: true });
        const activeBanners = await Banner.find({ isActive: true });

        // Return the response with all the sections
        res.status(200).json({
            topSales,
            newArrivals, // Newly added products (with filter applied)
            activeBrandOffers, 
            affordableProducts, // Products under ₹1000
            lowToHighProducts, // Products sorted from low to high price
            topPicksBestPrice, // Your Top Picks in the Best Price section
            activeSliders,
            activeBanners
        });

    } catch (error) {
        res.status(500).json({ message: "Error fetching homepage products", error: error.message });
    }
};
