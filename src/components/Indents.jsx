import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import {
  ClipboardList, Plus, X, CheckCircle, XCircle, Clock,
  AlertTriangle, ChevronDown, ChevronUp, RefreshCw, Send,
  Pill, Building2, FileText, Stethoscope, Zap, GitMerge
} from 'lucide-react';

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  PENDING:          { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: Clock,        label: 'Pending'          },
  ISSUED:           { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  icon: CheckCircle,  label: 'Issued'           },
  PARTIALLY_ISSUED: { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  icon: GitMerge,     label: 'Partially Issued' },
  CANCELLED:        { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   icon: XCircle,      label: 'Cancelled'        },
};

const ITEM_STATUS_COLOR = { FULL: '#10b981', PARTIAL: '#f59e0b', PENDING: '#ef4444' };

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const Icon = cfg.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
      color: cfg.color, backgroundColor: cfg.bg, border: `1px solid ${cfg.color}33`,
    }}>
      <Icon size={12} /> {cfg.label}
    </span>
  );
};

const fmt = (dt) => {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

// ─── Cancel Reason Modal ──────────────────────────────────────────────────────

const CancelModal = ({ onConfirm, onClose }) => {
  const [reason, setReason] = useState('');
  const QUICK = ['Out of stock', 'Duplicate request', 'Doctor revised order', 'Patient discharged', 'Other'];
  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={{ ...modalBox, maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '16px' }}>Cancel Indent</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer' }}><X size={18}/></button>
        </div>
        <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '14px' }}>Select or type a reason for cancellation:</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
          {QUICK.map(q => (
            <button key={q} onClick={() => setReason(q)}
              style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                background: reason === q ? 'rgba(239,68,68,0.15)' : 'rgba(30,41,59,0.8)',
                border: `1px solid ${reason === q ? 'rgba(239,68,68,0.5)' : '#334155'}`,
                color: reason === q ? '#ef4444' : '#64748b' }}>
              {q}
            </button>
          ))}
        </div>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Or type a custom reason…"
          rows={3}
          style={{ ...formInput, resize: 'vertical', marginBottom: '16px' }}
        />
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 18px', background: 'none', border: '1px solid #334155', color: '#94a3b8', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
            Back
          </button>
          <button onClick={() => onConfirm(reason)} disabled={!reason.trim()}
            style={{ padding: '9px 18px', background: reason.trim() ? '#ef4444' : '#334155', border: 'none',
              color: reason.trim() ? 'white' : '#64748b', borderRadius: '8px', cursor: reason.trim() ? 'pointer' : 'not-allowed', fontWeight: 700 }}>
            Confirm Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Indent Row ───────────────────────────────────────────────────────────────

const IndentRow = ({ indent, onCancel, onIssue, canManage, canCancel }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        className="indent-row"
        onClick={() => setExpanded(p => !p)}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(96,165,250,0.04)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <td style={td} className="indent-col-chevron">
          {expanded ? <ChevronUp size={14} color="#60a5fa"/> : <ChevronDown size={14} color="#475569"/>}
        </td>
        <td style={td}>
          <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#60a5fa', fontWeight: 600 }}>
            {indent.indentNumber || '#' + indent.id?.slice(-6).toUpperCase()}
          </span>
        </td>
        <td style={td} className="indent-col-ward">
          <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{indent.wardName}</span>
        </td>
        <td style={td} className="indent-col-requested">
          <span style={{ color: '#94a3b8' }}>{indent.requestedBy}</span>
        </td>
        <td style={td}>
          {indent.emergency && <Zap size={13} color="#f59e0b" fill="#f59e0b" style={{ marginRight: '6px', verticalAlign: 'middle' }} />}
          <StatusBadge status={indent.status} />
          {indent.hasStockWarning && indent.status === 'PENDING' && (
            <span title={indent.stockWarningMessage} style={{ marginLeft: '6px', cursor: 'help' }}>
              <AlertTriangle size={13} color="#f59e0b" />
            </span>
          )}
        </td>
        <td style={td} className="indent-col-date">
          <span style={{ color: '#64748b', fontSize: '13px' }}>{fmt(indent.requestDate)}</span>
        </td>
        <td style={{ ...td, textAlign: 'right' }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            {canManage && (indent.status === 'PENDING' || indent.status === 'PARTIALLY_ISSUED') && (
              <button onClick={() => onIssue(indent.id)}
                style={{ ...actionBtn, background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
                <CheckCircle size={13} /> <span className="indent-btn-label">Issue</span>
              </button>
            )}
            {canCancel && (indent.status === 'PENDING' || indent.status === 'PARTIALLY_ISSUED') && (
              <button onClick={() => onCancel(indent.id)}
                style={{ ...actionBtn, background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                <X size={13} /> <span className="indent-btn-label">Cancel</span>
              </button>
            )}
          </div>
        </td>
      </tr>

      {expanded && (
        <tr style={{ background: 'rgba(15,23,42,0.6)' }}>
          <td colSpan={7} style={{ padding: '16px' }}>
            {/* Meta info grid */}
            <div className="indent-meta-grid">
              {indent.authorizedByDoctor && <InfoChip icon={<Stethoscope size={13}/>} label="Authorized By" value={indent.authorizedByDoctor} />}
              {indent.referenceNote      && <InfoChip icon={<FileText size={13}/>}    label="Reference Note" value={indent.referenceNote} />}
              {indent.enteredBy         && <InfoChip icon={<Building2 size={13}/>}   label="Entered By" value={indent.enteredBy} />}
              {indent.orderSource       && <InfoChip icon={<ClipboardList size={13}/>} label="Order Source" value={indent.orderSource.replace(/_/g, ' ')} />}
              {indent.issuedBy          && <InfoChip icon={<CheckCircle size={13}/>} label="Issued By" value={indent.issuedBy} />}
              {indent.issueDate         && <InfoChip icon={<Clock size={13}/>}       label="Issue Time" value={fmt(indent.issueDate)} />}
              {indent.cancellationReason && (
                <InfoChip icon={<XCircle size={13}/>} label="Cancellation Reason" value={indent.cancellationReason} />
              )}
            </div>

            {/* Stock warning banner */}
            {indent.hasStockWarning && indent.stockWarningMessage && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
                background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: '8px', color: '#f59e0b', fontSize: '12px', marginBottom: '12px' }}>
                <AlertTriangle size={13}/> {indent.stockWarningMessage}
              </div>
            )}

            {/* Items table */}
            {indent.items?.length > 0 && (
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '560px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1e293b' }}>
                      {['Medicine', 'Batch', 'Qty Req.', 'Qty Issued', 'Qty Pending', 'Unit Price', 'Total', 'Status'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', color: '#475569', fontWeight: 600,
                          textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {indent.items.map((item, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #0f172a' }}>
                        <td style={{ padding: '8px 12px', color: '#e2e8f0' }}>{item.medicineName}</td>
                        <td style={{ padding: '8px 12px', color: '#64748b', fontFamily: 'monospace', fontSize: '11px' }}>{item.batchNo || '—'}</td>
                        <td style={{ padding: '8px 12px', color: '#94a3b8' }}>{item.quantityRequested}</td>
                        <td style={{ padding: '8px 12px', color: '#10b981', fontWeight: 600 }}>{item.quantityIssued ?? '—'}</td>
                        <td style={{ padding: '8px 12px', color: item.quantityPending > 0 ? '#f59e0b' : '#475569' }}>
                          {item.quantityPending > 0 ? item.quantityPending : '—'}
                        </td>
                        <td style={{ padding: '8px 12px', color: '#94a3b8' }}>{item.unitPriceAtIssue != null ? `₹${item.unitPriceAtIssue}` : '—'}</td>
                        <td style={{ padding: '8px 12px', color: '#94a3b8' }}>{item.totalValue != null ? `₹${item.totalValue}` : '—'}</td>
                        <td style={{ padding: '8px 12px' }}>
                          {item.itemStatus && (
                            <span style={{ fontSize: '11px', fontWeight: 700, color: ITEM_STATUS_COLOR[item.itemStatus] || '#475569' }}>
                              {item.itemStatus}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
};

const InfoChip = ({ icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
    <span style={{ color: '#60a5fa', marginTop: '2px' }}>{icon}</span>
    <div>
      <div style={{ fontSize: '10px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>{label}</div>
      <div style={{ color: '#cbd5e1', fontSize: '13px', marginTop: '2px' }}>{value}</div>
    </div>
  </div>
);

// ─── Raise Indent Modal ───────────────────────────────────────────────────────

const WARDS = ['ICU', 'Emergency', 'OPD', 'General Ward', 'Maternity', 'Paediatrics', 'Surgery', 'Orthopaedics', 'Cardiology', 'Neurology'];
const ORDER_SOURCES = ['NURSE_APP', 'DOCTOR_VERBAL', 'PHYSICAL_REGISTER'];

const RaiseIndentModal = ({ onClose, onSuccess, currentUser }) => {
  const [medicines, setMedicines]         = useState([]);
  const [loadingMeds, setLoadingMeds]     = useState(true);
  const [submitting, setSubmitting]       = useState(false);
  const [error, setError]                 = useState('');
  const [stockWarnings, setStockWarnings] = useState({});

  const [form, setForm] = useState({
    wardName: '', requestedBy: currentUser || '',
    authorizedByDoctor: '', referenceNote: '',
    orderSource: 'NURSE_APP', emergency: false,
  });

  const [items, setItems] = useState([{ medicineId: '', medicineName: '', quantityRequested: 1 }]);

  useEffect(() => {
    api.get('/medicines')
      .then(r => setMedicines(r.data || []))
      .catch(() => setMedicines([]))
      .finally(() => setLoadingMeds(false));
  }, []);

  const setField = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const setItem = (idx, key, val) => {
    setItems(p => {
      const updated = [...p];
      updated[idx] = { ...updated[idx], [key]: val };
      if (key === 'medicineId') {
        const med = medicines.find(m => (m.id || m._id) === val);
        if (med) {
          updated[idx].medicineName = med.name;
          const qty = updated[idx].quantityRequested || 1;
          if (med.stockQuantity < qty) {
            setStockWarnings(prev => ({ ...prev, [idx]: `Only ${med.stockQuantity} in stock` }));
          } else {
            setStockWarnings(prev => { const n = {...prev}; delete n[idx]; return n; });
          }
        }
      }
      if (key === 'quantityRequested') {
        const med = medicines.find(m => (m.id || m._id) === updated[idx].medicineId);
        if (med) {
          if (med.stockQuantity < val) {
            setStockWarnings(prev => ({ ...prev, [idx]: `Only ${med.stockQuantity} in stock` }));
          } else {
            setStockWarnings(prev => { const n = {...prev}; delete n[idx]; return n; });
          }
        }
      }
      return updated;
    });
  };

  const addItem    = () => setItems(p => [...p, { medicineId: '', medicineName: '', quantityRequested: 1 }]);
  const removeItem = (idx) => {
    setItems(p => p.filter((_, i) => i !== idx));
    setStockWarnings(prev => { const n = {...prev}; delete n[idx]; return n; });
  };

  const handleSubmit = async () => {
    if (!form.wardName) { setError('Ward name is required.'); return; }
    if (items.some(it => !it.medicineName || it.quantityRequested < 1)) {
      setError('All items must have a medicine and quantity ≥ 1.'); return;
    }
    setError('');
    setSubmitting(true);
    try {
      await api.post('/indents', { ...form, items });
      onSuccess();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to raise indent. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const hasWarnings = Object.keys(stockWarnings).length > 0;

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={modalBox} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(96,165,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ClipboardList size={18} color="#60a5fa" />
            </div>
            <div>
              <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '17px' }}>Raise New Indent</div>
              <div style={{ color: '#475569', fontSize: '12px', marginTop: '2px' }}>Submit a medicine request</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', flexShrink: 0 }}>
            <X size={20} />
          </button>
        </div>

        {/* Emergency toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px',
          padding: '12px 16px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s',
          background: form.emergency ? 'rgba(245,158,11,0.1)' : 'rgba(30,41,59,0.5)',
          border: `1px solid ${form.emergency ? 'rgba(245,158,11,0.4)' : '#1e293b'}` }}
          onClick={() => setField('emergency', !form.emergency)}>
          <Zap size={16} color={form.emergency ? '#f59e0b' : '#475569'} fill={form.emergency ? '#f59e0b' : 'none'} />
          <span style={{ color: form.emergency ? '#f59e0b' : '#64748b', fontWeight: 600, fontSize: '14px' }}>
            {form.emergency ? '⚡ Emergency Indent' : 'Mark as Emergency'}
          </span>
          <div style={{ marginLeft: 'auto', width: '36px', height: '20px', borderRadius: '10px',
            background: form.emergency ? '#f59e0b' : '#334155', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: '3px', left: form.emergency ? '18px' : '3px',
              width: '14px', height: '14px', borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
          </div>
        </div>

        {/* Form fields */}
        <div className="indent-form-grid">
          <div style={formGroup}>
            <label style={formLabel}>Ward *</label>
            <select style={formInput} value={form.wardName} onChange={e => setField('wardName', e.target.value)}>
              <option value="">Select Ward</option>
              {WARDS.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          <div style={formGroup}>
            <label style={formLabel}>Requested By *</label>
            <input style={formInput} value={form.requestedBy} onChange={e => setField('requestedBy', e.target.value)} placeholder="Nurse / Doctor name" />
          </div>
          <div style={formGroup}>
            <label style={formLabel}>Authorized By Doctor {form.emergency && <span style={{ color: '#ef4444' }}>*</span>}</label>
            <input style={formInput} value={form.authorizedByDoctor} onChange={e => setField('authorizedByDoctor', e.target.value)} placeholder="Dr. Sharma" />
          </div>
          <div style={formGroup}>
            <label style={formLabel}>Order Source</label>
            <select style={formInput} value={form.orderSource} onChange={e => setField('orderSource', e.target.value)}>
              {ORDER_SOURCES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div style={{ ...formGroup, gridColumn: '1 / -1' }}>
            <label style={formLabel}>Reference Note</label>
            <input style={formInput} value={form.referenceNote} onChange={e => setField('referenceNote', e.target.value)} placeholder="e.g. Emergency - Dr. Sharma's order" />
          </div>
        </div>

        {/* Medicine items */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <label style={{ ...formLabel, marginBottom: 0 }}>Medicine Items *</label>
            <button onClick={addItem} style={{ display: 'flex', alignItems: 'center', gap: '5px',
              background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.3)',
              color: '#60a5fa', borderRadius: '6px', padding: '5px 10px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>
              <Plus size={13} /> Add Item
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {items.map((item, idx) => (
              <div key={idx} style={{ padding: '12px', background: 'rgba(15,23,42,0.6)', borderRadius: '8px',
                border: `1px solid ${stockWarnings[idx] ? 'rgba(245,158,11,0.4)' : '#1e293b'}` }}>
                <div className="indent-item-row">
                  <div className="indent-item-selects">
                    {loadingMeds ? (
                      <input style={formInput} placeholder="Loading medicines..." disabled />
                    ) : (
                      <select style={formInput} value={item.medicineId} onChange={e => setItem(idx, 'medicineId', e.target.value)}>
                        <option value="">Select Medicine</option>
                        {medicines.map(m => (
                          <option key={m.id || m._id} value={m.id || m._id}>
                            {m.name} {m.stockQuantity <= (m.minStockLevel || 20) ? '⚠️' : ''}
                          </option>
                        ))}
                      </select>
                    )}
                    <input type="number" min={1} style={{ ...formInput, width: '80px', flexShrink: 0 }}
                      value={item.quantityRequested}
                      onChange={e => setItem(idx, 'quantityRequested', parseInt(e.target.value) || 1)} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '12px', whiteSpace: 'nowrap' }}>
                      <Pill size={13} color="#60a5fa" /> x{item.quantityRequested}
                    </span>
                    {items.length > 1 && (
                      <button onClick={() => removeItem(idx)}
                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                          color: '#ef4444', borderRadius: '6px', width: '28px', height: '28px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>
                {stockWarnings[idx] && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', color: '#f59e0b', fontSize: '12px' }}>
                    <AlertTriangle size={12} /> {stockWarnings[idx]} — indent will be partially issued
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Global stock warning */}
        {hasWarnings && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 14px',
            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: '8px', color: '#f59e0b', fontSize: '13px', marginBottom: '12px' }}>
            <AlertTriangle size={14} style={{ marginTop: '1px', flexShrink: 0 }} />
            <span>Some items have insufficient stock. The indent will be raised but may be partially issued.</span>
          </div>
        )}

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '8px', color: '#ef4444', fontSize: '13px', marginBottom: '16px' }}>
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', background: 'none', border: '1px solid #334155', color: '#94a3b8', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 22px',
              background: submitting ? '#334155' : '#60a5fa', border: 'none',
              color: submitting ? '#64748b' : '#0f172a', borderRadius: '8px',
              cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '14px' }}>
            <Send size={14} /> {submitting ? 'Submitting…' : 'Submit Indent'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const Indents = () => {
  const { hasRole, auth } = useAuth();

  const isNurse      = hasRole('NURSE');
  const isPharmacist = hasRole('PHARMACIST');
  const isAdmin      = hasRole('ADMIN');
  const canManage    = isPharmacist || isAdmin;
  const canRaise     = isNurse || canManage;

  const [indents, setIndents]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [showModal, setShowModal]       = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [filterStatus, setFilter]       = useState('ALL');
  const [toast, setToast]               = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchIndents = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const endpoint = isNurse ? '/indents/my' : '/indents';
      const res = await api.get(endpoint);
      setIndents(res.data || []);
    } catch {
      setError('Failed to load indents. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [isNurse]);

  useEffect(() => { fetchIndents(); }, [fetchIndents]);

  const handleCancelConfirm = async (reason) => {
    try {
      await api.put(`/indents/cancel/${cancelTarget}`, { reason });
      showToast('Indent cancelled.');
      fetchIndents();
    } catch {
      showToast('Failed to cancel indent.', 'error');
    } finally {
      setCancelTarget(null);
    }
  };

  const handleIssue = async (id) => {
    if (!window.confirm('Issue this indent? Partial issuing will apply if stock is insufficient.')) return;
    try {
      await api.put(`/indents/issue/${id}`);
      showToast('Indent issued successfully.');
      fetchIndents();
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to issue indent.', 'error');
    }
  };

  const filtered = filterStatus === 'ALL'
    ? indents
    : indents.filter(i => i.status === filterStatus);

  const stats = {
    total:     indents.length,
    pending:   indents.filter(i => i.status === 'PENDING').length,
    issued:    indents.filter(i => i.status === 'ISSUED').length,
    partial:   indents.filter(i => i.status === 'PARTIALLY_ISSUED').length,
    cancelled: indents.filter(i => i.status === 'CANCELLED').length,
    emergency: indents.filter(i => i.emergency).length,
  };

  return (
    <div className="indent-page">

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '24px', zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '12px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: 600,
          background: toast.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
          border: `1px solid ${toast.type === 'error' ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.4)'}`,
          color: toast.type === 'error' ? '#ef4444' : '#10b981',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          {toast.type === 'error' ? <XCircle size={16}/> : <CheckCircle size={16}/>}
          {toast.msg}
        </div>
      )}

      {/* ── Header ── */}
      <div className="indent-header">
        <div>
          <h1 style={{ color: '#f1f5f9', fontSize: '24px', fontWeight: 800, margin: 0 }}>
            {isNurse ? 'My Indents' : 'Indent Management'}
          </h1>
          <p style={{ color: '#475569', fontSize: '14px', marginTop: '6px', marginBottom: 0 }}>
            {isNurse ? 'Track your medicine requests and their status' : 'Review and process ward medicine indent requests'}
          </p>
        </div>
        <div className="indent-header-btns">
          <button onClick={fetchIndents} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', background: 'rgba(96,165,250,0.08)', border: '1px solid #334155', color: '#94a3b8', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
            <RefreshCw size={14} /> Refresh
          </button>
          {canRaise && (
            <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: '#60a5fa', border: 'none', color: '#0f172a', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '14px' }}>
              <Plus size={16} /> Raise Indent
            </button>
          )}
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="indent-stats-grid">
        {[
          { label: 'Total',     value: stats.total,     color: '#60a5fa' },
          { label: 'Pending',   value: stats.pending,   color: '#f59e0b' },
          { label: 'Issued',    value: stats.issued,    color: '#10b981' },
          { label: 'Partial',   value: stats.partial,   color: '#60a5fa' },
          { label: 'Cancelled', value: stats.cancelled, color: '#ef4444' },
          ...(stats.emergency > 0 ? [{ label: 'Emergency', value: stats.emergency, color: '#f97316' }] : []),
        ].map(s => (
          <div key={s.label} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '16px 20px' }}>
            <div style={{ color: '#475569', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.7px' }}>{s.label}</div>
            <div style={{ color: s.color, fontSize: '28px', fontWeight: 800, marginTop: '6px', lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Filter tabs ── */}
      <div className="indent-filter-row">
        {[
          { key: 'ALL',              label: `All (${stats.total})` },
          { key: 'PENDING',          label: `Pending (${stats.pending})` },
          { key: 'ISSUED',           label: `Issued (${stats.issued})` },
          { key: 'PARTIALLY_ISSUED', label: `Partial (${stats.partial})` },
          { key: 'CANCELLED',        label: `Cancelled (${stats.cancelled})` },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            style={{ padding: '7px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', border: '1px solid transparent', transition: 'all 0.15s',
              background: filterStatus === f.key ? 'rgba(96,165,250,0.15)' : 'rgba(30,41,59,0.5)',
              color: filterStatus === f.key ? '#60a5fa' : '#64748b',
              borderColor: filterStatus === f.key ? 'rgba(96,165,250,0.4)' : '#1e293b',
              whiteSpace: 'nowrap' }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      <div style={{ background: '#1e293b', borderRadius: '14px', border: '1px solid #334155', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#475569' }}>
            <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 12px' }} />
            Loading indents…
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <AlertTriangle size={16} /> {error}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#475569' }}>
            <ClipboardList size={48} style={{ margin: '0 auto 16px', opacity: 0.3, display: 'block' }} />
            <p style={{ fontSize: '15px' }}>
              {filterStatus === 'ALL' ? 'No indents found. Raise your first one!' : `No ${filterStatus.toLowerCase().replace('_', ' ')} indents.`}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #334155', background: 'rgba(15,23,42,0.4)' }}>
                  <th style={th} className="indent-col-chevron"></th>
                  <th style={th}>Indent No.</th>
                  <th style={th} className="indent-col-ward">Ward</th>
                  <th style={th} className="indent-col-requested">Requested By</th>
                  <th style={th}>Status</th>
                  <th style={th} className="indent-col-date">Date</th>
                  <th style={{ ...th, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(indent => (
                  <IndentRow
                    key={indent.id}
                    indent={indent}
                    onCancel={(id) => setCancelTarget(id)}
                    onIssue={handleIssue}
                    canManage={canManage}
                    canCancel={isNurse
                      ? indent.enteredBy === auth?.username || indent.requestedBy === auth?.username
                      : canManage}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showModal && (
        <RaiseIndentModal
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); fetchIndents(); showToast('Indent raised successfully!'); }}
          currentUser={auth?.username}
        />
      )}

      {cancelTarget && (
        <CancelModal
          onConfirm={handleCancelConfirm}
          onClose={() => setCancelTarget(null)}
        />
      )}

      <style>{`
        @keyframes spin    { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        select option { background: #1e293b; color: #e2e8f0; }

        /* ── Page ── */
        .indent-page {
          padding: 32px;
          min-height: 100vh;
          background-color: #0f172a;
          box-sizing: border-box;
        }

        /* ── Header ── */
        .indent-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 28px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .indent-header-btns {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        /* ── Stats: auto-fit ── */
        .indent-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 14px;
          margin-bottom: 24px;
        }

        /* ── Filter tabs ── */
        .indent-filter-row {
          display: flex;
          gap: 6px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        /* ── Table row ── */
        .indent-row {
          border-bottom: 1px solid #1e293b;
          cursor: pointer;
          transition: background 0.15s;
        }

        /* ── Expanded meta grid: 3-col desktop ── */
        .indent-meta-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 14px;
        }

        /* ── Modal form: 2-col desktop ── */
        .indent-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 20px;
        }

        /* ── Medicine item row ── */
        .indent-item-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .indent-item-selects {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
          flex: 1;
          min-width: 0;
        }

        /* ════════════════════════════════
           TABLET  (≤ 900px)
        ════════════════════════════════ */
        @media (max-width: 900px) {
          .indent-page {
            padding: 24px 16px;
          }
          .indent-meta-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          /* Hide less-critical columns */
          .indent-col-requested {
            display: none;
          }
        }

        /* ════════════════════════════════
           MOBILE  (≤ 480px)
        ════════════════════════════════ */
        @media (max-width: 480px) {
          .indent-page {
            padding: 14px 12px;
          }
          .indent-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .indent-header-btns {
            width: 100%;
          }
          .indent-header-btns button {
            flex: 1;
            justify-content: center;
          }
          .indent-stats-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
          }
          .indent-stats-grid > div {
            padding: 12px;
          }
          .indent-stats-grid > div > div:last-child {
            font-size: 22px !important;
          }
          .indent-meta-grid {
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }
          .indent-form-grid {
            grid-template-columns: 1fr;
          }
          .indent-form-grid > div[style*="1 / -1"] {
            grid-column: 1 !important;
          }
          /* Hide date + ward columns on mobile — keep indent#, status, actions */
          .indent-col-date,
          .indent-col-ward,
          .indent-col-chevron {
            display: none;
          }
          /* Shrink action button labels on very small screens */
          .indent-btn-label {
            display: none;
          }
          .indent-filter-row button {
            font-size: 12px;
            padding: 6px 10px;
          }
          .indent-item-selects {
            grid-template-columns: 1fr;
          }
          .indent-item-selects input[type="number"] {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const th        = { padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.7px' };
const td        = { padding: '14px 16px', verticalAlign: 'middle' };
const actionBtn = { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' };
const formGroup = { display: 'flex', flexDirection: 'column', gap: '6px' };
const formLabel = { color: '#64748b', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' };
const formInput = { background: 'rgba(15,23,42,0.8)', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0', padding: '10px 12px', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' };
const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' };
const modalBox     = { background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' };

export default Indents;