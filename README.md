# Milestone 2 & 3

> ☝ All the rules and requirements for this project are are mentioned in [project description](https://coderminds.notion.site/Todolist-Project-10a2722e759b80788d88ed107d1ecc39?pvs=4) and [Milestone 1](https://github.com/kucukbahadir/todolist-team-synergy) repository can be found here.  

---

# Backend and Frontend Development with JWT, MongoDB Cloud, Email Authentication, and Task List Sharing

## Overview

In **Milestone 2** and **Milestone 3**, we will develop both the **backend** and **frontend** architecture for the **ToDoList** application. The backend will use **Node.js**, **Express**, and **MongoDB Cloud** to implement **JWT (JSON Web Token)** authentication. Users will sign in/sign up using only their **email** (no passwords). They will receive a **6-digit verification code** via email to log in.

Users can **share task lists** with others, allowing multiple people to view and manage a common list of tasks. Tasks in a shared list can be **assigned** to specific users, and all users of a shared list will see who is responsible for each task.

### Key Objectives

- Email-based authentication using **JWT** and a **6-digit verification code**.
- **MongoDB Cloud** schemas to store users, tasks, and shared task lists.
- **CRUD operations** for tasks and task lists.
- Task list **sharing** with other users.
- Task **assignment** to specific users in shared lists.
- Comprehensive **API documentation** and a **Postman collection** for testing.
- **Frontend integration** with changes to the login flow and task-sharing functionalities.

---

## Environment Setup

### MongoDB Cloud

We will use **MongoDB Cloud (Atlas)** for database connection. The connection string will be provided and stored in the `.env` file.

### .env File

The `.env` file will contain all necessary configuration secrets, including:

- **MONGODB_URI**: The MongoDB Cloud connection string.
- **EMAIL**: Email account used to send verification codes.
- **EMAIL_PASSWORD**: Email account password.
- **JWT_SECRET**: Secret key for signing JWT tokens.

The actual values will be provided to you, and the `.env` file should **not** be committed to the repository.

---

## Backend Authentication Flow

The app will use **email-only login** with no password.

1. **Sign-up/Sign-in:**
    - A user enters their email.
    - The backend generates a **6-digit code** and sends it to the user's email.
    - The user enters the code, which is verified by the backend.
    - Once verified, a **JWT token** is generated and sent to the user for authentication in future API calls.
2. **JWT Token:**
    - The JWT token will include user details and an expiration time.
    - The token will be used to authenticate the user on subsequent requests.

---

## MongoDB Models

> ☝ These are example models. As a team, you can modify the models as needed.

### User Model

```javascript
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  verificationCode: {
    type: String,
    required: false // Only used temporarily during login
  },
  tasks: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Task' 
  }],
  sharedLists: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaskList'
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
```

# Task Model

```javascript
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  dueDate: Date,
  completed: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  assignedToUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  taskList: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaskList',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
```
# Task List Model

```javascript
const mongoose = require('mongoose');

const taskListSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

module.exports = mongoose.model('TaskList', taskListSchema);
```

# JWT & Email Authentication

## Sending Verification Codes

You can use a service like **SendGrid**, **Nodemailer**, or any other email provider to send the 6-digit verification code to the user.

Here’s an example using **Nodemailer**:

```javascript
const nodemailer = require('nodemailer');

// Set up email transport
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Function to send email with verification code
const sendVerificationCode = (email, code) => {
  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: 'Your ToDoList App Verification Code',
    text: `Your verification code is ${code}`
  };

  return transporter.sendMail(mailOptions);
};
```

# Generating and Verifying Codes

1. **Generate a 6-digit code** when the user enters their email.
2. **Send the code** via email using `sendVerificationCode()`.
3. **Store the code temporarily** in the user's document in MongoDB.
4. When the user submits the code, **verify** it matches the one stored in MongoDB.

---

# JWT Token Generation

Once the code is verified, generate a **JWT** token to authenticate the user for future requests.

```javascript
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRATION }
  );
};
```

# API Endpoints

## Auth Routes

### 1. Request Verification Code (Sign-up/Sign-in)

- **POST /auth/request-code**
- Input: `{ "email": "user@example.com" }`
- Action: Generates a 6-digit code, sends it to the email, and stores it temporarily in MongoDB.

### 2. Verify Code and Generate JWT

- **POST /auth/verify-code**
- Input: `{ "email": "user@example.com", "code": "123456" }`
- Action: Verifies the code and generates a JWT token on success.

---

## Task List Sharing and Task Assignment

### 1. Create Task List

- **POST /task-lists**
- Input: `{ "title": "My Task List" }`
- Action: Creates a new task list owned by the authenticated user.

### 2. Share Task List with Users

- **POST /task-lists/:id/share**
- Input: `{ "emails": ["user1@example.com", "user2@example.com"] }`
- Action: Shares the task list with specified users.

### 3. Assign Task to User

- **PATCH /tasks/:id/assign**
- Input: `{ "userId": "userId" }`
- Action: Assigns a task to a specific user.

---

# Frontend Changes (Milestone 3)

For the frontend part, the following changes should be made:

### Login Flow:

- Replace related fields with email input and a verification code input during the login/signup process.
- Once logged in, store the JWT token and use it for authentication in subsequent API calls.

### Task Sharing:

- Add the ability to share task lists with other users by entering their email addresses.
- Display a list of shared users in the UI for each task list.

### Task Assignment:

- Display the user to whom each task is assigned in the UI.
- Add functionality to assign tasks to users when viewing a shared task list.

---

# Postman Collection and API Documentation

## Postman Collection

A **Postman collection** should be included in the repository to allow easy testing of the APIs. The collection will contain all the endpoints described above, and each request will include:

- **Base URL**: The base URL for the API.
- **Authorization**: Include a **Bearer Token** in the headers for endpoints that require authentication.
- **Example Requests**: Each request will come pre-configured with input JSON bodies.

### To use the Postman collection for testing the API:

1. Clone the repository to your local machine.
2. Locate the Postman collection file (`ToDoList.postman_collection.json`) in the repository.
3. Open Postman and import the collection file.
4. Set up your environment variables in Postman, including the base URL for your local or deployed API.
5. Use the authentication endpoints to get a JWT token:
    - Send a request to `/auth/request-code` with your email.
    - Check your email for the verification code.
    - Send a request to `/auth/verify-code` with your email and the code to receive a JWT token.
6. For authenticated endpoints, add the JWT token to the Authorization header as a Bearer token.
7. You can now test all API endpoints using the pre-configured requests in the Postman collection.

---

## API Documentation

The **README** file for the repository will provide detailed instructions on how to:

1. **Set up the project**:
    - Installation steps.
    - Environment variable configurations (e.g., **MONGODB_URI**, **JWT_SECRET**, **Email credentials**).

2. **Run the backend**:
    - How to start the server.
    - How to connect to the MongoDB Cloud database.

3. **Test the APIs**:
    - Instructions on using the Postman collection.
    - Example API requests and responses for each endpoint.
    - How to include the JWT token in the API requests.

4. **Frontend Setup**:
    - Instructions on setting up the frontend with the updated login flow and task-sharing features.

---

# Updated Branch Naming Convention

The new **GitFlow** branch names will follow the format: `feature/Synergy-ID`.

---

# Conclusion

By completing **Milestone 2** and **Milestone 3**, we will establish a complete and secure **ToDoList** application using **MongoDB Cloud** for database storage. The backend will provide authentication via email, task management, task list sharing, and collaboration features. The frontend will reflect these changes, allowing users to log in with verification codes, share task lists, and assign tasks to different users. Additionally, a **Postman collection** and comprehensive **API documentation** will ensure easy testing and use of the API.