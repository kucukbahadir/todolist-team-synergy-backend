const express = require('express');
const router = express.Router();
const {ObjectId} = require('mongodb'); // Import ObjectId for MongoDB

let db;

function connectDB(database) {
    db = database;
}

router.get('/', async (res) => {
    try {
        const users = await db.collection('user').find().toArray();
        res.json(users);
    } catch (err) {
        res.status(500).json({message: 'Error fetching users', error: err.message});
    }
});


// Create User operation (POST)
router.post('/', async (req, res) => {
    const {email} = req.body;
    const newUser = {
        email,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    try {
        // Insert the new User into the database
        const result = await db.collection('email').insertOne(newUser);

        // Fetch the newly created User using the insertedId
        const insertedUser = await db.collection('email').findOne({_id: result.insertedId});

        // Return the newly created User
        res.status(201).json(insertedUser);
    } catch (err) {
        res.status(500).json({message: 'Error creating User', error: err.message});
    }
});

// Read User operation (GET) get a single User by ID
router.get('/:id', async (req, res) => {
    const {id} = req.params;

    // Ensure the id is a valid ObjectId
    if (!ObjectId.isValid(id)) {
        return res.status(400).json({message: 'Invalid User ID'});
    }

    try {
        const task = await db.collection('email').findOne({_id: new ObjectId(id)}); // Convert id to ObjectId

        if (!task) {
            return res.status(404).json({message: 'User not found'});
        }

        res.json(task); // Return the User if found
    } catch (err) {
        res.status(500).json({message: 'Error fetching task', error: err.message});
    }
});

// Update User operation (PUT) update a single User by ID
router.put('/:id', async (req, res) => {
    const {id} = req.params;
    const {email} = req.body;
    try {
        // update object with fields to update
        const updateFields = {
            ...(email && {email}),  // Only add these fields if they are provided
            updatedAt: new Date() // Always update the 'updatedAt' field
        };

        // Check we have valid update fields
        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({message: 'No valid fields provided for update'});
        }

        // Update the task in the database
        const result = await db.collection('email').updateOne(
            {_id: new ObjectId(id)}, // Filter by the task's _id
            {$set: updateFields} // Update the fields
        );

        // Check if the User was found and updated
        if (result.matchedCount === 0) {
            return res.status(404).json({message: 'User not found'});
        }

        // Retrieve the updated User to return in the response
        const updatedTask = await db.collection('email').findOne({_id: new ObjectId(id)});

        res.status(200).json(updatedTask);
    } catch (err) {
        res.status(500).json({message: 'Error updating User', error: err.message});
    }
});

// Delete User operation (DELETE) delete a single User by ID
router.delete('/:id', async (req, res) => {
    const {id} = req.params;

    // Ensure the id is a valid ObjectId
    if (!ObjectId.isValid(id)) {
        return res.status(400).json({message: 'Invalid User ID'});
    }
    try {
        const result = await db.collection('email').deleteOne({_id: new ObjectId(id)}); // Convert id to ObjectId
        if (result.deletedCount === 1) {
            res.json({message: 'User deleted successfully'});
        } else {
            res.status(404).json({message: 'User not found'});
        }
    } catch (err) {
        res.status(500).json({message: 'Error deleting User', error: err.message});
    }
});

module.exports = {router, connectDB};
