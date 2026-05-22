import React, { useState } from 'react';
import api from '../api/axiosConfig';
import { Search, RotateCcw, CheckCircle, XCircle, Package, FileText, AlertTriangle, Printer, X } from 'lucide-react';

// ─── RETURN RECEIPT MODAL ────────────────────────────────────────────────────
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
          {/* Receipt Header */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '14px' }}>
            <h2 style={{ margin: '0 0 4px', fontSize: '18px', letterSpacing: '2px', textTransform: 'uppercase' }}>
              SALE RETURN RECEIPT
            </h2>
            <p style={{ margin: 0, fontSize: '11px', color: '#555' }}>This is a return/refund document</p>
          </div>

          {/* Return Info */}
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

          {/* Items Table */}
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

          {/* Total */}
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

// ─── MAIN SALE RETURN COMPONENT ───────────────────────────────────────────────
const SaleReturn = () => {
  const [searchMode, setSearchMode]       = useState('invoice');
  const [searchQuery, setSearchQuery]     = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedSale, setSelectedSale]   = useState(null);

  const [returnItems, setReturnItems]     = useState([]);
  const [reason, setReason]               = useState('');
  const [pharmacist, setPharmacist]       = useState('');

  const [loading, setLoading]             = useState(false);
  const [searching, setSearching]         = useState(false);
  const [error, setError]                 = useState('');
  const [success, setSuccess]             = useState('');
  const [returnReceipt, setReturnReceipt] = useState(null);

  // ── Search by Invoice ID ──────────────────────────────────────────────────
  const searchByInvoice = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setError('');
    setSelectedSale(null);
    setSearchResults([]);
    try {
      const res = await api.get('/sales');
      const all = res.data || [];
      const match = all.find(s =>
        s.id?.toUpperCase().startsWith(searchQuery.trim().toUpperCase()) ||
        s.id?.substring(0, 8).toUpperCase() === searchQuery.trim().toUpperCase()
      );
      if (match) {
        loadSaleForReturn(match);
      } else {
        setError('No invoice found with that ID. Please check and try again.');
      }
    } catch {
      setError('Error searching. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  // ── Search by Customer Name ───────────────────────────────────────────────
  const searchByCustomer = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setError('');
    setSelectedSale(null);
    setSearchResults([]);
    try {
      const res = await api.get('/sales');
      const all = res.data || [];
      const matches = all.filter(s =>
        s.customerName?.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        s.customerMobile?.includes(searchQuery.trim())
      );
      if (matches.length === 0) {
        setError('No bills found for that customer name/mobile.');
      } else {
        setSearchResults(matches);
      }
    } catch {
      setError('Error searching. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  // ── Load a sale and set up return item checkboxes ─────────────────────────
  const loadSaleForReturn = (sale) => {
    setSelectedSale(sale);
    setSearchResults([]);
    setReturnItems(
      sale.saleItems?.map(item => ({
        medicineId: item.medicineId,
        medicineName: item.medicineName || 'Medicine',
        unitPrice: item.unitPrice || item.mrp || 0,
        maxQty: item.quantity,
        quantityReturned: 0,
        selected: false,
        subTotal: 0,
      })) || []
    );
    setError('');
    setSuccess('');
  };

  // ── Toggle item selection ─────────────────────────────────────────────────
  const toggleItem = (index) => {
    setReturnItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const selected = !item.selected;
      return {
        ...item,
        selected,
        quantityReturned: selected ? 1 : 0,
        subTotal: selected ? item.unitPrice : 0,
      };
    }));
  };

  // ── Update return quantity ────────────────────────────────────────────────
  const updateQty = (index, qty) => {
    setReturnItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const safeQty = Math.min(Math.max(1, parseInt(qty) || 1), item.maxQty);
      return { ...item, quantityReturned: safeQty, subTotal: safeQty * item.unitPrice };
    }));
  };

  const totalRefund = returnItems
    .filter(i => i.selected)
    .reduce((sum, i) => sum + i.subTotal, 0);

  const selectedCount = returnItems.filter(i => i.selected).length;

  // ── Submit Return ─────────────────────────────────────────────────────────
  const submitReturn = async () => {
    if (selectedCount === 0) { setError('Please select at least one item to return.'); return; }
    if (!reason.trim())      { setError('Please enter a reason for return.'); return; }
    if (!pharmacist.trim())  { setError('Please enter the pharmacist name.'); return; }

    setLoading(true);
    setError('');
    try {
      const payload = returnItems
        .filter(i => i.selected)
        .map(i => ({
          medicineId: i.medicineId,
          medicineName: i.medicineName,
          quantityReturned: i.quantityReturned,
          unitPrice: i.unitPrice,
          subTotal: i.subTotal,
        }));

      const res = await api.post(
        `/returns/process/${selectedSale.id}?reason=${encodeURIComponent(reason)}&pharmacist=${encodeURIComponent(pharmacist)}`,
        payload
      );

      setReturnReceipt(res.data);
      setSuccess(`Return processed! Refund: ₹${res.data.totalRefundAmount?.toFixed(2)}`);
      setSelectedSale(null);
      setReturnItems([]);
      setSearchQuery('');
      setReason('');
      setPharmacist('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error processing return. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={pageStyle}>

      {/* Page Header */}
      <div style={headerFlex}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <RotateCcw size={28} color="#f87171" />
          <h1 style={{ color: '#f1f5f9', margin: 0 }}>Sale Return</h1>
        </div>
      </div>

      {/* Banners */}
      {success && (
        <div style={bannerStyle('#052e16', '#16a34a', '#4ade80')}>
          <CheckCircle size={18} /> {success}
        </div>
      )}
      {error && (
        <div style={bannerStyle('#450a0a', '#dc2626', '#fca5a5')}>
          <XCircle size={18} /> {error}
        </div>
      )}

      {/* ── STEP 1: Search ── */}
      <div style={cardStyle}>
        <h2 style={sectionTitle}><span style={stepBadge}>1</span> Find Original Bill</h2>

        {/* Mode Toggle */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setSearchMode('invoice'); setSearchQuery(''); setSearchResults([]); setSelectedSale(null); setError(''); }}
            style={modeBtn(searchMode === 'invoice')}
          >
            <FileText size={15} /> By Invoice ID
          </button>
          <button
            onClick={() => { setSearchMode('customer'); setSearchQuery(''); setSearchResults([]); setSelectedSale(null); setError(''); }}
            style={modeBtn(searchMode === 'customer')}
          >
            <Search size={15} /> By Customer Name
          </button>
        </div>

        {/* Search Input */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div style={searchWrap}>
            <Search size={18} color="#94a3b8" />
            <input
              type="text"
              placeholder={searchMode === 'invoice' ? 'Enter Invoice ID (e.g. 69F65B80)...' : 'Enter customer name or mobile...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (searchMode === 'invoice' ? searchByInvoice() : searchByCustomer())}
              style={inputStyle}
            />
          </div>
          <button
            onClick={searchMode === 'invoice' ? searchByInvoice : searchByCustomer}
            disabled={searching || !searchQuery.trim()}
            style={btnStyle('#2563eb')}
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Customer Search Results */}
        {searchResults.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '10px' }}>
              Found {searchResults.length} bill(s) — select one to process return:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {searchResults.map(sale => (
                <div
                  key={sale.id}
                  onClick={() => loadSaleForReturn(sale)}
                  style={resultRowStyle}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{ color: '#60a5fa', fontFamily: 'monospace', fontWeight: 'bold' }}>
                      {sale.id?.substring(0, 8).toUpperCase()}
                    </span>
                    <span style={{ color: '#cbd5e1' }}>
                      {sale.customerName || 'Cash Customer'}
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                      {sale.saleDate ? new Date(sale.saleDate).toLocaleDateString('en-IN') : 'N/A'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                      ₹{sale.totalAmount?.toFixed(2)}
                    </span>
                    <span style={{ ...payBadge, ...payColor(sale.paymentMethod) }}>
                      {sale.paymentMethod}
                    </span>
                    <span style={{ color: '#60a5fa', fontSize: '13px' }}>Select →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── STEP 2: Select Items ── */}
      {selectedSale && (
        <div style={cardStyle}>
          <h2 style={sectionTitle}><span style={stepBadge}>2</span> Select Items to Return</h2>

          {/* Original Bill Info */}
          <div style={infoBoxStyle}>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <span><span style={labelStyle}>Invoice:</span> <span style={{ color: '#60a5fa', fontFamily: 'monospace' }}>{selectedSale.id?.substring(0, 8).toUpperCase()}</span></span>
              <span><span style={labelStyle}>Customer:</span> <span style={{ color: '#f1f5f9' }}>{selectedSale.customerName || 'Cash Customer'}</span></span>
              <span><span style={labelStyle}>Date:</span> <span style={{ color: '#f1f5f9' }}>{selectedSale.saleDate ? new Date(selectedSale.saleDate).toLocaleDateString('en-IN') : 'N/A'}</span></span>
              <span><span style={labelStyle}>Payment:</span> <span style={{ ...payBadge, ...payColor(selectedSale.paymentMethod) }}>{selectedSale.paymentMethod}</span></span>
              <span><span style={labelStyle}>Bill Total:</span> <span style={{ color: '#10b981', fontWeight: 'bold' }}>₹{selectedSale.totalAmount?.toFixed(2)}</span></span>
              {selectedSale.creditSale && (
                <span style={{ color: '#fbbf24', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <AlertTriangle size={14} /> Credit/Udhaar — balance will be adjusted
                </span>
              )}
            </div>
          </div>

          {/* ✅ FIX: Items table wrapped for horizontal scroll on mobile */}
          <div style={tableScrollWrapper}>
            <table style={tableStyle}>
              <thead>
                <tr style={theadRow}>
                  <th style={{ ...th, width: '5%' }}>✓</th>
                  <th style={{ ...th, width: '35%' }}>Medicine</th>
                  <th style={{ ...th, textAlign: 'right', width: '20%' }}>Unit Price</th>
                  <th style={{ ...th, textAlign: 'center', width: '15%' }}>Sold Qty</th>
                  <th style={{ ...th, textAlign: 'center', width: '15%' }}>Return Qty</th>
                  <th style={{ ...th, textAlign: 'right', width: '10%' }}>Refund</th>
                </tr>
              </thead>
              <tbody>
                {returnItems.map((item, index) => (
                  <tr key={index} style={{ ...rowStyle, backgroundColor: item.selected ? 'rgba(248,113,113,0.07)' : 'transparent' }}>
                    <td style={{ padding: '12px 10px' }}>
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => toggleItem(index)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#f87171' }}
                      />
                    </td>
                    <td style={{ padding: '12px 10px', fontWeight: 'bold', color: '#f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Package size={14} color="#94a3b8" />
                        {item.medicineName}
                      </div>
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'right', color: '#94a3b8' }}>
                      ₹{item.unitPrice?.toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'center', color: '#94a3b8' }}>
                      {item.maxQty}
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                      {item.selected ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <button onClick={() => updateQty(index, item.quantityReturned - 1)} style={qtyBtn}>−</button>
                          <span style={{ color: '#f1f5f9', minWidth: '24px', textAlign: 'center' }}>{item.quantityReturned}</span>
                          <button onClick={() => updateQty(index, item.quantityReturned + 1)} style={qtyBtn}>+</button>
                        </div>
                      ) : (
                        <span style={{ color: '#475569' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'right', color: item.selected ? '#f87171' : '#475569', fontWeight: item.selected ? 'bold' : 'normal' }}>
                      {item.selected ? `₹${item.subTotal.toFixed(2)}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Refund Total */}
          {selectedCount > 0 && (
            <div style={refundTotalBox}>
              <span style={{ color: '#94a3b8' }}>{selectedCount} item(s) selected</span>
              <span style={{ color: '#f87171', fontSize: '20px', fontWeight: 'bold' }}>
                Total Refund: ₹{totalRefund.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 3: Reason & Submit ── */}
      {selectedSale && (
        <div style={cardStyle}>
          <h2 style={sectionTitle}><span style={stepBadge}>3</span> Return Details & Confirm</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={labelStyle}>Reason for Return *</label>
              <select
                value={reason}
                onChange={e => setReason(e.target.value)}
                style={selectStyle}
              >
                <option value="">-- Select Reason --</option>
                <option value="Wrong Medicine Dispensed">Wrong Medicine Dispensed</option>
                <option value="Expired Medicine">Expired Medicine</option>
                <option value="Damaged/Broken Package">Damaged / Broken Package</option>
                <option value="Doctor Changed Prescription">Doctor Changed Prescription</option>
                <option value="Customer Bought Extra">Customer Bought Extra</option>
                <option value="Side Effects / Allergic Reaction">Side Effects / Allergic Reaction</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Processed By (Pharmacist) *</label>
              <input
                type="text"
                placeholder="Enter pharmacist name..."
                value={pharmacist}
                onChange={e => setPharmacist(e.target.value)}
                style={fieldStyle}
              />
            </div>
          </div>

          {/* Summary Box */}
          <div style={summaryBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <p style={{ margin: '0 0 6px', color: '#94a3b8', fontSize: '13px' }}>Return Summary</p>
                <p style={{ margin: '0 0 4px', color: '#f1f5f9' }}>
                  Invoice: <strong style={{ color: '#60a5fa' }}>{selectedSale?.id?.substring(0, 8).toUpperCase()}</strong>
                  &nbsp;•&nbsp; Items: <strong>{selectedCount}</strong>
                  &nbsp;•&nbsp; Reason: <strong>{reason || '—'}</strong>
                </p>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>
                  Stock will be restored. Finance will be updated.
                  {selectedSale?.creditSale && ' Customer Udhaar balance will be reduced.'}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: '0 0 4px', color: '#94a3b8', fontSize: '12px' }}>Total Refund</p>
                <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#f87171' }}>
                  ₹{totalRefund.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={submitReturn}
            disabled={loading || selectedCount === 0}
            style={{
              ...btnStyle(selectedCount > 0 ? '#dc2626' : '#374151'),
              width: '100%',
              padding: '14px',
              fontSize: '15px',
              marginTop: '16px',
              justifyContent: 'center',
              opacity: selectedCount === 0 ? 0.5 : 1,
              cursor: selectedCount === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            <RotateCcw size={18} />
            {loading ? 'Processing Return...' : `Confirm Return & Refund ₹${totalRefund.toFixed(2)}`}
          </button>
        </div>
      )}

      {/* Return Receipt Modal */}
      {returnReceipt && (
        <ReturnReceipt returnData={returnReceipt} onClose={() => setReturnReceipt(null)} />
      )}
    </div>
  );
};

// ─── STYLES ───────────────────────────────────────────────────────────────────
const pageStyle        = { padding: '40px', backgroundColor: '#0f172a', minHeight: '100vh' };
const headerFlex       = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' };
const cardStyle        = { backgroundColor: '#1e293b', borderRadius: '16px', border: '1px solid #334155', padding: '28px', marginBottom: '20px' };
const sectionTitle     = { color: '#f1f5f9', fontSize: '16px', fontWeight: 'bold', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '10px' };
const stepBadge        = { backgroundColor: '#f87171', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 'bold', flexShrink: 0 };
const searchWrap       = { flex: 1, display: 'flex', alignItems: 'center', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px 14px', gap: '10px', minWidth: '0' };
const inputStyle       = { background: 'none', border: 'none', color: '#f1f5f9', width: '100%', outline: 'none', fontSize: '14px' };
const infoBoxStyle     = { backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', fontSize: '14px', color: '#94a3b8' };

// ✅ FIX: horizontal scroll wrapper for the items table
const tableScrollWrapper = { overflowX: 'auto', WebkitOverflowScrolling: 'touch' };
const tableStyle       = { width: '100%', minWidth: '580px', borderCollapse: 'collapse' };

const theadRow         = { color: '#64748b', fontSize: '12px', textTransform: 'uppercase', borderBottom: '1px solid #334155' };
const th               = { padding: '10px', textAlign: 'left', fontWeight: '600' };
const rowStyle         = { borderBottom: '1px solid #1e293b', transition: 'background 0.15s' };
const refundTotalBox   = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', border: '1px solid #f87171', borderRadius: '10px', padding: '14px 18px', marginTop: '16px', flexWrap: 'wrap', gap: '10px' };
const summaryBox       = { backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '18px' };
const labelStyle       = { color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' };
const fieldStyle       = { width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px 14px', color: '#f1f5f9', fontSize: '14px', outline: 'none', boxSizing: 'border-box' };
const selectStyle      = { ...fieldStyle, cursor: 'pointer' };
const resultRowStyle   = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '12px 16px', cursor: 'pointer', transition: 'border-color 0.2s', flexWrap: 'wrap', gap: '8px' };
const payBadge         = { padding: '2px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: 'bold' };
const payColor         = (m) => m === 'UPI' ? { backgroundColor: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid #3b82f6' } : m === 'CREDIT' ? { backgroundColor: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid #f59e0b' } : { backgroundColor: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid #10b981' };
const qtyBtn           = { backgroundColor: '#334155', color: '#f1f5f9', border: 'none', borderRadius: '5px', width: '26px', height: '26px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const modeBtn          = (active) => ({ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: `1px solid ${active ? '#f87171' : '#334155'}`, backgroundColor: active ? 'rgba(248,113,113,0.1)' : 'transparent', color: active ? '#f87171' : '#94a3b8', cursor: 'pointer', fontWeight: active ? 'bold' : 'normal', fontSize: '13px' });
const btnStyle         = (bg) => ({ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: bg, color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' });
const bannerStyle      = (bg, border, color) => ({ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: bg, border: `1px solid ${border}`, color, borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '14px' });
const overlayStyle     = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 };
const receiptCardStyle = { backgroundColor: '#1e293b', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' };
const printAreaStyle   = { backgroundColor: 'white', color: 'black', padding: '24px', borderRadius: '4px', fontFamily: 'monospace' };

export default SaleReturn;