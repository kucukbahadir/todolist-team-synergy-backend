// Require the app from app.js
const app = require('./app');

// Load environment variables from .env
require('dotenv').config();

// Set the port from the environment or default to 5000
const PORT = process.env.PORT || 5000;

// Ignore errors about unauthorized certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const NotificationDistributor = require('./services/NotificationDistributor');
const notificationDistributor = new NotificationDistributor(server);

// provide the notification distributor to the app
app.set('notificationDistributor', notificationDistributor);



const cleanup = () => {
  console.log("Cleaning up...");
  server.close(() => {
    console.log("Server closed");
    notificationDistributor.wss.close(); // Close the WebSocket server
    process.exit(0); // Exit the process
  });
}

process.on('exit', cleanup);