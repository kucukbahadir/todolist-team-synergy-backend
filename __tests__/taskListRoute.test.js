// __tests__/taskRoutes.test.js
const request = require('supertest');
const { describe } = require('node:test');

//const app = require('../app');
const express = require('express');
const bodyParser = require('body-parser');
const rout = { router: taskRoute, connectDB: connectTaskDB } = require('../routes/taskRoute');

const { MongoMemoryServer } = require('mongodb-memory-server');
const { MongoClient, ObjectId } = require('mongodb');

let app, db, mongod, client;
const mockUser = new ObjectId().toString();

beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    // Connect to in-memory MongoDB
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('testDB'); // Use a test database

    // Set up Express app and route
    // Allow to bypass /api/ authentication
    app = express();
    app.use(bodyParser.json());
    app.use((req, res, next) => {
        req.db = db; // Inject database into the request object
        req.user = { id: mockUser }; // Mock user with a random ObjectId
        next();
    });
    app.use('/tasks', rout.router);
});

afterAll(async () => {
    await client.close();
    await mongod.stop();
});

describe("GET /", () => {});

describe("POST /", () => {});

describe("PATCH /:id/add", () => {});

describe("PATCH /:id/remove", () => {});

describe("DELELTE /:id/delete", () => {});

describe("POST /:id/share", () => {});