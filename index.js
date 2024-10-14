// Require the app from app.js
const app = require('./app');

// Load environment variables from .env
require('dotenv').config();

// Set the port from the environment or default to 5000
const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Catch signal events and cleanly close the server
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  server.close(() => {
    console.log('Process terminated');
  });
});