const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { getDashboardStats } = require('../controllers/analyticsController');

router.use(protect);
router.get('/dashboard', getDashboardStats);

module.exports = router;
