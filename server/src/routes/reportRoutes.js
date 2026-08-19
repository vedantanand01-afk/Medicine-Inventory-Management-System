const express = require('express');
const {
  getInventoryReport,
  getSalesReport,
  getMovementReport,
  getExpiryReport,
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // Reports require authentication

router.get('/inventory', getInventoryReport);
router.get('/sales', getSalesReport);
router.get('/movement', getMovementReport);
router.get('/expiry', getExpiryReport);

module.exports = router;
