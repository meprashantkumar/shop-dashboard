const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: { type: String, required: true },
  price: { type: Number, required: true },
  costPrice: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  discount: { type: Number, default: 0, min: 0 },
  profit: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema({
  customerName: { type: String, required: true, trim: true },
  customerPhone: { type: String, required: true, trim: true },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  totalProfit: { type: Number, required: true },
  paymentMethod: {
    type: String,
    enum: ['cash', 'online', 'upi'],
    default: 'cash',
  },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
