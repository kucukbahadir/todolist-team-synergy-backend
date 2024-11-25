const JWToken = require('../utils/JWToken');
const jwt = require('jsonwebtoken');

jest.mock('jsonwebtoken');

describe('JWToken Class', () => {
    const mockUser = { _id: '12345', email: 'test@example.com' };
    const mockSecret = 'testsecret';
    const mockToken = 'mocked.jwt.token';
    const decodedToken = { id: '12345', email: 'test@example.com' };

    beforeEach(() => {
        process.env.JWT_SECRET = mockSecret;
        process.env.JWT_EXPIRATION = '1h';
        jest.clearAllMocks();
    });

    describe('generateToken', () => {
        it('should generate a JWT token for a valid user', () => {
            jwt.sign.mockReturnValue(mockToken);

            const token = JWToken.generateToken(mockUser);

            expect(jwt.sign).toHaveBeenCalledWith(
                { id: mockUser._id, email: mockUser.email },
                mockSecret,
                { expiresIn: '1h' }
            );
            expect(token).toBe(mockToken);
        });
    });

    describe('verifyToken', () => {
        it('should verify a valid JWT token', () => {
            jwt.verify.mockReturnValue(decodedToken);

            const result = JWToken.verifyToken(mockToken);

            expect(jwt.verify).toHaveBeenCalledWith(mockToken, mockSecret);
            expect(result).toEqual(decodedToken);
        });

        it('should throw an error for an invalid JWT token', () => {
            jwt.verify.mockImplementation(() => {
                throw new Error('Invalid or expired token');
            });

            expect(() => JWToken.verifyToken(mockToken)).toThrow(
                'Invalid or expired token'
            );
            expect(jwt.verify).toHaveBeenCalledWith(mockToken, mockSecret);
        });
    });
});
