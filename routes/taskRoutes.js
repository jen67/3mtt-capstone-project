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
    if (!title || !description || !deadline || !priority) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const currentDate = new Date();
    const deadlineDate = new Date(deadline);
    if (deadlineDate < currentDate) {
        return res.status(400).json({ error: 'Deadline cannot be in the past' });
    }

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

// Route to fetch a single task by its ID
router.get('/:id', authenticate, async (req, res) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, user: req.user });
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching task details' });
    }
});

router.put('/:id', authenticate, async (req, res) => {
    const { title, description, deadline, priority } = req.body;
    if (!title || !description || !deadline || !priority) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const currentDate = new Date();
    const deadlineDate = new Date(deadline);
    if (deadlineDate < currentDate) {
        return res.status(400).json({ error: 'Deadline cannot be in the past' });
    }

    try {
        const task = await Task.findOneAndUpdate(
            { _id: req.params.id, user: req.user },
            { title, description, deadline, priority },
            { new: true }
        );
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: 'Error updating task' });
    }
});

router.delete('/:id', authenticate, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user });
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting task' });
    }
});

// Route to mark a task as complete or incomplete
router.put('/:id/complete', authenticate, async (req, res) => {
    const { completed } = req.body;
    try {
        const task = await Task.findOneAndUpdate(
            { _id: req.params.id, user: req.user },
            { completed },
            { new: true }
        );
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: 'Error updating task completion status' });
    }
});

module.exports = router;