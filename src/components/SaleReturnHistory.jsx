import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import {
  RefreshCw, RotateCcw, ChevronDown, ChevronUp,
  PackageOpen, User, Calendar, FileText, Printer, X, Search
} from 'lucide-react';

// ─── RETURN RECEIPT MODAL (reused from SaleReturn.jsx style) ─────────────────
const ReturnReceipt = ({ returnData, onClose }) => {
  if (!returnData) return null;
  return (
    <div style={overlayStyle}>
      <div style={receiptCardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }} className="no-print">
          <h2 style={{ color: '#f87171', margin: 0 }}>Return Receipt</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => window.print()} style={btnStyle('#2563eb')}>
              <Printer size={16} /> Print
            </button>
            <button onClick={onClose} style={btnStyle('#475569')}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div id="printable-invoice" style={printAreaStyle}>
          <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '14px' }}>
            <h2 style={{ margin: '0 0 4px', fontSize: '18px', letterSpacing: '2px', textTransform: 'uppercase' }}>
              SALE RETURN RECEIPT
            </h2>
            <p style={{ margin: 0, fontSize: '11px', color: '#555' }}>This is a return/refund document</p>
          </div>

          <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse', marginBottom: '14px' }}>
            <tbody>
              <tr>
                <td style={{ padding: '2px 0' }}><strong>Customer:</strong> {returnData.customerName || 'Cash Customer'}</td>
                <td style={{ textAlign: 'right', padding: '2px 0' }}><strong>Return ID:</strong> {returnData.id?.substring(0, 8).toUpperCase()}</td>
              </tr>
              <tr>
                <td style={{ padding: '2px 0' }}><strong>Original Invoice:</strong> {returnData.originalSaleId?.substring(0, 8).toUpperCase()}</td>
                <td style={{ textAlign: 'right', padding: '2px 0' }}><strong>Date:</strong> {new Date(returnData.returnDate).toLocaleDateString('en-IN')}</td>
              </tr>
              <tr>
                <td style={{ padding: '2px 0' }}><strong>Reason:</strong> {returnData.reason}</td>
                <td style={{ textAlign: 'right', padding: '2px 0' }}><strong>Processed By:</strong> {returnData.processedBy}</td>
              </tr>
            </tbody>
          </table>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ borderTop: '2px solid #000', borderBottom: '2px solid #000' }}>
                <th style={{ textAlign: 'left', padding: '7px 5px', width: '45%' }}>Item Name</th>
                <th style={{ textAlign: 'right', padding: '7px 5px', width: '20%' }}>Unit Price</th>
                <th style={{ textAlign: 'center', padding: '7px 5px', width: '15%' }}>Qty</th>
                <th style={{ textAlign: 'right', padding: '7px 5px', width: '20%' }}>Refund</th>
              </tr>
            </thead>
            <tbody>
              {returnData.returnedItems?.map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '6px 5px' }}>{item.medicineName}</td>
                  <td style={{ textAlign: 'right', padding: '6px 5px' }}>₹{item.unitPrice?.toFixed(2)}</td>
                  <td style={{ textAlign: 'center', padding: '6px 5px' }}>{item.quantityReturned}</td>
                  <td style={{ textAlign: 'right', padding: '6px 5px' }}>₹{item.subTotal?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ borderTop: '2px solid #000', marginTop: '10px', paddingTop: '10px', textAlign: 'right' }}>
            <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
              Total Refund: ₹{returnData.totalRefundAmount?.toFixed(2)}
            </span>
          </div>
          <p style={{ textAlign: 'center', fontSize: '10px', fontStyle: 'italic', marginTop: '20px' }}>
            * Computer Generated Return Receipt
          </p>
        </div>
      </div>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-invoice, #printable-invoice * { visibility: visible; }
          #printable-invoice {
            position: fixed; top: 0; left: 0;
            width: 100%; padding: 15mm;
            box-sizing: border-box;
            background: white !important;
            color: black !important;
            font-family: monospace;
          }
        }
      `}</style>
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const SaleReturnHistory = () => {
  const [returns, setReturns]           = useState([]);
  const [filtered, setFiltered]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [expandedId, setExpandedId]     = useState(null);
  const [searchQuery, setSearchQuery]   = useState('');
  const [receiptData, setReceiptData]   = useState(null);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const res = await api.get('/returns/sale-returns');
      const data = res.data || [];
      setReturns(data);
      setFiltered(data);
    } catch (err) {
      console.error('Error fetching return history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReturns(); }, []);

  // ── Search/Filter ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFiltered(returns);
      return;
    }
    const q = searchQuery.trim().toLowerCase();
    setFiltered(returns.filter(r =>
      r.id?.toLowerCase().includes(q) ||
      r.originalSaleId?.toLowerCase().includes(q) ||
      r.customerName?.toLowerCase().includes(q) ||
      r.processedBy?.toLowerCase().includes(q) ||
      r.reason?.toLowerCase().includes(q)
    ));
  }, [searchQuery, returns]);

  const toggleExpand = (id) => setExpandedId(prev => prev === id ? null : id);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalRefunded   = returns.reduce((s, r) => s + (r.totalRefundAmount || 0), 0);
  const totalItemsBack  = returns.reduce((s, r) =>
    s + (r.returnedItems?.reduce((a, i) => a + (i.quantityReturned || 0), 0) || 0), 0);

  if (loading) return <div style={loadingStyle}>Loading Return History...</div>;

  return (
    <div style={pageStyle}>

      {/* Header */}
      <div style={headerFlex}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <RotateCcw size={28} color="#f87171" />
          <div>
            <h1 style={{ color: '#f1f5f9', margin: 0, fontSize: '24px' }}>Sale Return History</h1>
            <p style={{ color: '#64748b', margin: '2px 0 0', fontSize: '13px' }}>
              All processed refunds and restocked items
            </p>
          </div>
        </div>
        <button onClick={fetchReturns} style={refreshBtn}>
          <RefreshCw size={16} /> REFRESH
        </button>
      </div>

      {/* Stats Bar */}
      <div style={statsRow}>
        <div style={statCard('#a78bfa')}>
          <span style={statLabel}>Total Returns</span>
          <span style={{ ...statValue, color: '#a78bfa' }}>{returns.length}</span>
        </div>
        <div style={statCard('#f87171')}>
          <span style={statLabel}>Total Refunded</span>
          <span style={{ ...statValue, color: '#f87171' }}>₹{totalRefunded.toFixed(2)}</span>
        </div>
        <div style={statCard('#34d399')}>
          <span style={statLabel}>Units Restocked</span>
          <span style={{ ...statValue, color: '#34d399' }}>{totalItemsBack}</span>
        </div>
        <div style={statCard('#60a5fa')}>
          <span style={statLabel}>Showing</span>
          <span style={{ ...statValue, color: '#60a5fa' }}>{filtered.length} / {returns.length}</span>
        </div>
      </div>

      {/* Search Bar */}
      <div style={searchWrap}>
        <Search size={16} color="#64748b" />
        <input
          type="text"
          placeholder="Search by Return ID, Invoice ID, Customer, Pharmacist, Reason..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={searchInput}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} style={clearBtn}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Returns List */}
      <div style={listContainer}>
        {filtered.length === 0 ? (
          <div style={emptyState}>
            <PackageOpen size={48} color="#334155" />
            <p style={{ color: '#475569', marginTop: '12px', margin: '12px 0 0' }}>
              {returns.length === 0 ? 'No returns have been processed yet.' : 'No results match your search.'}
            </p>
          </div>
        ) : (
          filtered.map((ret) => (
            <div key={ret.id} style={returnCard}>

              {/* ── Card Header (always visible) ── */}
              <div style={cardHeader} onClick={() => toggleExpand(ret.id)}>

                {/* Return Badge + IDs */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 2 }}>
                  <div style={returnBadge}>
                    <RotateCcw size={14} color="#f87171" />
                  </div>
                  <div>
                    <div style={{ color: '#f1f5f9', fontWeight: 'bold', fontSize: '15px', fontFamily: 'monospace' }}>
                      #{ret.id?.substring(0, 8).toUpperCase()}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '12px', marginTop: '2px' }}>
                      Invoice:{' '}
                      <span style={{ color: '#60a5fa', fontFamily: 'monospace' }}>
                        #{ret.originalSaleId?.substring(0, 8).toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Meta: customer, date, pharmacist */}
                <div style={metaGroup}>
                  <span style={metaItem}>
                    <User size={13} color="#64748b" />
                    {ret.customerName || 'Cash Customer'}
                  </span>
                  <span style={metaItem}>
                    <Calendar size={13} color="#64748b" />
                    {new Date(ret.returnDate).toLocaleString('en-IN')}
                  </span>
                  <span style={metaItem}>
                    <FileText size={13} color="#64748b" />
                    {ret.processedBy || 'SYSTEM'}
                  </span>
                </div>

                {/* Items count + refund + expand */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={itemCountBadge}>
                    {ret.returnedItems?.length || 0} item(s)
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Refund</div>
                    <div style={{ color: '#f87171', fontWeight: 'bold', fontSize: '18px' }}>
                      ₹{ret.totalRefundAmount?.toFixed(2)}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setReceiptData(ret); }}
                    style={printBtnSmall}
                    title="Print Receipt"
                  >
                    <Printer size={14} />
                  </button>
                  {expandedId === ret.id
                    ? <ChevronUp size={18} color="#64748b" />
                    : <ChevronDown size={18} color="#64748b" />
                  }
                </div>
              </div>

              {/* ── Expanded Details ── */}
              {expandedId === ret.id && (
                <div style={expandedSection}>

                  {/* Reason */}
                  {ret.reason && (
                    <div style={reasonBox}>
                      <span style={smallLabel}>Reason for Return</span>
                      <p style={{ color: '#cbd5e1', margin: '6px 0 0', fontSize: '14px' }}>{ret.reason}</p>
                    </div>
                  )}

                  {/* Returned Items Table */}
                  <div style={{ marginTop: '16px' }}>
                    <span style={smallLabel}>Returned Items</span>
                    <table style={innerTable}>
                      <thead>
                        <tr style={innerHeaderRow}>
                          <th style={thStyle}>Medicine Name</th>
                          <th style={{ ...thStyle, textAlign: 'center' }}>Qty Returned</th>
                          <th style={{ ...thStyle, textAlign: 'right' }}>Unit Price</th>
                          <th style={{ ...thStyle, textAlign: 'right' }}>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ret.returnedItems?.map((item, idx) => (
                          <tr key={idx} style={innerRow}>
                            <td style={tdStyle}>{item.medicineName}</td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                              <span style={qtyBadge}>+{item.quantityReturned}</span>
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'right', color: '#94a3b8' }}>
                              ₹{item.unitPrice?.toFixed(2)}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'right', color: '#34d399', fontWeight: 'bold' }}>
                              ₹{item.subTotal?.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="3" style={{ ...tdStyle, textAlign: 'right', color: '#64748b', fontWeight: 'bold', borderTop: '1px solid #334155', paddingTop: '14px' }}>
                            TOTAL REFUND
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'right', color: '#f87171', fontWeight: 'bold', fontSize: '16px', borderTop: '1px solid #334155', paddingTop: '14px' }}>
                            ₹{ret.totalRefundAmount?.toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Receipt Modal */}
      {receiptData && (
        <ReturnReceipt returnData={receiptData} onClose={() => setReceiptData(null)} />
      )}
    </div>
  );
};

// ─── STYLES ───────────────────────────────────────────────────────────────────
const pageStyle      = { padding: '40px', backgroundColor: '#0f172a', minHeight: '100vh', marginLeft: '240px' };
const headerFlex     = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' };
const refreshBtn     = { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#334155', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const loadingStyle   = { height: '100vh', backgroundColor: '#0f172a', color: '#f87171', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px', marginLeft: '240px' };

const statsRow  = { display: 'flex', gap: '16px', marginBottom: '24px' };
const statCard  = (accent) => ({ flex: 1, backgroundColor: '#1e293b', border: `1px solid #334155`, borderRadius: '12px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '6px', borderLeft: `3px solid ${accent}` });
const statLabel = { color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' };
const statValue = { fontSize: '26px', fontWeight: 'bold' };

const searchWrap  = { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px' };
const searchInput = { background: 'none', border: 'none', color: '#f1f5f9', width: '100%', outline: 'none', fontSize: '14px' };
const clearBtn    = { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', padding: '2px' };

const listContainer = { display: 'flex', flexDirection: 'column', gap: '10px' };
const returnCard    = { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', overflow: 'hidden' };
const cardHeader    = { display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 24px', cursor: 'pointer' };
const returnBadge   = { width: '34px', height: '34px', borderRadius: '8px', backgroundColor: 'rgba(248,113,113,0.1)', border: '1px solid #ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
const metaGroup     = { display: 'flex', gap: '20px', flex: 3, flexWrap: 'wrap' };
const metaItem      = { display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '13px' };
const itemCountBadge = { backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '4px 10px', color: '#64748b', fontSize: '12px', whiteSpace: 'nowrap' };
const printBtnSmall  = { display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#334155', border: 'none', borderRadius: '6px', width: '30px', height: '30px', cursor: 'pointer', color: '#94a3b8' };

const expandedSection = { padding: '0 24px 24px', borderTop: '1px solid #334155' };
const reasonBox       = { backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '14px', marginTop: '20px' };
const smallLabel      = { color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' };

const innerTable     = { width: '100%', borderCollapse: 'collapse', marginTop: '8px' };
const innerHeaderRow = { borderBottom: '1px solid #334155' };
const thStyle        = { color: '#64748b', fontSize: '12px', textTransform: 'uppercase', padding: '10px 12px', textAlign: 'left', letterSpacing: '0.5px' };
const innerRow       = { borderBottom: '1px solid rgba(51,65,85,0.5)' };
const tdStyle        = { color: '#cbd5e1', fontSize: '14px', padding: '12px' };
const qtyBadge       = { backgroundColor: 'rgba(167,139,250,0.1)', color: '#a78bfa', border: '1px solid #8b5cf6', borderRadius: '5px', padding: '2px 10px', fontSize: '13px', fontWeight: 'bold' };

const emptyState     = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px', backgroundColor: '#1e293b', borderRadius: '16px', border: '1px solid #334155' };

// Receipt modal styles
const overlayStyle     = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 };
const receiptCardStyle = { backgroundColor: '#1e293b', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' };
const printAreaStyle   = { backgroundColor: 'white', color: 'black', padding: '24px', borderRadius: '4px', fontFamily: 'monospace' };
const btnStyle         = (bg) => ({ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: bg, color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' });

export default SaleReturnHistory;