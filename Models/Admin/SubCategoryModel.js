const mongoose = require("mongoose");

const subCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    unique: true,
    index: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  sizes: [
    {
      type: String,
      trim: true,
    },
  ],
});

const SubCategory = mongoose.model("SubCategory", subCategorySchema);

module.exports = SubCategory;