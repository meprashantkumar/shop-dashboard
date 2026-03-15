const Order = require('../models/Order');
const Product = require('../models/Product');

const PERIOD_KEYS = {
  today: 'today',
  week: '7days',
  month: '30days',
  year: 'year',
  financial: 'financial',
};

const getDateRange = (type) => {
  const now = new Date();
  let start;

  switch (type) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case '7days':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30days':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      start = new Date(now.getFullYear(), 0, 1);
      break;
    case 'financial': {
      const month = now.getMonth();
      const year = month >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      start = new Date(year, 3, 1);
      break;
    }
    default:
      start = new Date(0);
  }

  return { start, end: now };
};

const aggregateSales = async ({ start, end }) => {
  const result = await Order.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: null,
        totalSales: { $sum: '$totalAmount' },
        totalProfit: { $sum: '$totalProfit' },
        totalOrders: { $sum: 1 },
        totalItemsSold: { $sum: { $sum: '$items.quantity' } },
      },
    },
  ]);

  return result[0] || { totalSales: 0, totalProfit: 0, totalOrders: 0, totalItemsSold: 0 };
};

const aggregateProductAnalytics = async ({ start, end }) => {
  return Order.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        productName: { $first: '$items.productName' },
        quantitySold: { $sum: '$items.quantity' },
        sales: {
          $sum: {
            $multiply: [
              { $subtract: ['$items.price', { $ifNull: ['$items.discount', 0] }] },
              '$items.quantity',
            ],
          },
        },
        profit: { $sum: '$items.profit' },
        discountGiven: {
          $sum: {
            $multiply: [{ $ifNull: ['$items.discount', 0] }, '$items.quantity'],
          },
        },
      },
    },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product',
      },
    },
    {
      $addFields: {
        currentStock: { $ifNull: [{ $arrayElemAt: ['$product.stock', 0] }, 0] },
      },
    },
    {
      $project: {
        product: 0,
      },
    },
    { $sort: { quantitySold: -1, sales: -1 } },
  ]);
};

const aggregateChartData = async ({ start, end }, type) => {
  const useMonthlyBuckets = type === 'year' || type === 'financial';
  const format = useMonthlyBuckets ? '%Y-%m' : '%Y-%m-%d';

  return Order.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: { $dateToString: { format, date: '$createdAt' } },
        sales: { $sum: '$totalAmount' },
        profit: { $sum: '$totalProfit' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

exports.getDashboardStats = async (req, res) => {
  try {
    const ranges = Object.fromEntries(
      Object.entries(PERIOD_KEYS).map(([key, type]) => [key, getDateRange(type)])
    );

    const summaryEntries = await Promise.all(
      Object.entries(ranges).map(async ([key, range]) => [key, await aggregateSales(range)])
    );

    const chartEntries = await Promise.all(
      Object.entries(ranges).map(async ([key, range]) => [key, await aggregateChartData(range, PERIOD_KEYS[key])])
    );

    const productAnalyticsEntries = await Promise.all(
      Object.entries(ranges).map(async ([key, range]) => [key, await aggregateProductAnalytics(range)])
    );

    const summary = Object.fromEntries(summaryEntries);
    const chartData = Object.fromEntries(chartEntries);
    const productAnalytics = Object.fromEntries(productAnalyticsEntries);

    const totalProducts = await Product.countDocuments();
    const lowStockProducts = await Product.find({ stock: { $lte: 5 } }).select('name stock').sort({ stock: 1, name: 1 });

    res.json({
      success: true,
      data: {
        summary,
        chartData,
        productAnalytics,
        totalProducts,
        lowStockProducts,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
