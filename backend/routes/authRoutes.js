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

// Auth middleware for protected routes
const auth = require('../middleware/authMiddleware');

// --- MULTER SETUP ---
// Hum memory storage use kar rahe hain kyunki humein file save nahi karni, 
// bas read karke database mein data daalna hai.
const upload = multer({ storage: multer.memoryStorage() });

router.post('/register', register);
router.post('/login', login);
router.get('/users', getUsers);
router.delete('/users/:id', auth, deleteUser);

// Naya functionality: Faculty parameters update aur Student batch assignment ke liye
router.post('/update-expertise', updateUserAI); 

// 🔥 NAYA ROUTE: Excel file upload karke students import karne ke liye
// 'file' wahi naam hona chahiye jo aap frontend se FormData mein bhejenge
router.post('/bulk-import', upload.single('file'), bulkImportStudents);

// 🔥 PASSWORD CHANGE ROUTE (Protected - requires auth token)
router.post('/change-password', auth, changePassword);

// 🔥 VERIFY/REVOKE HOD ACCOUNT (Admin only)
router.post('/verify-hod', auth, verifyHOD);

module.exports = router;