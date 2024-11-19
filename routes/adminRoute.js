const express = require('express');
const router = express.Router();
const {ObjectId} = require('mongodb'); // Import ObjectId for MongoDB

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


// Create User operation (POST)
// Isn't this also what happens with authRoutes' "/register"?
router.post('/', async (req, res) => {
    const {email} = req.body;
    const newUser = {
        email,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    try {
        // Insert the new User into the database
        const result = await db.collection('users').insertOne(newUser);

        // Fetch the newly created User using the insertedId
        const insertedUser = await db.collection('users').findOne({_id: result.insertedId});

        // Return the newly created User
        res.status(201).json(insertedUser);
    } catch (err) {
        res.status(500).json({message: 'Error creating User', error: err.message});
    }
});

// Read User operation (GET) get a single User by ID
router.get('/id/:id', async (req, res) => {
    const id = req.params.id; // Extract the email from route params
    console.log("HIT")
    try {
        const user = await db.collection('users').findOne({ _id: new ObjectId(id) });
        console.log(user)

        if (!user) {
            return res.status(404).json({ message: 'User not found' }); // Handle case where user is not found
        }

        return res.status(200).json(user); // Send user data as JSON response
    } catch (error) {
        console.error("Error fetching user:", error); // Log the error for debugging
        res.status(500).json({ message: 'Internal server error' }); // Send structured error response
    }
});

// Read User operation (GET) get a single User by mail
router.get('/mail/:mail', async (req, res) => {
    const email = req.params.mail; // Extract the email from route params
    try {
        const user = await db.collection('users').findOne({ email: email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' }); // Handle case where user is not found
        }

        return res.status(200).json(user); // Send user data as JSON response
    } catch (error) {
        console.error("Error fetching user:", error); // Log the error for debugging
        res.status(500).json({ message: 'Internal server error' }); // Send structured error response
    }
});

// TODO: dit werkt niet voro de een of ander reden
router.patch("/:id/", async (req, res) => {
    const id = req.params;
    console.log("ID: ", id);
    const user = req.body;
    console.log("User", user);

    try {
        console.log(user);
        delete user._id;

        let result = await db.collection("users").findOneAndUpdate(
            {_id: new ObjectId(id)},
            { $set: user},
            { returnOriginal: false}
        )

        result = await db.collection("users").findOne(new ObjectId(id))

        console.log("Updated User: ", result);

        if (!result.value) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json(result);
    } catch (error) {
        console.log(error);
        return res.status(500);
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
        const result = await db.collection('users').updateOne(
            {_id: new ObjectId(id)}, // Filter by the task's _id
            {$set: updateFields} // Update the fields
        );

        // Check if the User was found and updated
        if (result.matchedCount === 0) {
            return res.status(404).json({message: 'User not found'});
        }

        // Retrieve the updated User to return in the response
        const updatedTask = await db.collection('users').findOne({_id: new ObjectId(id)});

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
        const result = await db.collection('users').deleteOne({_id: new ObjectId(id)}); // Convert id to ObjectId
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
