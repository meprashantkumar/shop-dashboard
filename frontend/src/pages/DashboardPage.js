import React, { useEffect, useMemo, useState } from 'react';
import { analyticsAPI } from '../services/api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { FiTrendingUp, FiShoppingBag, FiDollarSign, FiPackage, FiAlertTriangle } from 'react-icons/fi';

const fmt = (n) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
}).format(Number(n || 0));

const fmtCompact = (n) => Number(n || 0).toLocaleString('en-IN');

const PERIOD_OPTIONS = [
  { key: 'today', label: 'Today', icon: FiDollarSign, color: 'bg-blue-600' },
  { key: 'week', label: 'Last 7 Days', icon: FiTrendingUp, color: 'bg-emerald-600' },
  { key: 'month', label: 'Last 30 Days', icon: FiShoppingBag, color: 'bg-violet-600' },
  { key: 'year', label: 'This Year', icon: FiPackage, color: 'bg-amber-600' },
  { key: 'financial', label: 'Financial Year', icon: FiTrendingUp, color: 'bg-cyan-600' },
];

const StatCard = ({ label, value, sub, icon: Icon, color, active, onClick }) => (
  <button onClick={onClick} className={`card p-5 text-left transition-all ${active ? 'ring-1 ring-blue-500/70 border-blue-500/40' : 'hover:border-slate-500/60'}`}>
    <div className="flex items-start justify-between mb-3">
      <p className="text-slate-400 text-sm font-medium">{label}</p>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="text-white text-base" />
      </div>
    </div>
    <p className="text-2xl font-bold text-slate-100">{value}</p>
    {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
  </button>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm">
        <p className="text-slate-300 mb-1">{label}</p>
        {payload.map(p => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: {fmt(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  useEffect(() => {
    analyticsAPI.getDashboard()
      .then(res => setStats(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const selectedSummary = stats?.summary?.[selectedPeriod];
  const selectedChart = stats?.chartData?.[selectedPeriod] || [];
  const selectedProducts = stats?.productAnalytics?.[selectedPeriod] || [];
  const topProducts = useMemo(() => selectedProducts.slice(0, 5), [selectedProducts]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!stats) return <p className="text-slate-400">Failed to load dashboard.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Your shop overview and product performance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {PERIOD_OPTIONS.map(({ key, label, icon, color }) => {
          const data = stats.summary[key];
          return (
            <StatCard
              key={key}
              label={`Sales - ${label}`}
              value={fmt(data.totalSales)}
              sub={`${data.totalOrders} orders - Profit ${fmt(data.totalProfit)}`}
              icon={icon}
              color={color}
              active={selectedPeriod === key}
              onClick={() => setSelectedPeriod(key)}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="text-slate-400 text-sm font-medium">Selected Period</p>
          <p className="text-2xl font-bold text-slate-100 mt-2">{PERIOD_OPTIONS.find(p => p.key === selectedPeriod)?.label}</p>
          <p className="text-slate-500 text-xs mt-1">{selectedSummary.totalOrders} orders - {selectedSummary.totalItemsSold} units sold</p>
        </div>
        <div className="card p-5">
          <p className="text-slate-400 text-sm font-medium">Total Products</p>
          <p className="text-2xl font-bold text-slate-100 mt-2">{fmtCompact(stats.totalProducts)}</p>
          <p className="text-slate-500 text-xs mt-1">Live catalog count</p>
        </div>
        <div className="card p-5">
          <p className="text-slate-400 text-sm font-medium">Profit In Period</p>
          <p className="text-2xl font-bold text-emerald-400 mt-2">{fmt(selectedSummary.totalProfit)}</p>
          <p className="text-slate-500 text-xs mt-1">Based on completed orders</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr,0.7fr] gap-4">
        <div className="card p-5">
          <h2 className="font-semibold text-slate-100 mb-4">Sales Trend - {PERIOD_OPTIONS.find(p => p.key === selectedPeriod)?.label}</h2>
          {selectedChart.length === 0 ? (
            <p className="text-slate-500 text-sm">No sales data for this period.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={selectedChart}>
                <defs>
                  <linearGradient id="sales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="profit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="_id" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={value => fmtCompact(value)} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="sales" name="Sales" stroke="#3b82f6" fill="url(#sales)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="profit" name="Profit" stroke="#22c55e" fill="url(#profit)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-slate-100 mb-4">Top Products - {PERIOD_OPTIONS.find(p => p.key === selectedPeriod)?.label}</h2>
          {topProducts.length === 0 ? (
            <p className="text-slate-500 text-sm">No product sales found in this period.</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={`${p._id}-${i}`} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-700 text-slate-300 text-xs flex items-center justify-center font-bold flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate font-medium">{p.productName}</p>
                    <p className="text-xs text-slate-500">{p.quantitySold} sold - Stock: {p.currentStock}</p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-400">{fmt(p.profit)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.25fr,0.75fr] gap-4">
        <div className="card p-5 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-100">Product Analytics</h2>
              <p className="text-slate-500 text-xs mt-1">Sales, quantity, discount, and profit for {PERIOD_OPTIONS.find(p => p.key === selectedPeriod)?.label.toLowerCase()}</p>
            </div>
          </div>

          {selectedProducts.length === 0 ? (
            <p className="text-slate-500 text-sm">No product analytics available for this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left text-xs text-slate-400 font-medium px-3 py-3">Product</th>
                    <th className="text-right text-xs text-slate-400 font-medium px-3 py-3">Sold</th>
                    <th className="text-right text-xs text-slate-400 font-medium px-3 py-3">Sales</th>
                    <th className="text-right text-xs text-slate-400 font-medium px-3 py-3">Discount</th>
                    <th className="text-right text-xs text-slate-400 font-medium px-3 py-3">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedProducts.map((product, index) => (
                    <tr key={`${product._id}-${index}`} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                      <td className="px-3 py-3">
                        <p className="text-sm font-medium text-slate-200">{product.productName}</p>
                        <p className="text-xs text-slate-500">Current stock: {product.currentStock}</p>
                      </td>
                      <td className="px-3 py-3 text-right text-sm text-slate-300">{fmtCompact(product.quantitySold)}</td>
                      <td className="px-3 py-3 text-right text-sm text-slate-200">{fmt(product.sales)}</td>
                      <td className="px-3 py-3 text-right text-sm text-amber-300">{fmt(product.discountGiven)}</td>
                      <td className="px-3 py-3 text-right text-sm text-emerald-400">{fmt(product.profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <FiAlertTriangle className="text-amber-400" />
            Low Stock Alerts
          </h2>
          {stats.lowStockProducts?.length === 0 ? (
            <p className="text-slate-500 text-sm">All products are well stocked!</p>
          ) : (
            <div className="space-y-2">
              {stats.lowStockProducts.map(p => (
                <div key={p._id} className="flex items-center justify-between p-3 bg-amber-900/20 border border-amber-800/30 rounded-lg">
                  <p className="text-sm text-slate-200">{p.name}</p>
                  <span className={`badge ${p.stock === 0 ? 'bg-red-900/50 text-red-300' : 'bg-amber-900/50 text-amber-300'}`}>
                    {p.stock === 0 ? 'Out of Stock' : `${p.stock} left`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
