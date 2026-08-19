const express = require('express');
const {
  getMedicines,
  getMedicine,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  getCategories,
} = require('../controllers/medicineController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All medicine routes require login

router.get('/categories', getCategories);

router.route('/').get(getMedicines).post(createMedicine);

router
  .route('/:id')
  .get(getMedicine)
  .put(updateMedicine)
  .delete(authorize('Admin'), deleteMedicine);

module.exports = router;
