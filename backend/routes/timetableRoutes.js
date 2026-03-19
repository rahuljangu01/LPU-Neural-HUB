const express = require('express');
const router = express.Router();
const { 
    getTimetable, 
    addSlot, 
    checkLiveStatus, 
    cancelSlot, 
    addBulkSlots // Naya function import kiya
} = require('../controllers/timetableController');

// 1. Get Official Timetable (Student/Teacher dashboards ke liye)
router.get('/', getTimetable);

// 2. Manual Override (Special slots/Manual adjustment ke liye)
router.post('/add', addSlot); 

// 3. AI Bulk Deployment (HOD Dashboard -> Approve button ke liye)
// Frontend call: API.post('/timetable/add-bulk', { schedule: ... })
router.post('/add-bulk', addBulkSlots); 

// 4. Unit Scanner (Real-time availability check ke liye)
router.get('/availability', checkLiveStatus);

// 5. Delete Specific Node (Timetable clearing/Slot cancellation ke liye)
router.delete('/:id', cancelSlot);

module.exports = router;