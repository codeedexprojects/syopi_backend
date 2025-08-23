const jwt = require('jsonwebtoken');

const attachWishlistIfAuthenticated = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; 

    if (!token) return next(); 

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            console.log("Token expired, continuing as guest");
        } else {
            console.log("Invalid token, continuing as guest");
        }
        req.user = null;
    }

    next();
};

module.exports = attachWishlistIfAuthenticated;
