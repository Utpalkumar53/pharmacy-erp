import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { ClipboardList, Search, Calendar, RefreshCw, ChevronDown } from 'lucide-react';

const PurchaseHistory = () => {
    const [orders, setOrders] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState(null);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const res = await api.get('/purchases/history');
            setOrders(res.data || []);
        } catch (err) {
            console.error("Failed to load purchase history", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchHistory(); }, []);

    const filteredOrders = orders.filter(order => {
        const supplier = order.supplierName?.toLowerCase() || '';
        const invoice  = order.invoiceNumber?.toLowerCase() || '';
        const query    = searchQuery.toLowerCase();
        return supplier.includes(query) || invoice.includes(query);
    });

    if (loading) return <div style={{ color: '#60a5fa', padding: '40px' }}>Loading Purchase Ledger...</div>;

    return (
        <>
            <style>{`
                .ph-page {
                    padding: 40px;
                    background-color: #0f172a;
                    min-height: 100vh;
                }

                /* ── Header ── */
                .ph-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 30px;
                    flex-wrap: wrap;
                    gap: 12px;
                }
                .ph-header h1 {
                    color: #f1f5f9;
                    margin: 0;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 22px;
                }

                /* ── Search bar ── */
                .ph-search {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: #1e293b;
                    padding: 12px;
                    border-radius: 10px;
                    border: 1px solid #334155;
                    margin-bottom: 20px;
                    max-width: 400px;
                }
                .ph-search input {
                    background: none;
                    border: none;
                    color: white;
                    outline: none;
                    width: 100%;
                    font-size: 14px;
                }

                /* ── Card wrapper ── */
                .ph-card {
                    background: #1e293b;
                    border-radius: 16px;
                    border: 1px solid #334155;
                    padding: 20px;
                }

                /* ── Desktop table ── */
                .ph-table-wrap {
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                }
                .ph-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .ph-table thead tr {
                    border-bottom: 1px solid #334155;
                    color: #94a3b8;
                    text-transform: uppercase;
                    font-size: 11px;
                    text-align: left;
                }
                .ph-table thead th { padding: 12px; white-space: nowrap; }
                .ph-table tbody tr.ph-main-row {
                    color: #cbd5e1;
                    border-bottom: 1px solid #334155;
                    font-size: 13px;
                    cursor: pointer;
                }
                .ph-table tbody tr.ph-main-row:hover { background: rgba(96,165,250,0.04); }
                .ph-table tbody td { padding: 15px 12px; vertical-align: middle; }

                /* ── Sub-table (expanded) ── */
                .ph-sub-wrap {
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                }
                .ph-sub-table {
                    width: 100%;
                    border-collapse: collapse;
                    border-radius: 8px;
                    overflow: hidden;
                }
                .ph-sub-table thead tr {
                    background: #1e293b;
                    color: #94a3b8;
                    font-size: 11px;
                    text-align: left;
                }
                .ph-sub-table thead th { padding: 10px 12px; white-space: nowrap; }
                .ph-sub-table tbody tr {
                    border-bottom: 1px solid #1e293b;
                    color: #cbd5e1;
                    font-size: 12px;
                }
                .ph-sub-table tbody td { padding: 10px 12px; }

                /* ── Mobile order cards ── */
                .ph-mob-list { display: none; flex-direction: column; gap: 12px; }
                .ph-mob-card {
                    background: #0f172a;
                    border: 1px solid #334155;
                    border-radius: 12px;
                    padding: 14px;
                    cursor: pointer;
                }
                .ph-mob-card-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 8px;
                    margin-bottom: 10px;
                }
                .ph-mob-card-amounts {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                    padding-top: 10px;
                    border-top: 1px solid #1e293b;
                }
                .ph-mob-amt-block label {
                    font-size: 11px;
                    color: #64748b;
                    display: block;
                    margin-bottom: 2px;
                }
                /* Expanded sub-items on mobile */
                .ph-mob-items { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
                .ph-mob-item {
                    background: #1e293b;
                    border: 1px solid #334155;
                    border-radius: 8px;
                    padding: 10px 12px;
                    font-size: 12px;
                }
                .ph-mob-item-name {
                    color: white;
                    font-weight: 600;
                    font-size: 13px;
                    margin-bottom: 6px;
                }
                .ph-mob-item-meta {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 4px 12px;
                    color: #94a3b8;
                }
                .ph-mob-item-meta span b { color: #cbd5e1; font-weight: 500; }

                /* ══ TABLET (≤900px) ══ */
                @media (max-width: 900px) {
                    .ph-search { max-width: 100%; }
                }

                /* ══ MOBILE (≤640px) ══ */
                @media (max-width: 640px) {
                    .ph-page { padding: 12px; }
                    .ph-header h1 { font-size: 17px; }
                    .ph-card { padding: 12px; }

                    /* Hide desktop table, show mobile cards */
                    .ph-table-wrap { display: none; }
                    .ph-mob-list { display: flex; }
                }
            `}</style>

            <div className="ph-page">

                {/* ── Header ── */}
                <header className="ph-header">
                    <h1>
                        <ClipboardList size={26} color="#60a5fa" />
                        Purchase Invoice History
                    </h1>
                    <button
                        onClick={fetchHistory}
                        style={{ backgroundColor: '#334155', color: 'white', border: 'none', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                    >
                        <RefreshCw size={16} /> Refresh
                    </button>
                </header>

                {/* ── Search ── */}
                <div className="ph-search">
                    <Search size={18} color="#94a3b8" />
                    <input
                        placeholder="Search by supplier or invoice..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="ph-card">

                    {/* ── Desktop Table ── */}
                    <div className="ph-table-wrap">
                        <table className="ph-table">
                            <thead>
                                <tr>
                                    <th>Invoice No.</th>
                                    <th>Supplier Name</th>
                                    <th>Purchase Date</th>
                                    <th style={{ textAlign: 'right' }}>Tax Paid (GST)</th>
                                    <th style={{ textAlign: 'right' }}>Total Bill</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.length > 0 ? filteredOrders.map((order, i) => (
                                    <React.Fragment key={order.id || i}>
                                        <tr
                                            className="ph-main-row"
                                            onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                                        >
                                            <td style={{ fontWeight: 'bold', fontFamily: 'monospace', color: '#60a5fa' }}>
                                                {order.invoiceNumber || '—'}
                                            </td>
                                            <td style={{ color: 'white', fontWeight: '500' }}>{order.supplierName}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Calendar size={14} color="#94a3b8" />
                                                    {order.purchaseDate ? new Date(order.purchaseDate).toLocaleDateString('en-IN') : '—'}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right', color: '#fbbf24' }}>
                                                ₹{order.totalInputTax?.toFixed(2)}
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>
                                                ₹{order.totalBillAmount?.toFixed(2)}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <ChevronDown
                                                    size={16}
                                                    color="#94a3b8"
                                                    style={{ transform: expandedRow === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                                                />
                                            </td>
                                        </tr>

                                        {expandedRow === i && (
                                            <tr>
                                                <td colSpan={6} style={{ padding: '0 0 12px', backgroundColor: '#0f172a' }}>
                                                    <div className="ph-sub-wrap">
                                                        <table className="ph-sub-table">
                                                            <thead>
                                                                <tr>
                                                                    <th>Medicine</th>
                                                                    <th>Batch No.</th>
                                                                    <th>Expiry</th>
                                                                    <th>Rack No.</th>
                                                                    <th>Category</th>
                                                                    <th>Qty</th>
                                                                    <th>Cost Price</th>
                                                                    <th>GST%</th>
                                                                    <th style={{ textAlign: 'right' }}>Line Total</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {(order.items || []).map((it, j) => (
                                                                    <tr key={j}>
                                                                        <td style={{ fontWeight: 'bold', color: 'white' }}>{it.medicineName}</td>
                                                                        <td>{it.batchNo || '—'}</td>
                                                                        <td>{it.expiryDate ? new Date(it.expiryDate).toLocaleDateString('en-IN') : '—'}</td>
                                                                        <td style={{ color: '#f59e0b', fontWeight: 'bold' }}>{it.rackNumber || 'N/A'}</td>
                                                                        <td style={{ color: '#a78bfa' }}>{it.category || 'Tablet'}</td>
                                                                        <td>{it.quantity}</td>
                                                                        <td>₹{(it.unitCostPrice || 0).toFixed(2)}</td>
                                                                        <td>{it.gstPercentage || 0}%</td>
                                                                        <td style={{ textAlign: 'right', color: '#60a5fa', fontWeight: 'bold' }}>
                                                                            ₹{(it.lineTotal || 0).toFixed(2)}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                )) : (
                                    <tr>
                                        <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#475569' }}>
                                            No purchase invoices documented yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* ── Mobile Cards ── */}
                    <div className="ph-mob-list">
                        {filteredOrders.length > 0 ? filteredOrders.map((order, i) => (
                            <div
                                key={order.id || i}
                                className="ph-mob-card"
                                onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                            >
                                {/* Top row: invoice + chevron */}
                                <div className="ph-mob-card-top">
                                    <div>
                                        <div style={{ fontFamily: 'monospace', color: '#60a5fa', fontWeight: 'bold', fontSize: '13px', marginBottom: '3px' }}>
                                            {order.invoiceNumber || '—'}
                                        </div>
                                        <div style={{ color: 'white', fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>
                                            {order.supplierName}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748b', fontSize: '12px' }}>
                                            <Calendar size={13} color="#64748b" />
                                            {order.purchaseDate ? new Date(order.purchaseDate).toLocaleDateString('en-IN') : '—'}
                                        </div>
                                    </div>
                                    <ChevronDown
                                        size={18}
                                        color="#94a3b8"
                                        style={{ transform: expandedRow === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}
                                    />
                                </div>

                                {/* Amounts row */}
                                <div className="ph-mob-card-amounts">
                                    <div className="ph-mob-amt-block">
                                        <label>GST Paid</label>
                                        <span style={{ color: '#fbbf24', fontWeight: '600', fontSize: '14px' }}>
                                            ₹{order.totalInputTax?.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="ph-mob-amt-block">
                                        <label>Total Bill</label>
                                        <span style={{ color: '#10b981', fontWeight: '700', fontSize: '15px' }}>
                                            ₹{order.totalBillAmount?.toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                {/* Expanded items */}
                                {expandedRow === i && (
                                    <div className="ph-mob-items">
                                        {(order.items || []).map((it, j) => (
                                            <div key={j} className="ph-mob-item">
                                                <div className="ph-mob-item-name">{it.medicineName}</div>
                                                <div className="ph-mob-item-meta">
                                                    <span>Batch: <b>{it.batchNo || '—'}</b></span>
                                                    <span>Expiry: <b>{it.expiryDate ? new Date(it.expiryDate).toLocaleDateString('en-IN') : '—'}</b></span>
                                                    <span>Rack: <b style={{ color: '#f59e0b' }}>{it.rackNumber || 'N/A'}</b></span>
                                                    <span>Cat: <b style={{ color: '#a78bfa' }}>{it.category || 'Tablet'}</b></span>
                                                    <span>Qty: <b>{it.quantity}</b></span>
                                                    <span>Cost: <b>₹{(it.unitCostPrice || 0).toFixed(2)}</b></span>
                                                    <span>GST: <b>{it.gstPercentage || 0}%</b></span>
                                                    <span>Total: <b style={{ color: '#60a5fa' }}>₹{(it.lineTotal || 0).toFixed(2)}</b></span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )) : (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#475569' }}>
                                No purchase invoices documented yet.
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </>
    );
};

export default PurchaseHistory;