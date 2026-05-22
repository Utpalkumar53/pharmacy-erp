import React, { useState } from 'react';
import api from '../api/axiosConfig';
import {
  FileText, Download, Printer, TrendingUp, TrendingDown,
  CheckCircle, AlertCircle, RefreshCw, IndianRupee
} from 'lucide-react';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const now = new Date();

// ── helpers ───────────────────────────────────────────────────────────────────
const fmt   = (n) => `₹${(Number(n) || 0).toFixed(2)}`;
const round = (n) => Math.round((Number(n) || 0) * 100) / 100;

const GstReport = () => {
  const [month,   setMonth]   = useState(now.getMonth() + 1);
  const [year,    setYear]    = useState(now.getFullYear());
  const [report,  setReport]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState({ text: '', type: '' });
  const [tab,     setTab]     = useState('gstr3b'); // gstr3b | gstr1 | gstr2

  const fetchReport = async () => {
    setLoading(true);
    setReport(null);
    try {
      const res = await api.get(`/reports/gst-summary?month=${month}&year=${year}`);
      setReport(res.data);
    } catch {
      showMsg('Failed to fetch GST report. Check backend connection.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (text, type) => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 4000);
  };

  // ── CSV Export ────────────────────────────────────────────────────────────
  const exportCSV = () => {
    if (!report) return;
    const rows = [
      ['GST REPORT', `${MONTHS[month - 1]} ${year}`],
      [],
      ['GSTR-3B SUMMARY'],
      ['Output Tax (Collected on Sales)', report.totalCollectedGst],
      ['Input Tax Credit (Paid on Purchases)', report.totalPaidGst],
      ['Net GST Payable', report.netGstPayable],
      [],
      ['GSTR-1 — SALES BREAKDOWN'],
      ['Counter Sales', report.counterSalesTotal],
      ['Hospital Normal Indent', report.hospitalNormalIndentTotal],
      ['Hospital Emergency Indent', report.hospitalEmergencyIndentTotal],
      ['Total Sales Value', report.totalSalesValue],
      ['Total GST Collected', report.totalCollectedGst],
      [],
      ['GST COLLECTED BY RATE'],
      ['Rate %', 'Amount (₹)'],
      ...Object.entries(report.collectedGstByRate || {}).map(([k, v]) => [`${k}%`, v]),
      [],
      ['GSTR-2 — PURCHASE BREAKDOWN'],
      ['Total Purchase Value', report.totalPurchaseValue],
      ['Total GST Paid (ITC)', report.totalPaidGst],
      [],
      ['GST PAID BY RATE'],
      ['Rate %', 'Amount (₹)'],
      ...Object.entries(report.paidGstByRate || {}).map(([k, v]) => [`${k}%`, v]),
    ];

    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `GST_Report_${MONTHS[month - 1]}_${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Print ─────────────────────────────────────────────────────────────────
  const printReport = () => {
    if (!report) return;
    const rateRows = (map) =>
      Object.entries(map || {})
        .map(([k, v]) => `<tr><td>${k}%</td><td>₹${Number(v).toFixed(2)}</td></tr>`)
        .join('');

    const html = `<html><head><style>
      body{font-family:Arial,sans-serif;padding:30px;color:#111}
      h1{color:#2563eb;border-bottom:2px solid #2563eb;padding-bottom:8px}
      h2{color:#1e40af;font-size:15px;margin:24px 0 8px}
      table{width:100%;border-collapse:collapse;margin-bottom:16px}
      th{background:#2563eb;color:white;padding:8px 12px;text-align:left;font-size:13px}
      td{padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:13px}
      .highlight{background:#eff6ff}
      .red{color:#dc2626;font-weight:bold}
      .green{color:#16a34a;font-weight:bold}
      .total{font-weight:bold;font-size:15px}
    </style></head><body>
      <h1>GST Report — ${MONTHS[month - 1]} ${year}</h1>
      <h2>GSTR-3B Summary</h2>
      <table>
        <tr class="highlight"><td>Output Tax (Collected on Sales)</td><td class="red">₹${report.totalCollectedGst?.toFixed(2)}</td></tr>
        <tr class="highlight"><td>Input Tax Credit (Paid on Purchases)</td><td class="green">₹${report.totalPaidGst?.toFixed(2)}</td></tr>
        <tr><td class="total">Net GST Payable to Government</td><td class="total red">₹${report.netGstPayable?.toFixed(2)}</td></tr>
      </table>
      <h2>GSTR-1 — Sales</h2>
      <table>
        <tr><th>Particulars</th><th>Amount</th></tr>
        <tr><td>Counter Sales</td><td>₹${report.counterSalesTotal?.toFixed(2)}</td></tr>
        <tr><td>Hospital Normal Indent</td><td>₹${report.hospitalNormalIndentTotal?.toFixed(2)}</td></tr>
        <tr><td>Hospital Emergency Indent</td><td>₹${report.hospitalEmergencyIndentTotal?.toFixed(2)}</td></tr>
        <tr class="highlight"><td><strong>Total Sales Value</strong></td><td><strong>₹${report.totalSalesValue?.toFixed(2)}</strong></td></tr>
        <tr><td>GST Collected</td><td class="red">₹${report.totalCollectedGst?.toFixed(2)}</td></tr>
      </table>
      <h2>GST Collected by Rate</h2>
      <table>
        <tr><th>GST Rate</th><th>Tax Amount</th></tr>
        ${rateRows(report.collectedGstByRate)}
      </table>
      <h2>GSTR-2 — Purchases & ITC</h2>
      <table>
        <tr><th>Particulars</th><th>Amount</th></tr>
        <tr><td>Total Purchase Value</td><td>₹${report.totalPurchaseValue?.toFixed(2)}</td></tr>
        <tr class="highlight"><td><strong>Total ITC Available</strong></td><td class="green"><strong>₹${report.totalPaidGst?.toFixed(2)}</strong></td></tr>
      </table>
      <h2>GST Paid by Rate</h2>
      <table>
        <tr><th>GST Rate</th><th>Tax Amount</th></tr>
        ${rateRows(report.paidGstByRate)}
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

  // ── Rate breakdown table ──────────────────────────────────────────────────
  const RateTable = ({ map, color }) => {
    const entries = Object.entries(map || {});
    if (entries.length === 0)
      return <p style={{ color: '#475569', fontSize: '13px' }}>No data for this period.</p>;
    return (
      <div className="gst-table-scroll">
        <table style={{ ...s.innerTable, minWidth: '400px' }}>
          <thead>
            <tr>
              <th style={s.innerTh}>GST Rate</th>
              <th style={s.innerTh}>Tax Amount</th>
              <th style={s.innerTh} className="gst-col-hide">CGST (half)</th>
              <th style={s.innerTh} className="gst-col-hide">SGST (half)</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([rate, amt]) => (
              <tr key={rate}>
                <td style={s.innerTd}>
                  <span style={{
                    backgroundColor: 'rgba(37,99,235,0.15)', color: '#60a5fa',
                    padding: '3px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: '700'
                  }}>{rate}%</span>
                </td>
                <td style={{ ...s.innerTd, color, fontWeight: '700' }}>{fmt(amt)}</td>
                <td style={{ ...s.innerTd, color: '#94a3b8' }} className="gst-col-hide">{fmt(round(amt) / 2)}</td>
                <td style={{ ...s.innerTd, color: '#94a3b8' }} className="gst-col-hide">{fmt(round(amt) / 2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="gst-page">

      {/* ── Header ── */}
      <div className="gst-header">
        <div>
          <h1 style={s.h1}>GST Report</h1>
          <p style={s.subtitle}>GSTR-1 · GSTR-2 · GSTR-3B — monthly tax summary</p>
        </div>
        {report && (
          <div className="gst-action-btns">
            <button onClick={exportCSV} style={s.csvBtn}>
              <Download size={15}/> Export CSV
            </button>
            <button onClick={printReport} style={s.printBtn}>
              <Printer size={15}/> Print / PDF
            </button>
          </div>
        )}
      </div>

      {/* ── Toast ── */}
      {msg.text && (
        <div style={{ ...s.toast, ...(msg.type === 'success' ? s.toastOk : s.toastErr) }}>
          {msg.type === 'success' ? <CheckCircle size={16}/> : <AlertCircle size={16}/>}
          {msg.text}
        </div>
      )}

      {/* ── Controls ── */}
      <div className="gst-controls">
        <select style={s.select} value={month} onChange={e => setMonth(Number(e.target.value))}>
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select style={s.select} value={year} onChange={e => setYear(Number(e.target.value))}>
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <button onClick={fetchReport} disabled={loading} style={s.fetchBtn}>
          {loading
            ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }}/> Fetching...</>
            : <><FileText size={15}/> Generate Report</>}
        </button>
      </div>

      {/* ── Empty state ── */}
      {!report && !loading && (
        <div style={s.emptyBox}>
          <FileText size={48} color="#334155"/>
          <p style={{ color: '#94a3b8', marginTop: '16px', fontSize: '15px' }}>
            Select month and year, then click <strong style={{ color: 'white' }}>Generate Report</strong>
          </p>
        </div>
      )}

      {/* ── Report ── */}
      {report && (
        <>
          {/* GSTR-3B Summary cards — always visible */}
          <div className="gst-summary-grid">
            <div style={{ ...s.summaryCard, borderColor: '#ef4444' }}>
              <TrendingUp size={20} color="#ef4444"/>
              <span style={s.cardLabel}>OUTPUT TAX (Collected)</span>
              <span style={{ ...s.cardVal, color: '#ef4444' }}>{fmt(report.totalCollectedGst)}</span>
              <span style={s.cardSub}>GST collected from customers on sales</span>
            </div>
            <div style={{ ...s.summaryCard, borderColor: '#10b981' }}>
              <TrendingDown size={20} color="#10b981"/>
              <span style={s.cardLabel}>INPUT TAX CREDIT (Paid)</span>
              <span style={{ ...s.cardVal, color: '#10b981' }}>{fmt(report.totalPaidGst)}</span>
              <span style={s.cardSub}>GST paid on purchases — ITC available</span>
            </div>
            <div style={{
              ...s.summaryCard,
              borderColor: report.netGstPayable > 0 ? '#f97316' : '#10b981',
              backgroundColor: report.netGstPayable > 0
                ? 'rgba(249,115,22,0.08)' : 'rgba(16,185,129,0.08)'
            }}>
              <IndianRupee size={20} color={report.netGstPayable > 0 ? '#f97316' : '#10b981'}/>
              <span style={s.cardLabel}>NET GST PAYABLE</span>
              <span style={{
                ...s.cardVal,
                color: report.netGstPayable > 0 ? '#f97316' : '#10b981',
                fontSize: '28px'
              }}>
                {fmt(report.netGstPayable)}
              </span>
              <span style={s.cardSub}>
                {report.netGstPayable > 0
                  ? '⚠ Amount to pay to government'
                  : '✓ ITC exceeds output tax — no payment due'}
              </span>
            </div>
          </div>

          {/* ── Tab switcher ── */}
          <div className="gst-tab-row">
            {[
              { key: 'gstr3b', label: 'GSTR-3B Summary' },
              { key: 'gstr1',  label: 'GSTR-1 (Sales)'  },
              { key: 'gstr2',  label: 'GSTR-2 (Purchases)' },
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

          {/* ── GSTR-3B ── */}
          {tab === 'gstr3b' && (
            <div style={s.card}>
              <h3 style={s.cardTitle}>GSTR-3B — Monthly Summary</h3>
              <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>
                This is the net tax position for {MONTHS[month - 1]} {year}.
                File this with the GST portal by the due date.
              </p>
              <div className="gst-table-scroll">
                <table style={{ ...s.innerTable, minWidth: '480px' }}>
                  <thead>
                    <tr>
                      <th style={s.innerTh}>Particulars</th>
                      <th style={s.innerTh}>Amount</th>
                      <th style={s.innerTh} className="gst-col-hide">CGST</th>
                      <th style={s.innerTh} className="gst-col-hide">SGST</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={s.innerTd}>Total Outward Supplies (Sales)</td>
                      <td style={{ ...s.innerTd, color: 'white', fontWeight: '600' }}>{fmt(report.totalSalesValue)}</td>
                      <td style={s.innerTd} className="gst-col-hide">—</td>
                      <td style={s.innerTd} className="gst-col-hide">—</td>
                    </tr>
                    <tr>
                      <td style={s.innerTd}>Output Tax on Sales</td>
                      <td style={{ ...s.innerTd, color: '#ef4444', fontWeight: '700' }}>{fmt(report.totalCollectedGst)}</td>
                      <td style={{ ...s.innerTd, color: '#f87171' }} className="gst-col-hide">{fmt(round(report.totalCollectedGst) / 2)}</td>
                      <td style={{ ...s.innerTd, color: '#f87171' }} className="gst-col-hide">{fmt(round(report.totalCollectedGst) / 2)}</td>
                    </tr>
                    <tr>
                      <td style={s.innerTd}>Total Inward Supplies (Purchases)</td>
                      <td style={{ ...s.innerTd, color: 'white', fontWeight: '600' }}>{fmt(report.totalPurchaseValue)}</td>
                      <td style={s.innerTd} className="gst-col-hide">—</td>
                      <td style={s.innerTd} className="gst-col-hide">—</td>
                    </tr>
                    <tr>
                      <td style={s.innerTd}>Input Tax Credit Available</td>
                      <td style={{ ...s.innerTd, color: '#10b981', fontWeight: '700' }}>{fmt(report.totalPaidGst)}</td>
                      <td style={{ ...s.innerTd, color: '#34d399' }} className="gst-col-hide">{fmt(round(report.totalPaidGst) / 2)}</td>
                      <td style={{ ...s.innerTd, color: '#34d399' }} className="gst-col-hide">{fmt(round(report.totalPaidGst) / 2)}</td>
                    </tr>
                    <tr style={{ backgroundColor: 'rgba(249,115,22,0.08)', borderTop: '2px solid #f97316' }}>
                      <td style={{ ...s.innerTd, fontWeight: '700', color: 'white', fontSize: '14px' }}>
                        Net GST Payable to Government
                      </td>
                      <td style={{ ...s.innerTd, fontWeight: '700', color: '#f97316', fontSize: '14px' }}>
                        {fmt(report.netGstPayable)}
                      </td>
                      <td style={{ ...s.innerTd, color: '#fb923c', fontWeight: '600' }} className="gst-col-hide">
                        {fmt(round(report.netGstPayable) / 2)}
                      </td>
                      <td style={{ ...s.innerTd, color: '#fb923c', fontWeight: '600' }} className="gst-col-hide">
                        {fmt(round(report.netGstPayable) / 2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── GSTR-1 ── */}
          {tab === 'gstr1' && (
            <div style={s.card}>
              <h3 style={s.cardTitle}>GSTR-1 — Outward Supplies (Sales)</h3>

              <div style={s.subTitle}>Sales Channel Breakdown</div>
              <div className="gst-table-scroll" style={{ marginBottom: '28px' }}>
                <table style={{ ...s.innerTable, minWidth: '360px' }}>
                  <thead>
                    <tr>
                      <th style={s.innerTh}>Channel</th>
                      <th style={s.innerTh}>Taxable Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={s.innerTd}>Counter / Retail Sales</td>
                      <td style={{ ...s.innerTd, color: '#60a5fa', fontWeight: '600' }}>{fmt(report.counterSalesTotal)}</td>
                    </tr>
                    <tr>
                      <td style={s.innerTd}>Hospital Normal Indent</td>
                      <td style={{ ...s.innerTd, color: '#60a5fa', fontWeight: '600' }}>{fmt(report.hospitalNormalIndentTotal)}</td>
                    </tr>
                    <tr>
                      <td style={s.innerTd}>Hospital Emergency Indent</td>
                      <td style={{ ...s.innerTd, color: '#f97316', fontWeight: '600' }}>{fmt(report.hospitalEmergencyIndentTotal)}</td>
                    </tr>
                    <tr style={{ borderTop: '2px solid #334155' }}>
                      <td style={{ ...s.innerTd, fontWeight: '700', color: 'white' }}>Total Sales Value</td>
                      <td style={{ ...s.innerTd, fontWeight: '700', color: 'white', fontSize: '15px' }}>{fmt(report.totalSalesValue)}</td>
                    </tr>
                    <tr>
                      <td style={s.innerTd}>Total GST Collected</td>
                      <td style={{ ...s.innerTd, color: '#ef4444', fontWeight: '700' }}>{fmt(report.totalCollectedGst)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={s.subTitle}>GST Collected by Rate</div>
              <RateTable map={report.collectedGstByRate} color="#ef4444"/>
            </div>
          )}

          {/* ── GSTR-2 ── */}
          {tab === 'gstr2' && (
            <div style={s.card}>
              <h3 style={s.cardTitle}>GSTR-2 — Inward Supplies (Purchases) & ITC</h3>

              <div style={s.subTitle}>Purchase Summary</div>
              <div className="gst-table-scroll" style={{ marginBottom: '28px' }}>
                <table style={{ ...s.innerTable, minWidth: '360px' }}>
                  <thead>
                    <tr>
                      <th style={s.innerTh}>Particulars</th>
                      <th style={s.innerTh}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={s.innerTd}>Total Purchase Value (incl. GST)</td>
                      <td style={{ ...s.innerTd, color: 'white', fontWeight: '600' }}>{fmt(report.totalPurchaseValue)}</td>
                    </tr>
                    <tr>
                      <td style={s.innerTd}>Taxable Value (excl. GST)</td>
                      <td style={{ ...s.innerTd, color: '#94a3b8' }}>
                        {fmt(round(report.totalPurchaseValue) - round(report.totalPaidGst))}
                      </td>
                    </tr>
                    <tr style={{ borderTop: '2px solid #334155' }}>
                      <td style={{ ...s.innerTd, fontWeight: '700', color: 'white' }}>
                        Total ITC Available
                      </td>
                      <td style={{ ...s.innerTd, fontWeight: '700', color: '#10b981', fontSize: '15px' }}>
                        {fmt(report.totalPaidGst)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={s.subTitle}>GST Paid by Rate</div>
              <RateTable map={report.paidGstByRate} color="#10b981"/>

              {/* ITC note */}
              <div style={{
                marginTop: '20px', backgroundColor: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px',
                padding: '14px 16px', fontSize: '13px', color: '#34d399'
              }}>
                ✅ <strong>Input Tax Credit of {fmt(report.totalPaidGst)}</strong> is available
                to offset against your output tax of {fmt(report.totalCollectedGst)}.
                Net payable to government: <strong>{fmt(report.netGstPayable)}</strong>.
              </div>
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* ── Page ── */
        .gst-page {
          padding: 40px;
          background-color: #0f172a;
          min-height: 100vh;
          box-sizing: border-box;
        }

        /* ── Header ── */
        .gst-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .gst-action-btns {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        /* ── Controls ── */
        .gst-controls {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 28px;
          flex-wrap: wrap;
        }

        /* ── Summary cards: 3-col desktop ── */
        .gst-summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 28px;
        }

        /* ── Tab row ── */
        .gst-tab-row {
          display: flex;
          gap: 4px;
          background-color: #1e293b;
          padding: 4px;
          border-radius: 10px;
          border: 1px solid #334155;
          margin-bottom: 20px;
          width: fit-content;
          flex-wrap: wrap;
        }

        /* ── Table scroll ── */
        .gst-table-scroll {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        /* ════════════════════════════════
           TABLET  (≤ 900px)
        ════════════════════════════════ */
        @media (max-width: 900px) {
          .gst-page {
            padding: 24px 16px;
          }
          .gst-summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        /* ════════════════════════════════
           MOBILE  (≤ 480px)
        ════════════════════════════════ */
        @media (max-width: 480px) {
          .gst-page {
            padding: 14px 12px;
          }
          .gst-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .gst-action-btns {
            width: 100%;
          }
          .gst-action-btns button {
            flex: 1;
            justify-content: center;
          }
          .gst-controls {
            flex-direction: column;
            align-items: stretch;
          }
          .gst-controls select {
            width: 100%;
          }
          .gst-controls button {
            width: 100%;
            justify-content: center;
          }
          .gst-summary-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .gst-tab-row {
            width: 100%;
          }
          .gst-tab-row button {
            flex: 1;
            padding: 8px 6px !important;
            font-size: 11px !important;
          }
          /* Hide CGST/SGST columns on mobile — too narrow */
          .gst-col-hide {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  h1:         { color: '#f1f5f9', margin: '0 0 4px', fontSize: '26px', fontWeight: '600' },
  subtitle:   { color: '#94a3b8', margin: 0, fontSize: '14px' },
  toast:      { display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' },
  toastOk:    { backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid #10b981' },
  toastErr:   { backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid #ef4444' },
  select:     { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white', padding: '10px 14px', fontSize: '14px', outline: 'none', cursor: 'pointer' },
  fetchBtn:   { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '10px 22px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' },
  csvBtn:     { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#10b981', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' },
  printBtn:   { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#7c3aed', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' },
  emptyBox:   { textAlign: 'center', padding: '80px 0' },
  summaryCard:{ backgroundColor: '#1e293b', borderRadius: '16px', border: '2px solid #334155', padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' },
  cardLabel:  { color: '#94a3b8', fontSize: '11px', fontWeight: '800', letterSpacing: '0.05em' },
  cardVal:    { color: '#f1f5f9', fontSize: '26px', fontWeight: '700' },
  cardSub:    { color: '#64748b', fontSize: '11px' },
  tabRow:     { display: 'flex', gap: '4px', backgroundColor: '#1e293b', padding: '4px', borderRadius: '10px', border: '1px solid #334155', marginBottom: '20px', width: 'fit-content' },
  tab:        { padding: '8px 20px', backgroundColor: 'transparent', color: '#94a3b8', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
  tabActive:  { padding: '8px 20px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
  card:       { backgroundColor: '#1e293b', borderRadius: '16px', border: '1px solid #334155', padding: '28px', marginBottom: '20px' },
  cardTitle:  { color: 'white', fontSize: '17px', fontWeight: '600', margin: '0 0 6px' },
  subTitle:   { color: '#60a5fa', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px', marginTop: '4px' },
  innerTable: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  innerTh:    { textAlign: 'left', padding: '10px 14px', backgroundColor: '#0f172a', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #334155' },
  innerTd:    { padding: '11px 14px', color: '#cbd5e1', borderBottom: '1px solid #1e293b' },
};

export default GstReport;