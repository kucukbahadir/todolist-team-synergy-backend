const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  verificationCode: {
    type: String,
    required: false 
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