// __tests__/taskRoutes.test.js
const request = require('supertest');
const { describe } = require('node:test');

//const app = require('../app');
const express = require('express');
const bodyParser = require('body-parser');
//const router = require('../routes/taskRoute');
const rout = { router: taskRoute, connectDB: connectTaskDB } = require('../routes/taskRoute');

const { MongoMemoryServer } = require('mongodb-memory-server');
const { MongoClient, ObjectId } = require('mongodb');

let app, db, mongod, client;

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
        next();
    });
    app.use('/tasks', rout.router);
});

afterAll(async () => {
    await client.close();
    await mongod.stop();
})

describe("GET /", () => {
    beforeEach(async () => {
        // Insert test data into the in-memory database
        const tasksCollection = db.collection('tasks');
        await tasksCollection.insertMany([
            { _id: new ObjectId(), name: 'Task 1' },
            { _id: new ObjectId(), name: 'Task 2' },
        ]);
    });

    afterEach(async () => {
        // Clear db
        await db.collection("tasks").deleteMany({});
    })

    test('should return tasks for valid IDs', async () => {
        const tasks = await db.collection('tasks').find({}).toArray();
        console.log("Tasks: ", tasks);
        const ids = tasks.map(task => task._id.toString()).join(',');
        console.log("ID's: ", ids)


        const res = await request(app).get(`/tasks?ids=${ids}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(2);
        expect(res.body[0]).toHaveProperty('name', 'Task 1');
    });
})