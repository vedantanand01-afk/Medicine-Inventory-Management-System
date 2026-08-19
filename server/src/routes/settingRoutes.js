const express = require('express');
const {
  getSettings,
  updateSettings,
} = require('../controllers/settingController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // Settings require authentication

router.route('/').get(getSettings).put(authorize('Admin'), updateSettings);

module.exports = router;
