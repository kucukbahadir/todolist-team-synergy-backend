const { MongoClient } = require("mongodb");
const request = require("supertest");
const app = require("../app");

describe("Task List Routes", () => {
    let client;
    let db;

    // Increase Jest timeout to allow for longer MongoDB connection
    jest.setTimeout(30000); // 30 seconds timeout for hooks

    beforeAll(async () => {
        try {
            // Initialize MongoClient and connect
            client = new MongoClient("mongodb://localhost:27017/testdb");
            await client.connect();
            db = client.db();
            console.log("Successfully connected to MongoDB");

            // Ensure your app uses the correct database
            require("../routes/taskListRoute").connectDB(db);
        } catch (error) {
            console.error("Failed to connect to MongoDB:", error);
            throw error; // Rethrow the error to fail the test
        }
    });

    afterAll(async () => {
        try {
            // Drop the test database to clean up
            if (db) {
                await db.dropDatabase();
                console.log("Dropped test database");
            }
            // Close MongoDB client after tests
            if (client) {
                await client.close();
                console.log("Closed MongoDB connection");
            }
        } catch (error) {
            console.error("Error during MongoDB cleanup:", error);
        }
    });

    test("POST /taskLists - Create a new task list", async () => {
        const response = await request(app)
            .post("/taskLists")
            .send({
                title: "Test Task List",
                owner: "63579c9f9e7c9a7e1a8b4567",
                tasks: [],
                sharedWith: []
            });

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("listId");
    });

    test("GET /taskLists - Fetch task lists by IDs", async () => {
        const insertedList = await db.collection("task_lists").insertOne({
            title: "Test List",
            owner: "63579c9f9e7c9a7e1a8b4567",
            tasks: [],
            sharedWith: []
        });

        const response = await request(app).get(
            `/taskLists?ids=${insertedList.insertedId.toString()}`
        );

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    _id: insertedList.insertedId.toString(),
                    title: "Test List"
                })
            ])
        );
    });
});
