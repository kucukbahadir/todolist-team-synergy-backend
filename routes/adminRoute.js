const express = require('express');
const router = express.Router();
const {ObjectId} = require('mongodb'); 

let db;

function connectDB(database) {
    db = database;
}

router.get('/', async (req, res) => {
    try {
        const users = await db.collection('users').find().toArray();
        res.json(users);
    } catch (err) {
        res.status(500).json({message: 'Error fetching users', error: err.message});
    }
});


router.post('/', async (req, res) => {
    const {email} = req.body;
    const newUser = {
        email,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    try {
        const result = await db.collection('users').insertOne(newUser);

        const insertedUser = await db.collection('users').findOne({_id: result.insertedId});

        res.status(201).json(insertedUser);
    } catch (err) {
        res.status(500).json({message: 'Error creating User', error: err.message});
    }
});

router.get('/:id', async (req, res) => {
    const {id} = req.params;

    if (!ObjectId.isValid(id)) {
        return res.status(400).json({message: 'Invalid User ID'});
    }

    try {
        const task = await db.collection('email').findOne({_id: new ObjectId(id)});

        if (!task) {
            return res.status(404).json({message: 'User not found'});
        }

        res.json(task); 
    } catch (err) {
        res.status(500).json({message: 'Error fetching task', error: err.message});
    }
});

router.put('/:id', async (req, res) => {
    const {id} = req.params;
    const {email} = req.body;
    try {
        const updateFields = {
            ...(email && {email}),  
            updatedAt: new Date() 
        };

        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({message: 'No valid fields provided for update'});
        }

        const result = await db.collection('users').updateOne(
            {_id: new ObjectId(id)}, 
            {$set: updateFields} 
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({message: 'User not found'});
        }

        const updatedTask = await db.collection('users').findOne({_id: new ObjectId(id)});

        res.status(200).json(updatedTask);
    } catch (err) {
        res.status(500).json({message: 'Error updating User', error: err.message});
    }
});

router.delete('/:id', async (req, res) => {
    const {id} = req.params;

    if (!ObjectId.isValid(id)) {
        return res.status(400).json({message: 'Invalid User ID'});
    }
    try {
        const result = await db.collection('users').deleteOne({_id: new ObjectId(id)}); 
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
