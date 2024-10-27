const express = require('express');
const router = express.Router();
const {ObjectId} = require('mongodb'); // Import ObjectId for MongoDB

let db;

// This function will fetch the database connection from app.js
function connectDB(database) {
    db = database;
}

// Get all tasks
router.get('/', async (req, res) => {
    try {
        const tasks = await db.collection('tasks').find().toArray();
        res.json(tasks);
    } catch (err) {
        res.status(500).json({message: 'Error fetching tasks', error: err.message});
    }
});

// Create Task operation (POST)
router.post('/', async (req, res) => {
    const {title, description, dueDate, completed, priority, assignedToUser, taskList} = req.body;
    const newTask = {
        title,
        description,
        dueDate,
        completed: completed || false,
        priority: priority || 'Medium',
        assignedToUser: assignedToUser ? new ObjectId(assignedToUser) : null,
        taskList: new ObjectId(taskList), // Convert taskList to ObjectId
        createdAt: new Date(),
        updatedAt: new Date()
    };
    try {
        // Insert the new task into the database
        const result = await db.collection('tasks').insertOne(newTask);

        // Fetch the newly created task using the insertedId
        const insertedTask = await db.collection('tasks').findOne({_id: result.insertedId});

        // Return the newly created task
        res.status(201).json(insertedTask);
    } catch (err) {
        res.status(500).json({message: 'Error creating task', error: err.message});
    }
});

// Read Task operation (GET) get a single task by ID
router.get('/:id', async (req, res) => {
    const {id} = req.params;

    // Ensure the id is a valid ObjectId
    if (!ObjectId.isValid(id)) {
        return res.status(400).json({message: 'Invalid task ID'});
    }

    try {
        const task = await db.collection('tasks').findOne({_id: new ObjectId(id)}); // Convert id to ObjectId

        if (!task) {
            return res.status(404).json({message: 'Task not found'});
        }

        res.json(task); // Return the task if found
    } catch (err) {
        res.status(500).json({message: 'Error fetching task', error: err.message});
    }
});

// Update Task operation (PUT) update a single task by ID
router.put('/:id', async (req, res) => {
    const {id} = req.params;
    const {title, description, dueDate, completed, priority, assignedToUser, taskList} = req.body;
    try {
        // update object with fields to update
        const updateFields = {
            ...(title && {title}),  // Only add these fields if they are provided
            ...(description && {description}),
            ...(dueDate && {dueDate}),
            ...(typeof completed === 'boolean' && {completed}), // Completed might be false
            ...(priority && {priority}),
            ...(assignedToUser && {assignedToUser: new ObjectId(assignedToUser)}),
            ...(taskList && {taskList: new ObjectId(taskList)}),
            updatedAt: new Date() // Always update the 'updatedAt' field
        };

        // Check we have valid update fields
        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({message: 'No valid fields provided for update'});
        }

        // Update the task in the database
        const result = await db.collection('tasks').updateOne(
            {_id: new ObjectId(id)}, // Filter by the task's _id
            {$set: updateFields} // Update the fields
        );

        // Check if the task was found and updated
        if (result.matchedCount === 0) {
            return res.status(404).json({message: 'Task not found'});
        }

        // Retrieve the updated task to return in the response
        const updatedTask = await db.collection('tasks').findOne({_id: new ObjectId(id)});

        res.status(200).json(updatedTask);
    } catch (err) {
        res.status(500).json({message: 'Error updating task', error: err.message});
    }
});

// Delete Task operation (DELETE) delete a single task by ID
router.delete('/:id', async (req, res) => {
    const {id} = req.params;

    // Ensure the id is a valid ObjectId
    if (!ObjectId.isValid(id)) {
        return res.status(400).json({message: 'Invalid task ID'});
    }
    try {
        const result = await db.collection('tasks').deleteOne({_id: new ObjectId(id)}); // Convert id to ObjectId
        if (result.deletedCount === 1) {
            res.json({message: 'Task deleted successfully'});
        } else {
            res.status(404).json({message: 'Task not found'});
        }
    } catch (err) {
        res.status(500).json({message: 'Error deleting task', error: err.message});
    }
});

// Assign a user to a task (PATCH)
router.patch('/:id/assign', async (req, res) => {
    const { id } = req.params; // Get the task ID from the URL
    const { userId } = req.body; // Get the user ID from the request body

    // Ensure the id is a valid ObjectId
    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid task ID' });
    }

    try {
        // Update the task to assign the user
        const updatedTask = await db.collection('tasks').findOneAndUpdate(
            { _id: new ObjectId(id) }, // Filter by the task's _id
            { $set: { assignedToUser: new ObjectId(userId) } }, // Update assigned user
            { returnOriginal: false } // Return the updated document
        );

        // Check if the task was found and updated
        if (!updatedTask.value) {
            return res.status(404).json({ message: 'Task found 1' });
        }

        // Return the updated task
        res.status(200).json(updatedTask.value);
    } catch (error) {
        res.status(500).json({ message: 'Error assigning user to task', error: error.message });
    }
});

module.exports = {router, connectDB};
