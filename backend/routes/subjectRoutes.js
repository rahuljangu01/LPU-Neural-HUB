const express = require('express');
const router = express.Router();
const { 
    addSubject, 
    getSubjects, 
    deleteSubject, // Naya function
    updateSubject  // Naya function (Rearrangement ke liye)
} = require('../controllers/subjectController');
const auth = require('../middleware/authMiddleware');

// 1. Add New Subject (Input Variable)
router.post('/', auth, addSubject);

// 2. Get All Subjects (Multi-department context)
router.get('/', auth, getSubjects);

// 3. Update Subject (For rearrangeable solutions)
router.put('/:id', auth, updateSubject);

// 4. Delete Subject (Purge Node from AI Engine)
router.delete('/:id', auth, deleteSubject);

module.exports = router;