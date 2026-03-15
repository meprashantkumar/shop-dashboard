const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { getOrders, getOrder, createOrder, updateOrder, deleteOrder } = require('../controllers/orderController');

router.use(protect);
router.get('/', getOrders);
router.get('/:id', getOrder);
router.post('/', createOrder);
router.put('/:id', updateOrder);
router.delete('/:id', deleteOrder);

module.exports = router;
