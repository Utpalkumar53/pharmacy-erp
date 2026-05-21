import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import {
  Plus, Edit, Trash2, Search, Phone, Mail,
  CheckCircle, AlertCircle, X, Save, Users
} from 'lucide-react';

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  page:        { padding: '40px', marginLeft: '240px', backgroundColor: '#0f172a', minHeight: '100vh' },
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' },
  h1:          { color: '#f1f5f9', margin: '0 0 4px', fontSize: '26px', fontWeight: '600' },
  subtitle:    { color: '#94a3b8', margin: 0, fontSize: '14px' },
  addBtn:      { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' },
  searchBar:   { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#1e293b', padding: '12px', borderRadius: '10px', border: '1px solid #334155', marginBottom: '20px', maxWidth: '400px' },
  searchInput: { background: 'none', border: 'none', color: 'white', outline: 'none', width: '100%', fontSize: '14px' },
  // Stats row
  statsRow:    { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' },
  statCard:    { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' },
  statNum:     { color: 'white', fontSize: '28px', fontWeight: '700', margin: '0 0 4px' },
  statLabel:   { color: '#94a3b8', fontSize: '13px', margin: 0 },
  // Table
  tableWrap:   { backgroundColor: '#1e293b', borderRadius: '16px', border: '1px solid #334155', overflow: 'hidden' },
  table:       { width: '100%', borderCollapse: 'collapse' },
  th:          { textAlign: 'left', padding: '14px 16px', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #334155', backgroundColor: '#0f172a' },
  td:          { padding: '14px 16px', color: '#cbd5e1', borderBottom: '1px solid #1e293b', fontSize: '14px' },
  // Modal
  overlay:     { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center' },
  modal:       { backgroundColor: '#1e293b', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '520px', border: '1px solid #334155' },
  label:       { color: '#94a3b8', fontSize: '12px', marginBottom: '6px', display: 'block' },
  input:       { width: '100%', padding: '10px 12px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', marginBottom: '16px', outline: 'none', fontSize: '14px', boxSizing: 'border-box' },
  inputFocus:  { border: '1px solid #2563eb' },
  saveBtn:     { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '11px 22px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
  cancelBtn:   { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px', padding: '11px 16px' },
  deleteBtn:   { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  editBtn:     { background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)', color: '#60a5fa', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', marginRight: '8px' },
  toast:       { display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' },
  toastOk:     { backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid #10b981' },
  toastErr:    { backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid #ef4444' },
  emptyState:  { textAlign: 'center', padding: '60px 0', color: '#475569' },
  pill:        { display: 'inline-block', padding: '3px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: '600' },
};

const emptyForm = { name: '', contactPerson: '', contactPhone: '', email: '', address: '', gstNumber: '' };

const Suppliers = () => {
  const [suppliers, setSuppliers]     = useState([]);
  const [showModal, setShowModal]     = useState(false);
  const [isEditing, setIsEditing]     = useState(false);
  const [currentId, setCurrentId]     = useState(null);
  const [form, setForm]               = useState({ ...emptyForm });
  const [searchQuery, setSearchQuery] = useState('');
  const [msg, setMsg]                 = useState({ text: '', type: '' });
  const [loading, setLoading]         = useState(false);
  const [focusedField, setFocusedField] = useState('');

  useEffect(() => { fetchSuppliers(); }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/suppliers');
      setSuppliers(Array.isArray(res.data) ? res.data : []);
    } catch {
      showMsg('Failed to load suppliers.', 'error');
    }
  };

  const openAdd = () => {
    setIsEditing(false);
    setCurrentId(null);
    setForm({ ...emptyForm });
    setShowModal(true);
  };

  const openEdit = (sup) => {
    setIsEditing(true);
    setCurrentId(sup.id);
    setForm({
    name:          sup.name          || '',
    contactPerson: sup.contactPerson || '',
    contactPhone:  sup.contactPhone  || '',
    email:         sup.email         || '',
    address:       sup.address       || '',
    gstNumber:     sup.gstNumber     || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim())         return showMsg('Supplier name is required.', 'error');
    if (!form.contactPhone.trim()) return showMsg('Phone number is required.', 'error');
    if (!form.email.trim())        return showMsg('Email is required.', 'error');

    setLoading(true);
    try {
      if (isEditing) {
        // PUT /api/suppliers/{id}
        await api.put(`/suppliers/${currentId}`, form);
        showMsg('Supplier updated successfully!', 'success');
      } else {
        // POST /api/suppliers
        await api.post('/suppliers', form);
        showMsg('Supplier added successfully!', 'success');
      }
      setShowModal(false);
      fetchSuppliers();
    } catch {
      showMsg('Failed to save supplier. Check connection.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete supplier "${name}"? This cannot be undone.`)) return;
    try {
      // DELETE /api/suppliers/{id}
      await api.delete(`/suppliers/${id}`);
      showMsg('Supplier deleted.', 'success');
      fetchSuppliers();
    } catch {
      showMsg('Failed to delete supplier.', 'error');
    }
  };

  const showMsg = (text, type) => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 4000);
  };

  const inputStyle = (field) => ({
    ...s.input,
    ...(focusedField === field ? s.inputFocus : {}),
  });

  const filtered = suppliers.filter(sup => {
    const q = searchQuery.toLowerCase();
    return (
      (sup.name         || '').toLowerCase().includes(q) ||
      (sup.contactPhone || '').toLowerCase().includes(q) ||
      (sup.email        || '').toLowerCase().includes(q)
    );
  });

  // Stats
  const withPhone = suppliers.filter(s => s.contactPhone).length;
  const withEmail = suppliers.filter(s => s.email).length;

  return (
    <div style={s.page}>

      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.h1}>Supplier Management</h1>
          <p style={s.subtitle}>Manage your medicine suppliers and their contact details</p>
        </div>
        <button onClick={openAdd} style={s.addBtn}>
          <Plus size={18}/> ADD SUPPLIER
        </button>
      </div>

      {/* Toast */}
      {msg.text && (
        <div style={{ ...s.toast, ...(msg.type === 'success' ? s.toastOk : s.toastErr) }}>
          {msg.type === 'success' ? <CheckCircle size={16}/> : <AlertCircle size={16}/>}
          {msg.text}
        </div>
      )}

      {/* Stats */}
      <div style={s.statsRow}>
        <div style={s.statCard}>
          <p style={s.statNum}>{suppliers.length}</p>
          <p style={s.statLabel}>Total Suppliers</p>
        </div>
        <div style={s.statCard}>
          <p style={{ ...s.statNum, color: '#10b981' }}>{withPhone}</p>
          <p style={s.statLabel}>With WhatsApp / Phone</p>
        </div>
        <div style={s.statCard}>
          <p style={{ ...s.statNum, color: '#60a5fa' }}>{withEmail}</p>
          <p style={s.statLabel}>With Email</p>
        </div>
      </div>

      {/* Search */}
      <div style={s.searchBar}>
        <Search size={16} color="#94a3b8"/>
        <input
          style={s.searchInput}
          placeholder="Search by name, phone, or email..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <X size={14} color="#94a3b8" style={{ cursor: 'pointer' }}
            onClick={() => setSearchQuery('')}/>
        )}
      </div>

      {/* Table */}
      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Supplier Name</th>
              <th style={s.th}>Phone / WhatsApp</th>
              <th style={s.th}>Email</th>
              <th style={s.th}>Address</th>
              <th style={s.th}>GSTIN</th>
              <th style={s.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={s.emptyState}>
                  <Users size={40} color="#334155" style={{ margin: '0 auto 12px', display: 'block' }}/>
                  <p style={{ margin: 0, fontSize: '14px' }}>
                    {searchQuery ? `No suppliers match "${searchQuery}"` : 'No suppliers yet. Add your first supplier.'}
                  </p>
                </td>
              </tr>
            ) : filtered.map(sup => (
              <tr key={sup.id}
                style={{ borderBottom: '1px solid #334155', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <td style={{ ...s.td, color: 'white', fontWeight: '500' }}>
                  {sup.name}
                </td>
                <td style={s.td}>
                  {sup.contactPhone ? (
                    <a
                      href={`https://wa.me/${sup.contactPhone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', textDecoration: 'none' }}
                    >
                      <Phone size={13}/> {sup.contactPhone}
                    </a>
                  ) : (
                    <span style={{ color: '#475569' }}>—</span>
                  )}
                </td>
                <td style={s.td}>
                  {sup.email ? (
                    <a
                      href={`mailto:${sup.email}`}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#60a5fa', textDecoration: 'none' }}
                    >
                      <Mail size={13}/> {sup.email}
                    </a>
                  ) : (
                    <span style={{ color: '#475569' }}>—</span>
                  )}
                </td>
                <td style={{ ...s.td, color: '#94a3b8', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {sup.address || '—'}
                </td>
                <td style={s.td}>
                  {sup.gstin ? (
                    <span style={{ ...s.pill, backgroundColor: 'rgba(167,139,250,0.1)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.25)' }}>
                      {sup.gstin}
                    </span>
                  ) : (
                    <span style={{ color: '#475569' }}>—</span>
                  )}
                </td>
                <td style={s.td}>
                  <div style={{ display: 'flex' }}>
                    <button style={s.editBtn} onClick={() => openEdit(sup)} title="Edit supplier">
                      <Edit size={14}/>
                    </button>
                    <button style={s.deleteBtn} onClick={() => handleDelete(sup.id, sup.name)} title="Delete supplier">
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={s.modal}>

            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ color: '#60a5fa', margin: 0, fontSize: '18px' }}>
                {isEditing ? 'Edit Supplier' : 'Add New Supplier'}
              </h2>
              <button onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20}/>
              </button>
            </div>

            {/* Form */}
            <label style={s.label}>Supplier Name *</label>
              <input
                  style={inputStyle('name')}
                  placeholder="e.g. MedLine Distributors"
                  value={form.name}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField('')}
                  onChange={e => setForm({ ...form, name: e.target.value })}
              />

              {/* ADD THIS BLOCK */}
              <label style={s.label}>Contact Person</label>
              <input
                  style={inputStyle('contactPerson')}
                  placeholder="e.g. Rajesh Kumar"
                  value={form.contactPerson}
                  onFocus={() => setFocusedField('contactPerson')}
                  onBlur={() => setFocusedField('')}
                  onChange={e => setForm({ ...form, contactPerson: e.target.value })}
              />
                                  
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                      <label style={s.label}>Phone / WhatsApp *</label>
                      <input
                          style={inputStyle('phone')}
                          placeholder="91XXXXXXXXXX"
                          value={form.contactPhone}
                          onFocus={() => setFocusedField('phone')}
                          onBlur={() => setFocusedField('')}
                          onChange={e => setForm({ ...form, contactPhone: e.target.value })}
                      />
                  </div>
                  <div>
                      <label style={s.label}>Email *</label>
                      <input
                          style={inputStyle('email')}
                          placeholder="supplier@example.com"
                          type="email"
                          value={form.email}
                          onFocus={() => setFocusedField('email')}
                          onBlur={() => setFocusedField('')}
                          onChange={e => setForm({ ...form, email: e.target.value })}
                      />
                  </div>
              </div>
                    
              <label style={s.label}>Address</label>
              <input
                  style={inputStyle('address')}
                  placeholder="e.g. 12 MG Road, Guwahati, Assam"
                  value={form.address}
                  onFocus={() => setFocusedField('address')}
                  onBlur={() => setFocusedField('')}
                  onChange={e => setForm({ ...form, address: e.target.value })}
              />
                    
              {/* FIXED: gstin → gstNumber */}
              <label style={s.label}>GST Number</label>
              <input
                  style={{ ...inputStyle('gstNumber'), marginBottom: '24px' }}
                  placeholder="e.g. 18AABCU9603R1ZM"
                  value={form.gstNumber}
                  onFocus={() => setFocusedField('gstNumber')}
                  onBlur={() => setFocusedField('')}
                  onChange={e => setForm({ ...form, gstNumber: e.target.value.toUpperCase() })}
              />
                    
            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowModal(false)} style={s.cancelBtn}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={loading} style={{ ...s.saveBtn, opacity: loading ? 0.6 : 1 }}>
                <Save size={16}/>
                {loading ? 'Saving...' : (isEditing ? 'Update Supplier' : 'Save Supplier')}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Suppliers;