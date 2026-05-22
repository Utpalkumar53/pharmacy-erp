import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import {
  ClipboardList, Clock, CheckCircle, XCircle, GitMerge,
  RefreshCw, AlertTriangle, Zap, Package, Calendar, IndianRupee,
  Activity, UserCheck, Stethoscope, TrendingUp, Bell
} from 'lucide-react';

const STATUS_CONFIG = {
  PENDING:          { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  label: 'Pending'        },
  ISSUED:           { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  label: 'Issued'         },
  PARTIALLY_ISSUED: { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', label: 'Partly Issued'  },
  CANCELLED:        { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   label: 'Cancelled'      },
};

const StatusPill = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
      color: cfg.color, backgroundColor: cfg.bg, border: `1px solid ${cfg.color}33`,
    }}>
      {cfg.label}
    </span>
  );
};

const fmt = (dt) => {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  });
};

const NurseDashboard = ({ onNavigate }) => {
  const { auth } = useAuth();
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [indents, setIndents]             = useState([]);
  const [attendance, setAttendance]       = useState(null);
  const [inventory, setInventory]         = useState([]);
  const [monthSummary, setMonthSummary]   = useState(null);
  const [salary, setSalary]               = useState(null);
  const [salaryLoading, setSalaryLoading] = useState(false);

  const now      = new Date();
  const username = auth?.username || 'Nurse';

  const fetchAll = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      const [indentRes, attendRes] = await Promise.all([
        api.get('/indents/my').catch(() => ({ data: [] })),
        api.get('/staff/attendance/my/today').catch(() => ({ data: null })),
      ]);
      setIndents(indentRes.data || []);
      setAttendance(attendRes?.data ?? null);

      const thisMonth = (indentRes.data || []).filter(i => {
        if (!i.requestDate) return false;
        const d = new Date(i.requestDate);
        if (isNaN(d.getTime())) return false;
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      setMonthSummary({
        total:     thisMonth.length,
        pending:   thisMonth.filter(i => i.status === 'PENDING').length,
        issued:    thisMonth.filter(i => i.status === 'ISSUED' || i.status === 'PARTIALLY_ISSUED').length,
        cancelled: thisMonth.filter(i => i.status === 'CANCELLED').length,
      });
    } catch (err) {
      console.error('NurseDashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchSalary = async () => {
    setSalaryLoading(true);
    try {
      const res = await api.get(
        `/staff/salary-report/my?month=${now.getMonth() + 1}&year=${now.getFullYear()}`
      );
      setSalary(res.data);
    } catch {
      setSalary(null);
    } finally {
      setSalaryLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    fetchSalary();
  }, []);

  const recentIndents  = [...indents].sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate)).slice(0, 5);
  const pendingIndents = indents.filter(i => i.status === 'PENDING');
  const emergencyCount = indents.filter(i => i.emergency && i.status === 'PENDING').length;

  const todayStr = now.toLocaleDateString('en-IN', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  });

  if (loading) return (
    <div style={loadingStyle}>
      <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
      Loading your dashboard…
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .nd-page { padding: 32px; background-color: #0f172a; min-height: 100vh; }

        /* ── Header ── */
        .nd-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .nd-header-btns { display: flex; gap: 10px; flex-wrap: wrap; }

        /* ── Stat grid: 5 cols → 3 → 2 → 1 ── */
        .nd-stat-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        /* ── Main 2-col grid → 1 col on tablet ── */
        .nd-main-grid {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 20px;
        }

        /* ── Indent table: hide on mobile, show cards ── */
        .nd-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .nd-mob-indent { display: none; flex-direction: column; gap: 10px; }
        .nd-mob-indent-row {
          background: rgba(96,165,250,0.05);
          border: 1px solid #334155;
          border-radius: 10px;
          padding: 12px 14px;
        }
        .nd-mob-indent-row-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          flex-wrap: wrap;
          gap: 6px;
        }
        .nd-mob-indent-meta {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: #64748b;
          flex-wrap: wrap;
        }

        /* ── Pending row ── */
        .nd-pending-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 14px;
          background: rgba(245,158,11,0.05);
          border-radius: 10px;
          border: 1px solid rgba(245,158,11,0.2);
          flex-wrap: wrap;
          gap: 8px;
        }

        /* ========== TABLET (≤900px) ========== */
        @media (max-width: 900px) {
          .nd-stat-grid { grid-template-columns: repeat(3, 1fr); }
          .nd-main-grid { grid-template-columns: 1fr; }
        }

        /* ========== MOBILE (≤600px) ========== */
        @media (max-width: 600px) {
          .nd-page { padding: 12px; }
          .nd-stat-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .nd-header-btns button { font-size: 12px; padding: 7px 10px !important; }

          /* Hide table, show mobile cards */
          .nd-table-wrap { display: none; }
          .nd-mob-indent { display: flex; }

          .nd-pending-row { flex-direction: column; align-items: flex-start; }
        }

        /* ========== SMALL MOBILE (≤380px) ========== */
        @media (max-width: 380px) {
          .nd-stat-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
        }
      `}</style>

      <div className="nd-page">

        {/* ── Header ── */}
        <div className="nd-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <Stethoscope size={22} color="#60a5fa" />
              <h1 style={h1}>Welcome, {username}</h1>
            </div>
            <p style={subtitle}>{todayStr}</p>
          </div>
          <div className="nd-header-btns">
            <button onClick={() => fetchAll(true)} style={refreshBtn}>
              <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
            <button onClick={() => onNavigate('INDENTS')} style={primaryBtn}>
              <ClipboardList size={15} /> My Indents
            </button>
          </div>
        </div>

        {/* ── Emergency Banner ── */}
        {emergencyCount > 0 && (
          <div style={emergencyBanner}>
            <Zap size={16} color="#f59e0b" fill="#f59e0b" />
            <span><strong>{emergencyCount} emergency indent{emergencyCount > 1 ? 's' : ''}</strong> pending pharmacist action</span>
          </div>
        )}

        {/* ── Stat Cards ── */}
        <div className="nd-stat-grid">
          <StatCard icon={<ClipboardList size={20} color="#60a5fa"/>} label="This Month's Indents"
            value={monthSummary?.total ?? 0} color="#60a5fa" />
          <StatCard icon={<Clock size={20} color="#f59e0b"/>} label="Pending"
            value={monthSummary?.pending ?? 0} color="#f59e0b"
            onClick={() => onNavigate('INDENTS')} />
          <StatCard icon={<CheckCircle size={20} color="#10b981"/>} label="Issued"
            value={monthSummary?.issued ?? 0} color="#10b981" />
          <StatCard icon={<UserCheck size={20} color="#a78bfa"/>} label="Today's Attendance"
            value={attendance ? (attendance.checkOutTime ? 'Done' : 'Present') : 'Not In'}
            color={attendance ? '#10b981' : '#f97316'} isText />
          <StatCard
            icon={<IndianRupee size={20} color="#fbbf24"/>}
            label="Est. Salary This Month"
            value={salary ? `₹${(salary.finalPayableAmount || 0).toLocaleString('en-IN')}` : salaryLoading ? '...' : '—'}
            sub={salary ? `Base: ₹${(salary.baseMonthlySalary || 0).toLocaleString('en-IN')}` : 'Not available'}
            color="#fbbf24"
            isText
          />
        </div>

        {/* ── Main Grid ── */}
        <div className="nd-main-grid">

          {/* LEFT — Recent Indents */}
          <div style={card}>
            <div style={cardHeader}>
              <h3 style={cardTitle}><ClipboardList size={16} color="#60a5fa"/> Recent Indent Requests</h3>
              <button onClick={() => onNavigate('INDENTS')} style={linkBtn}>View All →</button>
            </div>

            {recentIndents.length === 0 ? (
              <Empty icon={<ClipboardList size={32}/>} text="No indents yet. Raise your first one!" />
            ) : (
              <>
                {/* Desktop table */}
                <div className="nd-table-wrap">
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        {['Indent No.', 'Ward', 'Items', 'Status', 'Raised On'].map(h => (
                          <th key={h} style={th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentIndents.map((ind, i) => (
                        <tr key={i} style={trStyle}>
                          <td style={td}>
                            <span style={{ fontFamily: 'monospace', color: '#60a5fa', fontSize: '12px', fontWeight: 700 }}>
                              {ind.indentNumber || '#' + (ind.id || '').slice(-6).toUpperCase()}
                            </span>
                            {ind.emergency && <Zap size={11} color="#f59e0b" fill="#f59e0b" style={{ marginLeft: '5px', verticalAlign: 'middle' }} />}
                          </td>
                          <td style={td}><span style={{ color: '#e2e8f0' }}>{ind.wardName}</span></td>
                          <td style={td}><span style={{ color: '#94a3b8' }}>{(ind.items || []).length} item{(ind.items || []).length !== 1 ? 's' : ''}</span></td>
                          <td style={td}><StatusPill status={ind.status} /></td>
                          <td style={td}><span style={{ color: '#64748b', fontSize: '12px' }}>{fmt(ind.requestDate)}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="nd-mob-indent">
                  {recentIndents.map((ind, i) => (
                    <div key={i} className="nd-mob-indent-row">
                      <div className="nd-mob-indent-row-top">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontFamily: 'monospace', color: '#60a5fa', fontSize: '12px', fontWeight: 700 }}>
                            {ind.indentNumber || '#' + (ind.id || '').slice(-6).toUpperCase()}
                          </span>
                          {ind.emergency && <Zap size={11} color="#f59e0b" fill="#f59e0b" />}
                        </div>
                        <StatusPill status={ind.status} />
                      </div>
                      <div className="nd-mob-indent-meta">
                        <span>🏥 {ind.wardName}</span>
                        <span>📦 {(ind.items || []).length} item(s)</span>
                        <span>🕐 {fmt(ind.requestDate)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* RIGHT column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Today's Attendance */}
            <div style={card}>
              <div style={cardHeader}>
                <h3 style={cardTitle}><Calendar size={16} color="#a78bfa"/> Today's Attendance</h3>
                <button onClick={() => onNavigate('ATTENDANCE')} style={linkBtn}>Details →</button>
              </div>
              {attendance ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <AttRow label="Status" value={
                    <span style={{ color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <CheckCircle size={14}/> Present
                    </span>
                  }/>
                  <AttRow label="Clock In"  value={<span style={{ color: '#10b981' }}>{attendance.checkInTime?.substring(0, 5) || '—'}</span>} />
                  <AttRow label="Clock Out" value={<span style={{ color: attendance.checkOutTime ? '#f97316' : '#475569' }}>{attendance.checkOutTime?.substring(0, 5) || 'Still In'}</span>} />
                  {attendance.checkInTime && attendance.checkOutTime && (() => {
                    const [ih, im] = attendance.checkInTime.split(':').map(Number);
                    const [oh, om] = attendance.checkOutTime.split(':').map(Number);
                    const mins = (oh * 60 + om) - (ih * 60 + im);
                    return <AttRow label="Hours Worked" value={<span style={{ color: '#60a5fa', fontWeight: 700 }}>{Math.floor(mins / 60)}h {mins % 60}m</span>} />;
                  })()}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#f97316' }}>
                  <UserCheck size={28} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <p style={{ margin: 0, fontSize: '13px' }}>Not checked in today</p>
                </div>
              )}
            </div>

            {/* Salary Card */}
            <div style={card}>
              <div style={cardHeader}>
                <h3 style={cardTitle}><IndianRupee size={16} color="#fbbf24"/> Salary — {now.toLocaleString('default', { month: 'long' })}</h3>
              </div>
              {salaryLoading ? (
                <div style={{ color: '#475569', fontSize: '13px', textAlign: 'center', padding: '16px' }}>Loading…</div>
              ) : salary ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {[
                    { label: 'Base Monthly Salary', value: `₹${(salary.baseMonthlySalary || 0).toLocaleString('en-IN')}`,      color: '#94a3b8' },
                    { label: 'Days Present',         value: salary.daysPresent,                                                  color: '#10b981' },
                    { label: 'Days Absent',          value: (salary.totalDaysInMonth || 0) - (salary.daysPresent || 0),          color: '#f87171' },
                    { label: 'Net Payable',          value: `₹${(salary.finalPayableAmount || 0).toLocaleString('en-IN')}`,      color: '#fbbf24', large: true },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 0', borderBottom: i < 3 ? '1px solid #1e293b' : 'none' }}>
                      <span style={{ color: '#64748b', fontSize: '13px' }}>{row.label}</span>
                      <span style={{ color: row.color, fontWeight: row.large ? 800 : 600, fontSize: row.large ? '20px' : '14px' }}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                  <div style={{ marginTop: '12px', padding: '10px 12px', backgroundColor: 'rgba(251,191,36,0.06)',
                    border: '1px solid rgba(251,191,36,0.2)', borderRadius: '8px', fontSize: '11px', color: '#92400e' }}>
                    💡 Prorated on {salary.daysPresent} / {salary.totalDaysInMonth} days present
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#475569', fontSize: '13px' }}>
                  <IndianRupee size={28} style={{ marginBottom: '8px', opacity: 0.3 }} />
                  <p style={{ margin: 0 }}>Salary info not available.</p>
                  <p style={{ margin: '4px 0 0', fontSize: '11px' }}>Contact your manager.</p>
                </div>
              )}
            </div>

            {/* Low Stock Alert */}
            {inventory.length > 0 && (
              <div style={card}>
                <div style={cardHeader}>
                  <h3 style={cardTitle}><AlertTriangle size={16} color="#f97316"/> Low Stock Alert</h3>
                  <button onClick={() => onNavigate('INVENTORY')} style={linkBtn}>View →</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {inventory.map((med, i) => (
                    <div key={i} style={alertRow}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Package size={13} color="#f97316"/>
                        <span style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: 500 }}>{med.name}</span>
                      </div>
                      <span style={{ color: '#f97316', fontSize: '12px', fontWeight: 700 }}>{med.stockQuantity} left</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div style={card}>
              <h3 style={{ ...cardTitle, marginBottom: '14px' }}><Activity size={16} color="#34d399"/> Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <QuickAction icon={<ClipboardList size={15}/>} label="Raise New Indent"
                  color="#60a5fa" onClick={() => onNavigate('INDENTS')} />
                <QuickAction icon={<Calendar size={15}/>} label="My Attendance"
                  color="#a78bfa" onClick={() => onNavigate('ATTENDANCE')} />
              </div>
            </div>

          </div>
        </div>

        {/* ── Pending Indents Detail ── */}
        {pendingIndents.length > 0 && (
          <div style={{ ...card, marginTop: '20px' }}>
            <div style={cardHeader}>
              <h3 style={cardTitle}><Clock size={16} color="#f59e0b"/> Pending Approvals ({pendingIndents.length})</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pendingIndents.map((ind, i) => (
                <div key={i} className="nd-pending-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {ind.emergency && <Zap size={14} color="#f59e0b" fill="#f59e0b"/>}
                    <div>
                      <span style={{ color: '#60a5fa', fontFamily: 'monospace', fontSize: '12px', fontWeight: 700 }}>
                        {ind.indentNumber || '#' + (ind.id || '').slice(-6).toUpperCase()}
                      </span>
                      <span style={{ color: '#94a3b8', fontSize: '12px', marginLeft: '10px' }}>
                        {ind.wardName} • {(ind.items || []).length} item(s)
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ color: '#64748b', fontSize: '12px' }}>{fmt(ind.requestDate)}</span>
                    <StatusPill status={ind.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </>
  );
};

// ── Sub-components ──────────────────────────────────────────────────────────────

const StatCard = ({ icon, label, value, sub, color, onClick, isText }) => (
  <div
    style={{ ...statCard, cursor: onClick ? 'pointer' : 'default', borderColor: color + '44' }}
    onClick={onClick}
  >
    {icon}
    <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em' }}>{label}</span>
    <span style={{ color, fontSize: isText ? '18px' : '30px', fontWeight: 800, lineHeight: 1 }}>{value}</span>
    {sub && <span style={{ color: '#475569', fontSize: '11px' }}>{sub}</span>}
  </div>
);

const AttRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '8px 0', borderBottom: '1px solid #1e293b' }}>
    <span style={{ color: '#64748b', fontSize: '13px' }}>{label}</span>
    <span style={{ fontSize: '14px', fontWeight: 600 }}>{value}</span>
  </div>
);

const QuickAction = ({ icon, label, color, onClick }) => (
  <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', width: '100%', textAlign: 'left',
    backgroundColor: `${color}11`, border: `1px solid ${color}33`, color, fontWeight: 600, fontSize: '13px' }}>
    {icon} {label}
  </button>
);

const Empty = ({ icon, text }) => (
  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#475569' }}>
    <div style={{ opacity: 0.3, marginBottom: '10px' }}>{icon}</div>
    <p style={{ margin: 0, fontSize: '13px' }}>{text}</p>
  </div>
);

// ── Styles ─────────────────────────────────────────────────────────────────────
const loadingStyle   = { height: '100vh', backgroundColor: '#0f172a', color: '#60a5fa', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontSize: '16px' };
const h1             = { color: '#f1f5f9', margin: 0, fontSize: '24px', fontWeight: 700 };
const subtitle       = { color: '#64748b', margin: 0, fontSize: '13px' };
const refreshBtn     = { display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid #334155', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 };
const primaryBtn     = { display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#60a5fa', color: '#0f172a', border: 'none', padding: '9px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700 };
const statCard       = { backgroundColor: '#1e293b', border: '2px solid #334155', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' };
const card           = { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '22px' };
const cardHeader     = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' };
const cardTitle      = { color: '#f1f5f9', margin: 0, fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' };
const linkBtn        = { background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: '12px', fontWeight: 600 };
const tableStyle     = { width: '100%', borderCollapse: 'collapse' };
const th             = { textAlign: 'left', padding: '8px 10px', color: '#475569', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, borderBottom: '1px solid #334155' };
const td             = { padding: '11px 10px', verticalAlign: 'middle' };
const trStyle        = { borderBottom: '1px solid #1e293b' };
const alertRow       = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', backgroundColor: 'rgba(249,115,22,0.06)', borderRadius: '8px', border: '1px solid rgba(249,115,22,0.15)' };
const emergencyBanner = { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', color: '#f59e0b', fontSize: '13px', fontWeight: 600, marginBottom: '20px', flexWrap: 'wrap' };

export default NurseDashboard;