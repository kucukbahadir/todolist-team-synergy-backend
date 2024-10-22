const JWToken = require('../utils/JWToken');

/**
 * Middleware function to verify the JWT token
 * @param req Request object
 * @param res Response object
 * @param next Next middleware function
 *
 * @Author Yassin Rahou
 */
function JWTFilter(req, res, next) {
    const token = req.header('Authorization')?.split(' ')[1];

    if (!token) {
        return res.status(403).json({ message: 'No token provided' });
    }

    try {
        req.user = JWToken.verifyToken(token);
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
}

module.exports = JWTFilter;
