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

// test if connection to database
async function connectDB() {
    try {
        await client.connect();
        console.log('Successfully connected to MongoDB');
        const db = client.db(dbName);
        return db;
    } catch (err) {
        console.error('Error connecting to MongoDB:', err.message);
        process.exit(1);  // Exit if database connection fails
    }
}

// Route imports
const routeAuthenticate = require('./routes/routeAuthenticate');
const { router: routeTask, connectDB: connectTaskDB } = require('./routes/routeTask');

// Connect to the database and set up routes
connectDB().then((database) => {
    connectTaskDB(database); // Pass the connected database to task routes

    // Define routes
    app.use('/api', routeAuthenticate);    // Authentication routes
    app.use('/api/tasks', routeTask);      // Task-related routes
});

// Export the `app` instance for use in `index.js`
module.exports = app;
