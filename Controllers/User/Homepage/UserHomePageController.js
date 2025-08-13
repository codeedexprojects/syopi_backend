const getProduct = require('../../../utils/getProducts');
const Slider = require('../../../Models/Admin/SliderModel');
const BrandSlider = require('../../../Models/Admin/BrandSlider')
const CategorySlider = require('../../../Models/Admin/CategorySlider')
const Banner = require('../../../Models/Admin/BannerModel');
const affordableProductsModel= require('../../../Models/Admin/AffordableProductModel');
const LowestProductModel = require('../../../Models/Admin/LowestProductModel')
const OfferModel = require('../../../Models/Admin/offerModel');
const Brand = require('../../../Models/Admin/BrandModel');
const TopPicksModel = require('../../../Models/Admin/TopPicksModel')
const TopSaleSectionModel = require('../../../Models/Admin/TopSaleSectionModel')
const OfferSectionModel = require('../../../Models/Admin/OfferSectionModel')
const InfoSection = require('../../../Models/Admin/InfoSection');


exports.getHomePage = async (req, res) => {
    try {
        let userId;
        if (req.user && req.user.id) {
            userId = req.user.id;
        }

        // Fetch all products (ensure createdAt, salesCount, price, offerPrice, and rating fields are included)
        const allProducts = await getProduct(userId);

        if (!Array.isArray(allProducts) || allProducts.length === 0) {
        return res.status(200).json({
            message: "No products found",
            total: 0,
            products: [],
            topSales: [],
            newArrivals: [],
            brands: await Brand.find().populate('discount'),
            affordableProducts: await affordableProductsModel.find(),
            lowToHighProducts: await LowestProductModel.find(),
            topPicksBestPrice: await TopPicksModel.find(),
            OfferSection: await OfferSectionModel.find(),
            ProductSliders: await Slider.find({ isActive: true }),
            CategorySliders: await CategorySlider.find({ isActive: true }),
            BrandSliders: await BrandSlider.find({ isActive: true }),
            featuringBrandsNow: []
            });
        }

        const topSales = await TopSaleSectionModel.find();

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

        const brands = await Brand.find().populate('discount');
        const OfferSection = await OfferSectionModel.find();
        const topPicksBestPrice = await TopPicksModel.find();

        // Fetch sliders
        const ProductSliders = await Slider.find({ isActive: true }).populate('productIds')
        const CategorySliders = await CategorySlider.find({ isActive: true });
        const BrandSliders = await BrandSlider.find({ isActive: true });

       

        const featuringBrandsNow = [];

        // For each brand, find the top 1 sold product (instead of top 2)
        for (const brand of brands) {
            // Find all products of the current brand
            const brandProducts = allProducts.filter(product => product.brand.toString() === brand._id.toString());
            
            // Sort the products by salesCount (descending) and get the top 1
            const topProduct = brandProducts
                .sort((a, b) => b.salesCount - a.salesCount) // Sorting based on salesCount
                .slice(0, 1); // Get the top 1 sold product

            // Check if there's a top product and add it to the array
            if (topProduct.length > 0) {
                featuringBrandsNow.push(topProduct[0]);  // Add the top product
            }
        }

        // Return the response with all the sections
        res.status(200).json({
            topSales,
            newArrivals, // Newly added products (with filter applied)
            brands, 
            affordableProducts, // Products under ₹1000
            lowToHighProducts, // Products sorted from low to high price
            topPicksBestPrice, // Your Top Picks in the Best Price section
            OfferSection,
            ProductSliders,
            CategorySliders,
            BrandSliders,
            featuringBrandsNow // Top 1 product per brand
        });

    } catch (error) {
        res.status(500).json({ message: "Error fetching homepage products", error: error.message });
    }
};

exports.getInfoSection = async (req, res) => {
    try {
        const referralId = req.params.id        
        const data = await InfoSection.find({referralId}).sort({ createdAt: -1 });

        res.status(200).json({
            message: "Info fetched successfully",
            data
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};


