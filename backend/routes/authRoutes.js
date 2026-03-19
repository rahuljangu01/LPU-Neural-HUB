const express = require('express');
const router = express.Router();
const { register, login, getUsers, deleteUser, updateUserAI } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/users', getUsers);
router.delete('/users/:id', deleteUser);

// Naya functionality: Faculty parameters update aur Student batch assignment ke liye
router.post('/update-expertise', updateUserAI); 

module.exports = router;