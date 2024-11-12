const jwt = require('jsonwebtoken');

/**
 * Helper class for generating and verifying JWT tokens
 * @class JWToken
 *
 * @Author Yassin Rahou
 */
class JWToken {

    /**
     * Generate a JWT token for the user
     * @param user User object to generate the token for
     * @returns {string} JWT token
     */
    static generateToken(user) {
        return jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRATION }
        );
    }

    /**
     * Verify the JWT token
     * @param token JWT token to verify
     * @returns {object} Decoded token
     * @throws {Error} If the token is invalid
     */
    static verifyToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }
}

module.exports = JWToken;
