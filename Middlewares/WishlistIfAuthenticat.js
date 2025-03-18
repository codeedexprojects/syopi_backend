const jwt = require('jsonwebtoken');

const attachWishlistIfAuthenticated = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Extract Bearer token

    if (!token) {
        // No token provided, proceed without user data
        return next();
    }

    try {
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        next();
    } catch (error) {
        console.error('JWT verification failed or invalid:', error);
        // Proceed without blocking the request
        req.user = null;
        next();
    }
};

module.exports = attachWishlistIfAuthenticated;