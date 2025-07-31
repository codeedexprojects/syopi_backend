const getProduct = require('../../../utils/getProducts');
// const Slider = require('../../../Models/Admin/SliderModel');
// const Banner = require('../../../Models/Admin/BannerModel');
const Review = require("../../../Models/User/ReviewModel");
const moment = require("moment");
const axios = require("axios");
const Brand = require('../../../Models/Admin/BrandModel');


// const affordableProductsModel= require('../../../Models/Admin/AffordableProductModel');
// get all products
const mongoose = require('mongoose');

exports.getallProducts = async (req, res) => {
  try {
    const { 
      brand, productType, minPrice, maxPrice, size, newArrivals, 
      discountMin, discountMax, sort, search, minRating, maxRating, 
      category, subcategory, page = 1, limit = 20, topSales 
    } = req.query;
    
    let userId = req.user?.id;
    const allProducts = await getProduct(userId);

    if (!allProducts || allProducts.length === 0) {

      return res.status(200).json({
        message: "No products found",
        total: 0,
        products: [],
      });
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
        const offerPrice = firstVariant?.offerPrice || 0;

        if ((minPrice && offerPrice < parseFloat(minPrice)) || (maxPrice && offerPrice > parseFloat(maxPrice))) {
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

      // ✅ Search filtering
      if (searchQuery) {
        const searchWords = searchQuery.split(" ");
        const isMatch = searchWords.every((word) =>
          product.name?.toLowerCase().includes(word)
        );
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

    // ✅ Sorting (optional, after top sales filter)
    if (sort) {
      if (!["asc", "desc"].includes(sort)) {
        return res.status(400).json({ message: 'Invalid sort parameter. Use "asc" or "desc"' });
      }

      filteredProducts.sort((a, b) => {
        const offerPriceA = a.variants?.[0]?.offerPrice || 0;
        const offerPriceB = b.variants?.[0]?.offerPrice || 0;
        return sort === "asc" ? offerPriceA - offerPriceB : offerPriceB - offerPriceA;
      });
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

    // ✅ Response with pagination info
    res.status(200).json({
      total: filteredProducts.length,
      currentPage: pageNumber,
      totalPages: Math.ceil(filteredProducts.length / pageSize),
      products: paginatedProducts
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

      let brandName = null;
    if (product.brand && mongoose.Types.ObjectId.isValid(product.brand)) {
      const brandDoc = await Brand.findById(product.brand, "name");
      brandName = brandDoc?.name || null;
    }

        // Fetch reviews for the product
        const reviews = await Review.find({ productId: id })
            .populate("userId", "name")
            .sort({ createdAt: -1 });
            const formattedReview = reviews.map(review => ({
              ...review._doc,  // Spread existing document data
              createdAt: moment(review.createdAt).format("YYYY-MM-DD HH:mm:ss"),
              updatedAt: moment(review.createdAt).format("YYYY-MM-DD HH:mm:ss")
          }));

            //  // Get default variant values
            //   const defaultVariant = product.variants?.[0];
            //   const price = defaultVariant?.price || null;
            //   const offerPrice = defaultVariant?.offerPrice;

            //   // Determine if a valid offer exists
            //   const hasValidOffer = offerPrice !== undefined && offerPrice !== null && offerPrice < price;

            //   const defaultOfferPrice = hasValidOffer ? offerPrice : null;
            //   const defaultPrice = price;
            //   // Include both prices in the product response
            //   res.status(200).json({
            //     product: {
            //       ...product,
            //       defaultOfferPrice,
            //       defaultPrice
            //     },
            //     reviews: formattedReview
            //   });

        res.status(200).json({ product, brandName, reviews:formattedReview });
  
      // res.status(200).json(product);
    } catch (err) {
      res.status(500).json({ message: "Error fetching product", error: err.message });
    }
  }
 
  
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

    if (similarProducts.length === 0) {
      return res.status(404).json({ message: "No similar products found" });
    }

    res.status(200).json({ products: similarProducts });
  } catch (error) {
    res.status(500).json({ message: "Error fetching similar products", error: error.message });
  }
};

// Get Expected Delivery Date based on Pincode
exports.getExpectedDeliveryDate = async (req, res) => {
  const { pincode } = req.query;

  try {
      const response = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = response.data;

      if (data[0].Status === "Success") {
          const state = data[0].PostOffice[0].State.toLowerCase();
          const officeType = data[0].PostOffice[0].BranchType.toLowerCase();

          let daysToAdd;
          if (state === "kerala") {
              // Inside Kerala: Head/Sub office -> 1 day, Branch office -> 2 days
              daysToAdd = (officeType === "head post office" || officeType === "sub post office") ? 1 : 2;
          } else {
              // Outside Kerala: Head/Sub office -> 5 days, Branch office -> 7 days
              daysToAdd = (officeType === "head post office" || officeType === "sub post office") ? 5 : 7;
          }

          const deliveryDate = moment().add(daysToAdd, 'days');

          // Constructing the delivery message
          let deliveryMessage;
          if (daysToAdd === 1) {
              deliveryMessage = "Delivered by tomorrow";
          } else if (daysToAdd === 2) {
              deliveryMessage = "Delivered within 2 days";
          } else {
              deliveryMessage = `Delivered by ${deliveryDate.format("dddd")}, ${deliveryDate.format("MMMM D")}`;
          }

          return res.status(200).json({
              success: true,
              message: "Expected delivery date calculated successfully",
              deliveryDate: deliveryDate.format("YYYY-MM-DD"),
              deliveryMessage,
              pincode
          });
      }

      return res.status(400).json({
          success: false,
          message: "Invalid Pincode",
      });
  } catch (error) {
      console.error("Error fetching pincode data:", error.message);
      return res.status(500).json({
          success: false,
          message: "Error occurred while calculating delivery date",
      });
  }
};
  
// // sorting based on price
// exports.getSortedProducts = async (req, res) => {
//   try {
//     let userId;
//     if (req.user && req.user.id) {
//       userId = req.user.id;
//     }
//     const {sort} = req.query;

//     // Validate the query parameters
//     if (sort && sort !== 'asc' && sort !== 'desc') {
//       return res.status(400).json({ message: 'Invalid sort parameter. Use "asc" or "desc".' });
//     }

//     const sortOrder = sort === 'asc' ? 1 : -1;

//     const products = await getProduct(userId); 

//     // Sort the products based on the first variant's offerPrice
//     const sortedProducts = products.sort((a, b) => {
//       const offerPriceA = a.variants[0]?.offerPrice || 0; // Handle cases where variants might be missing
//       const offerPriceB = b.variants[0]?.offerPrice || 0;

//       return sortOrder === 1 ? offerPriceA - offerPriceB : offerPriceB - offerPriceA;
//     });

//     res.status(200).json({ message: 'Products sorted successfully', products:sortedProducts });
//   } catch (error) {
//     res.status(500).json({ message: 'Error fetching sorted products', error: error.message });
//   }
// };

// Get home pages 

// exports.getHomePage = async (req, res) => {
//   try {
//     let userId;
//     if (req.user && req.user.id) {
//       userId = req.user.id;
//     }

//     // Fetch all products (ensure salesCount, price, offerPrice, and rating fields are included)
//     const allProducts = await getProduct(userId);

//     if (!allProducts || allProducts.length === 0) {
//       return res.status(404).json({ message: "No products found" });
//     }

//     // Sort products based on salesCount (highest to lowest)
//     const sortedProducts = allProducts
//       .filter(product => product.totalSales && product.totalSales > 0)
//       .sort((a, b) => b.totalSales - a.totalSales);

//     // Limit results (default to top 10)
//     const limit = req.query.limit ? parseInt(req.query.limit) : 10;
//     const topProducts = sortedProducts.slice(0, limit);

//     // Section: Products under ₹1000
//     const affordableProducts = await affordableProductsModel.find()

//     // Section: Products sorted from lowest price to highest
//     const lowToHighProducts = [...allProducts]
//       .sort((a, b) => a.price - b.price) // Sort by price ascending
//       .slice(0, 10); // Limit to 10 products

//     // Fetch featured products (incredible delights) based on best offers
//     const bestOfferProducts = allProducts
//       .filter(product =>
//         product.variants.some(variant =>
//           variant.offerPrice !== null && variant.offerPrice < variant.price // Ensure offerPrice is lower
//         )
//       )
//       .sort((a, b) => {
//         const maxDiscountA = Math.max(...a.variants.map(v => v.price - (v.offerPrice ?? v.price)));
//         const maxDiscountB = Math.max(...b.variants.map(v => v.price - (v.offerPrice ?? v.price)));
//         return maxDiscountB - maxDiscountA; // Sort by highest discount
//       })
//       .slice(0, 5); // Get top 5 best offer products

//     // "Your Top Picks in the Best Price" – combining best-selling and best-priced products
//     const topPicksBestPrice = allProducts
//       .filter(product => 
//         product.salesCount > 0 && 
//         product.variants.some(variant => variant.offerPrice !== null && variant.offerPrice < variant.price)
//       )
//       .sort((a, b) => {
//         const maxDiscountA = Math.max(...a.variants.map(v => v.price - (v.offerPrice ?? v.price)));
//         const maxDiscountB = Math.max(...b.variants.map(v => v.price - (v.offerPrice ?? v.price)));
//         return maxDiscountB - maxDiscountA; // Sort by best discount
//       })
//       .slice(0, 10); // Limit to 10 products for this section

//     // Fetch active sliders and banners
//     const activeSliders = await Slider.find({isActive:true});
//     const activeBanners = await Banner.find({isActive:true});

//     // Return the response with all the sections
//     res.status(200).json({
//       topProducts,
//       bestOfferProducts, // Featured products with best offers
//       affordableProducts, // Products under ₹1000
//       lowToHighProducts, // Products sorted from low to high price
//       topPicksBestPrice, // Your Top Picks in the Best Price section
//       activeSliders, 
//       activeBanners
//     });

//   } catch (error) {
//     res.status(500).json({ message: "Error fetching homepage products", error: error.message });
//   }
// };

