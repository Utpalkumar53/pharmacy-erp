import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { Eye, Search, RefreshCw, FileText, Download, X } from 'lucide-react';
import Invoice from './Invoice';

const SalesHistory = () => {
  const [sales, setSales]           = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading]       = useState(true);
  const [selectedSale, setSelectedSale] = useState(null);
  const [exporting, setExporting]   = useState(false);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const res = await api.get('/sales');
      setSales(res.data || []);
    } catch (err) {
      console.error('Error loading bills', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSales(); }, []);

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const response = await api.get('/backup/sales/excel', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Sales_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed', err);
      alert('Failed to generate Excel report. Please check if the server is running.');
    } finally {
      setExporting(false);
    }
  };

  const filteredSales = sales.filter(sale => {
    const name   = sale.customerName?.toLowerCase() || '';
    const mobile = sale.customerMobile || '';
    const query  = searchQuery.toLowerCase();
    return name.includes(query) || mobile.includes(query);
  });

  // ── Summary stats ──────────────────────────────────────────────────────────
  const totalRevenue = sales.reduce((s, sale) => s + (sale.totalAmount || 0), 0);
  const upiCount     = sales.filter(s => s.paymentMethod === 'UPI').length;
  const cashCount    = sales.filter(s => s.paymentMethod === 'CASH').length;
  const creditCount  = sales.filter(s => s.paymentMethod === 'CREDIT').length;

  if (loading) return <div style={loadingStyle}>Loading Invoices...</div>;

  return (
    <div style={containerStyle}>

      {/* ── Header ── */}
      <header style={headerFlex}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FileText size={26} color="#60a5fa" />
          <div>
            <h1 style={{ color: '#f1f5f9', margin: 0, fontSize: '22px' }}>Sales Invoices & History</h1>
            <p style={{ color: '#64748b', margin: '2px 0 0', fontSize: '13px' }}>
              {sales.length} total bills recorded
            </p>
          </div>
        </div>

        {/* ✅ Action buttons — wrap on mobile */}
        <div style={actionBtns}>
          <button
            onClick={handleExportExcel}
            style={exportBtn}
            disabled={exporting || sales.length === 0}
          >
            <Download size={15} />
            <span style={btnLabel}>{exporting ? 'Exporting...' : 'Export to Excel'}</span>
          </button>
          <button onClick={fetchSales} style={refreshBtn}>
            <RefreshCw size={15} />
            <span style={btnLabel}>Refresh</span>
          </button>
        </div>
      </header>

      {/* ✅ Stats Row — wraps to 2×2 on mobile */}
      <div style={statsRow}>
        <div style={statCard('#60a5fa')}>
          <span style={statLabel}>Total Bills</span>
          <span style={{ ...statValue, color: '#60a5fa' }}>{sales.length}</span>
        </div>
        <div style={statCard('#10b981')}>
          <span style={statLabel}>Total Revenue</span>
          <span style={{ ...statValue, color: '#10b981', fontSize: '18px' }}>₹{totalRevenue.toFixed(2)}</span>
        </div>
        <div style={statCard('#34d399')}>
          <span style={statLabel}>Cash / UPI</span>
          <span style={{ ...statValue, color: '#34d399' }}>{cashCount} / {upiCount}</span>
        </div>
        <div style={statCard('#fbbf24')}>
          <span style={statLabel}>Credit (Udhaar)</span>
          <span style={{ ...statValue, color: '#fbbf24' }}>{creditCount}</span>
        </div>
      </div>

      {/* ✅ Search Bar */}
      <div style={searchBoxStyle}>
        <Search color="#64748b" size={18} />
        <input
          type="text"
          placeholder="Search by customer name or mobile number..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={inputStyle}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} style={clearBtn}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* ✅ Table with horizontal scroll wrapper */}
      <div style={tableContainer}>
        <div style={tableScrollWrapper}>
          <table style={darkTable}>
            <thead>
              <tr style={headerRow}>
                <th style={th}>Date</th>
                <th style={th}>Invoice ID</th>
                <th style={th}>Customer</th>
                <th style={th}>Payment</th>
                <th style={{ ...th, textAlign: 'right' }}>Total</th>
                <th style={{ ...th, textAlign: 'center' }}>Invoice</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length > 0 ? filteredSales.map(sale => (
                <tr key={sale.id} style={rowStyle}>
                  <td style={td}>
                    <div style={{ color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {new Date(sale.saleDate).toLocaleDateString('en-IN')}
                    </div>
                    <div style={{ color: '#475569', fontSize: '12px' }}>
                      {new Date(sale.saleDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td style={{ ...td, fontFamily: 'monospace', color: '#60a5fa', whiteSpace: 'nowrap' }}>
                    {sale.id?.substring(0, 8).toUpperCase()}
                  </td>
                  <td style={{ ...td, fontWeight: 'bold', color: '#f1f5f9' }}>
                    <div>{sale.customerName || 'Cash Customer'}</div>
                    {sale.customerMobile && (
                      <div style={{ color: '#64748b', fontSize: '12px', fontWeight: 'normal' }}>
                        {sale.customerMobile}
                      </div>
                    )}
                  </td>
                  <td style={td}>
                    <span style={{ ...badgeBase, ...getPaymentStyle(sale.paymentMethod) }}>
                      {sale.paymentMethod}
                    </span>
                  </td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 'bold', color: '#10b981', whiteSpace: 'nowrap' }}>
                    ₹{sale.totalAmount?.toFixed(2)}
                  </td>
                  <td style={{ ...td, textAlign: 'center' }}>
                    <button onClick={() => setSelectedSale(sale)} style={viewBtn}>
                      <Eye size={14} /> View
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" style={emptyStyle}>No matching bills found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ✅ Result count shown inside table card */}
        {filteredSales.length > 0 && (
          <div style={resultCount}>
            Showing <strong style={{ color: '#f1f5f9' }}>{filteredSales.length}</strong> of{' '}
            <strong style={{ color: '#f1f5f9' }}>{sales.length}</strong> bills
          </div>
        )}
      </div>

      {/* Invoice Modal */}
      {selectedSale && (
        <Invoice data={selectedSale} onClose={() => setSelectedSale(null)} />
      )}
    </div>
  );
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const getPaymentStyle = (method) => {
  if (method === 'UPI')    return { backgroundColor: 'rgba(59,130,246,0.1)',  color: '#60a5fa', border: '1px solid #3b82f6' };
  if (method === 'CREDIT') return { backgroundColor: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid #f59e0b' };
  return                          { backgroundColor: 'rgba(16,185,129,0.1)',  color: '#34d399', border: '1px solid #10b981' };
};

// ─── STYLES ───────────────────────────────────────────────────────────────────

// ✅ Responsive page padding
const containerStyle = { padding: 'clamp(16px, 4vw, 40px)', backgroundColor: '#0f172a', minHeight: '100vh' };
const loadingStyle   = { height: '100vh', backgroundColor: '#0f172a', color: '#60a5fa', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px' };

// ✅ Header wraps on mobile
const headerFlex = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', gap: '12px', flexWrap: 'wrap' };

// ✅ Action buttons wrap
const actionBtns = { display: 'flex', gap: '10px', flexWrap: 'wrap', flexShrink: 0 };
const exportBtn  = { display: 'flex', alignItems: 'center', gap: '7px', backgroundColor: '#10b981', color: 'white', border: 'none', padding: '9px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' };
const refreshBtn = { display: 'flex', alignItems: 'center', gap: '7px', backgroundColor: '#334155', color: 'white', border: 'none', padding: '9px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' };
// ✅ Hide text on very small screens if needed (optional — kept visible here)
const btnLabel   = { display: 'inline' };

// ✅ Stats row — wraps to 2×2 on mobile
const statsRow  = { display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' };
const statCard  = (accent) => ({
  flex: '1 1 130px',
  minWidth: '120px',
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderLeft: `3px solid ${accent}`,
  borderRadius: '12px',
  padding: '14px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '5px',
});
const statLabel = { color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' };
const statValue = { fontSize: '22px', fontWeight: 'bold' };

// ✅ Search
const searchBoxStyle = { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#1e293b', padding: '11px 14px', borderRadius: '12px', border: '1px solid #334155', marginBottom: '16px' };
const inputStyle     = { background: 'none', border: 'none', color: '#f1f5f9', width: '100%', outline: 'none', fontSize: '14px', minWidth: 0 };
const clearBtn       = { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', padding: '2px', flexShrink: 0 };

// ✅ Table container with scroll
const tableContainer    = { backgroundColor: '#1e293b', borderRadius: '16px', border: '1px solid #334155', overflow: 'hidden' };
const tableScrollWrapper = { overflowX: 'auto', WebkitOverflowScrolling: 'touch' };
const darkTable         = { width: '100%', minWidth: '580px', borderCollapse: 'collapse' };
const headerRow         = { borderBottom: '1px solid #334155' };
const th                = { padding: '13px 16px', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'left', fontWeight: 500, whiteSpace: 'nowrap' };
const rowStyle          = { borderBottom: '1px solid #334155' };
const td                = { padding: '13px 16px', fontSize: '14px', color: '#cbd5e1' };
const badgeBase         = { padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' };
const viewBtn           = { display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', whiteSpace: 'nowrap' };
const emptyStyle        = { padding: '50px', textAlign: 'center', color: '#475569' };
const resultCount       = { padding: '12px 16px', color: '#64748b', fontSize: '13px', borderTop: '1px solid #334155' };

export default SalesHistory;