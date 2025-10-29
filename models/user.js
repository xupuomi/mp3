// Load required packages
var mongoose = require('mongoose');

// Define our user schema
var UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    pendingTasks: [{ type: String, default: [] }],
    dateCreated: { type: Date, default: Date.now }
});

var TaskSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, default: "" },
    deadline: { type: Date, required: true },
    completed: { type: Boolean, default: false },
    assignedUser: { type: String, default: "" },
    assignedUserName: { type: String, default: "unassigned" },
    dateCreated: { type: Date, default: Date.now }
});

// Export both models
var User = mongoose.model('User', UserSchema);
var Task = mongoose.model('Task', TaskSchema);

module.exports = {
    User: User,
    Task: Task
};
