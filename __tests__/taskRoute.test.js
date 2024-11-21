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

describe("GET /tasks", () => {
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
    });

    it('should return tasks for valid IDs', async () => {
        const tasks = await db.collection('tasks').find({}).toArray();
        //console.log("Tasks: ", tasks);
        const ids = tasks.map(task => task._id.toString()).join(',');
        //console.log("ID's: ", ids);

        const url = `/tasks?ids=${ids}`
        //console.log("URL: ", url);


        const res = await request(app)
            .get(url);

        expect(res.status).toBe(200);
        //expect(res.body).toHaveLength(2);
        expect(res.body[0]).toHaveProperty('name', 'Task 1');
    });

    it("should return 400 upon empty query", async () => {
        const url = `/tasks?ids=`

        const res = await request(app)
            .get(url);

        expect(res.status).toBe(400);
    })

    it("should return 401 upon invalid id's query", async () => {
        const url = `/tasks?ids=invalid,id`

        const res = await request(app)
            .get(url);

        expect(res.status).toBe(401);
    })
});

describe('POST /tasks', () => {
    it('should create a new task and return it', async () => {
        /* const mockTask = {
            title: 'Test Task',
            description: 'This is a test task',
            dueDate: '2024-12-01T00:00:00Z',
            completed: false,
            priority: 'High',
            taskList: new ObjectId().toString()
        }; */

        const mockTask = {
            title: 'Test Task',
            description: 'This is a test task',
            dueDate: new Date('2024-12-01T00:00:00Z'),
            completed: false,
            priority: 'High',
            taskList: new ObjectId().toString()
        };

        const res = await request(app)
            .post('/tasks')
            .send(mockTask);
            //.send(JSON.stringify(mockTask));

        expect(res.status).toBe(201);
        expect(res.body).toBeDefined();
        console.log("body: ", res.body);
        expect(res.body).toMatchObject({
            title: mockTask.title,
            description: mockTask.description,
            dueDate: mockTask.dueDate.toISOString(),
            completed: mockTask.completed,
            priority: mockTask.priority,
            taskList: mockTask.taskList
        });
        //expect(res.body.assignedToUser).toBeDefined();
    });

    /* it('should return 500 if required fields are missing', async () => {
        const incompleteTask = {
            description: 'This is a test task without a title',
        };

        const res = await request(app)
            .post('/tasks')
            .send(incompleteTask);

        console.log(res.body);
        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('message', 'Error creating task');
        expect(res.body).toHaveProperty('error');
    }); */

    /* it('should return 500 if taskList is not a valid ObjectId', async () => {
        const invalidTask = {
            title: 'Invalid TaskList',
            description: 'This task has an invalid taskList',
            taskList: 'not-a-valid-id',
            priority: 'Low'
        };

        const res = await request(app)
            .post('/tasks')
            .send(invalidTask);

        expect(res.status).toBe(500);
        expects(res.body).toHaveProperty('message', 'Error creating task');
        expect(res.body).toHaveProperty('error');
    }); */
});

describe('GET /tasks/:id', () => {
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
    });

    it('should return return a tasks', async () => {
        const tasks = await db.collection('tasks').find({}).toArray();
        //console.log("Tasks: ", tasks);
        const index = Math.floor(Math.random() * tasks.length)
        const id = tasks[index]._id;
        //console.log("ID: ", id)

        const url = `/tasks/${id}`
        //console.log("URL: ", url);

        const res = await request(app)
            .get(url);

        expect(res.status).toBe(200);
        console.log("Body", res.body);
        expect(res.body).toMatchObject({
            _id: tasks[index]._id.toString(),
            name: tasks[index].name
        });
    });

    it("should return 404 for _id not in db", async () => {
        const url = `/tasks/${new ObjectId()}`
        //console.log("URL: ", url);

        const res = await request(app)
            .get(url);

        expect(res.status).toBe(404);
    });

    it("should return 400 for invalid ObjectId", async () => {
        const url = `/tasks/invalidID`
        //console.log("URL: ", url);

        const res = await request(app)
            .get(url);

        expect(res.status).toBe(400);
    })
});

describe("PUT /tasks/:id");

describe("DELETE /tasks/:id", () => {
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
    });

    it("should delete the tasks", async () => {

    });
});

