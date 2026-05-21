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
    <div style={modalOverlay}>
      <div style={invoiceCard}>

        {/* Buttons */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ color: '#60a5fa', margin: 0 }}>Invoice Generated</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handlePrint} style={actionBtn('#2563eb')}>
              <Printer size={18} /> Print
            </button>
            <button onClick={onClose} style={actionBtn('#475569')}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div id="printable-invoice" style={printArea}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '16px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
            <h1 style={{ margin: '0 0 4px 0', fontSize: '20px', textTransform: 'uppercase', letterSpacing: '2px' }}>
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

          {/* Bill To + Invoice Info */}
          <table style={{ width: '100%', marginBottom: '16px', fontSize: '13px', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ verticalAlign: 'top', width: '50%', padding: '2px 0' }}>
                  <strong>Bill To:</strong> {data.customerName || 'Cash Customer'}
                </td>
                <td style={{ verticalAlign: 'top', textAlign: 'right', padding: '2px 0' }}>
                  <strong>Invoice No:</strong> {data.id?.substring(0, 8).toUpperCase() || 'INV-001'}
                </td>
              </tr>
              <tr>
                <td style={{ verticalAlign: 'top', padding: '2px 0' }}>
                  <strong>Contact:</strong> {data.customerMobile || 'N/A'}
                </td>
                <td style={{ verticalAlign: 'top', textAlign: 'right', padding: '2px 0' }}>
                  {/* ✅ FIX 2: Shows actual billing date, handles old/corrupt dates */}
                  <strong>Date:</strong> {displayDate}
                </td>
              </tr>
              <tr>
                <td></td>
                <td style={{ verticalAlign: 'top', textAlign: 'right', padding: '2px 0' }}>
                  <strong>Payment:</strong> {data.paymentMethod || 'CASH'}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Items Table */}
          <table style={tableStyle}>
            <thead>
              <tr style={{ borderBottom: '2px solid #000', borderTop: '2px solid #000' }}>
                <th style={{ ...th, width: '45%' }}>Item Name</th>
                <th style={{ ...th, textAlign: 'right', width: '20%' }}>MRP</th>
                <th style={{ ...th, textAlign: 'center', width: '15%' }}>Qty</th>
                <th style={{ ...th, textAlign: 'right', width: '20%' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {data.saleItems && data.saleItems.map((item, index) => {
                const itemPrice = getItemPrice(item);
                const itemTotal = itemPrice * item.quantity;
                return (
                  <tr key={index}>
                    <td style={td}>{item.medicineName || 'Medicine'}</td>
                    <td style={{ ...td, textAlign: 'right' }}>₹{itemPrice.toFixed(2)}</td>
                    <td style={{ ...td, textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ ...td, textAlign: 'right' }}>₹{itemTotal.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Summary */}
          <div style={{ marginTop: '16px', borderTop: '2px solid #000', paddingTop: '10px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <tbody>
                <tr>
                  <td style={{ width: '60%' }}></td>
                  <td style={{ textAlign: 'right', padding: '3px 0' }}>Subtotal:</td>
                  <td style={{ textAlign: 'right', padding: '3px 0', paddingLeft: '20px', width: '100px' }}>
                    ₹{data.totalAmount?.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td></td>
                  <td style={{ textAlign: 'right', padding: '3px 0' }}>GST (Incl.):</td>
                  <td style={{ textAlign: 'right', padding: '3px 0', paddingLeft: '20px' }}>
                    ₹{gstIncluded.toFixed(2)}
                  </td>
                </tr>

                {roundOffToShow !== 0 && (
                  <tr>
                    <td></td>
                    <td style={{ textAlign: 'right', padding: '3px 0', color: '#555' }}>Round Off:</td>
                    <td style={{ textAlign: 'right', padding: '3px 0', paddingLeft: '20px', color: '#555' }}>
                      {roundOffToShow >= 0 ? '+' : ''}₹{roundOffToShow.toFixed(2)}
                    </td>
                  </tr>
                )}

                {/* ✅ FIX 1: Now correctly shows totalAmount for old bills where finalAmount=0 */}
                <tr style={{ borderTop: '1px solid #000', fontWeight: 'bold', fontSize: '16px' }}>
                  <td></td>
                  <td style={{ textAlign: 'right', padding: '6px 0' }}>Total Charged:</td>
                  <td style={{ textAlign: 'right', padding: '6px 0', paddingLeft: '20px' }}>
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
        }
      `}</style>
    </div>
  );
};

const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 };
const invoiceCard = { backgroundColor: '#1e293b', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' };
const printArea = { backgroundColor: 'white', color: 'black', padding: '24px', borderRadius: '4px', fontFamily: 'monospace' };
const actionBtn = (bg) => ({ backgroundColor: bg, color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' });
const tableStyle = { width: '100%', borderCollapse: 'collapse', marginTop: '10px', tableLayout: 'fixed' };
const th = { textAlign: 'left', padding: '8px 5px', fontSize: '13px', fontWeight: 'bold' };
const td = { padding: '7px 5px', borderBottom: '1px solid #ddd', fontSize: '12px', wordWrap: 'break-word' };

export default Invoice;