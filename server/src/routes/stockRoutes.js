const express = require('express');
const {
  getAllStock,
  stockIn,
  stockOut,
  getLowStock,
} = require('../controllers/stockController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All stock operations require authentication

router.get('/', getAllStock);
router.post('/in', stockIn);
router.post('/out', stockOut);
router.get('/low', getLowStock);

module.exports = router;
