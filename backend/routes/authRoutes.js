const express = require('express');
const router = express.Router();
const multer = require('multer');
const { 
    register, 
    login, 
    getUsers, 
    deleteUser, 
    updateUserAI, 
    bulkImportStudents,
    changePassword,
    verifyHOD
} = require('../controllers/authController');

const auth = require('../middleware/authMiddleware');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/register', register);
router.post('/login', login);
router.get('/users', getUsers);
router.delete('/users/:id', auth, deleteUser);
router.post('/update-expertise', updateUserAI); 
router.post('/bulk-import', upload.single('file'), bulkImportStudents);
router.post('/change-password', auth, changePassword);
router.post('/verify-hod', auth, verifyHOD);

module.exports = router;
