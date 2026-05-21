import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axiosConfig';
import {
  ShoppingCart, Plus, Save, Search,
  Package, CheckCircle, AlertCircle, ChevronDown, X
} from 'lucide-react';

const emptyItem = {
  medicineName: '',
  batchNo: '',
  expiryDate: '',
  quantity: '',
  unitCostPrice: '',
  sellingPrice: '',
  gstPercentage: '',
  hsnCode: '',
  rackNumber: '',
  category: '',
};

const Purchase = () => {
  const [supplierName, setSupplierName]     = useState('');
  const [supplierPhone, setSupplierPhone]   = useState('');
  const [supplierEmail, setSupplierEmail]   = useState('');
  const [invoiceNumber, setInvoiceNumber]   = useState('');
  const [purchaseDate, setPurchaseDate]     = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems]                   = useState([{ ...emptyItem }]);
  const [msg, setMsg]                       = useState({ text: '', type: '' });
  const [loading, setLoading]               = useState(false);
  const [history, setHistory]               = useState([]);
  const [activeTab, setActiveTab]           = useState('new');
  const [searchTerm, setSearchTerm]         = useState('');
  const [expandedRow, setExpandedRow]       = useState(null);

  const [allMedicines, setAllMedicines] = useState([]);
  const [showMedSuggestions, setShowMedSuggestions] = useState(null); // stores row index
  const medSuggestionRef = useRef(null);
  // Supplier autocomplete
  const [allSuppliers, setAllSuppliers]     = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoosePurchase, setIsLoosePurchase] = useState(false);
  const suggestionRef                       = useRef(null);

  useEffect(() => {
    fetchSuppliers();
    fetchMedicines();
  }, []);

  useEffect(() => {
    if (activeTab === 'history') fetchHistory();
  }, [activeTab]);

  // Close suggestions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/suppliers');
      setAllSuppliers(Array.isArray(res.data) ? res.data : []);
    } catch {
      setAllSuppliers([]);
    }
  };

  const fetchMedicines = async () => {
    try {
        const res = await api.get('/medicines');
        setAllMedicines(Array.isArray(res.data) ? res.data : []);
    } catch {
        setAllMedicines([]);
    }
  };
  const fetchHistory = async () => {
    try {
      const res = await api.get('/purchases/history');
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch {
      setHistory([]);
    }
  };

  const handleItemChange = (index, field, value) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const addRow = () => setItems(prev => [...prev, { ...emptyItem }]);

  const removeRow = (index) => {
    if (items.length === 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const calcLineTotal = (item) => {
    const qty   = parseFloat(item.quantity)      || 0;
    const price = parseFloat(item.unitCostPrice) || 0;
    const gst   = parseFloat(item.gstPercentage) || 0;
    return qty * price * (1 + gst / 100);
  };

  const calcGrandTotal = () => items.reduce((sum, it) => sum + calcLineTotal(it), 0);

  const handleSubmit = async () => {
    if (!supplierName.trim())
      return showMsg('Supplier name required.', 'error');

    // Require Phone/Email only for regular (non-loose) purchases
  if (!supplierName.trim())
  return showMsg('Supplier name required.', 'error');

  if (items.some(it => !it.medicineName || !it.quantity || !it.unitCostPrice))
  return showMsg('Fill medicine name, quantity and cost price for all rows.', 'error');
    setLoading(true);
    try {
      const payload = {
        supplierName,
        supplierPhone: supplierPhone || 'N/A',
        supplierEmail: supplierEmail || 'N/A',
        isLoosePurchase,
        invoiceNumber,
        purchaseDate: purchaseDate + 'T00:00:00',
        items: items.map(it => {
          const qty   = parseInt(it.quantity)        || 0;
          const price = parseFloat(it.unitCostPrice) || 0;
          const gst   = parseFloat(it.gstPercentage) || 0;
          const tax   = qty * price * (gst / 100);
          return {
            medicineName:  it.medicineName,
            batchNo:       it.batchNo,
            expiryDate:    it.expiryDate || null,
            quantity:      qty,
            unitCostPrice: price,
            sellingPrice:  parseFloat(it.sellingPrice) || 0,
            gstPercentage: gst,
            hsnCode:       it.hsnCode || '',
            rackNumber:    it.rackNumber || 'N/A',
            category:      it.category || 'Tablet',
            taxAmount:     Math.round(tax * 100) / 100,
            lineTotal:     Math.round((qty * price + tax) * 100) / 100,
          };
        }),
      };

      // Backend should call SupplierService.getOrCreateSupplierByName
      await api.post('/purchases/receive', payload);
      showMsg('Stock received & Supplier updated!', 'success');

      // Reset form
      setSupplierName('');
      setSupplierPhone('');
      setSupplierEmail('');
      setInvoiceNumber('');
      setIsLoosePurchase(false);
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setItems([{ ...emptyItem }]);
    } catch {
      showMsg('Failed to save purchase. Check server connection.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (text, type) => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 4000);
  };

  const filteredSuppliers = supplierName
  ? allSuppliers.filter(su =>
      su.name?.toLowerCase().includes(supplierName.toLowerCase())
    )
  : allSuppliers;

  const filtered = history.filter(h =>
    (h.supplierName  || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (h.invoiceNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={s.page}>

      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.h1}>Purchase & GRN</h1>
          <p style={s.subtitle}>Goods Receipt Note — receive stock from suppliers</p>
        </div>
        <div style={s.tabs}>
          <button style={activeTab === 'new' ? s.tabActive : s.tab} onClick={() => setActiveTab('new')}>
            <Plus size={15}/> New GRN
          </button>
          <button style={activeTab === 'history' ? s.tabActive : s.tab} onClick={() => setActiveTab('history')}>
            <Package size={15}/> Purchase History
          </button>
        </div>
      </div>

      {/* Toast */}
      {msg.text && (
        <div style={{ ...s.toast, ...(msg.type === 'success' ? s.toastSuccess : s.toastError) }}>
          {msg.type === 'success' ? <CheckCircle size={16}/> : <AlertCircle size={16}/>}
          {msg.text}
        </div>
      )}

      {/* ══ NEW GRN FORM ══ */}
      {activeTab === 'new' && (
        <>
          {/* Supplier Details */}
          <div style={s.card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ ...s.cardTitle, marginBottom: 0 }}>
                <ShoppingCart size={17} color="#60a5fa"/>
                Supplier Details
              </div>

              {/* Loose Purchase Toggle */}
              <label style={s.toggleLabel}>
                <div
                  style={{ ...s.toggleTrack, backgroundColor: isLoosePurchase ? '#2563eb' : '#334155' }}
                  onClick={() => setIsLoosePurchase(v => !v)}
                >
                  <div style={{ ...s.toggleThumb, transform: isLoosePurchase ? 'translateX(18px)' : 'translateX(2px)' }}/>
                </div>
                <span style={{ color: isLoosePurchase ? '#60a5fa' : '#94a3b8', fontSize: '13px', fontWeight: '500' }}>
                  Loose / Cash Purchase
                </span>
              </label>
            </div>

            {isLoosePurchase && (
              <div style={s.looseBanner}>
                ⚡ Loose / Cash purchase — enter supplier phone & email.
              </div>
            )}

            <div style={s.row3}>
              {/* Supplier Name with Autocomplete */}
              <div style={{ ...s.fieldGroup, position: 'relative' }} ref={suggestionRef}>
                <label style={s.label}>Supplier Name *</label>
                <input
                  style={s.input}
                  placeholder="e.g. MedLine Distributors"
                  value={supplierName}
                  onChange={e => { setSupplierName(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                />
                {showSuggestions && filteredSuppliers.length > 0 && (
                <div style={s.suggestionsBox}>
                  {filteredSuppliers.map(su => (
                    <div
                      key={su.id}
                      style={s.suggestionItem}
                      onMouseDown={() => {
                        setSupplierName(su.name);
                        setSupplierPhone(su.contactPhone || '');
                        setSupplierEmail(su.email || '');
                        setShowSuggestions(false);
                      }}
                    >
                      <span style={{ color: 'white', fontWeight: '500' }}>{su.name}</span>
                      {su.contactPhone && (
                        <span style={{ color: '#94a3b8', fontSize: '11px', marginLeft: '8px' }}>
                          {su.contactPhone}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                )}
              </div>

              <div style={s.fieldGroup}>
                <label style={s.label}>Invoice Number</label>
                <input
                  style={s.input}
                  placeholder="e.g. INV-20240501"
                  value={invoiceNumber}
                  onChange={e => setInvoiceNumber(e.target.value)}
                />
              </div>
              <div style={s.fieldGroup}>
                <label style={s.label}>Purchase Date</label>
                <input
                  style={s.input}
                  type="date"
                  value={purchaseDate}
                  onChange={e => setPurchaseDate(e.target.value)}
                />
              </div>
            </div>

            {/* Phone & Email — hidden in loose mode */}
            {isLoosePurchase && (
              <div style={{ ...s.row3, marginTop: '16px' }}>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Supplier Phone *</label>
                  <input
                    style={s.input}
                    placeholder="91XXXXXXXXXX"
                    value={supplierPhone}
                    onChange={e => setSupplierPhone(e.target.value)}
                  />
                </div>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Supplier Email *</label>
                  <input
                    style={s.input}
                    placeholder="supplier@example.com"
                    value={supplierEmail}
                    onChange={e => setSupplierEmail(e.target.value)}
                  />
                </div>
                <div/>{/* spacer */}
              </div>
            )}
          </div>

          {/* Medicine Items */}
          <div style={s.card}>
            <div style={{ ...s.cardTitle, marginBottom: '16px' }}>
              <Package size={17} color="#60a5fa"/>
              Medicine Items
              <span style={s.countBadge}>{items.length} item{items.length !== 1 ? 's' : ''}</span>
            </div>

            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>
                    {['Name', 'Batch', 'Expiry', 'HSN', 'Rack', 'Cat.', 'Qty', 'Cost', 'MRP', 'GST', 'Total', ''].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} style={s.tr}>
                      <td style={{ ...s.td, position: 'relative' }}>
                          <input
                              style={{ ...s.cellInput, width: '130px' }}
                              placeholder="Name *"
                              value={item.medicineName}
                              onChange={e => {
                                  handleItemChange(i, 'medicineName', e.target.value);
                                  setShowMedSuggestions(i);
                              }}
                              onFocus={() => setShowMedSuggestions(i)}
                              onBlur={() => setTimeout(() => setShowMedSuggestions(null), 150)}
                          />
                          {showMedSuggestions === i && (
                              <div style={{
                                  position: 'absolute', top: '100%', left: 0, zIndex: 999,
                                  backgroundColor: '#1e293b', border: '1px solid #334155',
                                  borderRadius: '8px', minWidth: '220px', maxHeight: '180px',
                                  overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                              }}>
                                  {allMedicines
                                      .filter(m => m.name?.toLowerCase().includes(
                                          (item.medicineName || '').toLowerCase()
                                      ))
                                      .slice(0, 8)
                                      .map((m, idx) => (
                                          <div
                                              key={idx}
                                              onMouseDown={() => {
                                                  // Auto-fill all known fields from inventory
                                                  handleItemChange(i, 'medicineName', m.name);
                                                  handleItemChange(i, 'hsnCode', m.hsnCode || '');
                                                  handleItemChange(i, 'rackNumber', m.rackLocation || '');
                                                  handleItemChange(i, 'category', m.category || '');
                                                  handleItemChange(i, 'sellingPrice', m.mrp || '');
                                                  handleItemChange(i, 'gstPercentage', m.gstPercentage || 12);
                                                  setShowMedSuggestions(null);
                                              }}
                                              style={{
                                                  padding: '8px 12px', cursor: 'pointer',
                                                  borderBottom: '1px solid #334155',
                                                  fontSize: '12px', color: '#cbd5e1'
                                              }}
                                              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(96,165,250,0.1)'}
                                              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                          >
                                              <span style={{ color: 'white', fontWeight: '500' }}>{m.name}</span>
                                              <span style={{ color: '#64748b', marginLeft: '8px' }}>
                                                  Stock: {m.stockQuantity}
                                              </span>
                                          </div>
                                      ))
                                  }
                                  {allMedicines.filter(m => m.name?.toLowerCase().includes(
                                      (item.medicineName || '').toLowerCase()
                                  )).length === 0 && (
                                      <div style={{ padding: '10px 12px', color: '#475569', fontSize: '12px' }}>
                                          No match — new medicine
                                      </div>
                                  )}
                              </div>
                          )}
                      </td>
                      <td style={s.td}>
                        <input style={{ ...s.cellInput, width: '80px' }} placeholder="Batch"
                          value={item.batchNo}
                          onChange={e => handleItemChange(i, 'batchNo', e.target.value)} />
                      </td>
                      <td style={s.td}>
                        <input style={{ ...s.cellInput, width: '120px' }} type="date"
                          value={item.expiryDate}
                          onChange={e => handleItemChange(i, 'expiryDate', e.target.value)} />
                      </td>
                      <td style={s.td}>
                        <input style={{ ...s.cellInput, width: '70px' }} placeholder="HSN"
                          value={item.hsnCode}
                          onChange={e => handleItemChange(i, 'hsnCode', e.target.value)} />
                      </td>
                      <td style={s.td}>
                        <input style={{ ...s.cellInput, width: '75px', color: '#fbbf24', fontWeight: 'bold' }} placeholder="Rack"
                          value={item.rackNumber}
                          onChange={e => handleItemChange(i, 'rackNumber', e.target.value)} />
                      </td>
                      <td style={s.td}>
                        <input style={{ ...s.cellInput, width: '80px', color: '#a78bfa' }} placeholder="Cat."
                          value={item.category}
                          onChange={e => handleItemChange(i, 'category', e.target.value)} />
                      </td>
                      <td style={s.td}>
                        <input style={{ ...s.cellInput, width: '50px' }} type="number" placeholder="0"
                          value={item.quantity}
                          onChange={e => handleItemChange(i, 'quantity', e.target.value)} />
                      </td>
                      <td style={s.td}>
                        <input style={{ ...s.cellInput, width: '75px' }} type="number" placeholder="0.00"
                          value={item.unitCostPrice}
                          onChange={e => handleItemChange(i, 'unitCostPrice', e.target.value)} />
                      </td>
                      <td style={s.td}>
                        <input style={{ ...s.cellInput, width: '75px' }} type="number" placeholder="0.00"
                          value={item.sellingPrice}
                          onChange={e => handleItemChange(i, 'sellingPrice', e.target.value)} />
                      </td>
                      <td style={s.td}>
                        <input style={{ ...s.cellInput, width: '45px' }} type="number" placeholder="0"
                          value={item.gstPercentage}
                          onChange={e => handleItemChange(i, 'gstPercentage', e.target.value)} />
                      </td>
                      <td style={{ ...s.td, color: '#60a5fa', fontWeight: 'bold', minWidth: '80px' }}>
                        ₹{calcLineTotal(item).toFixed(2)}
                      </td>
                      <td style={s.td}>
                        <button style={s.deleteBtn} onClick={() => removeRow(i)}>
                          <X size={14}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={s.tableFooter}>
              <button style={s.addRowBtn} onClick={addRow}>
                <Plus size={15}/> Add Medicine
              </button>
              <div style={s.totalBox}>
                <span style={{ color: '#94a3b8', fontSize: '13px' }}>Grand Total (incl. GST)</span>
                <span style={s.totalAmount}>₹{calcGrandTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>

          <button
            style={loading ? s.submitBtnDisabled : s.submitBtn}
            onClick={handleSubmit}
            disabled={loading}
          >
            <Save size={18}/>
            {loading ? 'Saving...' : 'RECEIVE STOCK & SAVE GRN'}
          </button>
        </>
      )}

      {/* ══ HISTORY TAB ══ */}
      {activeTab === 'history' && (
        <div style={s.card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={s.cardTitle}>
              <Package size={17} color="#60a5fa"/>
              Purchase Records
              <span style={s.countBadge}>{filtered.length} records</span>
            </div>
            <div style={s.searchWrap}>
              <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}/>
              <input
                style={s.searchInput}
                placeholder="Search supplier / invoice..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div style={s.emptyState}>
              <Package size={40} color="#334155"/>
              <p style={{ color: '#94a3b8', marginTop: '12px' }}>No purchase records found.</p>
            </div>
          ) : (
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>
                    {['Date', 'Supplier', 'Invoice No.', 'Items', 'Total Bill', 'GST Paid', ''].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((rec, i) => (
                    <React.Fragment key={i}>
                      <tr
                        style={{ ...s.tr, cursor: 'pointer' }}
                        onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                      >
                        <td style={s.td}>
                          {rec.purchaseDate ? new Date(rec.purchaseDate).toLocaleDateString('en-IN') : '—'}
                        </td>
                        <td style={{ ...s.td, fontWeight: '500', color: 'white' }}>
                          {rec.supplierName}
                          {rec.isLoosePurchase && (
                            <span style={s.loosePill}>loose</span>
                          )}
                        </td>
                        <td style={{ ...s.td, color: '#94a3b8' }}>{rec.invoiceNumber || '—'}</td>
                        <td style={s.td}>
                          <span style={s.itemsBadge}>{(rec.items || []).length} items</span>
                        </td>
                        <td style={{ ...s.td, color: '#60a5fa', fontWeight: '500' }}>
                          ₹{(rec.totalBillAmount || 0).toFixed(2)}
                        </td>
                        <td style={{ ...s.td, color: '#10b981' }}>
                          ₹{(rec.totalInputTax || 0).toFixed(2)}
                        </td>
                        <td style={s.td}>
                          <ChevronDown
                            size={15}
                            color="#94a3b8"
                            style={{ transform: expandedRow === i ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}
                          />
                        </td>
                      </tr>

                      {expandedRow === i && (
                        <tr>
                          <td colSpan={7} style={{ padding: '0 0 8px', backgroundColor: '#0f172a' }}>
                            <table style={{ ...s.table, borderRadius: '8px', overflow: 'hidden' }}>
                              <thead>
                                <tr>
                                  {['Medicine', 'Batch No.', 'Expiry', 'HSN', 'Rack', 'Category', 'Qty', 'Cost Price', 'GST%', 'Tax Amt', 'Line Total'].map(h => (
                                    <th key={h} style={{ ...s.th, backgroundColor: '#1e293b', fontSize: '11px' }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {(rec.items || []).map((it, j) => (
                                  <tr key={j} style={s.tr}>
                                    <td style={s.td}>{it.medicineName}</td>
                                    <td style={s.td}>{it.batchNo || '—'}</td>
                                    <td style={s.td}>{it.expiryDate ? new Date(it.expiryDate).toLocaleDateString('en-IN') : '—'}</td>
                                    <td style={s.td}>{it.hsnCode || '—'}</td>
                                    <td style={{ ...s.td, color: '#fbbf24', fontWeight: 'bold' }}>{it.rackNumber || 'N/A'}</td>
                                    <td style={{ ...s.td, color: '#a78bfa' }}>{it.category || 'Tablet'}</td>
                                    <td style={s.td}>{it.quantity}</td>
                                    <td style={s.td}>₹{(it.unitCostPrice || 0).toFixed(2)}</td>
                                    <td style={s.td}>{it.gstPercentage || 0}%</td>
                                    <td style={{ ...s.td, color: '#10b981' }}>₹{(it.taxAmount || 0).toFixed(2)}</td>
                                    <td style={{ ...s.td, color: '#60a5fa', fontWeight: '500' }}>₹{(it.lineTotal || 0).toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────
const s = {
  page:              { padding: '40px', marginLeft: '240px', backgroundColor: '#0f172a', minHeight: '100vh' },
  header:            { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' },
  h1:                { color: 'white', margin: '0 0 4px', fontSize: '26px', fontWeight: '600' },
  subtitle:          { color: '#94a3b8', margin: 0, fontSize: '14px' },
  tabs:              { display: 'flex', gap: '8px', backgroundColor: '#1e293b', padding: '4px', borderRadius: '10px', border: '1px solid #334155' },
  tab:               { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', backgroundColor: 'transparent', color: '#94a3b8', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
  tabActive:         { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
  toast:             { display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' },
  toastSuccess:      { backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid #10b981' },
  toastError:        { backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid #ef4444' },
  card:              { backgroundColor: '#1e293b', borderRadius: '16px', border: '1px solid #334155', padding: '24px', marginBottom: '20px' },
  cardTitle:         { display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontWeight: '600', fontSize: '15px', marginBottom: '20px' },
  countBadge:        { marginLeft: '8px', backgroundColor: '#1d4ed8', color: '#bfdbfe', fontSize: '11px', padding: '2px 8px', borderRadius: '99px' },
  row3:              { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' },
  fieldGroup:        { display: 'flex', flexDirection: 'column', gap: '8px' },
  label:             { color: '#94a3b8', fontSize: '13px' },
  input:             { backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '11px 14px', color: 'white', outline: 'none', fontSize: '14px', width: '100%', boxSizing: 'border-box' },
  tableWrap:         { overflowX: 'auto', borderRadius: '10px', border: '1px solid #334155' },
  table:             { width: '100%', borderCollapse: 'collapse', fontSize: '12px' },
  th:                { backgroundColor: '#0f172a', color: '#94a3b8', padding: '12px 8px', textAlign: 'left', fontWeight: '500', whiteSpace: 'nowrap', borderBottom: '1px solid #334155' },
  tr:                { borderBottom: '1px solid #1e293b' },
  td:                { padding: '8px 8px', color: '#cbd5e1', verticalAlign: 'middle' },
  cellInput:         { backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '8px 8px', color: 'white', outline: 'none', fontSize: '12px', boxSizing: 'border-box' },
  deleteBtn:         { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  tableFooter:       { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', flexWrap: 'wrap', gap: '12px' },
  addRowBtn:         { display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(37,99,235,0.15)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.4)', borderRadius: '8px', padding: '10px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
  totalBox:          { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' },
  totalAmount:       { color: 'white', fontSize: '22px', fontWeight: '700' },
  submitBtn:         { width: '100%', padding: '16px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', fontSize: '15px', letterSpacing: '0.5px' },
  submitBtnDisabled: { width: '100%', padding: '16px', backgroundColor: '#1e3a6e', color: '#60a5fa', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'not-allowed', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', fontSize: '15px' },
  searchWrap:        { position: 'relative' },
  searchInput:       { backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '9px 14px 9px 32px', color: 'white', outline: 'none', fontSize: '13px', width: '260px' },
  emptyState:        { textAlign: 'center', padding: '50px 0' },
  itemsBadge:        { backgroundColor: '#0f172a', color: '#94a3b8', padding: '3px 10px', borderRadius: '99px', fontSize: '12px', border: '1px solid #334155' },
  // Autocomplete
  suggestionsBox:    { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', zIndex: 999, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', maxHeight: '200px', overflowY: 'auto' },
  suggestionItem:    { padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #334155', color: '#cbd5e1', fontSize: '13px', display: 'flex', alignItems: 'center' },
  // Loose purchase
  looseBanner:       { backgroundColor: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.3)', borderRadius: '8px', padding: '10px 14px', color: '#60a5fa', fontSize: '13px', marginBottom: '16px' },
  loosePill:         { marginLeft: '8px', backgroundColor: 'rgba(37,99,235,0.2)', color: '#60a5fa', fontSize: '10px', padding: '2px 7px', borderRadius: '99px', fontWeight: '600', textTransform: 'uppercase' },
  toggleLabel:       { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' },
  toggleTrack:       { width: '40px', height: '22px', borderRadius: '99px', position: 'relative', cursor: 'pointer', transition: 'background-color 0.2s' },
  toggleThumb:       { position: 'absolute', top: '3px', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'white', transition: 'transform 0.2s' },
};

export default Purchase;