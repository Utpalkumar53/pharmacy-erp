import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axiosConfig';
import { Search, Trash2, AlertCircle, User, CreditCard, Plus, Minus, Hash } from 'lucide-react';
import Invoice from './Invoice';

const Billing = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [cart, setCart] = useState([]);
  const [isEmergency, setIsEmergency] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [error, setError] = useState('');
  const [lastSale, setLastSale] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [finalAmount, setFinalAmount] = useState('');   // ✅ New
  const [roundOff, setRoundOff] = useState(0);          // ✅ New
  const searchRef = useRef(null);
  const customerRef = useRef(null);

  const subtotal = cart.reduce((s, i) => s + (i.mrp * i.qty), 0);

  // ✅ Auto calculate round off when cart changes
  useEffect(() => {
    const rounded = Math.round(subtotal);
    setFinalAmount(rounded.toString());
    setRoundOff(rounded - subtotal);
  }, [cart]);

  // Medicine search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length > 1) {
        api.get(`/medicines?search=${encodeURIComponent(searchQuery)}`)
          .then(res => {
            setSearchResults(res.data || []);
            setShowDropdown(true);
          })
          .catch(err => {
            console.error("Search Failed", err);
            setSearchResults([]);
            setShowDropdown(false);
          });
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, isEmergency]);

  // Customer search
  useEffect(() => {
    if (selectedCustomer) {
      setCustomerSuggestions([]);
      return;
    }
    const delayDebounceCust = setTimeout(() => {
      if (customerName.trim().length > 1) {
        api.get(`/customers/search?query=${encodeURIComponent(customerName)}`)
          .then(res => {
            const suggestions = res.data || [];
            setCustomerSuggestions(suggestions);
            const exactMatch = suggestions.find(
              cust => cust.name.toLowerCase() === customerName.trim().toLowerCase()
            );
            if (exactMatch) {
              setSelectedCustomer(exactMatch);
              setCustomerMobile(exactMatch.mobile || '');
              setCustomerId(exactMatch.id || '');
              setCustomerSuggestions([]);
            }
          })
          .catch(err => console.error("Customer search failed", err));
      } else {
        setCustomerSuggestions([]);
      }
    }, 200);
    return () => clearTimeout(delayDebounceCust);
  }, [customerName]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      if (customerRef.current && !customerRef.current.contains(e.target)) {
        setCustomerSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCustomer = (cust) => {
    setSelectedCustomer(cust);
    setCustomerName(cust.name);
    setCustomerMobile(cust.mobile || '');
    setCustomerId(cust.id || '');
    setCustomerSuggestions([]);
    setError('');
  };

  const addToCart = (med) => {
    const existing = cart.find(item => item.id === med.id);
    if (existing) {
      setCart(cart.map(item =>
        item.id === med.id ? { ...item, qty: item.qty + 1 } : item
      ));
    } else {
      setCart([...cart, {
        id: med.id, name: med.name, batchNo: med.batchNo,
        mrp: med.mrp, qty: 1, expiry: med.expiryDate,
        maxStock: med.stockQuantity
      }]);
    }
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  const increaseQty = (id) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        if (item.qty >= item.maxStock) {
          alert(`Only ${item.maxStock} units available in stock!`);
          return item;
        }
        return { ...item, qty: item.qty + 1 };
      }
      return item;
    }));
  };

  const decreaseQty = (id) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        if (item.qty <= 1) return item;
        return { ...item, qty: item.qty - 1 };
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(i => i.id !== id));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!finalAmount) {
      setError('Please enter final amount to charge.');
      return;
    }
    setError('');

    if (paymentMethod === 'CREDIT' && !customerId.trim()) {
      setError('Customer ID is required for Store Credit (Udhaar) sales.');
      return;
    }

    const parsedFinal = parseFloat(finalAmount);
    const saleRequest = {
      customerName, customerMobile, paymentMethod,
      saleItems: cart.map(item => ({
        medicineId: item.id,
        batchNo: item.batchNo,
        quantity: item.qty
      })),
      emergencySale: isEmergency,
      finalAmount: parsedFinal,                  // ✅ What cashier charged
      roundOff: parsedFinal - subtotal,          // ✅ Difference tracked
      ...(paymentMethod === 'CREDIT' && {
        customerId: customerId.trim()
      })
    };

    try {
      const response = await api.post('/sales', saleRequest);
      setLastSale({
        ...response.data,
        finalAmount: parsedFinal,               // ✅ Pass to invoice
        roundOff: parsedFinal - subtotal
      });
      setCart([]);
      setCustomerName('');
      setCustomerMobile('');
      setCustomerId('');
      setFinalAmount('');
      setRoundOff(0);
      setSelectedCustomer(null);
    } catch (err) {
      setError(err.response?.data?.message || "Checkout failed. Check stock.");
    }
  };

  const isCreditSale = paymentMethod === 'CREDIT';

  return (
    <div style={containerStyle}>
      <header style={headerFlex}>
        <h1 style={{ color: '#f1f5f9', margin: 0 }}>Billing Terminal</h1>
        <div onClick={() => setIsEmergency(!isEmergency)} style={emergencyToggle(isEmergency)}>
          <AlertCircle size={18} />
          {isEmergency ? "EXPIRY OVERRIDE ON" : "STRICT MODE"}
        </div>
      </header>

      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: 2 }}>

          {/* Customer + Payment */}
          <div style={customerSection}>
            <div style={{ ...inputGroup, position: 'relative' }} ref={customerRef}>
              <User size={16} color="#94a3b8" />
              <input
                placeholder="Customer Name"
                value={customerName}
                onChange={e => {
                  setCustomerName(e.target.value);
                  if (selectedCustomer) setSelectedCustomer(null);
                }}
                style={cleanInput}
              />
              {selectedCustomer && (
                <span style={linkedBadgeStyle}>Linked ✔</span>
              )}
              {customerSuggestions.length > 0 && (
                <div style={resultsDropdown}>
                  {customerSuggestions.map(cust => (
                    <div key={cust.id} onMouseDown={() => handleSelectCustomer(cust)}
                      style={customerSuggestItem}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{cust.name}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                          {cust.mobile || 'No Mobile'}
                        </div>
                      </div>
                      <span style={{ color: '#fbbf24', fontSize: '12px', fontWeight: 'bold' }}>
                        Balance: ₹{cust.outstandingBalance?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={inputGroup}>
              <CreditCard size={16} color="#94a3b8" />
              <select value={paymentMethod}
                onChange={e => { setPaymentMethod(e.target.value); setError(''); }}
                style={{ ...cleanInput, backgroundColor: '#1e293b', color: 'white' }}>
                <option value="CASH" style={{ color: 'white', backgroundColor: '#0f172a' }}>Cash Payment</option>
                <option value="UPI" style={{ color: 'white', backgroundColor: '#0f172a' }}>UPI / QR Scanner</option>
                <option value="CARD" style={{ color: 'white', backgroundColor: '#0f172a' }}>Debit/Credit Card</option>
                <option value="CREDIT" style={{ color: 'white', backgroundColor: '#0f172a' }}>Store Credit (Udhaar)</option>
              </select>
            </div>
          </div>

          {/* Udhaar Customer ID */}
          {isCreditSale && (
            <div style={{ ...inputGroup, marginBottom: '20px', border: '1px solid #f59e0b' }}>
              <Hash size={16} color="#f59e0b" />
              <input
                placeholder="Customer ID (required for Udhaar)"
                value={customerId}
                onChange={e => setCustomerId(e.target.value)}
                style={{ ...cleanInput, color: '#fef3c7' }}
              />
            </div>
          )}

          {/* Medicine Search */}
          <div style={searchBoxStyle} ref={searchRef}>
            <Search color="#94a3b8" size={20} />
            <input
              type="text"
              placeholder="Type medicine name (e.g. Azi, Dolo, Para)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
              style={inputStyle}
            />
            {showDropdown && searchResults.length > 0 && (
              <div style={resultsDropdown}>
                {searchResults.map(med => (
                  <div key={med.id}
                    onMouseDown={(e) => { e.preventDefault(); addToCart(med); }}
                    style={resultItemStyle}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#334155'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{med.name}</div>
                      <div style={{ fontSize: '11px', color: med.stockQuantity < 20 ? '#ef4444' : '#94a3b8' }}>
                        Batch: {med.batchNo} | Exp: {med.expiryDate ?
                          new Date(med.expiryDate).toLocaleDateString('en-IN') : 'N/A'}
                        | Stock: {med.stockQuantity}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ color: '#10b981', fontWeight: 'bold' }}>₹{med.mrp}</div>
                      <div style={{ fontSize: '10px', color: med.stockQuantity < 10 ? '#ef4444' : '#94a3b8' }}>
                        {med.stockQuantity < 10 ? 'LOW STOCK' : 'In stock'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {showDropdown && searchQuery.length > 1 && searchResults.length === 0 && (
              <div style={{ ...resultsDropdown, padding: '15px', color: '#94a3b8', fontSize: '13px' }}>
                No medicine found for "{searchQuery}"
              </div>
            )}
          </div>

          {/* Cart Table */}
          <div style={panelStyle}>
            <table style={tableStyle}>
              <thead>
                <tr style={tableHeader}>
                  <th style={{ padding: '10px 0' }}>Item</th>
                  <th>Batch</th>
                  <th>MRP</th>
                  <th>Qty</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#475569', fontSize: '13px' }}>
                      Search and add medicines above
                    </td>
                  </tr>
                ) : (
                  cart.map(item => (
                    <tr key={item.id} style={tableRow}>
                      <td style={{ padding: '12px 0' }}>{item.name}</td>
                      <td>{item.batchNo}</td>
                      <td>₹{item.mrp}</td>
                      <td>
                        <div style={qtyControls}>
                          <button onClick={() => decreaseQty(item.id)} style={qtyBtn} disabled={item.qty <= 1}>
                            <Minus size={12} />
                          </button>
                          <span style={{ minWidth: '28px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', color: '#f1f5f9' }}>
                            {item.qty}
                          </span>
                          <button onClick={() => increaseQty(item.id)} style={qtyBtn} disabled={item.qty >= item.maxStock}>
                            <Plus size={12} />
                          </button>
                        </div>
                      </td>
                      <td style={{ color: '#10b981', fontWeight: 'bold' }}>
                        ₹{(item.mrp * item.qty).toFixed(2)}
                      </td>
                      <td>
                        <Trash2 size={16} onClick={() => removeFromCart(item.id)}
                          style={{ cursor: 'pointer', color: '#ef4444' }} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bill Summary */}
        <div style={summaryPanel}>
          <h3 style={{ color: '#60a5fa', marginTop: 0 }}>Bill Summary</h3>

          <div style={summaryRow}>
            <span style={{ color: '#94a3b8' }}>Items</span>
            <span>{cart.reduce((s, i) => s + i.qty, 0)}</span>
          </div>
          <div style={summaryRow}>
            <span style={{ color: '#94a3b8' }}>Calculated Total</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>

          {/* ✅ Round Off */}
          <div style={summaryRow}>
            <span style={{ color: '#94a3b8' }}>ADD/LESS</span>
            <span style={{ color: roundOff >= 0 ? '#10b981' : '#ef4444' }}>
              {roundOff >= 0 ? '+' : ''}₹{roundOff.toFixed(2)}
            </span>
          </div>

          {/* ✅ Final Amount - Editable */}
          <div style={{
            borderTop: '1px solid #334155',
            paddingTop: '12px',
            marginTop: '10px'
          }}>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
              Final Amount Charged (editable)
            </div>
            <input
              type="number"
              value={finalAmount}
              onChange={e => {
                setFinalAmount(e.target.value);
                setRoundOff(parseFloat(e.target.value || 0) - subtotal);
              }}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#0f172a',
                border: '2px solid #10b981',
                borderRadius: '8px',
                color: '#10b981',
                fontSize: '20px',
                fontWeight: 'bold',
                outline: 'none',
                boxSizing: 'border-box',
                textAlign: 'right'
              }}
            />
            <div style={{ fontSize: '10px', color: '#475569', marginTop: '4px', textAlign: 'right' }}>
              Cashier can adjust this amount
            </div>
          </div>

          {isCreditSale && (
            <div style={{
              marginTop: '12px', padding: '10px',
              backgroundColor: '#451a03', borderRadius: '8px',
              border: '1px solid #f59e0b', fontSize: '12px', color: '#fcd34d'
            }}>
              ⚠️ Udhaar Sale — Customer ID required
            </div>
          )}

          <button
            style={cart.length > 0 && finalAmount ? checkoutBtn : disabledBtn}
            onClick={handleCheckout}
            disabled={cart.length === 0 || !finalAmount}
          >
            PRINT INVOICE
          </button>

          {cart.length > 0 && (
            <button
              onClick={() => {
                setCart([]);
                setError('');
                setCustomerId('');
                setFinalAmount('');
                setRoundOff(0);
              }}
              style={{
                width: '100%', marginTop: '10px',
                backgroundColor: 'transparent', color: '#ef4444',
                border: '1px solid #ef4444', padding: '10px',
                borderRadius: '8px', cursor: 'pointer', fontSize: '13px'
              }}
            >
              Clear Cart
            </button>
          )}

          {error && (
            <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '10px' }}>
              {error}
            </p>
          )}
        </div>
      </div>

      {lastSale && <Invoice data={lastSale} onClose={() => setLastSale(null)} />}
    </div>
  );
};

// --- STYLES ---
const containerStyle = { padding: '40px', backgroundColor: '#0f172a', minHeight: '100vh', marginLeft: '240px' };
const headerFlex = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' };
const emergencyToggle = (active) => ({ padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', border: `2px solid ${active ? '#f59e0b' : '#334155'}`, color: active ? '#f59e0b' : '#94a3b8' });
const customerSection = { display: 'flex', gap: '15px', marginBottom: '20px' };
const inputGroup = { flex: 1, display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#1e293b', padding: '10px', borderRadius: '8px', border: '1px solid #334155' };
const cleanInput = { background: 'none', border: 'none', color: 'white', width: '100%', outline: 'none', cursor: 'pointer' };
const searchBoxStyle = { position: 'relative', display: 'flex', alignItems: 'center', backgroundColor: '#1e293b', padding: '15px', borderRadius: '12px', border: '1px solid #334155', marginBottom: '20px' };
const inputStyle = { background: 'none', border: 'none', color: '#f1f5f9', width: '100%', marginLeft: '10px', outline: 'none', fontSize: '14px' };
const resultsDropdown = { position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', zIndex: 1000, maxHeight: '300px', overflowY: 'auto' };
const resultItemStyle = { padding: '12px 15px', cursor: 'pointer', borderBottom: '1px solid #334155', color: '#f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.1s' };
const panelStyle = { backgroundColor: '#1e293b', borderRadius: '16px', padding: '20px', border: '1px solid #334155' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const tableHeader = { color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1px solid #334155' };
const tableRow = { color: '#cbd5e1', borderBottom: '1px solid #334155', fontSize: '13px' };
const qtyControls = { display: 'flex', alignItems: 'center', gap: '8px' };
const qtyBtn = { width: '26px', height: '26px', borderRadius: '6px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 };
const summaryPanel = { flex: 1, backgroundColor: '#1e293b', borderRadius: '16px', padding: '30px', border: '1px solid #334155', height: 'fit-content' };
const summaryRow = { display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', marginBottom: '10px' };
const checkoutBtn = { width: '100%', marginTop: '20px', backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '15px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' };
const disabledBtn = { ...checkoutBtn, backgroundColor: '#334155', cursor: 'not-allowed' };
const linkedBadgeStyle = { backgroundColor: 'rgba(16,185,129,0.2)', color: '#34d399', fontSize: '11px', padding: '4px 8px', borderRadius: '4px', whiteSpace: 'nowrap', fontWeight: 'bold' };
const customerSuggestItem = { padding: '12px 15px', cursor: 'pointer', borderBottom: '1px solid #334155', color: '#f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };

export default Billing;

