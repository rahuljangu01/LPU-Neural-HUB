const express = require('express');
const router = express.Router();
const { addBatch, getBatches, deleteBatch,updateBatch  } = require('../controllers/batchController');
const auth = require('../middleware/authMiddleware');

router.get('/', getBatches);
router.post('/', auth, addBatch);
router.delete('/:id', auth, deleteBatch); 
router.put('/:id', auth, updateBatch); 

module.exports = router;
