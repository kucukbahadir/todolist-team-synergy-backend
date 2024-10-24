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
router.patch("/:id", (req, res) => {
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

    // Update the task
    db.collection("tasks").findOneAndUpdate(
            { _id: taskOID },
            { $set: {taskList: listOID}},
            { returnOriginal: false})
        .catch(error => {
            console.log(error);
            return res.status(400).json({ message: "Error updating Task"});
        });

    // Update the task list
    db.collection("task_lists").findOneAndUpdate(
            { _id: taskOID },
            { $push: {tasks: taskList + taskOID}},  // Does not check for duplicates
            { returnOriginal: false})
        .catch(error => {
            console.log(error);
            return res.status(400).json({ message: "Error updating List"});
        });

})

module.exports = {router, connectDB}