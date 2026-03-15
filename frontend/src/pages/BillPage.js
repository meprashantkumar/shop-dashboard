import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderAPI } from '../services/api';
import { FiPrinter, FiArrowLeft, FiShare2 } from 'react-icons/fi';

const fmtCurrency = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
}).format(Number(value) || 0);

export default function BillPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const shopName = process.env.REACT_APP_SHOP_NAME || 'My Shop';
  const billRef = useRef();

  useEffect(() => {
    orderAPI.getOne(id).then(r => setOrder(r.data.data)).catch(() => navigate('/orders')).finally(() => setLoading(false));
  }, [id, navigate]);

  const handlePrint = () => window.print();

  const handleWhatsApp = () => {
    if (!order) return;

    const lines = [
      `Bill from ${shopName}`,
      '----------------',
      `Customer: ${order.customerName}`,
      `Phone: ${order.customerPhone}`,
      `Date: ${new Date(order.createdAt).toLocaleString('en-IN')}`,
      '----------------',
      'Items:',
      ...order.items.map(i => {
        const discount = Number(i.discount) || 0;
        const netPrice = Math.max(i.price - discount, 0);
        const discountText = discount > 0 ? ` (${fmtCurrency(discount)} off)` : '';
        return `- ${i.productName} x${i.quantity} @ ${fmtCurrency(netPrice)}${discountText} = ${fmtCurrency(netPrice * i.quantity)}`;
      }),
      '----------------',
      `Total: ${fmtCurrency(order.totalAmount)}`,
      `Payment: ${order.paymentMethod.toUpperCase()}`,
      '',
      'Thank you for shopping with us!',
    ].join('\n');

    const phone = order.customerPhone.replace(/\D/g, '');
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(lines)}`;
    window.open(url, '_blank');
  };

  if (loading) return (
    <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
  );
  if (!order) return null;

  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalDiscount = order.items.reduce((sum, item) => sum + (Number(item.discount) || 0) * item.quantity, 0);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between no-print">
        <button onClick={() => navigate('/orders')} className="flex items-center gap-2 text-slate-400 hover:text-slate-100 transition-colors text-sm">
          <FiArrowLeft /> Back to Orders
        </button>
        <div className="flex gap-2">
          <button onClick={handleWhatsApp} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition-all text-sm">
            <FiShare2 /> WhatsApp
          </button>
          <button onClick={handlePrint} className="btn-primary flex items-center gap-2 text-sm">
            <FiPrinter /> Print
          </button>
        </div>
      </div>

      <div ref={billRef} className="card p-8 print:bg-white print:text-black print:border-0 print:shadow-none">
        <div className="text-center mb-6 pb-6 border-b border-slate-700 print:border-gray-300">
          <h1 className="text-2xl font-bold text-slate-100 print:text-black">{shopName}</h1>
          <p className="text-slate-400 print:text-gray-500 text-sm mt-1">Invoice / Receipt</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <p className="text-slate-400 print:text-gray-500 text-xs uppercase tracking-wide mb-1">Customer</p>
            <p className="font-semibold text-slate-100 print:text-black">{order.customerName}</p>
            <p className="text-slate-300 print:text-gray-700">{order.customerPhone}</p>
          </div>
          <div className="text-right">
            <p className="text-slate-400 print:text-gray-500 text-xs uppercase tracking-wide mb-1">Invoice Details</p>
            <p className="font-mono text-xs text-slate-400 print:text-gray-500">#{order._id.slice(-8).toUpperCase()}</p>
            <p className="text-slate-300 print:text-gray-700 text-sm">{new Date(order.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-900/40 text-blue-300 print:bg-gray-100 print:text-gray-700 uppercase">{order.paymentMethod}</span>
          </div>
        </div>

        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b border-slate-700 print:border-gray-300">
              <th className="text-left text-xs text-slate-400 print:text-gray-500 font-medium pb-2 uppercase tracking-wide">Item</th>
              <th className="text-center text-xs text-slate-400 print:text-gray-500 font-medium pb-2 uppercase tracking-wide">Qty</th>
              <th className="text-right text-xs text-slate-400 print:text-gray-500 font-medium pb-2 uppercase tracking-wide">Price</th>
              <th className="text-right text-xs text-slate-400 print:text-gray-500 font-medium pb-2 uppercase tracking-wide">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => {
              const discount = Number(item.discount) || 0;
              const netPrice = Math.max(item.price - discount, 0);
              const lineTotal = netPrice * item.quantity;

              return (
                <tr key={i} className="border-b border-slate-700/50 print:border-gray-100">
                  <td className="py-3 text-slate-200 print:text-black font-medium">
                    <div>{item.productName}</div>
                    {discount > 0 && (
                      <div className="text-xs text-amber-300 print:text-gray-600">
                        MRP {fmtCurrency(item.price)} - Discount {fmtCurrency(discount)}
                      </div>
                    )}
                  </td>
                  <td className="py-3 text-center text-slate-300 print:text-gray-700">{item.quantity}</td>
                  <td className="py-3 text-right text-slate-300 print:text-gray-700">{fmtCurrency(netPrice)}</td>
                  <td className="py-3 text-right text-slate-200 print:text-black font-semibold">{fmtCurrency(lineTotal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="border-t border-slate-700 print:border-gray-300 pt-4 space-y-2">
          <div className="flex justify-between text-sm text-slate-400 print:text-gray-500">
            <span>{totalItems} items</span>
          </div>
          {totalDiscount > 0 && (
            <div className="flex justify-between text-sm text-amber-300 print:text-gray-600">
              <span>Total Discount</span>
              <span>-{fmtCurrency(totalDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold text-slate-100 print:text-black">
            <span>Total Amount</span>
            <span>{fmtCurrency(order.totalAmount)}</span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-700 print:border-gray-200 text-center">
          <p className="text-slate-400 print:text-gray-500 text-sm">Thank you for your purchase!</p>
          <p className="text-slate-600 print:text-gray-400 text-xs mt-1">Please keep this receipt for your records.</p>
        </div>
      </div>
    </div>
  );
}
