const express = require("express");
const router = express.Router();
const productController = require("../../../Controllers/Admin/Product/productController");
const verifyToken = require("../../../Middlewares/jwtConfig");
const multerConfig = require("../../../Middlewares/MulterConfig");

// const upload = multerConfig.array("images", 5);
const upload = multerConfig.any();

router.post("/create",verifyToken(["admin"]), upload, productController.createProduct);
router.get("/get",verifyToken(["admin"]),productController.getProducts);
router.get("/get/:id", productController.getProductById);
router.patch("/update/:id", verifyToken(["admin"]), upload, productController.updateProduct);
router.delete("/delete/:id", verifyToken(["admin"]), productController.deleteProduct);
router.delete("/delete/:id/image", verifyToken(["admin"]), productController.deleteProductImage);
router.delete("/delete/:productId/variant/:variantId", verifyToken(["admin"]), productController.deleteVariantFromProduct)

module.exports = router;
