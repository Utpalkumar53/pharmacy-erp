import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { Eye, Search, RefreshCw, FileText, Download } from 'lucide-react'; // Added Download icon
import Invoice from './Invoice';

const SalesHistory = () => {
  const [sales, setSales] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState(null);
  const [exporting, setExporting] = useState(false); // New state for export loading

  const fetchSales = async () => {
    try {
      setLoading(true);
      const res = await api.get('/sales'); 
      setSales(res.data || []);
    } catch (err) {
      console.error("Error loading bills", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  // ✅ New Function to trigger Excel Download
  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const response = await api.get('/backup/sales/excel', { responseType: 'blob' });
      
      // Create a link and trigger browser download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Sales_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed", err);
      alert("Failed to generate Excel report. Please check if the server is running.");
    } finally {
      setExporting(false);
    }
  };

  // Filter bills by Customer Name or Mobile Number
  const filteredSales = sales.filter(sale => {
    const name = sale.customerName?.toLowerCase() || '';
    const mobile = sale.customerMobile || '';
    const query = searchQuery.toLowerCase();
    return name.includes(query) || mobile.includes(query);
  });

  if (loading) return <div style={loadingStyle}>Loading Invoices...</div>;

  return (
    <div style={containerStyle}>
      <header style={headerFlex}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FileText size={28} color="#60a5fa" />
          <h1 style={{ color: '#f1f5f9', margin: 0 }}>Sales Invoices & History</h1>
        </div>
        
        {/* ACTION BUTTONS */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={handleExportExcel} 
            style={exportBtn} 
            disabled={exporting || sales.length === 0}
          >
            <Download size={16} /> {exporting ? 'EXPORTING...' : 'EXPORT TO EXCEL'}
          </button>
          
          <button onClick={fetchSales} style={refreshBtn}>
            <RefreshCw size={16} /> REFRESH
          </button>
        </div>
      </header>

      {/* SEARCH BAR */}
      <div style={searchBoxStyle}>
        <Search color="#94a3b8" size={20} />
        <input 
          type="text" 
          placeholder="Search by customer name or mobile number..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          style={inputStyle}
        />
      </div>

      {/* SALES HISTORY TABLE */}
      <div style={tableContainer}>
        <table style={darkTable}>
          <thead>
            <tr style={headerRow}>
              <th style={{ padding: '15px' }}>Date</th>
              <th>Invoice ID</th>
              <th>Customer Name</th>
              <th>Payment Method</th>
              <th style={{ textAlign: 'right' }}>Total Bill</th>
              <th style={{ textAlign: 'center' }}>Invoice</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.length > 0 ? filteredSales.map((sale) => (
              <tr key={sale.id} style={rowStyle}>
                <td style={{ padding: '15px', color: '#94a3b8' }}>
                  {new Date(sale.saleDate).toLocaleDateString('en-IN')} {new Date(sale.saleDate).toLocaleTimeString('en-IN', {hour: '2-digit', minute:'2-digit'})}
                </td>
                <td style={{ fontFamily: 'monospace', color: '#60a5fa' }}>
                  {sale.id?.substring(0, 8).toUpperCase()}
                </td>
                <td style={{ fontWeight: 'bold' }}>{sale.customerName || 'Cash Customer'}</td>
                <td>
                  <span style={{ ...badgeBase, ...getPaymentStyle(sale.paymentMethod) }}>
                    {sale.paymentMethod}
                  </span>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>
                  ₹{sale.totalAmount?.toFixed(2)}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button onClick={() => setSelectedSale(sale)} style={viewBtn}>
                    <Eye size={16} style={{ marginRight: '5px' }} /> View
                  </button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="6" style={emptyStyle}>No matching bills found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL OVERLAY FOR REPRINTING INVOICES */}
      {selectedSale && (
        <Invoice data={selectedSale} onClose={() => setSelectedSale(null)} />
      )}
    </div>
  );
};

// Styling
const getPaymentStyle = (method) => {
  if (method === 'UPI') return { backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid #3b82f6' };
  if (method === 'CREDIT') return { backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24', border: '1px solid #f59e0b' };
  return { backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid #10b981' };
};

const containerStyle = { padding: '40px', backgroundColor: '#0f172a', minHeight: '100vh', marginLeft: '240px' };
const headerFlex = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' };
const refreshBtn = { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#334155', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };

// ✅ New style for Export Button
const exportBtn = { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#10b981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };

const searchBoxStyle = { display: 'flex', alignItems: 'center', backgroundColor: '#1e293b', padding: '15px', borderRadius: '12px', border: '1px solid #334155', marginBottom: '20px' };
const inputStyle = { background: 'none', border: 'none', color: '#f1f5f9', width: '100%', marginLeft: '10px', outline: 'none' };
const tableContainer = { backgroundColor: '#1e293b', padding: '30px', borderRadius: '16px', border: '1px solid #334155' };
const darkTable = { width: '100%', borderCollapse: 'collapse' };
const headerRow = { color: '#94a3b8', fontSize: '13px', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1px solid #334155' };
const rowStyle = { color: '#cbd5e1', borderBottom: '1px solid #334155', fontSize: '14px' };
const badgeBase = { padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' };
const viewBtn = { display: 'inline-flex', alignItems: 'center', backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' };
const loadingStyle = { height: '100vh', backgroundColor: '#0f172a', color: '#60a5fa', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px', marginLeft: '240px' };
const emptyStyle = { padding: '40px', textAlign: 'center', color: '#475569' };

export default SalesHistory;