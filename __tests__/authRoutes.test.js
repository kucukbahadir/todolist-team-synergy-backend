const request = require('supertest');
const express = require('express');
const { router, connectDB } = require('../routes/authRoutes');
const JWToken = require('../utils/JWToken');
const EmailService = require('../services/EmailService');

// Mock de afhankelijkheden
jest.mock('../utils/JWToken');
jest.mock('../services/EmailService');

// Setup een test server
const app = express();
app.use(express.json());
app.use('/', router);

describe('Router Tests', () => {
    let mockDb;

    beforeEach(() => {
        mockDb = {
            collection: jest.fn().mockReturnThis(),
            findOne: jest.fn(),
            updateOne: jest.fn(),
            insertOne: jest.fn(),
        };
        connectDB(mockDb);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /verify-code', () => {
        it('should return 404 if user is not found', async () => {
            mockDb.findOne.mockResolvedValue(null);

            const res = await request(app)
                .post('/verify-code')
                .send({ email: 'test@example.com', code: '123456' });

            expect(res.status).toBe(404);
            expect(res.text).toBe('User not found');
        });

        it('should return 200 with token and user if code is correct', async () => {
            const mockUser = { email: 'test@example.com', verificationCode: '123456' };
            mockDb.findOne.mockResolvedValue(mockUser);
            mockDb.updateOne.mockResolvedValue({ modifiedCount: 1 });
            JWToken.generateToken.mockReturnValue('mocked.jwt.token');

            const res = await request(app)
                .post('/verify-code')
                .send({ email: 'test@example.com', code: '123456' });

            expect(res.status).toBe(200);
            expect(res.headers['authorization']).toBe('Bearer mocked.jwt.token');
            expect(res.body.email).toBe('test@example.com');
        });

        it('should return 401 if code is incorrect', async () => {
            const mockUser = { email: 'test@example.com', verificationCode: '654321' };
            mockDb.findOne.mockResolvedValue(mockUser);

            const res = await request(app)
                .post('/verify-code')
                .send({ email: 'test@example.com', code: '999999' });

            expect(res.status).toBe(401);
            expect(res.text).toBe('Could not authenticate');
        });

        it('should return 500 on database errors', async () => {
            mockDb.findOne.mockRejectedValue(new Error('Database error'));

            const res = await request(app)
                .post('/verify-code')
                .send({ email: 'test@example.com', code: '123456' });

            expect(res.status).toBe(500);
            expect(res.text).toBe('Error verifying code');
        });
    });

    describe('POST /request-code', () => {
        it('should return 404 if user is not found', async () => {
            mockDb.updateOne.mockResolvedValue({ modifiedCount: 0 });

            const res = await request(app)
                .post('/request-code')
                .send({ email: 'test@example.com' });

            expect(res.status).toBe(404);
            expect(res.text).toBe('User not found');
        });

        it('should return 200 if code is sent successfully', async () => {
            mockDb.updateOne.mockResolvedValue({ modifiedCount: 1 });
            EmailService.prototype.sendVerificationEmail.mockResolvedValue();

            const res = await request(app)
                .post('/request-code')
                .send({ email: 'test@example.com' });

            expect(res.status).toBe(200);
            expect(res.text).toBe('Code sent successfully');
        });

        it('should return 500 if email service fails', async () => {
            mockDb.updateOne.mockResolvedValue({ modifiedCount: 1 });
            EmailService.prototype.sendVerificationEmail.mockRejectedValue(new Error('Email error'));

            const res = await request(app)
                .post('/request-code')
                .send({ email: 'test@example.com' });

            expect(res.status).toBe(500);
            expect(res.text).toBe('Error sending email');
        });
    });

    describe('POST /register', () => {
        it('should return 409 if user already exists', async () => {
            mockDb.findOne.mockResolvedValue({ email: 'test@example.com' });

            const res = await request(app)
                .post('/register')
                .send({ email: 'test@example.com' });

            expect(res.status).toBe(409);
            expect(res.text).toBe('User already exists');
        });

        it('should return 200 if user is created and email sent successfully', async () => {
            mockDb.findOne.mockResolvedValue(null);
            mockDb.insertOne.mockResolvedValue({ insertedCount: 1 });
            EmailService.prototype.sendVerificationEmail.mockResolvedValue();

            const res = await request(app)
                .post('/register')
                .send({ email: 'test@example.com' });

            expect(res.status).toBe(200);
            expect(res.text).toBe('Code sent successfully');
        });

        it('should return 500 if user creation fails', async () => {
            mockDb.findOne.mockResolvedValue(null);
            mockDb.insertOne.mockRejectedValue(new Error('Database error'));

            const res = await request(app)
                .post('/register')
                .send({ email: 'test@example.com' });

            expect(res.status).toBe(500);
            expect(res.text).toBe('Error creating user');
        });

        it('should return 500 if email service fails', async () => {
            mockDb.findOne.mockResolvedValue(null);
            mockDb.insertOne.mockResolvedValue({ insertedCount: 1 });
            EmailService.prototype.sendVerificationEmail.mockRejectedValue(new Error('Email error'));

            const res = await request(app)
                .post('/register')
                .send({ email: 'test@example.com' });

            expect(res.status).toBe(500);
            expect(res.text).toBe('Error sending email');
        });
    });
});
