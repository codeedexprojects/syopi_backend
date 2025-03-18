productSchema.pre("save", function (next) {
    const product = this;
  
    // Validate based on category
    if (product.category === "chappal") {
      if (!product.details.get("sizes") || product.details.get("sizes").length === 0) {
        return next(new Error("Sizes are required for Chappals."));
      }
      if (!product.details.get("strapMaterial")) {
        return next(new Error("Strap material is required for Chappals."));
      }
    } else if (product.category === "dress") {
      if (!product.details.get("fabric")) {
        return next(new Error("Fabric is required for Dresses."));
      }
      if (!product.details.get("color")) {
        return next(new Error("Color is required for Dresses."));
      }
    }
  
    next();
  });
  