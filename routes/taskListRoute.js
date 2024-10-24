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

// Gets the task list and returns the array of task objects assosiated with the task list
router.get('/:id', (req, res) => {
    const listID = req.params;
    let tasks = []

    // Ensure the id is a valid ObjectId
    if (!ObjectId.isValid(listID)) {
        return res.status(400).json({message: 'Invalid list ID'});
    }

    db.collection("task_lists").findOne({_id : new ObjectId(listID)})
        .then(result => {
            result.tasks.forEach(element => {
                try {
                    const task = db.collection("tasks").findOne({id : new ObjectId(element)});
                    tasks.push(task);
                } catch (error) {
                    console.log(error);
                    return res.status(400).json({message: error});
                }
                //res.json(tasks);
            });

            return res.status(200).json(tasks)
        })
        .catch(error => {
            console.log(error);
            return res.status(400).json({message: error});
        })
});

// Update task list and task to link them together
// Add a task to a list
router.patch("/:id/add", (req, res) => {
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

    // Update the task to add the list
    db.collection("tasks").findOneAndUpdate(
            { _id: taskOID },
            { $set: {taskList: listOID}},
            { returnOriginal: false})
        .catch(error => {
            console.log(error);
            return res.status(400).json({ message: "Error updating Task"});
        });

    // Update the list to add the task
    db.collection("task_lists").findOneAndUpdate(
            { _id: taskOID },
            { $push: {tasks: taskOID}},  // Does not check for duplicates
            { returnOriginal: false})
        .catch(error => {
            console.log(error);
            return res.status(400).json({ message: "Error updating List"});
        });

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