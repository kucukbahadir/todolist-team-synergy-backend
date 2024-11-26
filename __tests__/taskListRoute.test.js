const request = require("supertest");
const express = require("express");
const { router, connectDB } = require("../routes/taskListRoute");

const { ObjectId } = require("mongodb");

// Mock database connection
let mockDb;

beforeAll(() => {
    mockDb = {
        collection: jest.fn().mockReturnValue({
            insertOne: jest.fn(),
            updateOne: jest.fn(),
            findOneAndUpdate: jest.fn(),
            findOne: jest.fn(),
            deleteOne: jest.fn(),
            find: jest.fn().mockReturnValue({ toArray: jest.fn() }),
            updateMany: jest.fn(),
        }),
    };

    connectDB(mockDb);
});

const app = express();
app.use(express.json());
app.use("/tasklists", router);

describe("Task List Routes", () => {
    describe("POST /tasklists", () => {
        it("should create a new task list", async () => {
            const newList = {
                title: "New Task List",
                owner: new ObjectId().toString(),
                sharedWith: [new ObjectId().toString()],
            };

            const insertedId = new ObjectId();

            mockDb.collection("task_lists").insertOne.mockResolvedValueOnce({
                insertedId,
            });

            mockDb.collection("users").updateOne.mockResolvedValueOnce({
                modifiedCount: 1,
            });

            const response = await request(app)
                .post("/tasklists")
                .send(newList);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Task list created successfully");
            expect(response.body.listId).toEqual(insertedId);
            expect(mockDb.collection("task_lists").insertOne).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: newList.title,
                    owner: expect.any(ObjectId),
                    sharedWith: expect.any(Array),
                })
            );
        });

        it("should return 500 if database insert fails", async () => {
            const newList = {
                title: "Another List",
                owner: new ObjectId().toString(),
                sharedWith: [new ObjectId().toString()],
            };

            mockDb.collection("task_lists").insertOne.mockRejectedValueOnce(
                new Error("Database error")
            );

            const response = await request(app).post("/tasklists").send(newList);

            expect(response.status).toBe(500);
            expect(response.body.message).toBe("Failed to create task list");
        });
    });

    describe("GET /tasklists", () => {
        it("should return task lists for given IDs", async () => {
            const listIDs = [new ObjectId().toString(), new ObjectId().toString()];

            const mockLists = listIDs.map((id) => ({
                _id: new ObjectId(id),
                title: `List ${id}`,
            }));

            mockDb.collection("task_lists")
                .find()
                .toArray.mockResolvedValueOnce(mockLists);

            const response = await request(app).get(`/tasklists?ids=${listIDs.join(",")}`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockLists);
            expect(mockDb.collection("task_lists").find).toHaveBeenCalledWith({
                _id: { $in: expect.any(Array) },
            });
        });

        it("should return 400 if no IDs are provided", async () => {
            const response = await request(app).get("/tasklists");

            expect(response.status).toBe(400);
            expect(response.body.message).toBe("No list IDs provided");
        });
    });

    describe("PATCH /tasklists/:id/add", () => {
        it("should add a task to a task list", async () => {
            const listID = new ObjectId().toString();
            const taskID = new ObjectId().toString();

            mockDb.collection("tasks").findOneAndUpdate.mockResolvedValueOnce({
                value: { _id: taskID },
            });

            mockDb.collection("task_lists").findOneAndUpdate.mockResolvedValueOnce({
                value: { _id: listID },
            });

            const response = await request(app)
                .patch(`/tasklists/${listID}/add`)
                .send({ taskID });

            expect(response.status).toBe(200);
            expect(response.text).toContain(`${taskID} has been added / updated`);
            expect(mockDb.collection("tasks").findOneAndUpdate).toHaveBeenCalled();
            expect(mockDb.collection("task_lists").findOneAndUpdate).toHaveBeenCalled();
        });

        it("should return 400 for invalid list ID", async () => {
            const response = await request(app)
                .patch("/tasklists/invalidID/add")
                .send({ taskID: new ObjectId().toString() });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe("Invalid list ID");
        });
    });

    describe("POST /tasklists/:id/share", () => {
        it("should share a task list with users", async () => {
            const listID = new ObjectId().toString();
            const emails = ["test@example.com", "user@example.com"];
            const mockUsers = emails.map((email) => ({
                _id: new ObjectId(),
                email,
            }));

            mockDb.collection("task_lists").findOne.mockResolvedValueOnce({ _id: listID });
            mockDb.collection("users").find().toArray.mockResolvedValueOnce(mockUsers);
            mockDb.collection("task_lists").updateOne.mockResolvedValueOnce({ modifiedCount: 1 });
            mockDb.collection("users").updateMany.mockResolvedValueOnce({ modifiedCount: emails.length });

            const response = await request(app)
                .post(`/tasklists/${listID}/share`)
                .send({ emails });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Task list shared successfully");
            expect(mockDb.collection("task_lists").updateOne).toHaveBeenCalled();
            expect(mockDb.collection("users").updateMany).toHaveBeenCalled();
        });

        it("should return 404 if no users are found", async () => {
            const listID = new ObjectId().toString();
            const emails = ["notfound@example.com"];

            mockDb.collection("task_lists").findOne.mockResolvedValueOnce({ _id: listID });
            mockDb.collection("users").find().toArray.mockResolvedValueOnce([]);

            const response = await request(app)
                .post(`/tasklists/${listID}/share`)
                .send({ emails });

            expect(response.status).toBe(404);
            expect(response.body.message).toBe("No users found with provided emails");
        });
    });
});
