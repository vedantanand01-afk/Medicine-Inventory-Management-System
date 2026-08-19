const express = require('express');
const {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} = require('../controllers/supplierController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All supplier routes require login

router.route('/').get(getSuppliers).post(createSupplier);

router
  .route('/:id')
  .get(getSupplier)
  .put(updateSupplier)
  .delete(authorize('Admin'), deleteSupplier);

module.exports = router;
