import React, { useState } from 'react';
import api from '../api/axiosConfig';
import {
  TrendingUp, TrendingDown, IndianRupee, Download,
  Printer, RefreshCw, BookOpen, BarChart2,
  CheckCircle, AlertCircle, ArrowUpCircle, ArrowDownCircle
} from 'lucide-react';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const now  = new Date();
const fmt  = (n) => `₹${(Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtN = (n) => (Number(n) || 0).toFixed(2);

const Finance = () => {
  const [month,    setMonth]    = useState(now.getMonth() + 1);
  const [year,     setYear]     = useState(now.getFullYear());
  const [pl,       setPl]       = useState(null);
  const [cashBook, setCashBook] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [tab,      setTab]      = useState('pl'); // pl | cashbook
  const [msg,      setMsg]      = useState({ text: '', type: '' });

  const fetchData = async () => {
    setLoading(true);
    setPl(null);
    setCashBook([]);
    try {
      const [plRes, cbRes] = await Promise.all([
        api.get(`/finance/profit-loss?month=${month}&year=${year}`),
        api.get(`/finance/cash-book?month=${month}&year=${year}`),
      ]);
      setPl(plRes.data);
      setCashBook(Array.isArray(cbRes.data) ? cbRes.data : []);
    } catch {
      showMsg('Failed to fetch finance data. Check backend.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (text, type) => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 4000);
  };

  // ── CSV Export ─────────────────────────────────────────────────────────────
  const exportCSV = () => {
    if (!pl) return;
    const rows = [
      [`FINANCE REPORT — ${MONTHS[month - 1]} ${year}`],
      [],
      ['PROFIT & LOSS STATEMENT'],
      ['Total Revenue (Sales)', fmtN(pl.totalRevenue)],
      ['Cost of Goods Sold', fmtN(pl.totalCOGS)],
      ['Gross Profit', fmtN(pl.grossProfit)],
      ['Total Expenses', fmtN(pl.totalExpenses)],
      ['Net Profit', fmtN(pl.netProfit)],
      ['Profit Margin %', fmtN(pl.profitMargin)],
      ['GST Collected', fmtN(pl.totalGst)],
      ['Total Purchases', fmtN(pl.totalPurchases)],
      [],
      ['DAILY CASH BOOK'],
      ['Date', 'Sales (In)', 'Purchases (Out)', 'Expenses (Out)', 'Net Cash'],
      ...cashBook.map(d => [
        d.date,
        fmtN(d.salesIn),
        fmtN(d.purchasesOut),
        fmtN(d.expensesOut),
        fmtN(d.netCash),
      ]),
    ];
    const csv  = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `Finance_${MONTHS[month - 1]}_${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Print ──────────────────────────────────────────────────────────────────
  const printReport = () => {
    if (!pl) return;
    const cbRows = cashBook.map(d => `
      <tr>
        <td>${new Date(d.date).toLocaleDateString('en-IN')}</td>
        <td style="color:#16a34a">₹${fmtN(d.salesIn)}</td>
        <td style="color:#dc2626">₹${fmtN(d.purchasesOut)}</td>
        <td style="color:#d97706">₹${fmtN(d.expensesOut)}</td>
        <td style="font-weight:bold;color:${d.netCash >= 0 ? '#16a34a' : '#dc2626'}">
          ₹${fmtN(d.netCash)}
        </td>
      </tr>`).join('');

    const html = `<html><head><style>
      body{font-family:Arial,sans-serif;padding:30px;color:#111}
      h1{color:#2563eb;border-bottom:2px solid #2563eb;padding-bottom:8px}
      h2{color:#1e40af;font-size:15px;margin:24px 0 8px}
      table{width:100%;border-collapse:collapse;margin-bottom:20px}
      th{background:#2563eb;color:white;padding:9px 12px;text-align:left;font-size:13px}
      td{padding:9px 12px;border-bottom:1px solid #e2e8f0;font-size:13px}
      .green{color:#16a34a;font-weight:bold}
      .red{color:#dc2626;font-weight:bold}
      .total td{font-weight:bold;font-size:15px;border-top:2px solid #2563eb}
    </style></head><body>
      <h1>Finance Report — ${MONTHS[month - 1]} ${year}</h1>

      <h2>Profit & Loss Statement</h2>
      <table>
        <tr><td>Total Revenue (Sales)</td><td class="green">₹${fmtN(pl.totalRevenue)}</td></tr>
        <tr><td>Cost of Goods Sold (COGS)</td><td class="red">₹${fmtN(pl.totalCOGS)}</td></tr>
        <tr><td><strong>Gross Profit</strong></td><td><strong>₹${fmtN(pl.grossProfit)}</strong></td></tr>
        <tr><td>Total Operational Expenses</td><td class="red">₹${fmtN(pl.totalExpenses)}</td></tr>
        <tr class="total"><td>Net Profit</td><td class="${pl.netProfit >= 0 ? 'green' : 'red'}">₹${fmtN(pl.netProfit)}</td></tr>
        <tr><td>Profit Margin</td><td>${fmtN(pl.profitMargin)}%</td></tr>
        <tr><td>GST Collected</td><td>₹${fmtN(pl.totalGst)}</td></tr>
        <tr><td>Total Purchases</td><td>₹${fmtN(pl.totalPurchases)}</td></tr>
      </table>

      <h2>Daily Cash Book</h2>
      <table>
        <thead><tr><th>Date</th><th>Sales In</th><th>Purchases Out</th><th>Expenses Out</th><th>Net Cash</th></tr></thead>
        <tbody>${cbRows}</tbody>
      </table>
      <p style="color:#94a3b8;font-size:11px;margin-top:30px">
        Generated by RxManager Pro — ${new Date().toLocaleString('en-IN')}
      </p>
    </body></html>`;

    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 600);
  };

  // ── Cash book totals ───────────────────────────────────────────────────────
  const cbTotals = cashBook.reduce(
    (acc, d) => ({
      salesIn:      acc.salesIn      + (d.salesIn      || 0),
      purchasesOut: acc.purchasesOut + (d.purchasesOut || 0),
      expensesOut:  acc.expensesOut  + (d.expensesOut  || 0),
      netCash:      acc.netCash      + (d.netCash      || 0),
    }),
    { salesIn: 0, purchasesOut: 0, expensesOut: 0, netCash: 0 }
  );

  return (
    <div style={s.page}>

      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.h1}>Finance & Accounts</h1>
          <p style={s.subtitle}>Profit & Loss · Daily Cash Book · Monthly Overview</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {pl && (
            <>
              <button onClick={exportCSV} style={s.csvBtn}>
                <Download size={15}/> Export CSV
              </button>
              <button onClick={printReport} style={s.printBtn}>
                <Printer size={15}/> Print / PDF
              </button>
            </>
          )}
        </div>
      </div>

      {/* Toast */}
      {msg.text && (
        <div style={{ ...s.toast, ...(msg.type === 'success' ? s.toastOk : s.toastErr) }}>
          {msg.type === 'success' ? <CheckCircle size={16}/> : <AlertCircle size={16}/>}
          {msg.text}
        </div>
      )}

      {/* Controls */}
      <div style={s.controls}>
        <select style={s.select} value={month} onChange={e => setMonth(Number(e.target.value))}>
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select style={s.select} value={year} onChange={e => setYear(Number(e.target.value))}>
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <button onClick={fetchData} disabled={loading} style={s.fetchBtn}>
          {loading
            ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }}/> Loading...</>
            : <><BarChart2 size={15}/> Generate Report</>}
        </button>
      </div>

      {/* Empty state */}
      {!pl && !loading && (
        <div style={s.emptyBox}>
          <BookOpen size={48} color="#334155"/>
          <p style={{ color: '#94a3b8', marginTop: '16px', fontSize: '15px' }}>
            Select month and year, then click <strong style={{ color: 'white' }}>Generate Report</strong>
          </p>
        </div>
      )}

      {pl && (
        <>
          {/* Summary cards */}
          <div style={s.cardGrid}>
            <div style={{ ...s.card, borderColor: '#10b981' }}>
              <TrendingUp size={20} color="#10b981"/>
              <span style={s.cardLabel}>TOTAL REVENUE</span>
              <span style={{ ...s.cardVal, color: '#10b981' }}>{fmt(pl.totalRevenue)}</span>
              <span style={s.cardSub}>All sales this month</span>
            </div>
            <div style={{ ...s.card, borderColor: '#f97316' }}>
              <TrendingDown size={20} color="#f97316"/>
              <span style={s.cardLabel}>TOTAL PURCHASES</span>
              <span style={{ ...s.cardVal, color: '#f97316' }}>{fmt(pl.totalPurchases)}</span>
              <span style={s.cardSub}>Stock bought this month</span>
            </div>
            <div style={{ ...s.card, borderColor: '#ef4444' }}>
              <IndianRupee size={20} color="#ef4444"/>
              <span style={s.cardLabel}>TOTAL EXPENSES</span>
              <span style={{ ...s.cardVal, color: '#ef4444' }}>{fmt(pl.totalExpenses)}</span>
              <span style={s.cardSub}>Rent, food, transport etc.</span>
            </div>
            <div style={{
              ...s.card,
              borderColor: pl.netProfit >= 0 ? '#10b981' : '#ef4444',
              backgroundColor: pl.netProfit >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)'
            }}>
              <BarChart2 size={20} color={pl.netProfit >= 0 ? '#10b981' : '#ef4444'}/>
              <span style={s.cardLabel}>NET PROFIT</span>
              <span style={{
                ...s.cardVal, fontSize: '30px',
                color: pl.netProfit >= 0 ? '#10b981' : '#ef4444'
              }}>
                {fmt(pl.netProfit)}
              </span>
              <span style={s.cardSub}>
                Margin: {(pl.profitMargin || 0).toFixed(1)}%
                {pl.netProfit < 0 ? ' ⚠ Loss this month' : ' ✓ Profitable'}
              </span>
            </div>
          </div>

          {/* Tab switcher */}
          <div style={s.tabRow}>
            {[
              { key: 'pl',       label: 'P&L Statement' },
              { key: 'cashbook', label: 'Daily Cash Book' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={tab === t.key ? s.tabActive : s.tab}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* P&L */}
          {tab === 'pl' && (
            <div style={s.tableCard}>
              <h3 style={s.tableTitle}>
                Profit & Loss Statement — {MONTHS[month - 1]} {year}
              </h3>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Particulars</th>
                    <th style={s.th}>Amount</th>
                    <th style={s.th}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Revenue */}
                  <tr style={{ backgroundColor: 'rgba(16,185,129,0.06)' }}>
                    <td colSpan={3} style={{ ...s.td, color: '#10b981', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Income
                    </td>
                  </tr>
                  <tr>
                    <td style={s.td}>Total Sales Revenue</td>
                    <td style={{ ...s.td, color: '#10b981', fontWeight: '700' }}>{fmt(pl.totalRevenue)}</td>
                    <td style={{ ...s.td, color: '#64748b', fontSize: '12px' }}>All counter + hospital sales</td>
                  </tr>
                  {/* COGS */}
                  <tr style={{ backgroundColor: 'rgba(239,68,68,0.06)' }}>
                    <td colSpan={3} style={{ ...s.td, color: '#ef4444', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Cost of Goods
                    </td>
                  </tr>
                  <tr>
                    <td style={s.td}>Cost of Goods Sold (COGS)</td>
                    <td style={{ ...s.td, color: '#f87171', fontWeight: '600' }}>− {fmt(pl.totalCOGS)}</td>
                    <td style={{ ...s.td, color: '#64748b', fontSize: '12px' }}>Purchase cost of medicines sold</td>
                  </tr>
                  {/* Gross profit */}
                  <tr style={{ borderTop: '1px solid #334155', backgroundColor: 'rgba(96,165,250,0.06)' }}>
                    <td style={{ ...s.td, fontWeight: '700', color: 'white' }}>Gross Profit</td>
                    <td style={{ ...s.td, fontWeight: '700', color: '#60a5fa', fontSize: '16px' }}>{fmt(pl.grossProfit)}</td>
                    <td style={{ ...s.td, color: '#64748b', fontSize: '12px' }}>Revenue − COGS</td>
                  </tr>
                  {/* Expenses */}
                  <tr style={{ backgroundColor: 'rgba(251,191,36,0.06)' }}>
                    <td colSpan={3} style={{ ...s.td, color: '#fbbf24', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Operating Expenses
                    </td>
                  </tr>
                  <tr>
                    <td style={s.td}>Total Operational Expenses</td>
                    <td style={{ ...s.td, color: '#fbbf24', fontWeight: '600' }}>− {fmt(pl.totalExpenses)}</td>
                    <td style={{ ...s.td, color: '#64748b', fontSize: '12px' }}>Rent, food, transport, utilities</td>
                  </tr>
                  <tr>
                    <td style={s.td}>GST Collected (Output Tax)</td>
                    <td style={{ ...s.td, color: '#a78bfa' }}>{fmt(pl.totalGst)}</td>
                    <td style={{ ...s.td, color: '#64748b', fontSize: '12px' }}>To be remitted to government</td>
                  </tr>
                  {/* Net profit */}
                  <tr style={{
                    borderTop: '2px solid #334155',
                    backgroundColor: pl.netProfit >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'
                  }}>
                    <td style={{ ...s.td, fontWeight: '700', color: 'white', fontSize: '16px' }}>
                      NET PROFIT
                    </td>
                    <td style={{
                      ...s.td, fontWeight: '700', fontSize: '20px',
                      color: pl.netProfit >= 0 ? '#10b981' : '#ef4444'
                    }}>
                      {fmt(pl.netProfit)}
                    </td>
                    <td style={{ ...s.td, color: '#64748b', fontSize: '12px' }}>
                      Margin: {(pl.profitMargin || 0).toFixed(1)}%
                    </td>
                  </tr>
                  <tr>
                      <td style={s.td}>Customer Outstanding (Udhaar)</td>
                      <td style={{ ...s.td, color: '#f472b6' }}>{fmt(pl.totalOutstanding || 0)}</td>
                      <td style={{ ...s.td, color: '#64748b', fontSize: '12px' }}>
                        Pending collection from customers
                      </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Daily Cash Book */}
          {tab === 'cashbook' && (
            <div style={s.tableCard}>
              <h3 style={s.tableTitle}>
                Daily Cash Book — {MONTHS[month - 1]} {year}
              </h3>

              {/* Cash book summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
                <div style={s.miniCard}>
                  <ArrowUpCircle size={16} color="#10b981"/>
                  <span style={{ color: '#94a3b8', fontSize: '11px' }}>Total Cash In</span>
                  <span style={{ color: '#10b981', fontWeight: '700' }}>{fmt(cbTotals.salesIn)}</span>
                </div>
                <div style={s.miniCard}>
                  <ArrowDownCircle size={16} color="#f97316"/>
                  <span style={{ color: '#94a3b8', fontSize: '11px' }}>Total Purchases Out</span>
                  <span style={{ color: '#f97316', fontWeight: '700' }}>{fmt(cbTotals.purchasesOut)}</span>
                </div>
                <div style={s.miniCard}>
                  <ArrowDownCircle size={16} color="#ef4444"/>
                  <span style={{ color: '#94a3b8', fontSize: '11px' }}>Total Expenses Out</span>
                  <span style={{ color: '#ef4444', fontWeight: '700' }}>{fmt(cbTotals.expensesOut)}</span>
                </div>
                <div style={{
                  ...s.miniCard,
                  border: `1px solid ${cbTotals.netCash >= 0 ? '#10b981' : '#ef4444'}44`
                }}>
                  <IndianRupee size={16} color={cbTotals.netCash >= 0 ? '#10b981' : '#ef4444'}/>
                  <span style={{ color: '#94a3b8', fontSize: '11px' }}>Net Cash Position</span>
                  <span style={{ color: cbTotals.netCash >= 0 ? '#10b981' : '#ef4444', fontWeight: '700' }}>
                    {fmt(cbTotals.netCash)}
                  </span>
                </div>
              </div>

              {cashBook.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>
                  No transactions found for {MONTHS[month - 1]} {year}.
                </div>
              ) : (
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>Date</th>
                      <th style={s.th}>Sales (Cash In)</th>
                      <th style={s.th}>Purchases (Out)</th>
                      <th style={s.th}>Expenses (Out)</th>
                      <th style={s.th}>Net Cash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashBook.map((day, i) => (
                      <tr key={i} style={s.tr}>
                        <td style={{ ...s.td, color: 'white', fontWeight: '500' }}>
                          {new Date(day.date).toLocaleDateString('en-IN', {
                            weekday: 'short', day: '2-digit', month: 'short'
                          })}
                        </td>
                        <td style={{ ...s.td, color: '#10b981', fontWeight: '600' }}>
                          {day.salesIn > 0 ? `+ ${fmt(day.salesIn)}` : '—'}
                        </td>
                        <td style={{ ...s.td, color: '#f97316' }}>
                          {day.purchasesOut > 0 ? `− ${fmt(day.purchasesOut)}` : '—'}
                        </td>
                        <td style={{ ...s.td, color: '#ef4444' }}>
                          {day.expensesOut > 0 ? `− ${fmt(day.expensesOut)}` : '—'}
                        </td>
                        <td style={{
                          ...s.td, fontWeight: '700',
                          color: day.netCash >= 0 ? '#10b981' : '#ef4444'
                        }}>
                          {day.netCash >= 0 ? '+' : ''}{fmt(day.netCash)}
                        </td>
                      </tr>
                    ))}
                    {/* Totals row */}
                    <tr style={{ borderTop: '2px solid #334155', backgroundColor: '#0f172a' }}>
                      <td style={{ ...s.td, fontWeight: '700', color: 'white' }}>TOTAL</td>
                      <td style={{ ...s.td, color: '#10b981', fontWeight: '700' }}>{fmt(cbTotals.salesIn)}</td>
                      <td style={{ ...s.td, color: '#f97316', fontWeight: '700' }}>{fmt(cbTotals.purchasesOut)}</td>
                      <td style={{ ...s.td, color: '#ef4444', fontWeight: '700' }}>{fmt(cbTotals.expensesOut)}</td>
                      <td style={{
                        ...s.td, fontWeight: '700', fontSize: '15px',
                        color: cbTotals.netCash >= 0 ? '#10b981' : '#ef4444'
                      }}>
                        {fmt(cbTotals.netCash)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────
const s = {
    page:      { padding: '40px', marginLeft: '240px', backgroundColor: '#0f172a', minHeight: '100vh' },
    header:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
    h1:        { color: '#f1f5f9', margin: '0 0 4px', fontSize: '26px', fontWeight: '600' },
    subtitle:  { color: '#94a3b8', margin: 0, fontSize: '14px' },
    toast:     { display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' },
    toastOk:   { backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid #10b981' },
    toastErr:  { backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid #ef4444' },
    controls:  { display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap' },
    select:    { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white', padding: '10px 14px', fontSize: '14px', outline: 'none', cursor: 'pointer' },
    fetchBtn:  { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '10px 22px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' },
    csvBtn:    { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#10b981', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' },
    printBtn:  { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#7c3aed', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' },
    emptyBox:  { textAlign: 'center', padding: '80px 0' },
    cardGrid:  { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '24px' },
    card:      { backgroundColor: '#1e293b', borderRadius: '14px', border: '2px solid #334155', padding: '20px', display: 'flex', flexDirection: 'column', gap: '6px' },
    cardLabel: { color: '#94a3b8', fontSize: '11px', fontWeight: '800', letterSpacing: '0.05em' },
    cardVal:   { color: '#f1f5f9', fontSize: '22px', fontWeight: '700' },
    cardSub:   { color: '#64748b', fontSize: '11px' },
    tabRow:    { display: 'flex', gap: '4px', backgroundColor: '#1e293b', padding: '4px', borderRadius: '10px', border: '1px solid #334155', marginBottom: '20px', width: 'fit-content' },
    tab:       { padding: '8px 24px', backgroundColor: 'transparent', color: '#94a3b8', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
    tabActive: { padding: '8px 24px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
    tableCard: { backgroundColor: '#1e293b', borderRadius: '16px', border: '1px solid #334155', padding: '28px' },
    tableTitle:{ color: 'white', fontSize: '16px', fontWeight: '600', margin: '0 0 20px' },
    table:     { width: '100%', borderCollapse: 'collapse' },
    th:        { textAlign: 'left', padding: '12px 16px', backgroundColor: '#0f172a', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #334155' },
    td:        { padding: '13px 16px', color: '#cbd5e1', borderBottom: '1px solid #1e293b', fontSize: '14px' },
    tr:        { transition: 'background 0.1s' },
    miniCard:  { backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' },
};

export default Finance;