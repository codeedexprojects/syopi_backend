const mongoose = require("mongoose");

const vendorStoreSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    banners: [
      {
        image: { type: String, required: true },
        title: { type: String },
        subtitle: { type: String },
        productIds: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
          },
        ],
      },
    ],
    subcategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubCategory",
      },
    ],
    bottomBanner: {
      image: { type: String, required: true },
      title: { type: String },
      subtitle: { type: String },
      productIds: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
      ],
    },
    background: {
      image: { type: String, required: true }, 
      title: { type: String },
      subtitle: { type: String },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("VendorStore", vendorStoreSchema);
