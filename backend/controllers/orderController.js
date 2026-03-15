const Order = require('../models/Order');
const Product = require('../models/Product');

const normalizeDiscount = (value, maxPrice) => {
  const discount = Number(value) || 0;
  if (discount < 0) return 0;
  return Math.min(discount, maxPrice);
};

// Helper: restore stock from order items
const restoreStock = async (items) => {
  for (const item of items) {
    if (item.productId) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity, totalSold: -item.quantity },
      });
    }
  }
};

// Helper: deduct stock from order items
const deductStock = async (items) => {
  for (const item of items) {
    if (item.productId) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity, totalSold: item.quantity },
      });
    }
  }
};

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { customerName, customerPhone, items, paymentMethod } = req.body;
    if (!items || items.length === 0)
      return res.status(400).json({ success: false, message: 'Order must have at least one item' });

    // Enrich items with product data
    const enrichedItems = [];
    let totalAmount = 0;
    let totalProfit = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ success: false, message: `Product not found: ${item.productId}` });
      if (product.stock < item.quantity)
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}` });

      const discount = normalizeDiscount(item.discount, product.price);
      const netPrice = product.price - discount;
      const profit = (netPrice - product.costPrice) * item.quantity;
      enrichedItems.push({
        productId: product._id,
        productName: product.name,
        price: product.price,
        costPrice: product.costPrice,
        quantity: item.quantity,
        discount,
        profit,
      });
      totalAmount += netPrice * item.quantity;
      totalProfit += profit;
    }

    const order = await Order.create({
      customerName,
      customerPhone,
      items: enrichedItems,
      totalAmount,
      totalProfit,
      paymentMethod: paymentMethod || 'cash',
    });

    await deductStock(enrichedItems);
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const { customerName, customerPhone, items, paymentMethod } = req.body;

    // Restore old stock
    await restoreStock(order.items);

    // Enrich new items
    const enrichedItems = [];
    let totalAmount = 0;
    let totalProfit = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ success: false, message: `Product not found: ${item.productId}` });
      if (product.stock < item.quantity)
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}` });

      const discount = normalizeDiscount(item.discount, product.price);
      const netPrice = product.price - discount;
      const profit = (netPrice - product.costPrice) * item.quantity;
      enrichedItems.push({
        productId: product._id,
        productName: product.name,
        price: product.price,
        costPrice: product.costPrice,
        quantity: item.quantity,
        discount,
        profit,
      });
      totalAmount += netPrice * item.quantity;
      totalProfit += profit;
    }

    order.customerName = customerName || order.customerName;
    order.customerPhone = customerPhone || order.customerPhone;
    order.items = enrichedItems;
    order.totalAmount = totalAmount;
    order.totalProfit = totalProfit;
    order.paymentMethod = paymentMethod || order.paymentMethod;
    await order.save();

    await deductStock(enrichedItems);
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    await restoreStock(order.items);
    await order.deleteOne();
    res.json({ success: true, message: 'Order deleted and stock restored' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
