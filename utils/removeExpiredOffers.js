const Offer = require("../Models/Admin/offerModel");
const Product = require("../Models/Admin/productModel");

const removeOfferFromProducts = async (offer) => {
  const { _id: offerId, category, subcategory, products, ownerId, ownerType } = offer;

  try {
    const applicableProducts = await Product.find({
      owner: ownerId,
      ownerType,
      currentOffer: offerId,
      $or: [
        { _id: { $in: products } },
        { category: { $in: category } },
        { subcategory: { $in: subcategory } },
      ],
    });

    for (const product of applicableProducts) {
      product.currentOffer = null;

      // Reset offer price to original price for all variants
      product.variants.forEach((variant) => {
        variant.offerPrice = variant.price;
      });

      // Update product's overall offer price to the lowest variant price
      product.offerPrice = Math.min(...product.variants.map((v) => v.price));

      await product.save();
    }

    console.log(`Expired offer removed from ${applicableProducts.length} products.`);
  } catch (error) {
    console.error(`Error removing offer ${offerId} from products:`, error);
  }
};

const removeExpiredOffers = async () => {
  try {
    const expiredOffers = await Offer.find({ expireDate: { $lt: new Date() } });

    for (const offer of expiredOffers) {
      await removeOfferFromProducts(offer);
      await offer.remove();
    }

    console.log(`Expired offers processed: ${expiredOffers.length}`);
  } catch (error) {
    console.error("Error removing expired offers:", error);
  }
};

module.exports = removeExpiredOffers;