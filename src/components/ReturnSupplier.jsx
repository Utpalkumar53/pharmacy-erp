import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import {
  RotateCcw, Search, Plus, Trash2, Save,
  Package, Truck, AlertCircle, CheckCircle
} from 'lucide-react';

const ReturnSupplier = () => {
    const [inventory, setInventory]     = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [supplierName, setSupplierName] = useState('');
    const [invoiceRef, setInvoiceRef]   = useState('');
    const [returnReason, setReason]     = useState('Expired');
    const [returnList, setReturnList]   = useState([]);
    const [loading, setLoading]         = useState(false);
    const [msg, setMsg]                 = useState({ text: '', type: '' });

    useEffect(() => { fetchInventory(); }, []);

    const fetchInventory = async () => {
        try {
            const res = await api.get('/medicines');
            setInventory(res.data || []);
        } catch (err) {
            console.error("Failed to load inventory", err);
        }
    };

    const filteredInventory = inventory.filter(m =>
        (m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         m.batchNo?.toLowerCase().includes(searchQuery.toLowerCase())) &&
         m.stockQuantity > 0
    ).slice(0, 5);

    const addToReturn = (item) => {
        const exists = returnList.find(r => r.medicineId === item.id);
        if (exists) return;
        setReturnList([...returnList, {
            medicineId: item.id,
            medicineName: item.name,
            batchNo: item.batchNo,
            availableStock: item.stockQuantity,
            quantityReturned: 1,
            unitPrice: item.costPrice || 0,
            subTotal: item.costPrice || 0
        }]);
        setSearchQuery('');
    };

    const handleQtyChange = (index, val) => {
        const list = [...returnList];
        const qty  = parseInt(val) || 0;
        if (qty > list[index].availableStock) {
            showMsg(`Only ${list[index].availableStock} units available!`, 'error');
            return;
        }
        list[index].quantityReturned = qty;
        list[index].subTotal = qty * list[index].unitPrice;
        setReturnList(list);
    };

    const removeItem = (index) => setReturnList(returnList.filter((_, i) => i !== index));

    const showMsg = (text, type) => {
        setMsg({ text, type });
        setTimeout(() => setMsg({ text: '', type: '' }), 4000);
    };

    const handleSubmit = async () => {
        if (!supplierName || !invoiceRef || returnList.length === 0) {
            showMsg("Please fill supplier details and add items.", "error");
            return;
        }
        setLoading(true);
        try {
            const payload = {
                supplierName, referenceInvoiceNo: invoiceRef, reason: returnReason,
                items: returnList,
                totalReturnAmount: returnList.reduce((sum, i) => sum + i.subTotal, 0)
            };
            await api.post('/returns/process', payload);
            showMsg("Return to Supplier processed successfully!", "success");
            setReturnList([]); setSupplierName(''); setInvoiceRef('');
            fetchInventory();
        } catch {
            showMsg("Error processing return. Check stock levels.", "error");
        } finally {
            setLoading(false);
        }
    };

    const grandTotal = returnList.reduce((sum, i) => sum + i.subTotal, 0);

    return (
        <>
            <style>{`
                .rs-page {
                    padding: 40px;
                    background-color: #0f172a;
                    min-height: 100vh;
                    color: white;
                }

                /* ── Header ── */
                .rs-header { margin-bottom: 30px; }
                .rs-title {
                    display: flex; align-items: center; gap: 10px;
                    font-size: 24px; color: #60a5fa; margin: 0 0 6px;
                }
                .rs-subtitle { color: #94a3b8; font-size: 14px; margin: 0; }

                /* ── 2-col layout: left 1fr, right 2fr ── */
                .rs-grid {
                    display: grid;
                    grid-template-columns: 1fr 2fr;
                    gap: 20px;
                    align-items: start;
                }

                /* ── Cards ── */
                .rs-card {
                    background: #1e293b;
                    padding: 20px;
                    border-radius: 12px;
                    border: 1px solid #334155;
                    margin-bottom: 20px;
                }
                .rs-card:last-child { margin-bottom: 0; }
                .rs-card-title {
                    display: flex; align-items: center; gap: 8px;
                    margin-bottom: 15px; color: #f1f5f9; font-size: 16px;
                }

                /* ── Inputs ── */
                .rs-input {
                    width: 100%;
                    padding: 12px;
                    background: #0f172a;
                    border: 1px solid #334155;
                    border-radius: 8px;
                    color: white;
                    margin-bottom: 10px;
                    outline: none;
                    font-size: 14px;
                    box-sizing: border-box;
                }
                .rs-input:focus { border-color: #60a5fa; }

                /* ── Search results ── */
                .rs-results {
                    background: #0f172a;
                    border: 1px solid #334155;
                    border-radius: 8px;
                    overflow: hidden;
                }
                .rs-result-item {
                    padding: 10px 14px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: pointer;
                    border-bottom: 1px solid #1e293b;
                    transition: background 0.15s;
                }
                .rs-result-item:hover { background: rgba(96,165,250,0.08); }
                .rs-result-item:last-child { border-bottom: none; }

                /* ── Desktop table ── */
                .rs-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
                .rs-table { width: 100%; border-collapse: collapse; }
                .rs-table thead tr { border-bottom: 1px solid #334155; }
                .rs-table th {
                    text-align: left; padding: 10px 10px;
                    color: #94a3b8; font-size: 12px; white-space: nowrap;
                }
                .rs-table td {
                    padding: 10px 10px;
                    border-bottom: 1px solid #1e293b;
                    font-size: 14px; color: #cbd5e1;
                    vertical-align: middle;
                }
                .rs-qty-input {
                    width: 64px; padding: 6px 8px;
                    background: #0f172a; border: 1px solid #334155;
                    border-radius: 6px; color: white; outline: none;
                    font-size: 13px;
                }

                /* ── Mobile return item cards ── */
                .rs-mob-items { display: none; flex-direction: column; gap: 10px; }
                .rs-mob-item {
                    background: #0f172a;
                    border: 1px solid #334155;
                    border-radius: 10px;
                    padding: 12px 14px;
                }
                .rs-mob-item-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 10px;
                }
                .rs-mob-item-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 12px;
                    flex-wrap: wrap;
                }
                .rs-mob-qty-wrap {
                    display: flex; align-items: center; gap: 8px; font-size: 13px; color: #94a3b8;
                }

                /* ── Footer ── */
                .rs-footer {
                    margin-top: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 12px;
                }
                .rs-total { font-size: 18px; font-weight: bold; color: #10b981; }
                .rs-submit-btn {
                    display: flex; align-items: center; gap: 8px;
                    background: #2563eb; padding: 12px 24px;
                    border-radius: 8px; border: none;
                    color: white; font-weight: bold; cursor: pointer;
                    font-size: 14px;
                }
                .rs-submit-btn:disabled { background: #1e3a6e; color: #60a5fa; cursor: not-allowed; }

                /* ── Alert ── */
                .rs-alert {
                    padding: 15px; border-radius: 8px;
                    display: flex; align-items: center; gap: 10px;
                    margin-bottom: 20px; font-size: 14px;
                }

                /* ── Empty state ── */
                .rs-empty {
                    padding: 30px;
                    text-align: center;
                    color: #475569;
                    font-size: 13px;
                }

                /* ══ TABLET (≤900px) ══ */
                @media (max-width: 900px) {
                    .rs-grid { grid-template-columns: 1fr; }
                }

                /* ══ MOBILE (≤640px) ══ */
                @media (max-width: 640px) {
                    .rs-page { padding: 12px; }
                    .rs-title { font-size: 19px; }

                    /* Hide desktop table, show mobile cards */
                    .rs-table-wrap { display: none; }
                    .rs-mob-items { display: flex; }

                    .rs-footer { flex-direction: column; align-items: stretch; }
                    .rs-submit-btn { justify-content: center; width: 100%; }
                    .rs-total { text-align: center; }
                }
            `}</style>

            <div className="rs-page">

                {/* ── Header ── */}
                <header className="rs-header">
                    <h1 className="rs-title"><RotateCcw size={24} /> Return to Supplier</h1>
                    <p className="rs-subtitle">Deduct stock and request credit from distributors</p>
                </header>

                {/* ── Alert ── */}
                {msg.text && (
                    <div
                        className="rs-alert"
                        style={{ backgroundColor: msg.type === 'success' ? '#064e3b' : '#7f1d1d' }}
                    >
                        {msg.type === 'success' ? <CheckCircle size={18}/> : <AlertCircle size={18}/>}
                        {msg.text}
                    </div>
                )}

                <div className="rs-grid">

                    {/* ── LEFT: Supplier Details + Search ── */}
                    <div>
                        <div className="rs-card">
                            <h3 className="rs-card-title"><Truck size={18}/> Supplier Details</h3>
                            <input
                                className="rs-input"
                                placeholder="Supplier Name"
                                value={supplierName}
                                onChange={e => setSupplierName(e.target.value)}
                            />
                            <input
                                className="rs-input"
                                placeholder="Original Invoice Reference"
                                value={invoiceRef}
                                onChange={e => setInvoiceRef(e.target.value)}
                            />
                            <select
                                className="rs-input"
                                value={returnReason}
                                onChange={e => setReason(e.target.value)}
                            >
                                <option value="Expired">Expired Stock</option>
                                <option value="Damaged">Damaged / Leaked</option>
                                <option value="Wrong Item">Wrong Item Received</option>
                                <option value="Near Expiry">Near Expiry (Slow Moving)</option>
                            </select>
                        </div>

                        <div className="rs-card">
                            <h3 className="rs-card-title"><Search size={18}/> Search Inventory</h3>
                            <input
                                className="rs-input"
                                placeholder="Search medicine or batch..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <div className="rs-results">
                                    {filteredInventory.length > 0 ? filteredInventory.map(m => (
                                        <div key={m.id} className="rs-result-item" onClick={() => addToReturn(m)}>
                                            <div>
                                                <div style={{ fontWeight: 'bold', color: 'white', marginBottom: '2px' }}>{m.name}</div>
                                                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                                    Batch: {m.batchNo} | Stock: {m.stockQuantity}
                                                </div>
                                            </div>
                                            <Plus size={16} color="#10b981"/>
                                        </div>
                                    )) : (
                                        <div style={{ padding: '12px', color: '#475569', fontSize: '13px' }}>
                                            No matching medicines found.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── RIGHT: Return Items ── */}
                    <div className="rs-card">
                        <h3 className="rs-card-title"><Package size={18}/> Return Items</h3>

                        {returnList.length === 0 ? (
                            <div className="rs-empty">
                                <Package size={36} style={{ opacity: 0.3, marginBottom: '10px' }}/>
                                <p style={{ margin: 0 }}>Search and add medicines to return above.</p>
                            </div>
                        ) : (
                            <>
                                {/* Desktop Table */}
                                <div className="rs-table-wrap">
                                    <table className="rs-table">
                                        <thead>
                                            <tr>
                                                <th>Medicine</th>
                                                <th>Batch</th>
                                                <th>Avail.</th>
                                                <th>Return Qty</th>
                                                <th>Subtotal</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {returnList.map((item, index) => (
                                                <tr key={index}>
                                                    <td style={{ fontWeight: '500', color: 'white' }}>{item.medicineName}</td>
                                                    <td style={{ color: '#94a3b8', fontFamily: 'monospace' }}>{item.batchNo}</td>
                                                    <td style={{ color: '#64748b' }}>{item.availableStock}</td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            className="rs-qty-input"
                                                            value={item.quantityReturned}
                                                            min={1}
                                                            max={item.availableStock}
                                                            onChange={e => handleQtyChange(index, e.target.value)}
                                                        />
                                                    </td>
                                                    <td style={{ color: '#10b981', fontWeight: '600' }}>₹{item.subTotal.toFixed(2)}</td>
                                                    <td>
                                                        <button
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                                                            onClick={() => removeItem(index)}
                                                        >
                                                            <Trash2 size={16} color="#ef4444"/>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Cards */}
                                <div className="rs-mob-items">
                                    {returnList.map((item, index) => (
                                        <div key={index} className="rs-mob-item">
                                            <div className="rs-mob-item-top">
                                                <div>
                                                    <div style={{ fontWeight: '600', color: 'white', marginBottom: '3px' }}>{item.medicineName}</div>
                                                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                                        Batch: {item.batchNo} &nbsp;|&nbsp; Available: {item.availableStock}
                                                    </div>
                                                </div>
                                                <button
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                                                    onClick={() => removeItem(index)}
                                                >
                                                    <Trash2 size={16} color="#ef4444"/>
                                                </button>
                                            </div>
                                            <div className="rs-mob-item-row">
                                                <div className="rs-mob-qty-wrap">
                                                    <span>Return Qty:</span>
                                                    <input
                                                        type="number"
                                                        className="rs-qty-input"
                                                        value={item.quantityReturned}
                                                        min={1}
                                                        max={item.availableStock}
                                                        onChange={e => handleQtyChange(index, e.target.value)}
                                                    />
                                                </div>
                                                <span style={{ color: '#10b981', fontWeight: '700', fontSize: '15px' }}>
                                                    ₹{item.subTotal.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Footer */}
                                <div className="rs-footer">
                                    <div className="rs-total">
                                        Total Return: ₹{grandTotal.toFixed(2)}
                                    </div>
                                    <button
                                        className="rs-submit-btn"
                                        disabled={loading}
                                        onClick={handleSubmit}
                                    >
                                        <Save size={18}/> {loading ? 'Processing...' : 'Submit Return'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                </div>
            </div>
        </>
    );
};

export default ReturnSupplier;