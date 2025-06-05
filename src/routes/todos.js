const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Todo = require('../models/Todo');

/**
 * @route   GET api/todos
 * @desc    Get all todos for a user
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const todos = await Todo.find({ user: req.user.id })
      .sort({ date: -1 });
    res.json(todos);
  } catch (err) {
    console.error('Error fetching todos:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

/**
 * @route   POST api/todos
 * @desc    Create a todo
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
  try {
    const { text, time, date } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }

    const newTodo = new Todo({
      text,
      time: time || null,
      date: date || new Date(),
      user: req.user.id
    });

    const todo = await newTodo.save();
    res.json(todo);
  } catch (err) {
    console.error('Error creating todo:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

/**
 * @route   PUT api/todos/:id
 * @desc    Update a todo
 * @access  Private
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { text, time, date, completed } = req.body;

    let todo = await Todo.findById(id);
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    if (todo.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const updateData = {};
    if (text !== undefined) updateData.text = text;
    if (time !== undefined) updateData.time = time;
    if (date !== undefined) updateData.date = date;
    if (completed !== undefined) updateData.completed = completed;

    todo = await Todo.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    res.json(todo);
  } catch (err) {
    console.error('Error updating todo:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

/**
 * @route   DELETE api/todos/:id
 * @desc    Delete a todo
 * @access  Private
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const todo = await Todo.findById(id);
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    if (todo.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await Todo.deleteOne({ _id: id });
    res.json({ message: 'Todo removed' });
  } catch (err) {
    console.error('Error deleting todo:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router; 