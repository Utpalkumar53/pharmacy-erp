import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { RefreshCw, ArrowUpRight, ArrowDownLeft, Edit3, ClipboardList } from 'lucide-react';

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

  useEffect(() => {
    fetchHistory();
  }, []);

  const getTagStyle = (type) => {
    switch (type) {
      case 'SALE':
        return { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid #ef4444' };
      case 'PURCHASE_ADD':
        return { backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid #10b981' };
      case 'SALE_RETURN':                          // ← ADD THIS
        return { backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa', border: '1px solid #8b5cf6' };
      default:
        return { backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24', border: '1px solid #f59e0b' };
    }
};

const getIcon = (type) => {
    if (type === 'SALE') return <ArrowDownLeft size={16} color="#f87171" />;
    if (type === 'PURCHASE_ADD') return <ArrowUpRight size={16} color="#34d399" />;
    if (type === 'SALE_RETURN') return <RefreshCw size={16} color="#a78bfa" />;  // ← ADD THIS
    return <Edit3 size={16} color="#fbbf24" />;
};

  
  if (loading) return <div style={loadingStyle}>Loading Stock Ledger...</div>;

  return (
    <div style={containerStyle}>
      <header style={headerFlex}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ClipboardList size={28} color="#60a5fa" />
          <h1 style={{ color: '#f1f5f9', margin: 0 }}>Stock Transaction Ledger</h1>
        </div>
        <button onClick={fetchHistory} style={refreshBtn}>
          <RefreshCw size={16} /> REFRESH
        </button>
      </header>

      <div style={tableContainer}>
        <table style={darkTable}>
          <thead>
            <tr style={headerRow}>
              <th style={{ padding: '15px' }}>Date & Time</th>
              <th>Medicine Name</th>
              <th>Batch</th>
              <th>Operation</th>
              <th style={{ textAlign: 'right' }}>Qty Shift</th>
              <th style={{ textAlign: 'right' }}>Closing Stock</th>
              <th>Performed By</th>
            </tr>
          </thead>
          <tbody>
            {history.length > 0 ? history.map((tx) => (
              <tr key={tx.id} style={rowStyle}>
                <td style={{ padding: '15px', color: '#94a3b8' }}>
                  {new Date(tx.timestamp).toLocaleString('en-IN')}
                </td>
                <td style={{ fontWeight: 'bold' }}>{tx.medicineName}</td>
                <td style={{ fontFamily: 'monospace', color: '#60a5fa' }}>{tx.batchNo}</td>
                <td>
                  <span style={{ ...badgeBase, ...getTagStyle(tx.transactionType) }}>
                    {getIcon(tx.transactionType)} {tx.transactionType}
                  </span>
                </td>
                <td style={{ 
                  textAlign: 'right', 
                  fontWeight: 'bold', 
                  color: tx.quantityChanged < 0 ? '#f87171' : '#34d399' 
                }}>
                  {tx.quantityChanged > 0 ? `+${tx.quantityChanged}` : tx.quantityChanged}
                </td>
                <td style={{ textAlign: 'right', color: '#cbd5e1' }}>{tx.remainingStock} units</td>
                <td style={{ color: '#94a3b8' }}>{tx.performedBy || 'SYSTEM'}</td>
              </tr>
            )) : (
              <tr><td colSpan="7" style={emptyStyle}>No stock adjustments recorded yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// CSS Styles matching Dark-Theme
const containerStyle = { padding: '40px', backgroundColor: '#0f172a', minHeight: '100vh', marginLeft: '240px' };
const headerFlex = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' };
const refreshBtn = { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#334155', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const tableContainer = { backgroundColor: '#1e293b', padding: '30px', borderRadius: '16px', border: '1px solid #334155' };
const darkTable = { width: '100%', borderCollapse: 'collapse' };
const headerRow = { color: '#94a3b8', fontSize: '13px', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1px solid #334155' };
const rowStyle = { color: '#cbd5e1', borderBottom: '1px solid #334155', fontSize: '14px' };
const badgeBase = { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' };
const loadingStyle = { height: '100vh', backgroundColor: '#0f172a', color: '#60a5fa', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px', marginLeft: '240px' };
const emptyStyle = { padding: '40px', textAlign: 'center', color: '#475569' };

export default Transactions;