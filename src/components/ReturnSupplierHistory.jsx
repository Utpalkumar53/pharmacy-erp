import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import {
    History, Search, Calendar, ChevronDown,
    RefreshCw, Filter, X
} from 'lucide-react';

const ReturnSupplierHistory = () => {
    const [returns, setReturns] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState(null);
    const [hoveredRow, setHoveredRow] = useState(null);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showFilters, setShowFilters] = useState(false);

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

    const clearFilters = () => {
        setSearchQuery('');
        setDateFrom('');
        setDateTo('');
    };

    const hasActiveFilters = searchQuery || dateFrom || dateTo;

    const filteredReturns = returns.filter(r => {
        const matchesSearch =
            r.supplierName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.referenceInvoiceNo?.toLowerCase().includes(searchQuery.toLowerCase());

        const returnDate = new Date(r.returnDate);
        const matchesFrom = dateFrom ? returnDate >= new Date(dateFrom) : true;
        const matchesTo = dateTo ? returnDate <= new Date(dateTo) : true;

        return matchesSearch && matchesFrom && matchesTo;
    });

    const totalCredit = filteredReturns.reduce((sum, r) => sum + (r.totalReturnAmount || 0), 0);

    if (loading) return <div style={styles.loader}>Loading Return Ledger...</div>;

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.title}>
                    <History size={26} color="#60a5fa" />
                    Supplier Return History
                </h1>
                <div style={styles.headerActions}>
                    <button
                        onClick={() => setShowFilters(v => !v)}
                        style={{
                            ...styles.iconBtn,
                            ...(showFilters ? styles.iconBtnActive : {})
                        }}
                        title="Toggle date filters"
                    >
                        <Filter size={15} />
                    </button>
                    <button onClick={fetchHistory} style={styles.iconBtn} title="Refresh">
                        <RefreshCw size={15} />
                    </button>
                </div>
            </header>

            {/* Search & Filter Bar */}
            <div style={styles.searchRow}>
                <div style={styles.searchBar}>
                    <Search size={16} color="#64748b" />
                    <input
                        placeholder="Search by supplier or invoice..."
                        style={styles.searchInput}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} style={styles.clearBtn}>
                            <X size={14} />
                        </button>
                    )}
                </div>

                {showFilters && (
                    <div style={styles.dateFilters}>
                        <div style={styles.dateField}>
                            <Calendar size={14} color="#64748b" />
                            <input
                                type="date"
                                style={styles.dateInput}
                                value={dateFrom}
                                onChange={e => setDateFrom(e.target.value)}
                                title="From date"
                            />
                        </div>
                        <span style={{ color: '#475569', fontSize: '13px' }}>to</span>
                        <div style={styles.dateField}>
                            <Calendar size={14} color="#64748b" />
                            <input
                                type="date"
                                style={styles.dateInput}
                                value={dateTo}
                                onChange={e => setDateTo(e.target.value)}
                                title="To date"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Summary Strip */}
            <div style={styles.summaryStrip}>
                <span style={styles.summaryText}>
                    {filteredReturns.length} return{filteredReturns.length !== 1 ? 's' : ''}
                    {hasActiveFilters ? ' (filtered)' : ''}
                </span>
                <span style={styles.summaryCredit}>
                    Total credit: <strong style={{ color: '#f87171' }}>− ₹{totalCredit.toFixed(2)}</strong>
                </span>
                {hasActiveFilters && (
                    <button onClick={clearFilters} style={styles.clearAllBtn}>
                        Clear filters
                    </button>
                )}
            </div>

            {/* Table */}
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
                        {filteredReturns.length > 0 ? filteredReturns.map((ret, i) => {
                            // Use ret.id as stable key; fallback to index only for display
                            const rowKey = ret.id ?? i;
                            const isExpanded = expandedRow === rowKey;
                            const isHovered = hoveredRow === rowKey;

                            return (
                                <React.Fragment key={rowKey}>
                                    <tr
                                        style={{
                                            ...styles.tr,
                                            ...(isHovered ? styles.trHover : {}),
                                        }}
                                        onClick={() => setExpandedRow(isExpanded ? null : rowKey)}
                                        onMouseEnter={() => setHoveredRow(rowKey)}
                                        onMouseLeave={() => setHoveredRow(null)}
                                    >
                                        <td style={styles.td}>
                                            <div style={styles.iconFlex}>
                                                <Calendar size={13} color="#64748b" />
                                                {new Date(ret.returnDate).toLocaleDateString('en-IN', {
                                                    day: '2-digit', month: 'short', year: 'numeric'
                                                })}
                                            </div>
                                        </td>
                                        <td style={{ ...styles.td, fontWeight: '600', color: 'white' }}>
                                            {ret.supplierName}
                                        </td>
                                        <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: '12px', color: '#94a3b8' }}>
                                            {ret.referenceInvoiceNo}
                                        </td>
                                        <td style={styles.td}>
                                            <span style={styles.reasonTag}>{ret.reason}</span>
                                        </td>
                                        <td style={{ ...styles.td, textAlign: 'right', fontWeight: '600', color: '#f87171' }}>
                                            − ₹{ret.totalReturnAmount?.toFixed(2) ?? '0.00'}
                                        </td>
                                        <td style={styles.td}>
                                            <ChevronDown
                                                size={15}
                                                color="#64748b"
                                                style={{
                                                    transform: isExpanded ? 'rotate(180deg)' : 'none',
                                                    transition: 'transform 0.2s ease'
                                                }}
                                            />
                                        </td>
                                    </tr>

                                    {isExpanded && (
                                        <tr>
                                            <td colSpan="6" style={styles.expandedPane}>
                                                {Array.isArray(ret.items) && ret.items.length > 0 ? (
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
                                                                    <td style={{ ...styles.innerTd, color: '#f59e0b', fontWeight: '600' }}>
                                                                        {item.batchNo || 'N/A'}
                                                                    </td>
                                                                    <td style={styles.innerTd}>{item.quantityReturned}</td>
                                                                    <td style={styles.innerTd}>₹{item.unitPrice?.toFixed(2) ?? '0.00'}</td>
                                                                    <td style={{ ...styles.innerTd, textAlign: 'right', color: '#60a5fa' }}>
                                                                        ₹{item.subTotal?.toFixed(2) ?? '0.00'}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                ) : (
                                                    <p style={styles.noItems}>No item details available for this return.</p>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        }) : (
                            <tr>
                                <td colSpan="6" style={styles.empty}>
                                    {hasActiveFilters
                                        ? 'No returns match your search or date range.'
                                        : 'No supplier returns recorded yet.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const styles = {
    container: {
        padding: '36px',
        backgroundColor: '#0f172a',
        minHeight: '100vh',
        color: '#cbd5e1',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
    },
    title: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        margin: 0,
        color: '#f1f5f9',
        fontSize: '22px',
        fontWeight: '600',
    },
    headerActions: {
        display: 'flex',
        gap: '8px',
    },
    iconBtn: {
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        color: '#94a3b8',
        padding: '9px 11px',
        borderRadius: '8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
    },
    iconBtnActive: {
        backgroundColor: '#1e3a5f',
        border: '1px solid #3b82f6',
        color: '#60a5fa',
    },
    searchRow: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        marginBottom: '14px',
    },
    searchBar: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        backgroundColor: '#1e293b',
        padding: '11px 14px',
        borderRadius: '10px',
        border: '1px solid #334155',
        maxWidth: '420px',
    },
    searchInput: {
        background: 'none',
        border: 'none',
        color: 'white',
        outline: 'none',
        width: '100%',
        fontSize: '14px',
    },
    clearBtn: {
        background: 'none',
        border: 'none',
        color: '#64748b',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        padding: '0',
    },
    dateFilters: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexWrap: 'wrap',
    },
    dateField: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: '#1e293b',
        padding: '9px 12px',
        borderRadius: '8px',
        border: '1px solid #334155',
    },
    dateInput: {
        background: 'none',
        border: 'none',
        color: '#cbd5e1',
        outline: 'none',
        fontSize: '13px',
        colorScheme: 'dark',
    },
    summaryStrip: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '16px',
        padding: '0 2px',
    },
    summaryText: {
        fontSize: '13px',
        color: '#64748b',
    },
    summaryCredit: {
        fontSize: '13px',
        color: '#94a3b8',
    },
    clearAllBtn: {
        background: 'none',
        border: '1px solid #334155',
        color: '#94a3b8',
        padding: '3px 10px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '12px',
    },
    tableWrapper: { 
        backgroundColor: '#1e293b', 
        borderRadius: '16px', 
        border: '1px solid #334155', 
        overflowX: 'auto',   // ← enables horizontal scroll
        WebkitOverflowScrolling: 'touch',  // ← smooth scroll on iOS
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
    },
    table: { width: '100%', minWidth: '650px', borderCollapse: 'collapse' },
    th: {
        padding: '13px 16px',
        color: '#64748b',
        fontSize: '10px',
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        fontWeight: '500',
    },
    tr: {
        cursor: 'pointer',
        borderBottom: '1px solid #334155',
        transition: 'background-color 0.15s ease',
    },
    trHover: {
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    td: {
        padding: '14px 16px',
        fontSize: '13px',
    },
    iconFlex: {
        display: 'flex',
        alignItems: 'center',
        gap: '7px',
        color: '#94a3b8',
    },
    reasonTag: {
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        color: '#f59e0b',
        padding: '3px 10px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: '600',
    },
    expandedPane: {
        padding: '0 16px 16px',
        backgroundColor: '#0f172a',
    },
    innerTable: {
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '12px',
    },
    innerThRow: {
        borderBottom: '1px solid #1e293b',
    },
    innerTh: {
        padding: '9px 10px',
        color: '#475569',
        fontSize: '10px',
        textAlign: 'left',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    },
    innerTr: {
        borderBottom: '1px solid #1e293b',
    },
    innerTd: {
        padding: '10px',
        fontSize: '13px',
        color: '#94a3b8',
    },
    noItems: {
        padding: '16px 10px',
        color: '#475569',
        fontSize: '13px',
        margin: 0,
    },
    empty: {
        padding: '48px',
        textAlign: 'center',
        color: '#475569',
        fontSize: '14px',
    },
    loader: {
        color: '#60a5fa',
        padding: '40px',
        fontSize: '14px',
    },
};

export default ReturnSupplierHistory;