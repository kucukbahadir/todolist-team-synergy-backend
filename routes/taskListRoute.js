/* eslint-disable no-unused-vars */
const express = require("express");
const router = express.Router();
const {ObjectId} = require("mongodb");

const taskList = require("../models/tasklistModel.js");

let db;
// This function will fetch the database connection from app.js
function connectDB(database) {
    db = database;
}

// Create a new task list
/// TODO: Doesn't check for duplicate titles
router.post("/", async (req, res) => {
    //const _id = new ObjectId()
    const {title, owner, tasks, sharedWith} = req.body;

    const newList = {
        title,
        owner,
        tasks: [],
        sharedWith
    }

    const tempList = await db.collection("task_lists").insertOne(newList)
        .catch(error => {console.log(error)})

    console.log(tempList)

    return res.status(200).json("all good")
});

// Gets the task list and returns the array of task objects assosiated with the task list
router.get('/', async (req, res) => {
    const ids = req.query.ids;

    // Check if 'ids' parameter is provided
    if (!ids) {
        return res.status(400).json({ message: 'No list IDs provided' });
    }

    // Split the 'ids' query parameter into an array
    const listIDs = ids.split(',');

    // Validate all IDs to ensure they are valid MongoDB ObjectIDs
    const validObjectIds = listIDs.filter(id => ObjectId.isValid(id)).map(id => new ObjectId(id));

    if (validObjectIds.length === 0) {
        return res.status(400).json({ message: 'No valid list IDs provided' });
    }

    try {
        // Fetch all lists with the provided IDs
        const lists = await db.collection("task_lists").find({ _id: { $in: validObjectIds } }).toArray();
        return res.status(200).json(lists);
    } catch (error) {
        console.error("Error fetching lists:", error);
        return res.status(500).json({ message: 'Error fetching lists' });
    }
});

// Add a task to a list
router.patch("/:id/add", async (req, res) => {
    const listID = req.params;
    let listOID;
    const { taskID } = req.body;
    let taskOID;

    // Ensure the id is a valid ObjectId
    if (!ObjectId.isValid(listID)) {
        return res.status(400).json({message: 'Invalid list ID'});
    } else if (!ObjectId.isValid(taskID)) {
        console.log(taskID)
        return res.status(400).json({message: 'Invalid task ID'});
    }

    //console.log("Making OID's")
    listOID = new ObjectId(listID);
    taskOID = new ObjectId(taskID);

    // Update the task to add the list
    const oldTask = await db.collection("tasks").findOneAndUpdate(
            { _id: taskOID },
            { $set: {taskList: listOID}},
            { returnOriginal: "before"})
        .catch(error => {
            console.log(error);
            return res.status(400).json({ message: "Error updating Task"});
        });
    console.log(oldTask);
    /* if (oldTask == null) {
        return res.status(400).json({ message: "Task not found"});
    } else if (oldTask.value.taskList != null) {
        // Remove task from old taskList
        db.collection("task_lists").findOneAndUpdate(
            { _id: oldTask.value.taskList },
            { $pull: {taskList: taskOID}},
            { returnOriginal: false}
        .catch(error => {console.log(error)}));
    } */
    
    //console.log("Task");
    //console.log(oldTask);

    // Update the list to add the task
    const updatedList = await db.collection("task_lists").findOneAndUpdate(
            { _id: listOID },
            { $push: {tasks: taskOID}},  // Does not check for duplicates
            { returnOriginal: false})
        .catch(error => {
            console.log(error);
            return res.status(400).json({ message: "Error updating List"});
        });
    if (updatedList == null) {
        return res.status(400).json({ message: "List not found"});
    }

    console.log("List:");
    console.log(updatedList);

    return res.status(200).json(taskID + " has been added / updated");
});

// Remove a task from a list
router.patch("/:id/remove", (req, res) => {
    const listID = req.params;
    let listOID;
    const { taskID } = req.body;
    let taskOID;

    // Ensure the id is a valid ObjectId
    if (!ObjectId.isValid(listID)) {
        return res.status(400).json({message: 'Invalid list ID'});
    } else if (!ObjectId.isValid(taskID)) {
        return res.status(400).json({message: 'Invalid task ID'});
    }

    listOID = new ObjectId(listID);
    taskOID = new ObjectId(taskID);

    // Update the task to remove the list
    db.collection("tasks").findOneAndUpdate(
            { _id: taskOID },
            { $set: {taskList: null}},
            { returnOriginal: false})
        .catch(error => {console.log(error)}
    );

    // Update the list to remove the task
    db.collection("task_lists").findOneAndUpdate(
            { _id: listOID },
            { $pull: {taskList: taskOID}},
            { returnOriginal: false}
        .catch(error => {console.log(error)})
    );
});

router.delete("/:id/delete", (req, res) => {
    const listID = req.params;
    let listOID;

    if (!ObjectId.isValid(listID)) {
        return res.status(400).json({message: 'Invalid list ID'});
    } 
    listOID = new ObjectId(listID);

    // Remove task list form tasks
    db.collection("tasks").find({taskList : listOID}).toArray()
        .then(result => {
            result.forEach(element => {
                try {
                    db.collection("tasks").findOneAndUpdate(
                        { _id: new ObjectId(element._id) },
                        { $set: {taskList: null}},
                        { returnOriginal: false})
                } catch (error) {
                    console.log("Task not found: '\n'" + error)
                }
            })
        })
        .catch(error => {console.log(error)});

    db.collection("task_lists").deleteOne(listOID);
});

// Share a task list with other users
router.post("/:id/share", async (req, res) => {
    const listID = req.params.id;
    const { emails } = req.body; // Array of emails to share the list with

    // Check if the task list ID is valid
    if (!ObjectId.isValid(listID)) {
        return res.status(400).json({ message: 'Invalid task list ID' });
    }

    try {
        // Fetch the task list
        const taskList = await db.collection("task_lists").findOne({ _id: new ObjectId(listID) });
        if (!taskList) {
            console.log("Task list not found for ID:", listID);
            return res.status(404).json({ message: 'Task list not found' });
        }
        console.log("Task list found:", taskList);

        // Find users by emails
        const users = await db.collection("users").find({ email: { $in: emails } }).toArray();
        if (users.length === 0) {
            console.log("No users found for emails:", emails);
            return res.status(404).json({ message: 'No users found with provided emails' });
        }
        console.log("Users found:", users);

        // Extract user IDs
        const userIds = users.map(user => user._id);
        console.log("User IDs to share with:", userIds);

        // Update the `sharedWith` field in the task list
        const updateListResult = await db.collection("task_lists").updateOne(
            { _id: new ObjectId(listID) },
            { $addToSet: { sharedWith: { $each: userIds } } } // Avoid duplicates
        );
        console.log("Task list update result:", updateListResult);

        // Update each user's `sharedLists` field
        const updateUserResult = await db.collection("users").updateMany(
            { _id: { $in: userIds } },
            { $addToSet: { sharedLists: new ObjectId(listID) } } // Avoid duplicates
        );
        console.log("User update result:", updateUserResult);

        res.status(200).json({ message: 'Task list shared successfully', sharedWith: emails });
    } catch (error) {
        console.error("Error details:", error);
        res.status(500).json({ message: 'An error occurred while sharing the task list' });
    }
});

module.exports = {router, connectDB}