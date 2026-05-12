const express = require('express');
const router = express.Router();
const { 
    getTimetable, 
    addSlot, 
    checkLiveStatus, 
    cancelSlot, 
    addBulkSlots
} = require('../controllers/timetableController');

router.get('/', getTimetable);
router.post('/add', addSlot); 
router.post('/add-bulk', addBulkSlots); 
router.get('/availability', checkLiveStatus);
router.delete('/:id', cancelSlot);

module.exports = router;
