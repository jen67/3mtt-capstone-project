#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Function to create a file with content
create_file() {
  local file_path=$1
  local file_content=$2

  mkdir -p "$(dirname "$file_path")"
  echo "$file_content" > "$file_path"
  echo "Created $file_path"
}

# Files and content
create_file "server.js" "
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();

app.use(express.json());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/taskmaster';

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

const User = require('./models/User');
const Task = require('./models/Task');

app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));

app.listen(PORT, () => {
    console.log(\`Server running on http://localhost:\${PORT}\`);
});
"

create_file "models/User.js" "
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

module.exports = mongoose.model('User', UserSchema);
"

create_file "models/Task.js" "
const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String },
    deadline: { type: Date },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);
"

create_file "routes/userRoutes.js" "
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error registering user' });
    }
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: 'Error logging in' });
    }
});

module.exports = router;
"

create_file "routes/taskRoutes.js" "
const express = require('express');
const Task = require('../models/Task');
const jwt = require('jsonwebtoken');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded.userId;
        next();
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
};

router.post('/', authenticate, async (req, res) => {
    const { title, description, deadline, priority } = req.body;
    try {
        const task = new Task({ user: req.user, title, description, deadline, priority });
        await task.save();
        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({ error: 'Error creating task' });
    }
});

router.get('/', authenticate, async (req, res) => {
    try {
        const tasks = await Task.find({ user: req.user });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching tasks' });
    }
});

router.put('/:id', authenticate, async (req, res) => {
    try {
        const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: 'Error updating task' });
    }
});

router.delete('/:id', authenticate, async (req, res) => {
    try {
        await Task.findByIdAndDelete(req.params.id);
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting task' });
    }
});

module.exports = router;
"

create_file "frontend/index.html" "
<!DOCTYPE html>
<html lang='en'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>TaskMaster</title>
    <link rel='stylesheet' href='styles.css'>
</head>
<body>
    <div id='app'>
        <h1>TaskMaster</h1>
        <div id='tasks'></div>
    </div>
    <script src='app.js'></script>
</body>
</html>
"

create_file "frontend/styles.css" "
/* Add your CSS styles here */
body { font-family: Arial, sans-serif; }
"

create_file "frontend/app.js" "
console.log('Frontend loaded');
"

echo "TaskMaster project structure created successfully!"
