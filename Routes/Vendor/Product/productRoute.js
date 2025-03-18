const express = require("express");
const router = express.Router();
const vendorProductController = require("../../../Controllers/Vendor/product/vendorProductController");
const verifyToken = require("../../../Middlewares/jwtConfig");
const multerConfig = require("../../../Middlewares/MulterConfig");
 
const upload = multerConfig.array("images", 5);

// Create a new product
router.post("/create", verifyToken(["vendor"]), upload, vendorProductController.createProduct);

// Get all products
router.get("/get", verifyToken(["vendor"]), vendorProductController.getProducts);

// Get a single product by ID
router.get("/get/:id", verifyToken(["vendor"]), vendorProductController.getProductById);

// Update a product
router.patch("/update/:id", verifyToken(["vendor"]), upload, vendorProductController.updateProduct);

// Delete a product
router.delete("/delete/:id", verifyToken(["vendor"]), vendorProductController.deleteProduct);

// Delete a specific image by name
router.delete("/delete/:id/image", verifyToken(["vendor"]), vendorProductController.deleteProductImage);

module.exports = router;
