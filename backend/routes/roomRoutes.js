const express = require('express');
const router = express.Router();
const { addRoom, getRooms, deleteRoom } = require('../controllers/roomController');
const auth = require('../middleware/authMiddleware');

router.post('/', auth, addRoom);
router.get('/', auth, getRooms);
router.delete('/:id', auth, deleteRoom);

module.exports = router;