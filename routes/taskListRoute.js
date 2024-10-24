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

router.get('/:id', (req, res) => {
    const listID = req.params;
    let tasks = []

    // Ensure the id is a valid ObjectId
    if (!ObjectId.isValid(listID)) {
        return res.status(400).json({message: 'Invalid task ID'});
    }

    db.collection("task_lists").findOne({id : new ObjectId(listID)})
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
})

module.exports = {router, connectDB}