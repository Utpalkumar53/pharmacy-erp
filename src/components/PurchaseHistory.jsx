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
            // ✅ FIXED: Relative URL (Axios automatically prepends /api)
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
        const invoice = order.invoiceNumber?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();
        return supplier.includes(query) || invoice.includes(query);
    });

    if (loading) return <div style={{ color: '#60a5fa', padding: '40px', marginLeft: '240px' }}>Loading Purchase Ledger...</div>;

    return (
        <div style={{ padding: '40px', marginLeft: '240px', backgroundColor: '#0f172a', minHeight: '100vh' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                <h1 style={{ color: '#f1f5f9', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ClipboardList size={28} color="#60a5fa" /> Purchase Invoice History
                </h1>
                <button onClick={fetchHistory} style={{ backgroundColor: '#334155', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}>
                    <RefreshCw size={16} />
                </button>
            </header>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#1e293b', padding: '12px', borderRadius: '10px', border: '1px solid #334155', marginBottom: '20px', maxWidth: '400px' }}>
                <Search size={18} color="#94a3b8" />
                <input 
                    placeholder="Search by supplier or invoice..." 
                    style={{ background: 'none', border: 'none', color: 'white', outline: 'none', width: '100%' }}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
            </div>

            <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', border: '1px solid #334155', padding: '20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8', textTransform: 'uppercase', fontSize: '11px', textAlign: 'left' }}>
                            <th style={{ padding: '12px' }}>Invoice No.</th>
                            <th>Supplier Name</th>
                            <th>Purchase Date</th>
                            <th style={{ textAlign: 'right' }}>Tax PAID (GST)</th>
                            <th style={{ textAlign: 'right' }}>Total Bill Amount</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.length > 0 ? filteredOrders.map((order, i) => (
                            <React.Fragment key={order.id || i}>
                                <tr 
                                    style={{ color: '#cbd5e1', borderBottom: '1px solid #334155', fontSize: '13px', cursor: 'pointer' }}
                                    onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                                >
                                    <td style={{ padding: '15px', fontWeight: 'bold', fontFamily: 'monospace', color: '#60a5fa' }}>
                                        {order.invoiceNumber || '—'}
                                    </td>
                                    <td>{order.supplierName}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Calendar size={14} color="#94a3b8" />
                                            {order.purchaseDate ? new Date(order.purchaseDate).toLocaleDateString('en-IN') : '—'}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right', color: '#fbbf24' }}>₹{order.totalInputTax?.toFixed(2)}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>₹{order.totalBillAmount?.toFixed(2)}</td>
                                    <td style={{ padding: '15px', textAlign: 'center' }}>
                                        <ChevronDown 
                                            size={16} 
                                            color="#94a3b8" 
                                            style={{ 
                                                transform: expandedRow === i ? 'rotate(180deg)' : 'none', 
                                                transition: 'transform 0.2s' 
                                            }} 
                                        />
                                    </td>
                                </tr>

                                {expandedRow === i && (
                                    <tr>
                                        <td colSpan={6} style={{ padding: '0 0 12px', backgroundColor: '#0f172a' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', borderRadius: '8px', overflow: 'hidden' }}>
                                                <thead>
                                                    <tr style={{ backgroundColor: '#1e293b', color: '#94a3b8', fontSize: '11px', textAlign: 'left' }}>
                                                        <th style={{ padding: '10px 15px' }}>Medicine</th>
                                                        <th>Batch No.</th>
                                                        <th>Expiry</th>
                                                        <th>Rack No.</th>
                                                        <th>Category</th>
                                                        <th>Qty</th>
                                                        <th>Cost Price</th>
                                                        <th>GST%</th>
                                                        <th style={{ textAlign: 'right', paddingRight: '15px' }}>Line Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(order.items || []).map((it, j) => (
                                                        <tr key={j} style={{ borderBottom: '1px solid #1e293b', color: '#cbd5e1', fontSize: '12px' }}>
                                                            <td style={{ padding: '10px 15px', fontWeight: 'bold' }}>{it.medicineName}</td>
                                                            <td>{it.batchNo || '—'}</td>
                                                            <td>{it.expiryDate ? new Date(it.expiryDate).toLocaleDateString('en-IN') : '—'}</td>
                                                            <td style={{ color: '#f59e0b', fontWeight: 'bold' }}>{it.rackNumber || 'N/A'}</td>
                                                            <td style={{ color: '#a78bfa' }}>{it.category || 'Tablet'}</td>
                                                            <td>{it.quantity}</td>
                                                            <td>₹{(it.unitCostPrice || 0).toFixed(2)}</td>
                                                            <td>{it.gstPercentage || 0}%</td>
                                                            <td style={{ textAlign: 'right', color: '#60a5fa', fontWeight: 'bold', paddingRight: '15px' }}>
                                                                ₹{(it.lineTotal || 0).toFixed(2)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
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
        </div>
    );
};

export default PurchaseHistory;