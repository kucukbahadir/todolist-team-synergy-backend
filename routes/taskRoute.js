const express = require('express');
const router = express.Router();
const {ObjectId} = require('mongodb'); // Import ObjectId for MongoDB
const NotificationRepository = require('../repositories/NotificationRepository');

let db;
let notificationRepository;

// This function will fetch the database connection from app.js
function connectDB(database) {
    db = database;
    notificationRepository = new NotificationRepository(db);
}

// Get all tasks
router.get('/', async (req, res) => {
    if (req.db) {
        db = req.db;
    }
    const ids = req.query.ids;

    // Check if 'ids' parameter is provided
    if (!ids) {
        return res.status(400).json({ message: 'No list IDs provided' });
    }

    // Split the 'ids' query parameter into an array
    const listIDs = ids.split(',');
    //console.log("List ID's", listIDs);

    // Validate all IDs to ensure they are valid MongoDB ObjectIDs
    const validObjectIds = listIDs.filter(id => ObjectId.isValid(id)).map(id => new ObjectId(id));
    //console.log("Valids: ", validObjectIds)

    if (validObjectIds.length === 0) {
        return res.status(401).json({ message: 'No valid task IDs provided' });
    }

    try {
        // Fetch all lists with the provided IDs
        const tasks = await db.collection("tasks").find({ _id: { $in: validObjectIds } }).toArray();
        return res.status(200).json(tasks);
    } catch (error) {
        console.error("Error fetching tasks:", error);
        return res.status(500).json({ message: 'Error fetching tasks' });
    }
});

// Create Task operation (POST)
router.post('/', async (req, res) => {
    /* if (req.db) {
        db = req.db;
    } */
    const {title, description, dueDate, completed, priority, taskList} = req.body;
    console.log("Body: ", req.body);
    console.log("User: ", req.user);
    // Automatically assign the task to the authenticated user
    const newTask = {
        title,
        description,
        dueDate,
        completed: completed || false,
        priority: priority || 'Medium',
        // TODO: fix this i.v.m de test somehow
        assignedToUser: new ObjectId(req.user.id), // Automatically set the creator as the assigned user
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

        res.status(200).json(task); // Return the task if found
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
            res.status(200).json({message: 'Task deleted successfully'});
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
    const notificationDistributor = req.app.get('notificationDistributor');

    // Ensure the id is a valid ObjectId
    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid task ID' });
    }

    try {
        // Update the task to assign the user
        const result = await db.collection('tasks').updateOne(
            { _id: new ObjectId(id) }, // Filter by the task's _id
            { $set: { assignedToUser: new ObjectId(userId) } } // Assign the user
        );

        // Check if the task was found and updated
        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Retrieve the updated task to return in the response
        const updatedTask = await db.collection('tasks').findOne({ _id: new ObjectId(id) });

        // Create a notification for the assigned user
        await notificationRepository.createNotification(userId, {
            title: 'Task Assigned',
            message: `You have been assigned to: ${updatedTask.title}`,
            link: `/tasks/${id}`
        }).then(async () => {
            // Distribute the notification to the user
            await notificationDistributor.notify(`notifications-${userId}`);

            await notificationDistributor.notify(`new-task-${userId}`);
        });

        // Return the updated task
        res.status(200).json();
    } catch (error) {
        res.status(500).json({ message: 'Error assigning user to task', error: error.message });
    }
});

module.exports = {router, connectDB};
