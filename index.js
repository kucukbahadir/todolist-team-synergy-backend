// Require the app from app.js
const app = require('./app');

// Load environment variables from .env
require('dotenv').config();

// Set the port from the environment or default to 5000
const PORT = process.env.PORT || 5000;

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const cleanup = () => {
  console.log("Cleaning up...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0); // Exit the process
  });
}

process.on('exit', cleanup);