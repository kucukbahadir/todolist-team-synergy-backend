// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const {MongoClient, ObjectId} = require('mongodb'); // Import ObjectId for MongoDB
const EmailService = require('./services/EmailService');
const Task = require('./taskModel'); // Keep the Task model import

// Create an instance of Express
const app = express();

// Middleware to parse JSON requests
app.use(express.json());

const emailService = new EmailService();

// MongoDB Connection URL and Database Name from environment variables
const url = process.env.MONGO_DB_URL;
const dbName = process.env.MONGO_DB_NAME;

// MongoDB Client (native MongoDB driver)
const client = new MongoClient(url);

// Connect to MongoDB
async function connectDB() {
    try {
        console.log('Connecting to MongoDB server...');
        await client.connect();
        console.log('Connected successfully to MongoDB server');
        const db = client.db(dbName);
        console.log(`Using database: ${db.databaseName}`);
        return db;
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
        process.exit(1); // Exit if there's a DB connection error
    }
}

// Call the MongoDB connection function
let db;
connectDB().then(database => {
    db = database;
});

// Define a basic route to test the server
app.get('/', (req, res) => {
    res.send('Hello, World! Express is up and running.');
});

// Test the verification email service
app.post('/api/verify', async (req, res) => {
    try {
        await emailService.sendVerificationEmail(req.body.email, req.body.code);
        res.send('Email sent');
    } catch (error) {
        res.status(500).send('Error sending email');
    }
});

// Test the password reset email service
app.post('/api/reset', async (req, res) => {
    try {
        await emailService.sendPasswordResetEmail(req.body.email, req.body.link);
        res.send('Email sent');
    } catch (error) {
        res.status(500).send('Error sending email');
    }
});

// Define routes for other operations
app.get('/api/tasks', async (req, res) => {
    try {
        const db = client.db(dbName);
        const tasks = await db.collection('tasks').find().toArray();
        res.json(tasks);
    } catch (err) {
        res.status(500).json({message: 'Error fetching tasks', error: err.message});
    }
});

// Define the "Create Task" operation (POST) using MongoClient
app.post('/api/tasks', async (req, res) => {
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
        const result = await db.collection('tasks').insertOne(newTask); // Save task using MongoClient
        res.status(201).json(result.ops[0]); // Return the created task
    } catch (err) {
        res.status(500).json({message: 'Error creating task', error: err.message});
    }
});

app.delete('/api/tasks/:id', async (req, res) => {
    const {id} = req.params;
    try {
        const db = client.db(dbName);
        const result = await db.collection('tasks').deleteOne({_id: new MongoClient.ObjectID(id)});
        if (result.deletedCount === 1) {
            res.json({message: 'Task deleted successfully'});
        } else {
            res.status(404).json({message: 'Task not found'});
        }
    } catch (err) {
        res.status(500).json({message: 'Error deleting task', error: err.message});
    }
});

// Export the app object so it can be used in index.js
module.exports = app;