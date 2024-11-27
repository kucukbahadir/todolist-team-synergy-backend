const request = require("supertest");
const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const { router, connectDB } = require("../routes/taskListRoute");

// Mock database setup
let connection;
let db;
const app = express();
app.use(express.json());
app.use("/tasklist", router);

describe("POST /tasklist/ - Create a New Task List", () => {
  beforeAll(async () => {
  const mongoUri = global.__MONGO_URI__;
  const dbName = global.__MONGO_DB_NAME__;
  if (!mongoUri || !dbName) {
    throw new Error("MongoDB URI or DB Name is undefined. Check jest-mongodb configuration.");
  }
  connection = await MongoClient.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  db = connection.db(dbName);
  connectDB(db); // Connect the router to the mock DB
});


  afterAll(async () => {
    await connection.close();
  });

  beforeEach(async () => {
    // Clear collections before each test
    await db.collection("task_lists").deleteMany({});
    await db.collection("users").deleteMany({});
  });

  it("should create a new task list and return its ID", async () => {
    // Insert a mock user in the database
    const ownerId = new ObjectId();
    await db.collection("users").insertOne({
      _id: ownerId,
      email: "owner@example.com",
      sharedLists: [],
    });

    // Mock request body
    const newTaskListData = {
      title: "My Task List",
      owner: ownerId.toString(),
      tasks: [],
      sharedWith: [],
    };

    const response = await request(app)
      .post("/tasklist/")
      .send(newTaskListData)
      .expect(200);

    // Check response
    expect(response.body).toHaveProperty("message", "Task list created successfully");
    expect(response.body).toHaveProperty("listId");

    // Verify the task list was added to the database
    const createdTaskList = await db
      .collection("task_lists")
      .findOne({ _id: new ObjectId(response.body.listId) });

    expect(createdTaskList).toBeDefined();
    expect(createdTaskList).toMatchObject({
      title: "My Task List",
      owner: ownerId,
      tasks: [],
      sharedWith: [],
    });

    // Verify the user record was updated
    const updatedUser = await db.collection("users").findOne({ _id: ownerId });
    expect(updatedUser.sharedLists).toContainEqual(new ObjectId(response.body.listId));
  });

  it("should return 500 if database operation fails", async () => {
    // Simulate database failure by not inserting the user
    const ownerId = new ObjectId();

    const newTaskListData = {
      title: "My Task List",
      owner: ownerId.toString(),
      tasks: [],
      sharedWith: [],
    };

    const response = await request(app)
      .post("/tasklist/")
      .send(newTaskListData)
      .expect(500);

    expect(response.body).toHaveProperty("message", "Failed to create task list");
  });
});
