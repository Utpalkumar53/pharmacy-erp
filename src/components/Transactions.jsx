import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { RefreshCw, ArrowUpRight, ArrowDownLeft, Edit3, ClipboardList } from 'lucide-react';

const getTagStyle = (type) => {
  switch (type) {
    case 'SALE':         return { backgroundColor: 'rgba(239,68,68,0.1)',    color: '#f87171', border: '1px solid #ef4444' };
    case 'PURCHASE_ADD': return { backgroundColor: 'rgba(16,185,129,0.1)',   color: '#34d399', border: '1px solid #10b981' };
    case 'SALE_RETURN':  return { backgroundColor: 'rgba(139,92,246,0.1)',   color: '#a78bfa', border: '1px solid #8b5cf6' };
    default:             return { backgroundColor: 'rgba(245,158,11,0.1)',   color: '#fbbf24', border: '1px solid #f59e0b' };
  }
};

const getIcon = (type) => {
  if (type === 'SALE')         return <ArrowDownLeft size={16} color="#f87171"/>;
  if (type === 'PURCHASE_ADD') return <ArrowUpRight  size={16} color="#34d399"/>;
  if (type === 'SALE_RETURN')  return <RefreshCw     size={16} color="#a78bfa"/>;
  return <Edit3 size={16} color="#fbbf24"/>;
};

const Transactions = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/transactions');
      setHistory(res.data || []);
    } catch (err) {
      console.error("Error fetching ledger", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  if (loading) return (
    <div style={s.loading}>Loading Stock Ledger...</div>
  );

  return (
    <div className="txn-page">

      {/* ── Header ── */}
      <div className="txn-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ClipboardList size={26} color="#60a5fa"/>
          <h1 style={s.h1}>Stock Transaction Ledger</h1>
        </div>
        <button onClick={fetchHistory} style={s.refreshBtn}>
          <RefreshCw size={16}/> <span className="txn-refresh-label">REFRESH</span>
        </button>
      </div>

      {/* ── Table ── */}
      <div style={s.tableContainer}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ ...s.table, minWidth: '580px' }}>
            <thead>
              <tr style={s.headerRow}>
                <th style={s.th}>Date & Time</th>
                <th style={s.th}>Medicine</th>
                <th style={s.th} className="txn-col-batch">Batch</th>
                <th style={s.th}>Operation</th>
                <th style={{ ...s.th, textAlign: 'right' }}>Qty Shift</th>
                <th style={{ ...s.th, textAlign: 'right' }} className="txn-col-closing">Closing Stock</th>
                <th style={s.th} className="txn-col-by">Performed By</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? history.map((tx) => (
                <tr key={tx.id}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(96,165,250,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ ...s.td, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                    {new Date(tx.timestamp).toLocaleString('en-IN')}
                  </td>
                  <td style={{ ...s.td, fontWeight: 'bold', color: '#f1f5f9' }}>
                    {tx.medicineName}
                  </td>
                  <td style={{ ...s.td, fontFamily: 'monospace', color: '#60a5fa' }} className="txn-col-batch">
                    {tx.batchNo}
                  </td>
                  <td style={s.td}>
                    <span style={{ ...s.badge, ...getTagStyle(tx.transactionType) }}>
                      {getIcon(tx.transactionType)} {tx.transactionType}
                    </span>
                  </td>
                  <td style={{
                    ...s.td, textAlign: 'right', fontWeight: 'bold', whiteSpace: 'nowrap',
                    color: tx.quantityChanged < 0 ? '#f87171' : '#34d399'
                  }}>
                    {tx.quantityChanged > 0 ? `+${tx.quantityChanged}` : tx.quantityChanged}
                  </td>
                  <td style={{ ...s.td, textAlign: 'right', color: '#cbd5e1', whiteSpace: 'nowrap' }} className="txn-col-closing">
                    {tx.remainingStock} units
                  </td>
                  <td style={{ ...s.td, color: '#94a3b8' }} className="txn-col-by">
                    {tx.performedBy || 'SYSTEM'}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" style={s.empty}>
                    No stock adjustments recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        /* ── Page ── */
        .txn-page {
          padding: 40px;
          background-color: #0f172a;
          min-height: 100vh;
          box-sizing: border-box;
        }

        /* ── Header ── */
        .txn-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          flex-wrap: wrap;
          gap: 12px;
        }

        /* ════════════════════════════════
           TABLET  (≤ 900px)
        ════════════════════════════════ */
        @media (max-width: 900px) {
          .txn-page {
            padding: 24px 16px;
          }
          /* Hide less-critical columns */
          .txn-col-by {
            display: none;
          }
        }

        /* ════════════════════════════════
           MOBILE  (≤ 480px)
        ════════════════════════════════ */
        @media (max-width: 480px) {
          .txn-page {
            padding: 14px 12px;
          }
          .txn-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .txn-header > div {
            gap: 8px;
          }
          /* Hide more columns — keep Date, Medicine, Operation, Qty */
          .txn-col-batch,
          .txn-col-closing {
            display: none;
          }
          /* Shorten refresh button */
          .txn-refresh-label {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  h1:             { color: '#f1f5f9', margin: 0, fontSize: '22px', fontWeight: '600' },
  loading:        { height: '100vh', backgroundColor: '#0f172a', color: '#60a5fa', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px' },
  refreshBtn:     { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#334155', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' },
  tableContainer: { backgroundColor: '#1e293b', padding: '24px', borderRadius: '16px', border: '1px solid #334155' },
  table:          { width: '100%', borderCollapse: 'collapse' },
  headerRow:      { color: '#94a3b8', fontSize: '13px', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1px solid #334155' },
  th:             { padding: '12px 14px', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' },
  td:             { padding: '14px', color: '#cbd5e1', borderBottom: '1px solid #334155', fontSize: '14px' },
  badge:          { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap' },
  empty:          { padding: '40px', textAlign: 'center', color: '#475569' },
};

export default Transactions;