import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { X, Printer } from 'lucide-react';

const Invoice = ({ data, onClose }) => {
  const [pharmacy, setPharmacy] = useState(null);

  useEffect(() => {
    api.get('/profile')
      .then(res => setPharmacy(res.data))
      .catch(err => console.error("Error loading pharmacy profile", err));
  }, []);

  const handlePrint = () => { window.print(); };

  if (!data) return null;

  const getItemPrice = (item) => {
    return item.pricePerUnit || item.mrp || item.unitPrice || 0;
  };

  const calculateGST = () => {
    if (!data.saleItems) return 0;
    return data.saleItems.reduce((acc, item) => {
      const price = getItemPrice(item);
      const gstRate = item.gstPercentage || 12;
      const itemTotal = price * item.quantity;
      const gstAmount = itemTotal - (itemTotal / (1 + gstRate / 100));
      return acc + gstAmount;
    }, 0);
  };

  const gstIncluded = calculateGST();

  // ✅ FIX 1: If finalAmount is 0 or missing (old bills), fall back to totalAmount
  const finalAmountToShow = (data.finalAmount && data.finalAmount !== 0)
    ? data.finalAmount
    : data.totalAmount;

  const roundOffToShow = data.roundOff ?? 0;

  // ✅ FIX 2: Handle null saleDate AND epoch (1/1/1970) date for old bills
  const saleDate = data.saleDate ? new Date(data.saleDate) : null;
  const displayDate = (saleDate && saleDate.getFullYear() > 1971)
    ? saleDate.toLocaleDateString('en-IN')
    : 'N/A';

  return (
    <div style={s.modalOverlay}>
      <div className="inv-card">

        {/* ── Buttons (no-print) ── */}
        <div className="no-print inv-top-bar">
          <h2 style={{ color: '#60a5fa', margin: 0, fontSize: '18px' }}>Invoice Generated</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handlePrint} style={s.printBtn}>
              <Printer size={16} /> Print
            </button>
            <button onClick={onClose} style={s.closeBtn}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Printable area ── */}
        <div id="printable-invoice" style={s.printArea}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '14px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
            <h1 style={{ margin: '0 0 4px 0', fontSize: '18px', textTransform: 'uppercase', letterSpacing: '2px' }}>
              {pharmacy?.pharmacyName || 'MAA BHAGWATI PHARMA'}
            </h1>
            <p style={{ margin: '2px 0', fontSize: '12px' }}>
              {pharmacy?.address || 'Set Address in Settings'}
            </p>
            <p style={{ margin: '2px 0', fontSize: '12px' }}>
              Contact: {pharmacy?.contactNumber || 'N/A'}
            </p>
            {pharmacy?.gstNumber && (
              <p style={{ margin: '2px 0', fontWeight: 'bold', fontSize: '12px' }}>
                GSTIN: {pharmacy.gstNumber}
              </p>
            )}
          </div>

          {/* ── Bill To + Invoice Info ── */}
          <div className="inv-bill-grid">
            {/* Left: customer */}
            <div style={{ fontSize: '13px', lineHeight: '1.8' }}>
              <div><strong>Bill To:</strong> {data.customerName || 'Cash Customer'}</div>
              <div><strong>Contact:</strong> {data.customerMobile || 'N/A'}</div>
            </div>
            {/* Right: invoice meta */}
            <div style={{ fontSize: '13px', lineHeight: '1.8', textAlign: 'right' }}>
              <div><strong>Invoice No:</strong> {data.id?.substring(0, 8).toUpperCase() || 'INV-001'}</div>
              <div><strong>Date:</strong> {displayDate}</div>
              <div><strong>Payment:</strong> {data.paymentMethod || 'CASH'}</div>
            </div>
          </div>

          {/* ── Items Table ── */}
          <div className="inv-table-scroll">
            <table style={s.table}>
              <thead>
                <tr style={{ borderBottom: '2px solid #000', borderTop: '2px solid #000' }}>
                  <th style={{ ...s.th, width: '45%', textAlign: 'left' }}>Item Name</th>
                  <th style={{ ...s.th, width: '20%', textAlign: 'right' }}>MRP</th>
                  <th style={{ ...s.th, width: '15%', textAlign: 'center' }}>Qty</th>
                  <th style={{ ...s.th, width: '20%', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {data.saleItems && data.saleItems.map((item, index) => {
                  const itemPrice = getItemPrice(item);
                  const itemTotal = itemPrice * item.quantity;
                  return (
                    <tr key={index}>
                      <td style={s.td}>{item.medicineName || 'Medicine'}</td>
                      <td style={{ ...s.td, textAlign: 'right' }}>₹{itemPrice.toFixed(2)}</td>
                      <td style={{ ...s.td, textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ ...s.td, textAlign: 'right' }}>₹{itemTotal.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Summary ── */}
          <div style={{ marginTop: '16px', borderTop: '2px solid #000', paddingTop: '10px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <tbody>
                <tr>
                  <td style={{ width: '55%' }}></td>
                  <td style={{ textAlign: 'right', padding: '3px 0' }}>Subtotal:</td>
                  <td style={{ textAlign: 'right', padding: '3px 0', paddingLeft: '16px', minWidth: '90px' }}>
                    ₹{data.totalAmount?.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td></td>
                  <td style={{ textAlign: 'right', padding: '3px 0' }}>GST (Incl.):</td>
                  <td style={{ textAlign: 'right', padding: '3px 0', paddingLeft: '16px' }}>
                    ₹{gstIncluded.toFixed(2)}
                  </td>
                </tr>
                {roundOffToShow !== 0 && (
                  <tr>
                    <td></td>
                    <td style={{ textAlign: 'right', padding: '3px 0', color: '#555' }}>Round Off:</td>
                    <td style={{ textAlign: 'right', padding: '3px 0', paddingLeft: '16px', color: '#555' }}>
                      {roundOffToShow >= 0 ? '+' : ''}₹{roundOffToShow.toFixed(2)}
                    </td>
                  </tr>
                )}
                <tr style={{ borderTop: '1px solid #000', fontWeight: 'bold', fontSize: '15px' }}>
                  <td></td>
                  <td style={{ textAlign: 'right', padding: '6px 0' }}>Total Charged:</td>
                  <td style={{ textAlign: 'right', padding: '6px 0', paddingLeft: '16px' }}>
                    ₹{finalAmountToShow?.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>

            <p style={{ fontSize: '10px', marginTop: '20px', textAlign: 'center', fontStyle: 'italic' }}>
              * Computer Generated Invoice
            </p>
          </div>
        </div>
      </div>

      <style>{`
        /* ── Invoice card ── */
        .inv-card {
          background-color: #1e293b;
          padding: 28px;
          border-radius: 12px;
          width: 90%;
          max-width: 700px;
          max-height: 90vh;
          overflow-y: auto;
          box-sizing: border-box;
        }

        /* ── Top bar ── */
        .inv-top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 10px;
        }

        /* ── Bill-to grid: 2-col desktop ── */
        .inv-bill-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 16px;
        }

        /* ── Table scroll for very small screens ── */
        .inv-table-scroll {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        /* ════════════════════════════════
           TABLET  (≤ 640px)
        ════════════════════════════════ */
        @media (max-width: 640px) {
          .inv-card {
            width: 95%;
            padding: 18px 14px;
          }
          .inv-bill-grid {
            grid-template-columns: 1fr;
          }
          .inv-bill-grid > div:last-child {
            text-align: left !important;
          }
        }

        /* ════════════════════════════════
           MOBILE  (≤ 400px)
        ════════════════════════════════ */
        @media (max-width: 400px) {
          .inv-card {
            width: 100%;
            padding: 14px 10px;
            border-radius: 8px;
          }
          .inv-top-bar h2 {
            font-size: 15px !important;
          }
        }

        /* ── Print styles ── */
        @media print {
          body * { visibility: hidden; }
          #printable-invoice, #printable-invoice * { visibility: visible; }
          #printable-invoice {
            position: fixed;
            top: 0; left: 0;
            width: 100%;
            padding: 15mm 15mm;
            box-sizing: border-box;
            background: white !important;
            color: black !important;
            font-family: monospace;
          }
          #printable-invoice table {
            width: 100% !important;
            table-layout: fixed;
          }
          #printable-invoice td, #printable-invoice th {
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          /* Restore bill grid for print */
          .inv-bill-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
          }
          .inv-bill-grid > div:last-child {
            text-align: right !important;
          }
        }
      `}</style>
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  modalOverlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    zIndex: 9999, padding: '12px',
  },
  printArea: {
    backgroundColor: 'white', color: 'black',
    padding: '20px', borderRadius: '4px', fontFamily: 'monospace',
  },
  printBtn: {
    backgroundColor: '#2563eb', color: 'white', border: 'none',
    padding: '8px 16px', borderRadius: '6px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px',
  },
  closeBtn: {
    backgroundColor: '#475569', color: 'white', border: 'none',
    padding: '8px 12px', borderRadius: '6px', cursor: 'pointer',
    display: 'flex', alignItems: 'center',
  },
  table: {
    width: '100%', borderCollapse: 'collapse',
    marginTop: '10px', tableLayout: 'fixed', minWidth: '320px',
  },
  th: { padding: '8px 5px', fontSize: '13px', fontWeight: 'bold' },
  td: { padding: '7px 5px', borderBottom: '1px solid #ddd', fontSize: '12px', wordWrap: 'break-word' },
};

export default Invoice;