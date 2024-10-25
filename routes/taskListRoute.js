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
router.post("/", (req, res) => {
    //const _id = new ObjectId()
    const {title, owner, tasks, sharedWith} = req.body;

    const newList = {
        title,
        owner,
        tasks: [],
        sharedWith
    }

    db.collection("task_lists").insertOne(newList)
        .catch(error => {console.log(error)})
});

// Gets the task list and returns the array of task objects assosiated with the task list
router.get('/:id', async (req, res) => {
    const listID = req.params;
    let tasks = []
    let temp;

    // Ensure the id is a valid ObjectId
    if (!ObjectId.isValid(listID)) {
        return res.status(400).json({message: 'Invalid list ID'});
    }

    db.collection("task_lists").findOne({_id : new ObjectId(listID)})
        // This only returns pending Promises
        /*.then(result => {
            result.tasks.forEach(element => {
                try {
                    console.log(element)
                    const task = db.collection("tasks").findOne({id : new ObjectId(element)});
                    console.log(task)

                    tasks.push(task);
                } catch (error) {
                    console.log(error);
                    return res.status(400).json({message: error});
                }
                //res.json(tasks);
            });

            console.log(tasks)

            return res.status(200).json(tasks)
        })*/
       .then(result => {
            temp = result;
            console.log(temp)
            return res.status(200).json(temp)
       })
        .catch(error => {
            console.log(error);
            return res.status(400).json({message: error});
        })
});

// Add a task to a list
/// TODO:
/// 1. Does not check for duplicates
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
    const updatedTask = await db.collection("tasks").findOneAndUpdate(
            { _id: taskOID },
            { $set: {taskList: listOID}},
            { returnOriginal: false})
        .catch(error => {
            console.log(error);
            return res.status(400).json({ message: "Error updating Task"});
        });
    if (updatedTask == null) {
        return res.status(400).json({ message: "Task not found"});
    }
    
    console.log("Task");
    console.log(updatedTask);

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

    return res.status(200).json(taskID + " has been added");
});

// Remove a task from a list
router.patch("/:id/remove", (req, res) => {
    const listID = req.params;
    let listOID;
    const taskID = req.body;
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

module.exports = {router, connectDB}