import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { Users, Search, RefreshCw, CheckCircle, UserPlus, Phone } from 'lucide-react';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [activeCustomer, setActiveCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  // States for Registering New Customer
  const [newCustName, setNewCustName] = useState('');
  const [newCustMobile, setNewCustMobile] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customers');
      setCustomers(res.data || []);
    } catch (err) {
      console.error("Error loading customers", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleRegisterCustomer = async (e) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    try {
      await api.post('/customers', {
        name: newCustName,
        mobile: newCustMobile,
        outstandingBalance: 0.0
      });
      setNewCustName('');
      setNewCustMobile('');
      setSuccessMsg('Customer registered successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchCustomers();
    } catch (err) {
      console.error("Failed to register customer", err);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!activeCustomer || !paymentAmount || parseFloat(paymentAmount) <= 0) return;

    try {
      await api.put(`/customers/${activeCustomer.id}/pay?amountPaid=${paymentAmount}`);
      setPaymentAmount('');
      setActiveCustomer(null);
      fetchCustomers();
    } catch (err) {
      console.error("Failed to record payment", err);
    }
  };

  const filteredCustomers = customers.filter(cust => {
    const name = cust.name?.toLowerCase() || '';
    const mobile = cust.mobile || '';
    return name.includes(searchQuery.toLowerCase()) || mobile.includes(searchQuery);
  });

  if (loading) return <div style={loadingStyle}>Loading Credit Ledger...</div>;

  return (
    <div style={containerStyle}>
      <header style={headerFlex}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Users size={28} color="#60a5fa" />
          <h1 style={{ color: '#f1f5f9', margin: 0 }}>Credit Customers (Udhaar)</h1>
        </div>
        <button onClick={fetchCustomers} style={refreshBtn}><RefreshCw size={16} /></button>
      </header>

      {/* SEARCH BAR */}
      <div style={searchBoxStyle}>
        <Search color="#94a3b8" size={20} />
        <input 
          type="text" 
          placeholder="Search credit profiles by name or phone..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          style={inputStyle}
        />
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        
        {/* LEFT COLUMN: REGISTER NEW CUSTOMER FORM */}
        <div style={formCard}>
          <h3 style={{ color: '#60a5fa', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={20} /> Register Credit Profile
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '20px' }}>
            Add permanent accounts here to authorize them for Store Credit (Udhaar) at the billing counter.
          </p>

          <form onSubmit={handleRegisterCustomer}>
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Full Name</label>
              <div style={inputWithIcon}>
                <Users size={16} color="#94a3b8" />
                <input 
                  required 
                  type="text" 
                  placeholder="e.g. Ramesh Kumar" 
                  value={newCustName} 
                  onChange={e => setNewCustName(e.target.value)} 
                  style={formInput} 
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Mobile Number</label>
              <div style={inputWithIcon}>
                <Phone size={16} color="#94a3b8" />
                <input 
                  type="text" 
                  placeholder="e.g. 98011XXXXX" 
                  value={newCustMobile} 
                  onChange={e => setNewCustMobile(e.target.value)} 
                  style={formInput} 
                />
              </div>
            </div>

            <button type="submit" style={submitRegisterBtn}>REGISTER CUSTOMER</button>

            {successMsg && (
              <div style={successAlert}>
                <CheckCircle size={14} /> {successMsg}
              </div>
            )}
          </form>
        </div>

        {/* MIDDLE COLUMN: CUSTOMER LIST TABLE */}
        <div style={{ ...tableContainer, flex: 2 }}>
          <table style={darkTable}>
            <thead>
              <tr style={headerRow}>
                <th style={{ padding: '15px' }}>Customer Name</th>
                <th>Mobile Number</th>
                <th style={{ textAlign: 'right' }}>Outstanding Balance</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length > 0 ? filteredCustomers.map((cust) => (
                <tr key={cust.id} style={rowStyle}>
                  <td style={{ padding: '15px', fontWeight: 'bold' }}>{cust.name}</td>
                  <td style={{ color: '#94a3b8' }}>{cust.mobile || 'No Mobile'}</td>
                  <td style={{ 
                    textAlign: 'right', 
                    fontWeight: 'bold', 
                    color: cust.outstandingBalance > 0 ? '#ef4444' : '#10b981' 
                  }}>
                    ₹{cust.outstandingBalance?.toFixed(2) || '0.00'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {cust.outstandingBalance > 0 ? (
                      <button onClick={() => setActiveCustomer(cust)} style={payBtn}>
                        Record Payment
                      </button>
                    ) : (
                      <span style={{ color: '#10b981', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <CheckCircle size={14} /> Settled
                      </span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: '#475569' }}>
                    No credit customer accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* RIGHT COLUMN: PAYMENT COLLECTION PANEL */}
        {activeCustomer && (
          <div style={paymentFormPanel}>
            <h3 style={{ color: '#fbbf24', marginTop: 0 }}>Record Collection</h3>
            <p style={{ color: '#cbd5e1', fontSize: '14px' }}>
              Customer: <strong>{activeCustomer.name}</strong>
            </p>
            <p style={{ color: '#cbd5e1', fontSize: '14px', marginBottom: '20px' }}>
              Current Balance: <strong style={{ color: '#ef4444' }}>₹{activeCustomer.outstandingBalance?.toFixed(2)}</strong>
            </p>

            <form onSubmit={handlePayment}>
              <div style={{ marginBottom: '15px' }}>
                <label style={labelStyle}>Amount Received (₹)</label>
                <div style={inputWithIcon}>
                  <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>₹</span>
                  <input 
                    required 
                    type="number" 
                    step="0.01" 
                    max={activeCustomer.outstandingBalance} 
                    placeholder="Enter collected amount" 
                    value={paymentAmount} 
                    onChange={e => setPaymentAmount(e.target.value)} 
                    style={formInput} 
                  />
                </div>
              </div>
              <button type="submit" style={submitPaymentBtn}>RECORD TRANSACTION</button>
              <button type="button" onClick={() => setActiveCustomer(null)} style={cancelBtn}>CANCEL</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

// Styles
const containerStyle = { padding: '40px', backgroundColor: '#0f172a', minHeight: '100vh', marginLeft: '240px' };
const headerFlex = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' };
const refreshBtn = { backgroundColor: '#334155', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer' };
const searchBoxStyle = { display: 'flex', alignItems: 'center', backgroundColor: '#1e293b', padding: '15px', borderRadius: '12px', border: '1px solid #334155', marginBottom: '20px' };
const inputStyle = { background: 'none', border: 'none', color: '#f1f5f9', width: '100%', marginLeft: '10px', outline: 'none' };

// Dedicated form card style
const formCard = { flex: 1, backgroundColor: '#1e293b', padding: '25px', borderRadius: '16px', border: '1px solid #334155', height: 'fit-content' };
const submitRegisterBtn = { width: '100%', padding: '12px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', transition: 'background 0.2s' };
const successAlert = { display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '10px', borderRadius: '8px', marginTop: '12px', fontSize: '12px' };

const tableContainer = { backgroundColor: '#1e293b', padding: '30px', borderRadius: '16px', border: '1px solid #334155', height: 'fit-content' };
const darkTable = { width: '100%', borderCollapse: 'collapse' };
const headerRow = { color: '#94a3b8', fontSize: '13px', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1px solid #334155' };
const rowStyle = { color: '#cbd5e1', borderBottom: '1px solid #334155', fontSize: '14px' };
const payBtn = { backgroundColor: '#fbbf24', color: '#0f172a', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' };

const paymentFormPanel = { flex: 1, backgroundColor: '#1e293b', padding: '30px', borderRadius: '16px', border: '1px solid #334155', height: 'fit-content' };
const labelStyle = { color: '#94a3b8', fontSize: '12px', display: 'block', marginBottom: '6px' };
const inputWithIcon = { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px' };
const formInput = { background: 'none', border: 'none', color: 'white', width: '100%', outline: 'none' };
const submitPaymentBtn = { width: '100%', padding: '12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' };
const cancelBtn = { width: '100%', padding: '10px', backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer', marginTop: '8px', fontSize: '13px' };
const loadingStyle = { height: '100vh', backgroundColor: '#0f172a', color: '#60a5fa', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px', marginLeft: '240px' };

export default Customers;