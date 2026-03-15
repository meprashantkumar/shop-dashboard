import React, { useEffect, useState } from 'react';
import { productAPI, categoryAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiPackage, FiX, FiCheck, FiImage } from 'react-icons/fi';

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
    <div className="card w-full max-w-lg my-4">
      <div className="flex items-center justify-between p-5 border-b border-slate-700">
        <h2 className="font-semibold text-slate-100">{title}</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-100"><FiX /></button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);

const emptyForm = { name: '', category: '', price: '', costPrice: '', stock: '', image: null };

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([productAPI.getAll(), categoryAPI.getAll()]);
      setProducts(pRes.data.data);
      setCategories(cRes.data.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(emptyForm); setImagePreview(''); setModal('add'); };
  const openEdit = (p) => {
    setForm({ name: p.name, category: p.category?._id || '', price: p.price, costPrice: p.costPrice, stock: p.stock, image: null });
    setImagePreview(p.image || '');
    setModal({ edit: p });
  };
  const closeModal = () => setModal(null);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm({ ...form, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('category', form.category);
      fd.append('price', form.price);
      fd.append('costPrice', form.costPrice);
      fd.append('stock', form.stock);
      if (form.image) fd.append('image', form.image);

      if (modal === 'add') {
        await productAPI.create(fd);
        toast.success('Product added!');
      } else {
        await productAPI.update(modal.edit._id, fd);
        toast.success('Product updated!');
      }
      load(); closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving product');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await productAPI.delete(id);
      toast.success('Product deleted!');
      load();
    } catch (err) { toast.error('Error deleting product'); }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Products</h1>
          <p className="text-slate-400 text-sm mt-1">{products.length} products</p>
        </div>
        <div className="flex gap-2">
          <input className="input w-48" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
          <button onClick={openAdd} className="btn-primary flex items-center gap-2 flex-shrink-0">
            <FiPlus /> <span className="hidden sm:inline">Add Product</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <FiPackage className="text-4xl text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">{search ? 'No products match search.' : 'No products yet.'}</p>
          {!search && <button onClick={openAdd} className="btn-primary mt-4">Add First Product</button>}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left text-xs text-slate-400 font-medium px-4 py-3">Product</th>
                  <th className="text-left text-xs text-slate-400 font-medium px-4 py-3 hidden sm:table-cell">Category</th>
                  <th className="text-right text-xs text-slate-400 font-medium px-4 py-3">Price</th>
                  <th className="text-right text-xs text-slate-400 font-medium px-4 py-3 hidden md:table-cell">Cost</th>
                  <th className="text-right text-xs text-slate-400 font-medium px-4 py-3">Stock</th>
                  <th className="text-right text-xs text-slate-400 font-medium px-4 py-3 hidden lg:table-cell">Sold</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p._id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-9 h-9 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FiImage className="text-slate-500" />
                          </div>
                        )}
                        <span className="text-sm font-medium text-slate-200">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="badge bg-slate-700 text-slate-300">{p.category?.name || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-200">₹{p.price}</td>
                    <td className="px-4 py-3 text-right text-sm text-slate-400 hidden md:table-cell">₹{p.costPrice}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`badge ${p.stock === 0 ? 'bg-red-900/40 text-red-300' : p.stock <= 5 ? 'bg-amber-900/40 text-amber-300' : 'bg-emerald-900/40 text-emerald-300'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-400 hidden lg:table-cell">{p.totalSold}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => openEdit(p)} className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors">
                          <FiEdit2 className="text-sm" />
                        </button>
                        <button onClick={() => handleDelete(p._id, p.name)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors">
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
        <Modal title={modal === 'add' ? 'Add Product' : 'Edit Product'} onClose={closeModal}>
          <form onSubmit={handleSave} className="space-y-4">
            {/* Image */}
            <div>
              <label className="label">Product Image</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-slate-900 border border-slate-600 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0">
                  {imagePreview ? <img src={imagePreview} alt="" className="w-full h-full object-cover" /> : <FiImage className="text-slate-600 text-2xl" />}
                </div>
                <label className="btn-secondary text-sm cursor-pointer">
                  Choose Image
                  <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
                </label>
              </div>
            </div>

            <div>
              <label className="label">Name *</label>
              <input className="input" placeholder="Product name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option value="">Select category</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Selling Price (₹) *</label>
                <input type="number" className="input" placeholder="0" min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
              </div>
              <div>
                <label className="label">Cost Price (₹) *</label>
                <input type="number" className="input" placeholder="0" min="0" value={form.costPrice} onChange={e => setForm({ ...form, costPrice: e.target.value })} required />
              </div>
            </div>
            <div>
              <label className="label">Stock Quantity *</label>
              <input type="number" className="input" placeholder="0" min="0" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} required />
            </div>
            {form.price && form.costPrice && (
              <div className="bg-emerald-900/20 border border-emerald-800/30 rounded-lg p-3 text-sm">
                <span className="text-slate-400">Profit per unit: </span>
                <span className="text-emerald-400 font-semibold">₹{(form.price - form.costPrice).toFixed(2)}</span>
                <span className="text-slate-500 ml-2">({form.price > 0 ? (((form.price - form.costPrice) / form.price) * 100).toFixed(1) : 0}% margin)</span>
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiCheck />}
                Save
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
