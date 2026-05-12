const express = require('express');
const router = express.Router();
const { 
    addSubject, 
    getSubjects, 
    deleteSubject,
    updateSubject
} = require('../controllers/subjectController');
const auth = require('../middleware/authMiddleware');

router.post('/', auth, addSubject);
router.get('/', auth, getSubjects);
router.put('/:id', auth, updateSubject);
router.delete('/:id', auth, deleteSubject);

module.exports = router;
