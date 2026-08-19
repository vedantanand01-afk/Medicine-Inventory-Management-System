const express = require('express');
const {
  getLowStockAlerts,
  getExpiryAlerts,
  getAlertsSummary,
} = require('../controllers/alertController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All alerts routes require authentication

router.get('/low-stock', getLowStockAlerts);
router.get('/expiry', getExpiryAlerts);
router.get('/summary', getAlertsSummary);

module.exports = router;
