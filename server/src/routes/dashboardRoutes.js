const express = require('express');
const {
  getDashboardStats,
  getStockOverview,
  getSalesTrend,
  getRecentTransactions,
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // Dashboard requires authentication

router.get('/stats', getDashboardStats);
router.get('/stock-overview', getStockOverview);
router.get('/sales-trend', getSalesTrend);
router.get('/recent-transactions', getRecentTransactions);

module.exports = router;
