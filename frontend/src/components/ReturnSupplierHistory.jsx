import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { 
  History, Search, Calendar, ChevronDown, 
  RefreshCw 
} from 'lucide-react';

const ReturnSupplierHistory = () => {
    const [returns, setReturns] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState(null);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const res = await api.get('/returns/history');
            setReturns(res.data || []);
        } catch (err) {
            console.error("Failed to load return history", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchHistory(); }, []);

    const filteredReturns = returns.filter(r => 
        r.supplierName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.referenceInvoiceNo?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <div style={styles.loader}>Loading Return Ledger...</div>;

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.title}><History size={28} color="#60a5fa" /> Supplier Return History</h1>
                <button onClick={fetchHistory} style={styles.refreshBtn}>
                    <RefreshCw size={16} />
                </button>
            </header>

            <div style={styles.searchBar}>
                <Search size={18} color="#94a3b8" />
                <input 
                    placeholder="Search by supplier or original invoice..." 
                    style={styles.searchInput}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
            </div>

            <div style={styles.tableWrapper}>
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.thRow}>
                            <th style={styles.th}>Return Date</th>
                            <th style={styles.th}>Supplier</th>
                            <th style={styles.th}>Orig. Invoice</th>
                            <th style={styles.th}>Reason</th>
                            <th style={{ ...styles.th, textAlign: 'right' }}>Total Credit</th>
                            <th style={styles.th}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredReturns.length > 0 ? filteredReturns.map((ret, i) => (
                            <React.Fragment key={ret.id || i}>
                                <tr 
                                    style={styles.tr} 
                                    onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                                >
                                    <td style={styles.td}>
                                        <div style={styles.iconFlex}>
                                            <Calendar size={14} color="#94a3b8" />
                                            {new Date(ret.returnDate).toLocaleDateString('en-IN')}
                                        </div>
                                    </td>
                                    <td style={{ ...styles.td, fontWeight: 'bold', color: 'white' }}>{ret.supplierName}</td>
                                    <td style={{ ...styles.td, fontFamily: 'monospace' }}>{ret.referenceInvoiceNo}</td>
                                    <td style={styles.td}>
                                        <span style={styles.reasonTag}>{ret.reason}</span>
                                    </td>
                                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: 'bold', color: '#f87171' }}>
                                        - ₹{ret.totalReturnAmount?.toFixed(2)}
                                    </td>
                                    <td style={styles.td}>
                                        <ChevronDown 
                                            size={16} 
                                            style={{ 
                                                transform: expandedRow === i ? 'rotate(180deg)' : 'none', 
                                                transition: '0.2s' 
                                            }} 
                                        />
                                    </td>
                                </tr>

                                {expandedRow === i && (
                                    <tr>
                                        <td colSpan="6" style={styles.expandedPane}>
                                            <div style={styles.detailGrid}>
                                                <table style={styles.innerTable}>
                                                    <thead>
                                                        <tr style={styles.innerThRow}>
                                                            <th style={styles.innerTh}>Medicine</th>
                                                            <th style={styles.innerTh}>Batch</th>
                                                            <th style={styles.innerTh}>Qty Returned</th>
                                                            <th style={styles.innerTh}>Unit Price</th>
                                                            <th style={{ ...styles.innerTh, textAlign: 'right' }}>Subtotal</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {ret.items.map((item, j) => (
                                                            <tr key={j} style={styles.innerTr}>
                                                                <td style={styles.innerTd}>{item.medicineName}</td>
                                                                {/* ✅ FIXED: Corrected mapping for batchNo */}
                                                                <td style={{ ...styles.innerTd, color: '#f59e0b', fontWeight: 'bold' }}>
                                                                    {item.batchNo || 'N/A'}
                                                                </td>
                                                                <td style={styles.innerTd}>{item.quantityReturned}</td>
                                                                <td style={styles.innerTd}>₹{item.unitPrice?.toFixed(2)}</td>
                                                                <td style={{ ...styles.innerTd, textAlign: 'right', color: '#60a5fa' }}>
                                                                    ₹{item.subTotal?.toFixed(2)}
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
                                <td colSpan="6" style={styles.empty}>No supplier returns recorded yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const styles = {
    container: { padding: '40px', marginLeft: '240px', backgroundColor: '#0f172a', minHeight: '100vh', color: '#cbd5e1' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
    title: { display: 'flex', alignItems: 'center', gap: '12px', margin: 0, color: '#f1f5f9' },
    refreshBtn: { backgroundColor: '#1e293b', border: '1px solid #334155', color: 'white', padding: '10px', borderRadius: '8px', cursor: 'pointer' },
    searchBar: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#1e293b', padding: '12px', borderRadius: '10px', border: '1px solid #334155', marginBottom: '20px', maxWidth: '450px' },
    searchInput: { background: 'none', border: 'none', color: 'white', outline: 'none', width: '100%' },
    tableWrapper: { backgroundColor: '#1e293b', borderRadius: '16px', border: '1px solid #334155', overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse' },
    thRow: { borderBottom: '1px solid #334155', textAlign: 'left' },
    th: { padding: '15px', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' },
    tr: { cursor: 'pointer', borderBottom: '1px solid #334155' },
    td: { padding: '15px', fontSize: '14px' },
    iconFlex: { display: 'flex', alignItems: 'center', gap: '8px' },
    reasonTag: { backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' },
    expandedPane: { padding: '0 20px 20px', backgroundColor: '#0f172a' },
    innerTable: { width: '100%', borderCollapse: 'collapse', marginTop: '10px' },
    innerThRow: { borderBottom: '1px solid #1e293b' },
    innerTh: { padding: '10px', color: '#64748b', fontSize: '11px', textAlign: 'left' },
    innerTr: { borderBottom: '1px solid #1e293b' },
    innerTd: { padding: '10px', fontSize: '13px', color: '#94a3b8' },
    empty: { padding: '40px', textAlign: 'center', color: '#475569' },
    loader: { color: '#60a5fa', padding: '40px', marginLeft: '240px' }
};

export default ReturnSupplierHistory;