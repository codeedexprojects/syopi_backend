const mongoose = require("mongoose");

const paySmarterSchema = new mongoose.Schema({
    description: {
        type: String,
        required: [true, "Description is required"],
    },
    image: {
      type: String, // store filename or URL
      validate: {
        validator: function (value) {
          return /\.(jpg|jpeg|png|webp)$/i.test(value);
        },
        message: "Image must be a JPG, JPEG, PNG, or WEBP file",
      },
    },
}, { timestamps: true });

module.exports = mongoose.model("PaySmarter", paySmarterSchema);
