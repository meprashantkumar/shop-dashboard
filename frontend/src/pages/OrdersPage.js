import React, { useEffect, useState } from 'react';
import { orderAPI, productAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiPlus, FiEye, FiEdit2, FiTrash2, FiShoppingCart, FiX, FiCheck, FiMinus, FiSearch } from 'react-icons/fi';

const fmtCurrency = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
}).format(Number(value) || 0);

const Modal = ({ title, onClose, children, wide }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
    <div className={`card w-full ${wide ? 'max-w-2xl' : 'max-w-md'} my-4`}>
      <div className="flex items-center justify-between p-5 border-b border-slate-700">
        <h2 className="font-semibold text-slate-100">{title}</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-100"><FiX /></button>
      </div>
      <div className="p-5 max-h-[80vh] overflow-y-auto">{children}</div>
    </div>
  </div>
);

const paymentLabels = { cash: 'Cash', online: 'Online', upi: 'UPI' };
const paymentColors = { cash: 'bg-emerald-900/40 text-emerald-300', online: 'bg-blue-900/40 text-blue-300', upi: 'bg-violet-900/40 text-violet-300' };

function OrderForm({
  form,
  setForm,
  productSearch,
  setProductSearch,
  filteredProducts,
  addProduct,
  updateQty,
  updateDiscount,
  removeItem,
  subtotalAmount,
  totalDiscount,
  totalAmount,
  totalProfit,
  handleSave,
  closeModal,
  saving,
  isCreate,
}) {
  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Customer Name *</label>
          <input className="input" placeholder="John Doe" value={form.customerName} onChange={e => setForm(prev => ({ ...prev, customerName: e.target.value }))} required />
        </div>
        <div>
          <label className="label">Phone *</label>
          <input className="input" placeholder="9876543210" value={form.customerPhone} onChange={e => setForm(prev => ({ ...prev, customerPhone: e.target.value }))} required />
        </div>
      </div>

      <div>
        <label className="label">Payment Method</label>
        <div className="grid grid-cols-3 gap-2">
          {['cash', 'online', 'upi'].map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setForm(prev => ({ ...prev, paymentMethod: m }))}
              className={`py-2 rounded-lg text-sm font-medium border transition-all ${form.paymentMethod === m ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-900 border-slate-600 text-slate-400 hover:border-slate-500'}`}
            >
              {paymentLabels[m]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Add Products</label>
        <div className="relative mb-2">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input className="input pl-9 text-sm" placeholder="Search products..." value={productSearch} onChange={e => setProductSearch(e.target.value)} />
        </div>
        <div className="max-h-40 overflow-y-auto space-y-1 border border-slate-700 rounded-lg p-2 bg-slate-900">
          {filteredProducts.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-3">No products found</p>
          ) : filteredProducts.map(p => (
            <button
              key={p._id}
              type="button"
              onClick={() => addProduct(p)}
              className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-slate-700 text-left transition-colors"
            >
              <span className="text-sm text-slate-200">{p.name}</span>
              <span className="text-xs text-slate-400">{fmtCurrency(p.price)} - {p.stock} in stock</span>
            </button>
          ))}
        </div>
      </div>

      {form.items.length > 0 && (
        <div>
          <label className="label">Order Items</label>
          <div className="space-y-2">
            {form.items.map(item => {
              const unitDiscount = Number(item.discount) || 0;
              const unitNet = Math.max(item.price - unitDiscount, 0);
              const lineTotal = unitNet * item.quantity;

              return (
                <div key={item.productId} className="bg-slate-900 border border-slate-700 rounded-lg p-3 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{item.productName}</p>
                      <p className="text-xs text-slate-400">
                        {fmtCurrency(item.price)} x {item.quantity}
                        {unitDiscount > 0 ? ` - ${fmtCurrency(unitDiscount)} discount = ${fmtCurrency(lineTotal)}` : ` = ${fmtCurrency(lineTotal)}`}
                      </p>
                    </div>
                    <button type="button" onClick={() => removeItem(item.productId)} className="w-7 h-7 flex items-center justify-center hover:bg-red-900/30 rounded-md text-slate-500 hover:text-red-400 transition-colors">
                      <FiX className="text-xs" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                    <div>
                      <label className="label text-xs">Quantity</label>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => updateQty(item.productId, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded-md text-slate-300 transition-colors">
                          <FiMinus className="text-xs" />
                        </button>
                        <span className="w-10 text-center text-sm text-slate-200 font-mono">{item.quantity}</span>
                        <button type="button" onClick={() => updateQty(item.productId, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded-md text-slate-300 transition-colors">
                          <FiPlus className="text-xs" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="label text-xs">Discount Per Item</label>
                      <input
                        type="number"
                        min="0"
                        max={item.price}
                        step="0.01"
                        className="input"
                        value={item.discount ?? 0}
                        onChange={e => updateDiscount(item.productId, e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 p-3 bg-slate-900 border border-slate-700 rounded-lg text-sm space-y-2">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal</span>
              <span>{fmtCurrency(subtotalAmount)}</span>
            </div>
            <div className="flex justify-between text-amber-300">
              <span>Total Discount</span>
              <span>-{fmtCurrency(totalDiscount)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Total Amount</span>
              <span className="font-bold text-slate-100">{fmtCurrency(totalAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Profit</span>
              <span className="text-emerald-400">{fmtCurrency(totalProfit)}</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
          {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiCheck />}
          {isCreate ? 'Create & View Bill' : 'Update Order'}
        </button>
      </div>
    </form>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ customerName: '', customerPhone: '', paymentMethod: 'cash', items: [] });
  const [saving, setSaving] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const [oRes, pRes] = await Promise.all([orderAPI.getAll(), productAPI.getAll()]);
      setOrders(oRes.data.data);
      setProducts(pRes.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm({ customerName: '', customerPhone: '', paymentMethod: 'cash', items: [] });
    setProductSearch('');
    setModal('create');
  };

  const openEdit = (order) => {
    setForm({
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      paymentMethod: order.paymentMethod,
      items: order.items.map(i => ({
        productId: i.productId,
        productName: i.productName,
        price: i.price,
        costPrice: i.costPrice,
        quantity: i.quantity,
        discount: i.discount || 0,
      })),
    });
    setProductSearch('');
    setModal({ edit: order });
  };

  const closeModal = () => setModal(null);

  const addProduct = (product) => {
    setForm(prev => {
      const exists = prev.items.find(i => i.productId === product._id);
      if (exists) {
        return {
          ...prev,
          items: prev.items.map(i => i.productId === product._id ? { ...i, quantity: i.quantity + 1 } : i),
        };
      }

      return {
        ...prev,
        items: [
          ...prev.items,
          {
            productId: product._id,
            productName: product.name,
            price: product.price,
            costPrice: product.costPrice,
            quantity: 1,
            discount: 0,
          },
        ],
      };
    });
  };

  const updateQty = (productId, qty) => {
    if (qty < 1) return removeItem(productId);
    setForm(prev => ({ ...prev, items: prev.items.map(i => i.productId === productId ? { ...i, quantity: qty } : i) }));
  };

  const updateDiscount = (productId, discountValue) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.map(i => {
        if (i.productId !== productId) return i;
        const nextDiscount = Number(discountValue);
        if (Number.isNaN(nextDiscount)) return { ...i, discount: 0 };
        return { ...i, discount: Math.min(Math.max(nextDiscount, 0), i.price) };
      }),
    }));
  };

  const removeItem = (productId) => {
    setForm(prev => ({ ...prev, items: prev.items.filter(i => i.productId !== productId) }));
  };

  const subtotalAmount = form.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalDiscount = form.items.reduce((sum, item) => sum + (Number(item.discount) || 0) * item.quantity, 0);
  const totalAmount = form.items.reduce((sum, item) => sum + Math.max(item.price - (Number(item.discount) || 0), 0) * item.quantity, 0);
  const totalProfit = form.items.reduce((sum, item) => sum + (Math.max(item.price - (Number(item.discount) || 0), 0) - item.costPrice) * item.quantity, 0);

  const handleSave = async (e) => {
    e.preventDefault();
    if (form.items.length === 0) {
      toast.error('Add at least one item');
      return;
    }

    setSaving(true);
    try {
      if (modal === 'create') {
        const res = await orderAPI.create(form);
        toast.success('Order created!');
        load();
        closeModal();
        navigate(`/bill/${res.data.data._id}`);
      } else {
        await orderAPI.update(modal.edit._id, form);
        toast.success('Order updated!');
        load();
        closeModal();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving order');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this order? Stock will be restored.')) return;
    try {
      await orderAPI.delete(id);
      toast.success('Order deleted, stock restored!');
      load();
    } catch (err) {
      toast.error('Error deleting order');
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) && p.stock > 0
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Orders</h1>
          <p className="text-slate-400 text-sm mt-1">{orders.length} orders</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <FiPlus /> <span className="hidden sm:inline">New Order</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : orders.length === 0 ? (
        <div className="card p-12 text-center">
          <FiShoppingCart className="text-4xl text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No orders yet.</p>
          <button onClick={openCreate} className="btn-primary mt-4">Create First Order</button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left text-xs text-slate-400 font-medium px-4 py-3">Customer</th>
                  <th className="text-left text-xs text-slate-400 font-medium px-4 py-3 hidden sm:table-cell">Items</th>
                  <th className="text-right text-xs text-slate-400 font-medium px-4 py-3">Amount</th>
                  <th className="text-right text-xs text-slate-400 font-medium px-4 py-3 hidden md:table-cell">Profit</th>
                  <th className="text-left text-xs text-slate-400 font-medium px-4 py-3 hidden lg:table-cell">Payment</th>
                  <th className="text-left text-xs text-slate-400 font-medium px-4 py-3 hidden lg:table-cell">Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o._id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-200">{o.customerName}</p>
                      <p className="text-xs text-slate-500">{o.customerPhone}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-sm text-slate-400">{o.items.length} item{o.items.length !== 1 ? 's' : ''}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-slate-200">{fmtCurrency(o.totalAmount)}</td>
                    <td className="px-4 py-3 text-right text-sm text-emerald-400 hidden md:table-cell">{fmtCurrency(o.totalProfit)}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={`badge ${paymentColors[o.paymentMethod]}`}>{paymentLabels[o.paymentMethod]}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400 hidden lg:table-cell">
                      {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => navigate(`/bill/${o._id}`)} className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-900/20 rounded-lg transition-colors" title="View Bill">
                          <FiEye className="text-sm" />
                        </button>
                        <button onClick={() => openEdit(o)} className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors">
                          <FiEdit2 className="text-sm" />
                        </button>
                        <button onClick={() => handleDelete(o._id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors">
                          <FiTrash2 className="text-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <Modal title={modal === 'create' ? 'New Order' : 'Edit Order'} onClose={closeModal} wide>
          <OrderForm
            form={form}
            setForm={setForm}
            productSearch={productSearch}
            setProductSearch={setProductSearch}
            filteredProducts={filteredProducts}
            addProduct={addProduct}
            updateQty={updateQty}
            updateDiscount={updateDiscount}
            removeItem={removeItem}
            subtotalAmount={subtotalAmount}
            totalDiscount={totalDiscount}
            totalAmount={totalAmount}
            totalProfit={totalProfit}
            handleSave={handleSave}
            closeModal={closeModal}
            saving={saving}
            isCreate={modal === 'create'}
          />
        </Modal>
      )}
    </div>
  );
}
