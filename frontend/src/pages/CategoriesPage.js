import React, { useEffect, useState } from 'react';
import { categoryAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiTag, FiX, FiCheck } from 'react-icons/fi';

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
    <div className="card w-full max-w-md">
      <div className="flex items-center justify-between p-5 border-b border-slate-700">
        <h2 className="font-semibold text-slate-100">{title}</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-100"><FiX /></button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | { edit: category }
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    categoryAPI.getAll().then(r => setCategories(r.data.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm({ name: '', description: '' }); setModal('add'); };
  const openEdit = (cat) => { setForm({ name: cat.name, description: cat.description || '' }); setModal({ edit: cat }); };
  const closeModal = () => setModal(null);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'add') {
        await categoryAPI.create(form);
        toast.success('Category created!');
      } else {
        await categoryAPI.update(modal.edit._id, form);
        toast.success('Category updated!');
      }
      load(); closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving category');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete category "${name}"?`)) return;
    try {
      await categoryAPI.delete(id);
      toast.success('Category deleted!');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error deleting'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Categories</h1>
          <p className="text-slate-400 text-sm mt-1">{categories.length} categories</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <FiPlus /> <span className="hidden sm:inline">Add Category</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : categories.length === 0 ? (
        <div className="card p-12 text-center">
          <FiTag className="text-4xl text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No categories yet.</p>
          <button onClick={openAdd} className="btn-primary mt-4">Add First Category</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => (
            <div key={cat._id} className="card p-4 flex items-start justify-between group">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FiTag className="text-blue-400 text-sm" />
                  <p className="font-semibold text-slate-100">{cat.name}</p>
                </div>
                {cat.description && <p className="text-slate-400 text-sm">{cat.description}</p>}
                <p className="text-slate-600 text-xs mt-2">{new Date(cat.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(cat)} className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors">
                  <FiEdit2 className="text-sm" />
                </button>
                <button onClick={() => handleDelete(cat._id, cat.name)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors">
                  <FiTrash2 className="text-sm" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal === 'add' ? 'Add Category' : 'Edit Category'} onClose={closeModal}>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="label">Name *</label>
              <input className="input" placeholder="Category name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input resize-none" rows={3} placeholder="Optional description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
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
