const getProduct = require('../../../utils/getProducts');
// const Slider = require('../../../Models/Admin/SliderModel');
// const Banner = require('../../../Models/Admin/BannerModel');
const Review = require("../../../Models/User/ReviewModel");
const moment = require("moment");
const axios = require("axios");
const Brand = require('../../../Models/Admin/BrandModel');
const TopPicks = require('../../../Models/Admin/TopPicksModel')
const TopSaleSection = require('../../../Models/Admin/TopSaleSectionModel')
const ProductSlider = require('../../../Models/Admin/SliderModel')
const Product = require('../../../Models/Admin/productModel')
const User = require('../../../Models/User/UserModel')
const Wishlist = require("../../../Models/User/WishlistModel");


// const affordableProductsModel= require('../../../Models/Admin/AffordableProductModel');
// get all products
const mongoose = require('mongoose');

exports.getallProducts = async (req, res) => {
  try {
    const { 
      brand, productType, minPrice, maxPrice, size, newArrivals, 
      discountMin, discountMax, sort, search, minRating, maxRating, 
      category, subcategory, page = 1, limit = 20, topSales, topPicksId,
      topSaleSectionId, productSliderId
    } = req.query;
    
    let userId = req.user?.id;
    let allProducts = await getProduct(userId);

    if (!allProducts || allProducts.length === 0) {

      return res.status(200).json({
        message: "No products found",
        total: 0,
        products: [],
      });
   }

   // ✅ If topPicksId is provided, filter products by that section's productIds
    if (topPicksId) {
      if (!mongoose.Types.ObjectId.isValid(topPicksId)) {
        return res.status(400).json({ message: "Invalid TopPicks ID" });
      }

      const topPicks = await TopPicks.findById(topPicksId).select("productIds");
      if (!topPicks) {
        return res.status(404).json({ message: "TopPicks not found" });
      }

      const topPicksIds = topPicks.productIds.map(id => id.toString());
      allProducts = allProducts.filter(p => topPicksIds.includes(p._id.toString()));

      if (allProducts.length === 0) {
        return res.status(200).json({ message: "No products found in TopPicks", total: 0, products: [] });
      }
    }

    // ✅ If topSaleSectionId is provided, filter products by that section's productIds
    if (topSaleSectionId) {
      if (!mongoose.Types.ObjectId.isValid(topSaleSectionId)) {
        return res.status(400).json({ message: "Invalid TopSaleSection ID" });
      }

      const topSaleSection = await TopSaleSection.findById(topSaleSectionId).select("productIds");
      if (!topSaleSection) {
        return res.status(404).json({ message: "TopSaleSection not found" });
      }

      const topSaleIds = topSaleSection.productIds.map(id => id.toString());
      allProducts = allProducts.filter(p => topSaleIds.includes(p._id.toString()));

      if (allProducts.length === 0) {
        return res.status(200).json({ message: "No products found in TopSaleSection", total: 0, products: [] });
      }
    }


      if (productSliderId) {
  if (!mongoose.Types.ObjectId.isValid(productSliderId)) {
    return res.status(400).json({ message: "Invalid Product Slider ID" });
  }

  const sliderDoc = await ProductSlider.findById(productSliderId).select("productIds");

  if (!sliderDoc) {
    return res.status(404).json({ message: "Products not found" });
  }

  const productIdsSet = new Set(sliderDoc.productIds.map(id => id.toString()));
  allProducts = allProducts.filter(p => productIdsSet.has(p._id.toString()));

  if (!allProducts.length) {
    return res.status(200).json({ message: "No products found", total: 0, products: [] });
  }
}


    let brandIds = [];
    if (brand) {
      const brandArray = brand.split(",").map((b) => b.trim());
      const brandDocs = await Brand.find({ $or: [{ name: { $in: brandArray } }, { _id: { $in: brandArray } }] });

      if (brandDocs.length > 0) {
        brandIds = brandDocs.map((doc) => doc._id.toString());
      }

      if (brandArray.length > 0 && brandIds.length === 0) {
        return res.status(200).json({ message: "No matching brands found", total: 0, products: [] });
      }
    }

    const sizesArray = size ? size.split(",") : null;
    const newArrivalDate = new Date();
    newArrivalDate.setDate(newArrivalDate.getDate() - 2);

    const discountMinValue = discountMin ? parseFloat(discountMin) : null;
    const discountMaxValue = discountMax ? parseFloat(discountMax) : null;
    const minRatingValue = minRating ? parseFloat(minRating) : null;
    const maxRatingValue = maxRating ? parseFloat(maxRating) : null;
    const searchQuery = search ? search.trim().toLowerCase() : null;

    // Filtering products
    let filteredProducts = allProducts.filter((product) => {
      let isMatching = true;

      // ✅ Brand filtering
      if (brandIds.length > 0 && !brandIds.includes(product.brand?.toString())) {
        isMatching = false;
      }

      // ✅ Product type filtering
      if (productType && product.productType !== productType) {
        isMatching = false;
      }

      // ✅ Price filtering
      if ((minPrice || maxPrice) && product.variants?.length) {
        const firstVariant = product.variants[0];

        // If product has offers, use offerPrice, else use normal price
        const effectivePrice = (product.offers && product.offers.length > 0)
          ? (firstVariant?.offerPrice ?? firstVariant?.price ?? 0)
          : (firstVariant?.price ?? 0);

        if ((minPrice && effectivePrice < parseFloat(minPrice)) ||
            (maxPrice && effectivePrice > parseFloat(maxPrice))) {
          isMatching = false;
        }
      }


      // ✅ Size filtering
      if (sizesArray && product.variants) {
        const sizeMatch = product.variants.some((variant) =>
          variant.sizes?.some((s) => sizesArray.includes(s.size))
        );
        if (!sizeMatch) isMatching = false;
      }

      // ✅ New arrivals filtering
      if (newArrivals === "true" && new Date(product.createdAt) < newArrivalDate) {
        isMatching = false;
      }

      // ✅ Discount filtering
      if ((discountMinValue || discountMaxValue) && product.offers?.length) {
        const offer = product.offers[0];
        let discountPercentage = 0;

        if (offer.offerType === "percentage") {
          discountPercentage = offer.amount;
        } else if (offer.offerType === "fixed" && product.variants?.[0]?.price) {
          discountPercentage = (offer.amount / product.variants[0].price) * 100;
        }

        if ((discountMinValue && discountPercentage < discountMinValue) || (discountMaxValue && discountPercentage > discountMaxValue)) {
          isMatching = false;
        }
      } else if (discountMinValue || discountMaxValue) {
        isMatching = false;
      }

      // ✅ Rating filtering
      if ((minRatingValue !== null || maxRatingValue !== null) && product.averageRating !== undefined) {
        const productRating = product.averageRating || 0;

        if ((minRatingValue !== null && productRating < minRatingValue) ||
            (maxRatingValue !== null && productRating > maxRatingValue)) {
          isMatching = false;
        }
      }

      // ✅ Category filtering (Handle ObjectId comparison)
      if (category) {
        if (!mongoose.Types.ObjectId.isValid(category)) {
          isMatching = false;
        }
        const categoryId = new mongoose.Types.ObjectId(category);
        if (!product.category?.equals(categoryId)) {
          isMatching = false;
        }
      }

      // ✅ Subcategory filtering (Handle ObjectId comparison)
      if (subcategory) {
        if (!mongoose.Types.ObjectId.isValid(subcategory)) {
          isMatching = false;
        }
        const subcategoryId = new mongoose.Types.ObjectId(subcategory);
        if (!product.subcategory?.equals(subcategoryId)) {
          isMatching = false;
        }
      }

      if (searchQuery) {
        const searchWords = searchQuery.split(" ");

        const isMatch = searchWords.every((word) => {
          const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/gi, "");

          const clean = (str) => str?.toLowerCase().replace(/[^a-z0-9]/gi, "") || "";

          return (
            clean(product.name).includes(cleanWord) ||
            clean(product.description).includes(cleanWord) ||
            clean(product.features?.material).includes(cleanWord) ||
            clean(product.features?.fit).includes(cleanWord) ||
            clean(product.features?.occasion).includes(cleanWord) ||
            clean(product.supplierName).includes(cleanWord) ||
            product.variants?.some(variant =>
              clean(variant.colorName).includes(cleanWord)
            )
          );
        });

        if (!isMatch) isMatching = false;
      }

      return isMatching;
    });

    if (!filteredProducts.length) {
      return res.status(200).json({ message: "No products found matching the criteria", total: 0, products: [] });
    }

    // ✅ Filter for Top Sold in Category
    if (topSales === "true" && category) {
      // Only filter products within the specified category
      filteredProducts = filteredProducts.filter((product) => product.category.equals(new mongoose.Types.ObjectId(category)));

      // Sort products by salesCount (or another metric) in descending order to get the top sold products
      filteredProducts.sort((a, b) => {
        const salesCountA = a.salesCount || 0;
        const salesCountB = b.salesCount || 0;
        return salesCountB - salesCountA; // Sort descending by sales count
      });

      // Limit the number of top sold products (e.g., top 5)
      filteredProducts = filteredProducts.slice(0, 5);
    }
filteredProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // ✅ Sorting (optional, after top sales filter)
if (sort) {
  switch (sort) {
    case "asc": // Price ascending, consider offerPrice only if offer exists
      filteredProducts.sort((a, b) => {
        const variantA = a.variants?.[0];
        const variantB = b.variants?.[0];

        const hasOfferA = a.offers && a.offers.length > 0;
        const hasOfferB = b.offers && b.offers.length > 0;

        const priceA = hasOfferA ? variantA?.offerPrice ?? variantA?.price ?? 0 : variantA?.price ?? 0;
        const priceB = hasOfferB ? variantB?.offerPrice ?? variantB?.price ?? 0 : variantB?.price ?? 0;

        return priceA - priceB;
      });
      break;

    case "desc": // Price descending, consider offerPrice only if offer exists
      filteredProducts.sort((a, b) => {
        const variantA = a.variants?.[0];
        const variantB = b.variants?.[0];

        const hasOfferA = a.offers && a.offers.length > 0;
        const hasOfferB = b.offers && b.offers.length > 0;

        const priceA = hasOfferA ? variantA?.offerPrice ?? variantA?.price ?? 0 : variantA?.price ?? 0;
        const priceB = hasOfferB ? variantB?.offerPrice ?? variantB?.price ?? 0 : variantB?.price ?? 0;

        return priceB - priceA;
      });
      break;

    case "rating": // Rating descending
      filteredProducts.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
      break;

    default:
      return res.status(400).json({ message: 'Invalid sort parameter. Use "asc", "desc", or "rating"' });
  }
}



    // ✅ Pagination Logic
    const pageNumber = parseInt(page) || 1; // Ensure page is a number
    const pageSize = parseInt(limit) || 20; // Set default limit to 20

    const startIndex = (pageNumber - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    // const productsWithDefaults = paginatedProducts.map(product => {
    //   const variant = product.variants?.[0];
    //   const price = variant?.price || null;
    //   const offerPrice = variant?.offerPrice;
    
    //   const hasValidOffer = offerPrice !== undefined && offerPrice !== null && offerPrice < price;
    
    //   return {
    //     ...product,
    //     defaultPrice: price,
    //     defaultOfferPrice: hasValidOffer ? offerPrice : null
    //   };
    // });

    const productsWithDiscount = paginatedProducts.map(product => {
      const variant = product.variants?.[0];
      const price = variant?.price || null;
      const wholesalePrice = variant?.wholesalePrice || null;

      // ✅ check if product has valid offer
      const hasOffer = product.offers && product.offers.length > 0;
      const effectivePrice = hasOffer ? variant?.offerPrice : variant?.price;

      let discountPercentage = 0;

      if (wholesalePrice && effectivePrice && effectivePrice < wholesalePrice) {
        discountPercentage = Math.floor(
          ((wholesalePrice - effectivePrice) / wholesalePrice) * 100
        );
      }

      return {
        ...product,
        defaultPrice: price,
        defaultOfferPrice: hasOffer ? variant?.offerPrice : null,
        discountPercentage
      };
    });


    // ✅ Response with pagination info
    res.status(200).json({
      total: filteredProducts.length,
      currentPage: pageNumber,
      totalPages: Math.ceil(filteredProducts.length / pageSize),
      products: productsWithDiscount
    });

  } catch (error) {
    res.status(500).json({ message: "Error fetching products", error: error.message });
  }
};








// // search product
// exports.searchProducts = async(req,res) => {
//   try {
//     let userId;
//     if (req.user && req.user.id) {
//       userId = req.user.id;
//     }
//     const allProducts = await getProduct(userId);

//     if(!allProducts || allProducts.length === 0){
//       return res.status(404).json({ message: "No products found" });
//     }

//     const {search} = req.query;
//     if(!search || !search.trim()){
//       return res.status(400).json({ message: "No search query found"})
//     }
//     const searchQuery = search.trim().toLowerCase();

//     const matchedProducts = allProducts.filter(product =>
//       product.name.toLowerCase().includes(searchQuery)
//     );

//     if (matchedProducts.length === 0) {
//       return res.status(404).json({ message: "Product not found" });
//     }

//     res.status(200).json({ products: matchedProducts })

//   } catch (error) {
//     res.status(500).json({ message: "Error searching products", error: error.message});
//   }
// }

// get product by id
exports.getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    let userId;
    if (req.user && req.user.id) {
      userId = req.user.id;
    }

    const products = await getProduct(userId);
    const product = products.find((product) => product._id.toString() === id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // **Sort variants by total stock in descending order**
    if (product.variants && product.variants.length > 0) {
      product.variants.sort((a, b) => {
        const stockA = a.sizes.reduce((sum, size) => sum + (size.stock || 0), 0);
        const stockB = b.sizes.reduce((sum, size) => sum + (size.stock || 0), 0);
        return stockB - stockA;
      });
    }

    // Fetch brand name
    let brandName = null;
    if (product.brand && mongoose.Types.ObjectId.isValid(product.brand)) {
      const brandDoc = await Brand.findById(product.brand, "name");
      brandName = brandDoc?.name || null;
    }

    // Fetch reviews
    const reviews = await Review.find({ productId: id })
      .populate("userId", "name")
      .sort({ createdAt: -1 });

    const formattedReview = reviews.map(review => ({
      ...review._doc,
      createdAt: moment(review.createdAt).format("YYYY-MM-DD HH:mm:ss"),
      updatedAt: moment(review.updatedAt).format("YYYY-MM-DD HH:mm:ss")
    }));

    // Calculate discount percentage
    let discountPercentage = 0;
    const defaultVariant = product.variants?.[0];
    if (defaultVariant?.wholesalePrice) {
      const hasOffer = product.offers && product.offers.length > 0;
      const effectivePrice = hasOffer ? defaultVariant.offerPrice : defaultVariant.price;

      if (effectivePrice < defaultVariant.wholesalePrice) {
        discountPercentage = Math.floor(
          ((defaultVariant.wholesalePrice - effectivePrice) / defaultVariant.wholesalePrice) * 100
        );
      }
    }

    res.status(200).json({
      product,
      brandName,
      reviews: formattedReview,
      discountPercentage
    });

  } catch (err) {
    res.status(500).json({ message: "Error fetching product", error: err.message });
  }
};

 
  
// Get Similar Products
exports.getSimilarProducts = async (req, res) => {
  try {
    const { id } = req.params; // Product ID from URL
    let userId;

    if (req.user && req.user.id) {
      userId = req.user.id;
    }

    // Get all products
    const allProducts = await getProduct(userId);

    // Find the target product
    const targetProduct = allProducts.find((product) => product._id.toString() === id);

    if (!targetProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Define price range tolerance (10% variation)
    const priceTolerance = 0.1; // 10% price difference allowed
    const minPrice = targetProduct.variants[0]?.offerPrice * (1 - priceTolerance);
    const maxPrice = targetProduct.variants[0]?.offerPrice * (1 + priceTolerance);

    // Filter similar products based on multiple attributes
    const similarProducts = allProducts
      .filter((product) => {
        if (product._id.toString() === id) return false; // Exclude the original product

        let matchScore = 0;

        if (product.category === targetProduct.category) matchScore += 3; // Higher weight for category
        if (product.brand === targetProduct.brand) matchScore += 2;
        if (product.productType === targetProduct.productType) matchScore += 2;
        if (product.color && targetProduct.color && product.color === targetProduct.color) matchScore += 2; // Color match
        if (product.variants && product.variants.length > 0) {
          const firstVariant = product.variants[0];
          if (firstVariant.offerPrice >= minPrice && firstVariant.offerPrice <= maxPrice) matchScore += 1; // Price range match
        }

        return matchScore > 0;
      })
      .sort((a, b) => {
        // Sort by highest match score
        let scoreA = 0, scoreB = 0;

        if (a.category === targetProduct.category) scoreA += 3;
        if (b.category === targetProduct.category) scoreB += 3;
        if (a.brand === targetProduct.brand) scoreA += 2;
        if (b.brand === targetProduct.brand) scoreB += 2;
        if (a.productType === targetProduct.productType) scoreA += 2;
        if (b.productType === targetProduct.productType) scoreB += 2;
        if (a.color === targetProduct.color) scoreA += 2;
        if (b.color === targetProduct.color) scoreB += 2;

        return scoreB - scoreA; // Higher score first
      });

    // Add discountPercentage field
      const productsWithDiscount = similarProducts.map((product) => {
      const variant = product.variants?.[0];
      const wholesalePrice = variant?.wholesalePrice || 0;
      const offerExists = product.offers && product.offers.length > 0;
      const effectivePrice = offerExists ? variant?.offerPrice : variant?.price;

      let discountPercentage = 0;
      if (wholesalePrice && effectivePrice < wholesalePrice) {
        discountPercentage = Math.floor(((wholesalePrice - effectivePrice) / wholesalePrice) * 100);
      }
      
      return {
        ...product,
        discountPercentage
      };
    });

    if (productsWithDiscount.length === 0) {
      return res.status(404).json({ message: "No similar products found" });
    }

    res.status(200).json({ products: productsWithDiscount });
  } catch (error) {
    res.status(500).json({ message: "Error fetching similar products", error: error.message });
  }
};

// Get Expected Delivery Date based on Pincode
exports.getExpectedDeliveryDate = async (req, res) => {
  const { pincode } = req.query;

  if (!pincode) {
    return res
      .status(400)
      .json({ success: false, message: "Pincode is required" });
  }

  try {
    const options = {
      method: "POST",
      url: "https://pincode.p.rapidapi.com/v1/postalcodes/india",
      headers: {
        "x-rapidapi-key": process.env.RAPIDAPI_KEY,
        "x-rapidapi-host": "pincode.p.rapidapi.com",
        "Content-Type": "application/json",
      },
      data: { search: pincode },
    };

    const response = await axios.request(options);
    const data = response.data;

    // ✅ API returns an array, not { postalCodes: [] }
    if (!Array.isArray(data) || data.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Pincode" });
    }

    // Pick the first office (or you can enhance to pick best S.O/H.O)
    const postOffice = data[0];
    const state = (postOffice.state || "").toLowerCase();
    const officeType = (postOffice.office_type || "").toLowerCase();

    // ✅ Delivery calculation logic with min = 2 days
    let daysToAdd;
    if (state === "kerala") {
      daysToAdd = 2; // always at least 2 days inside Kerala
    } else {
      daysToAdd =
        officeType.includes("s.o") || officeType.includes("h.o") ? 5 : 7;
    }

    // Absolute safeguard: enforce min = 2 days
    if (daysToAdd < 2) daysToAdd = 2;

    const deliveryDate = moment().add(daysToAdd, "days");
    let deliveryMessage =
      daysToAdd === 2
        ? "Delivered within 2 days"
        : `Delivered by ${deliveryDate.format("dddd")}, ${deliveryDate.format(
            "MMMM D"
          )}`;

    return res.status(200).json({
      success: true,
      message: "Expected delivery date calculated successfully",
      deliveryDate: deliveryDate.format("YYYY-MM-DD"),
      deliveryMessage,
      pincode
    });
  } catch (error) {
    console.error("Error fetching pincode data:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error occurred while calculating delivery date",
    });
  }
};
  
exports.searchKeywords = async (req, res) => {
  try {
    const { search } = req.query;

    if (!search || search.trim() === "") {
      const popularKeywords = await Product.aggregate([
        { $unwind: "$keywords" },
        { $group: { _id: { $toLower: "$keywords" }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 15 }, 
        { $project: { keyword: "$_id", count: 1, _id: 0 } },
      ]);

      return res.status(200).json({
        success: true,
        message: "Popular keywords fetched successfully",
        keywords: popularKeywords,
      });
    }

    const cleanQuery = search.trim().toLowerCase();

    const relatedKeywords = await Product.aggregate([
      {
        $match: {
          $or: [
            { name: new RegExp(cleanQuery, "i") },
            { description: new RegExp(cleanQuery, "i") },
            { keywords: { $regex: cleanQuery, $options: "i" } },
            { "features.material": new RegExp(cleanQuery, "i") },
            { "features.occasion": new RegExp(cleanQuery, "i") },
          ],
        },
      },
      { $unwind: "$keywords" },
      {
        $match: {
          keywords: { $regex: cleanQuery, $options: "i" },
        },
      },
      { $group: { _id: { $toLower: "$keywords" }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
      { $project: { keyword: "$_id", count: 1, _id: 0 } },
    ]);

    if (relatedKeywords.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No related keywords found for the query",
        keywords: [],
      });
    }

    res.status(200).json({
      success: true,
      message: "Related keywords fetched successfully",
      keywords: relatedKeywords,
    });
  } catch (error) {
    console.error("Error fetching search keywords:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const updateUserRecentKeywords = async (userId, newKeywords = []) => {
  if (!Array.isArray(newKeywords) || newKeywords.length === 0) return;

  const user = await User.findById(userId);
  if (!user) return;

  let currentKeywords = user.recommendedPreferences?.keywords || [];

  // ✅ Remove duplicates (keep unique only)
  const uniqueKeywords = [...new Set([...newKeywords, ...currentKeywords])];

  // ✅ Keep only the 6 most recent keywords
  const limitedKeywords = uniqueKeywords.slice(0, 6);

  user.recommendedPreferences.keywords = limitedKeywords;
  await user.save();
};

// 🔹 Controller
exports.getProductsByKeyword = async (req, res) => {
  try {
    const {
      keyword,
      minPrice,
      maxPrice,
      sort,
      category,
      page = 1,
      limit = 20,
      minRating,
      maxRating,
    } = req.query;

    const userId = req.user?.id;

    if (!keyword || keyword.trim() === "") {
      return res.status(400).json({ message: "Keyword is required" });
    }

    const cleanKeyword = keyword.trim().toLowerCase();

    // ✅ Step 1: Find keywords that start with this search term
    const keywordDocs = await Product.aggregate([
      { $unwind: "$keywords" },
      { $match: { keywords: { $regex: new RegExp(`^${cleanKeyword}`, "i") } } },
      { $group: { _id: "$keywords", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const matchingKeywords = keywordDocs.map((k) => k._id);

    // ✅ Step 2: Build query
    const query = {
      status: "active",
      $or: [{ keywords: { $in: matchingKeywords.length ? matchingKeywords : [cleanKeyword] } }],
    };

    if (category && mongoose.Types.ObjectId.isValid(category)) {
      query.category = new mongoose.Types.ObjectId(category);
    }

    // ✅ Step 3: Fetch products
    let products = await Product.find(query)
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .lean();

    // ✅ Step 4: Price & Rating Filters
    if (minPrice || maxPrice) {
      const min = parseFloat(minPrice) || 0;
      const max = parseFloat(maxPrice) || Number.MAX_VALUE;
      products = products.filter((p) => {
        const v = p.variants?.[0];
        const price = v?.offerPrice || v?.price || 0;
        return price >= min && price <= max;
      });
    }

    if (minRating || maxRating) {
      const min = parseFloat(minRating) || 0;
      const max = parseFloat(maxRating) || 5;
      products = products.filter(
        (p) => p.averageRating >= min && p.averageRating <= max
      );
    }

    // ✅ Step 5: Sorting
    if (sort) {
      switch (sort) {
        case "asc":
          products.sort(
            (a, b) =>
              (a.variants?.[0]?.offerPrice || a.variants?.[0]?.price || 0) -
              (b.variants?.[0]?.offerPrice || b.variants?.[0]?.price || 0)
          );
          break;
        case "desc":
          products.sort(
            (a, b) =>
              (b.variants?.[0]?.offerPrice || b.variants?.[0]?.price || 0) -
              (a.variants?.[0]?.offerPrice || a.variants?.[0]?.price || 0)
          );
          break;
        case "rating":
          products.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
          break;
      }
    }

    // ✅ Step 6: Wishlist Integration
    let wishlistProductIds = [];
    if (userId) {
      const wishlist = await Wishlist.find({ userId }).lean();
      wishlistProductIds = wishlist.map((w) => w.productId.toString());
    }

    // ✅ Step 7: Discount Calculation
    const productsWithDiscount = products.map((p) => {
      const variant = p.variants?.[0];
      const price = variant?.price || null;
      const wholesalePrice = variant?.wholesalePrice || null;

      const hasOffer = p.offers && p.offers.length > 0;
      const effectivePrice = hasOffer ? variant?.offerPrice : variant?.price;

      let discountPercentage = 0;
      if (wholesalePrice && effectivePrice && effectivePrice < wholesalePrice) {
        discountPercentage = Math.floor(
          ((wholesalePrice - effectivePrice) / wholesalePrice) * 100
        );
      }

      const isWishlisted = wishlistProductIds.includes(p._id.toString());

      return {
        ...p,
        defaultPrice: price,
        defaultOfferPrice: hasOffer ? variant?.offerPrice : null,
        discountPercentage,
        isWishlisted,
      };
    });

    // ✅ Step 8: Pagination
    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const startIndex = (pageNumber - 1) * pageSize;
    const paginated = productsWithDiscount.slice(startIndex, startIndex + pageSize);

    // ✅ Step 9: Save matched keywords (limit 6)
    if (userId && matchingKeywords.length) {
      await updateUserRecentKeywords(userId, matchingKeywords);
    }

    res.status(200).json({
      total: products.length,
      currentPage: pageNumber,
      totalPages: Math.ceil(products.length / pageSize),
      matchingKeywords,
      products: paginated,
    });
  } catch (error) {
    console.error("Error fetching products by keyword:", error);
    res.status(500).json({
      message: "Error fetching products",
      error: error.message,
    });
  }
};


exports.getRecommendedProducts = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { vendorId } = req.query;
    const limit = 8;

    if (!userId) {
      return res.status(200).json({
        success: true,
        usedKeywords: [],
        isFallback: false,
        total: 0,
        products: [],
      });
    }

    const user = await User.findById(userId).lean();
    const keywords = user?.recommendedPreferences?.keywords || [];

    const baseQuery = { status: "active" };
    if (vendorId && mongoose.Types.ObjectId.isValid(vendorId)) {
      baseQuery.owner = new mongoose.Types.ObjectId(vendorId);
    }

    let products = [];
    if (keywords.length > 0) {
      products = await Product.aggregate([
        { $match: { ...baseQuery, keywords: { $in: keywords } } },
        {
          $addFields: {
            matchCount: { $size: { $setIntersection: ["$keywords", keywords] } },
          },
        },
        { $sort: { matchCount: -1, createdAt: -1 } },
        { $limit: limit },
      ]);
    }

    if (!products.length) {
      products = await Product.aggregate([
        { $match: baseQuery },
        { $sample: { size: limit } },
      ]);
    }

    const wishlist = await Wishlist.find({ userId }).lean();
    const wishlistProductIds = wishlist.map((item) => item.productId.toString());

    const brandIds = products
      .filter((p) => mongoose.Types.ObjectId.isValid(p.brand))
      .map((p) => new mongoose.Types.ObjectId(p.brand));

    const Brand = mongoose.model("Brand");
    const brands = await Brand.find({ _id: { $in: brandIds } }).lean();

    const brandMap = {};
    brands.forEach((b) => {
      brandMap[b._id.toString()] = b.name;
    });

    const formattedProducts = products.map((p) => {
      const variant = p.variants?.[0];
      const price = variant?.price || null;
      const wholesalePrice = variant?.wholesalePrice || null;

      const hasOffer = p.offers && p.offers.length > 0;
      const offerPrice = hasOffer ? variant?.offerPrice : variant?.price;

      let discountPercentage = 0;
      if (wholesalePrice && offerPrice && offerPrice < wholesalePrice) {
        discountPercentage = Math.floor(
          ((wholesalePrice - offerPrice) / wholesalePrice) * 100
        );
      }

      let brandName = p.brand;
      if (mongoose.Types.ObjectId.isValid(p.brand)) {
        brandName = brandMap[p.brand.toString()];
      }

      const isWishlisted = wishlistProductIds.includes(p._id.toString());

      return {
        _id: p._id,
        name: p.name,
        brand: brandName,
        image: p.images?.[0] || null,
        price,
        offerPrice,
        discountPercentage,
        isWishlisted,
      };
    });

    res.status(200).json({
      success: true,
      usedKeywords: keywords,
      isFallback: !products.some((p) => p.matchCount > 0),
      total: formattedProducts.length,
      products: formattedProducts,
    });
  } catch (error) {
    console.error("Error fetching recommended products:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching recommended products",
      error: error.message,
    });
  }
};


