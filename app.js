// Load environment variables from .env file
require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const app = express();

// Middleware to parse JSON requests
app.use(express.json());

const url = process.env.MONGO_DB_URL;
const dbName = process.env.MONGO_DB_NAME;
const client = new MongoClient(url);

async function connectDB() {
    try {
        await client.connect();
        const db = client.db(dbName);
        return db;
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
        process.exit(1);
    }
}

// Route imports
const routeAuthenticate = require('./routes/routeAuthenticate');
const { router: routeTask, connectDB: connectTaskDB } = require('./routes/routeTask');

// Connect to the database and use in task routes
connectDB().then((database) => {
    connectTaskDB(database); // Pass the connected database

    // Routes
    app.use('/api', routeAuthenticate);    // For authentication
    app.use('/api/tasks', routeTask);      // Task-related routes

    // Start the server
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
});
