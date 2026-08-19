const express = require('express');
const {
  getTransactions,
  getTransaction,
  createSaleTransaction,
} = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All transaction routes require authentication

router.route('/').get(getTransactions).post(createSaleTransaction);
router.route('/:id').get(getTransaction);

module.exports = router;
