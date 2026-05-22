import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import {
  Plus, Coffee, Truck, Home, Zap, Tag,
  Trash2, TrendingDown, Filter, X, CheckCircle, AlertCircle
} from 'lucide-react';

// ── Category config ────────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: 'FOOD',      label: 'Food & Tea',       icon: Coffee, color: '#fbbf24', bg: 'rgba(251,191,36,0.12)'  },
  { value: 'TRANSPORT', label: 'Transport',         icon: Truck,  color: '#60a5fa', bg: 'rgba(96,165,250,0.12)'  },
  { value: 'RENT',      label: 'Shop Rent',         icon: Home,   color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  { value: 'UTILITY',   label: 'Electricity/Water', icon: Zap,    color: '#34d399', bg: 'rgba(52,211,153,0.12)'  },
  { value: 'MISC',      label: 'Others',            icon: Tag,    color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
];

const getCat = (val) => CATEGORIES.find(c => c.value === val) || CATEGORIES[4];

const now = new Date();

const months = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const ExpenseLedger = () => {
  const [expenses,     setExpenses]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showModal,    setShowModal]    = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [filterCat,    setFilterCat]    = useState('ALL');
  const [filterMonth,  setFilterMonth]  = useState(now.getMonth() + 1);
  const [filterYear,   setFilterYear]   = useState(now.getFullYear());
  const [msg,          setMsg]          = useState({ text: '', type: '' });
  const [monthlyTotal, setMonthlyTotal] = useState(0);

  const [form, setForm] = useState({
    description: '', amount: '', category: 'FOOD', expenseDate: ''
  });

  useEffect(() => { fetchExpenses(); }, [filterMonth, filterYear]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/expenses');
      const all = Array.isArray(res.data) ? res.data : [];
      const filtered = all.filter(e => {
        if (!e.expenseDate) return false;
        const d = new Date(e.expenseDate);
        return d.getMonth() + 1 === filterMonth && d.getFullYear() === filterYear;
      });
      setExpenses(filtered);
      setMonthlyTotal(filtered.reduce((sum, e) => sum + (e.amount || 0), 0));
    } catch {
      showToast('Failed to load expenses.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!form.description.trim()) return showToast('Description is required.', 'error');
    if (!form.amount || Number(form.amount) <= 0) return showToast('Enter a valid amount.', 'error');
    setSaving(true);
    try {
      await api.post('/expenses', {
        description: form.description,
        amount:      Number(form.amount),
        category:    form.category,
      });
      showToast('Expense logged!', 'success');
      setShowModal(false);
      setForm({ description: '', amount: '', category: 'FOOD', expenseDate: '' });
      fetchExpenses();
    } catch {
      showToast('Failed to save expense.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, desc) => {
    if (!window.confirm(`Delete expense "${desc}"?`)) return;
    try {
      await api.delete(`/expenses/${id}`);
      showToast('Expense deleted.', 'success');
      fetchExpenses();
    } catch {
      showToast('Failed to delete.', 'error');
    }
  };

  const showToast = (text, type) => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 4000);
  };

  const catTotals = CATEGORIES.map(cat => ({
    ...cat,
    total: expenses.filter(e => e.category === cat.value).reduce((sum, e) => sum + (e.amount || 0), 0)
  }));

  const displayed = filterCat === 'ALL'
    ? expenses
    : expenses.filter(e => e.category === filterCat);

  return (
    <div className="exp-page">

      {/* ── Header ── */}
      <div className="exp-header">
        <div>
          <h1 style={s.h1}>Expense Ledger</h1>
          <p style={s.subtitle}>Track shop costs — rent, utilities, food, transport</p>
        </div>
        <button onClick={() => setShowModal(true)} style={s.addBtn}>
          <Plus size={18}/> LOG EXPENSE
        </button>
      </div>

      {/* ── Toast ── */}
      {msg.text && (
        <div style={{ ...s.toast, ...(msg.type === 'success' ? s.toastOk : s.toastErr) }}>
          {msg.type === 'success' ? <CheckCircle size={16}/> : <AlertCircle size={16}/>}
          {msg.text}
        </div>
      )}

      {/* ── Month / Year filter ── */}
      <div className="exp-filter-row">
        <select style={s.select} value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))}>
          {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select style={s.select} value={filterYear} onChange={e => setFilterYear(Number(e.target.value))}>
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <div style={s.totalPill}>
          <TrendingDown size={14} color="#f87171"/>
          <span style={{ color: '#f87171', fontWeight: '700' }}>
            Total: ₹{monthlyTotal.toFixed(2)}
          </span>
          <span style={{ color: '#64748b', fontSize: '11px' }}>
            {months[filterMonth - 1]} {filterYear}
          </span>
        </div>
      </div>

      {/* ── Category summary cards ── */}
      <div className="exp-cat-grid">
        {catTotals.map(cat => {
          const Icon = cat.icon;
          return (
            <div
              key={cat.value}
              onClick={() => setFilterCat(filterCat === cat.value ? 'ALL' : cat.value)}
              style={{
                ...s.catCard,
                border: `1px solid ${filterCat === cat.value ? cat.color : '#334155'}`,
                backgroundColor: filterCat === cat.value ? cat.bg : '#1e293b',
                cursor: 'pointer'
              }}
            >
              <Icon size={18} color={cat.color}/>
              <span style={{ color: '#94a3b8', fontSize: '11px', marginTop: '6px' }}>{cat.label}</span>
              <span style={{ color: cat.total > 0 ? cat.color : '#475569', fontSize: '18px', fontWeight: '700' }}>
                ₹{cat.total.toFixed(0)}
              </span>
            </div>
          );
        })}
        {/* ALL button */}
        <div
          onClick={() => setFilterCat('ALL')}
          style={{
            ...s.catCard,
            border: `1px solid ${filterCat === 'ALL' ? '#2563eb' : '#334155'}`,
            backgroundColor: filterCat === 'ALL' ? 'rgba(37,99,235,0.12)' : '#1e293b',
            cursor: 'pointer'
          }}
        >
          <Filter size={18} color="#60a5fa"/>
          <span style={{ color: '#94a3b8', fontSize: '11px', marginTop: '6px' }}>All Categories</span>
          <span style={{ color: '#60a5fa', fontSize: '18px', fontWeight: '700' }}>
            {expenses.length} entries
          </span>
        </div>
      </div>

      {/* ── Table ── */}
      <div style={s.tableWrap}>
        <div className="exp-table-scroll">
          <table style={{ ...s.table, minWidth: '600px' }}>
            <thead>
              <tr>
                <th style={s.th}>Date & Time</th>
                <th style={s.th}>Description</th>
                <th style={s.th}>Category</th>
                <th style={s.th}>Amount</th>
                <th style={{ ...s.th }} className="exp-col-by">Logged By</th>
                <th style={s.th}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={s.empty}>Loading...</td></tr>
              ) : displayed.length === 0 ? (
                <tr><td colSpan={6} style={s.empty}>
                  No expenses found for {months[filterMonth - 1]} {filterYear}.
                </td></tr>
              ) : displayed
                  .sort((a, b) => new Date(b.expenseDate) - new Date(a.expenseDate))
                  .map(exp => {
                    const cat = getCat(exp.category);
                    const Icon = cat.icon;
                    return (
                      <tr key={exp.id} style={s.tr}>
                        <td style={s.td}>
                          <div style={{ fontSize: '13px', color: 'white' }}>
                            {new Date(exp.expenseDate).toLocaleDateString('en-IN')}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {new Date(exp.expenseDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td style={{ ...s.td, color: 'white', fontWeight: '500' }}>
                          {exp.description}
                        </td>
                        <td style={s.td}>
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            backgroundColor: cat.bg, color: cat.color,
                            padding: '4px 10px', borderRadius: '99px',
                            fontSize: '11px', fontWeight: '600',
                            border: `1px solid ${cat.color}33`, whiteSpace: 'nowrap'
                          }}>
                            <Icon size={12}/> {cat.label}
                          </div>
                        </td>
                        <td style={{ ...s.td, color: '#f87171', fontWeight: '700', fontSize: '15px', whiteSpace: 'nowrap' }}>
                          − ₹{(exp.amount || 0).toFixed(2)}
                        </td>
                        <td style={{ ...s.td, color: '#64748b', fontSize: '12px' }} className="exp-col-by">
                          {exp.addedBy || 'Admin'}
                        </td>
                        <td style={s.td}>
                          <button onClick={() => handleDelete(exp.id, exp.description)} style={s.delBtn} title="Delete expense">
                            <Trash2 size={14}/>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add Expense Modal ── */}
      {showModal && (
        <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="exp-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ color: '#f87171', margin: 0, fontSize: '18px' }}>Log Expense</h2>
              <button onClick={() => setShowModal(false)} style={s.closeBtn}><X size={18}/></button>
            </div>

            <label style={s.label}>Description *</label>
            <input
              style={s.input}
              placeholder="e.g. Samosas for staff, Van fuel, Shop rent"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />

            <div className="exp-modal-grid">
              <div>
                <label style={s.label}>Amount (₹) *</label>
                <input type="number" style={s.input} placeholder="0.00"
                  value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div>
                <label style={s.label}>Category *</label>
                <select style={s.input} value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>

            {/* Category preview */}
            {(() => {
              const cat  = getCat(form.category);
              const Icon = cat.icon;
              return (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  backgroundColor: cat.bg, border: `1px solid ${cat.color}44`,
                  borderRadius: '8px', padding: '10px 14px', marginBottom: '20px'
                }}>
                  <Icon size={16} color={cat.color}/>
                  <span style={{ color: cat.color, fontSize: '13px', fontWeight: '600' }}>{cat.label}</span>
                  {form.amount && Number(form.amount) > 0 && (
                    <span style={{ marginLeft: 'auto', color: '#f87171', fontWeight: '700' }}>
                      − ₹{Number(form.amount).toFixed(2)}
                    </span>
                  )}
                </div>
              );
            })()}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowModal(false)} style={s.cancelBtn}>Cancel</button>
              <button onClick={handleAdd} disabled={saving}
                style={{ ...s.saveBtn, opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving...' : 'Save Expense'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* ── Page ── */
        .exp-page {
          padding: 40px;
          background-color: #0f172a;
          min-height: 100vh;
          box-sizing: border-box;
        }

        /* ── Header ── */
        .exp-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 12px;
        }

        /* ── Filter row ── */
        .exp-filter-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        /* ── Category grid: 6-col desktop ── */
        .exp-cat-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }

        /* ── Table scroll ── */
        .exp-table-scroll {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        /* ── Modal ── */
        .exp-modal {
          background-color: #1e293b;
          padding: 32px;
          border-radius: 16px;
          width: 100%;
          max-width: 460px;
          border: 1px solid #334155;
          margin: 16px;
          box-sizing: border-box;
        }

        /* ── Modal 2-col grid ── */
        .exp-modal-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        /* ════════════════════════════════
           TABLET  (≤ 900px)
        ════════════════════════════════ */
        @media (max-width: 900px) {
          .exp-page {
            padding: 24px 16px;
          }
          .exp-cat-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        /* ════════════════════════════════
           MOBILE  (≤ 480px)
        ════════════════════════════════ */
        @media (max-width: 480px) {
          .exp-page {
            padding: 14px 12px;
          }
          .exp-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .exp-header button {
            width: 100%;
            justify-content: center;
          }
          .exp-cat-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }
          /* Hide "Logged By" column on mobile */
          .exp-col-by {
            display: none;
          }
          .exp-modal {
            padding: 20px 16px;
            margin: 12px;
          }
          /* Stack modal amount+category on mobile */
          .exp-modal-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────
const s = {
  h1:        { color: '#f1f5f9', margin: '0 0 4px', fontSize: '26px', fontWeight: '600' },
  subtitle:  { color: '#94a3b8', margin: 0, fontSize: '14px' },
  addBtn:    { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' },
  toast:     { display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' },
  toastOk:   { backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid #10b981' },
  toastErr:  { backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid #ef4444' },
  select:    { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white', padding: '9px 14px', fontSize: '13px', outline: 'none', cursor: 'pointer' },
  totalPill: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '8px', padding: '8px 14px', flexWrap: 'wrap' },
  catCard:   { borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px', transition: 'all 0.15s' },
  tableWrap: { backgroundColor: '#1e293b', borderRadius: '16px', border: '1px solid #334155', overflow: 'hidden' },
  table:     { width: '100%', borderCollapse: 'collapse' },
  th:        { textAlign: 'left', padding: '14px 16px', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #334155', backgroundColor: '#0f172a' },
  td:        { padding: '14px 16px', color: '#cbd5e1', borderBottom: '1px solid #1e293b', fontSize: '14px' },
  tr:        { transition: 'background 0.1s' },
  empty:     { padding: '50px', textAlign: 'center', color: '#475569', fontSize: '14px' },
  delBtn:    { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  overlay:   { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center' },
  label:     { color: '#94a3b8', fontSize: '12px', marginBottom: '6px', display: 'block' },
  input:     { width: '100%', padding: '10px 12px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', marginBottom: '16px', outline: 'none', fontSize: '14px', boxSizing: 'border-box' },
  saveBtn:   { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '11px 22px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
  cancelBtn: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px', padding: '11px 16px' },
  closeBtn:  { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' },
};

export default ExpenseLedger;