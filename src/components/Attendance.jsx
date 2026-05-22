import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import {
  Calendar, Clock, CheckCircle, XCircle, RefreshCw,
  UserCheck, LogIn, LogOut, BarChart2, ChevronLeft, ChevronRight,
  AlertCircle, TrendingUp
} from 'lucide-react';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const now = new Date();

const Attendance = () => {
  const { auth, hasRole } = useAuth();
  const isAdmin = hasRole('ADMIN');

  const [tab, setTab]               = useState('today');
  const [todayRec, setTodayRec]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [historyMonth, setHistoryMonth] = useState(now.getMonth() + 1);
  const [historyYear,  setHistoryYear]  = useState(now.getFullYear());
  const [monthRecords, setMonthRecords] = useState([]);
  const [histLoading,  setHistLoading]  = useState(false);
  const [msg, setMsg]               = useState({ text: '', type: '' });

  const username = auth?.username || 'You';

  const showMsg = (text, type) => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 4000);
  };

  const fetchToday = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      const res = await api.get('/staff/attendance/my/today');
      setTodayRec(res.data || null);
    } catch {
      setTodayRec(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchHistory = async () => {
    setHistLoading(true);
    try {
      const res = await api.get(
        `/staff/attendance/my/month?month=${historyMonth}&year=${historyYear}`
      );
      setMonthRecords(Array.isArray(res.data) ? res.data : []);
    } catch {
      setMonthRecords([]);
    } finally {
      setHistLoading(false);
    }
  };

  useEffect(() => { fetchToday(); }, []);
  useEffect(() => { if (tab === 'history') fetchHistory(); }, [tab, historyMonth, historyYear]);

  const handleClockIn = async () => {
    try {
      await api.post('/staff/attendance/my/check-in');
      showMsg('Clocked in successfully!', 'success');
      fetchToday(true);
    } catch (err) {
      showMsg(err.response?.data || 'Already clocked in today.', 'error');
    }
  };

  const handleClockOut = async () => {
    try {
      await api.put('/staff/attendance/my/check-out');
      showMsg('Clocked out successfully!', 'success');
      fetchToday(true);
    } catch (err) {
      showMsg(err.response?.data || 'No active clock-in found.', 'error');
    }
  };

  const daysPresent = monthRecords.filter(r => r.status === 'PRESENT').length;
  const daysInMonth = new Date(historyYear, historyMonth, 0).getDate();
  const pct         = daysInMonth > 0 ? Math.round((daysPresent / daysInMonth) * 100) : 0;

  const hoursWorked = (rec) => {
    if (!rec?.checkInTime || !rec?.checkOutTime) return null;
    const [ih, im] = rec.checkInTime.split(':').map(Number);
    const [oh, om] = rec.checkOutTime.split(':').map(Number);
    const mins = (oh * 60 + om) - (ih * 60 + im);
    if (mins <= 0) return null;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  const todayHours = hoursWorked(todayRec);
  const totalHoursMonth = monthRecords.reduce((sum, r) => {
    const h = hoursWorked(r);
    if (!h) return sum;
    const [hh, mm] = h.replace('h ', ':').replace('m', '').split(':').map(Number);
    return sum + hh * 60 + mm;
  }, 0);
  const totalHoursStr = totalHoursMonth > 0
    ? `${Math.floor(totalHoursMonth / 60)}h ${totalHoursMonth % 60}m`
    : '—';

  const todayStr = now.toLocaleDateString('en-IN', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  });

  if (loading) return (
    <div style={loadingStyle}>
      <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '10px' }} />
      Loading attendance…
    </div>
  );

  return (
    <div className="att-page">

      {/* ── Header ── */}
      <div className="att-header-row">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <Calendar size={22} color="#a78bfa" />
            <h1 className="att-h1">My Attendance</h1>
          </div>
          <p className="att-subtitle">
            {todayStr} · Logged in as <strong style={{ color: '#60a5fa' }}>{username}</strong>
          </p>
        </div>
        <button onClick={() => fetchToday(true)} style={refreshBtn}>
          <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* ── Toast ── */}
      {msg.text && (
        <div style={{ ...toast, ...(msg.type === 'success' ? toastOk : toastErr) }}>
          {msg.type === 'success' ? <CheckCircle size={15}/> : <AlertCircle size={15}/>}
          {msg.text}
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="att-tab-row">
        {[
          { key: 'today',   label: 'Today',          icon: Clock     },
          { key: 'history', label: 'Monthly History', icon: BarChart2 },
        ].map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={tab === t.key ? tabActive : tabStyle}>
              <Icon size={14}/> {t.label}
            </button>
          );
        })}
      </div>

      {/* ══════════ TODAY TAB ══════════ */}
      {tab === 'today' && (
        <>
          {/* Status Card */}
          <div className="att-status-card" style={{
            border: `1px solid ${todayRec ? 'rgba(16,185,129,0.25)' : 'rgba(249,115,22,0.2)'}`,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                backgroundColor: todayRec ? 'rgba(16,185,129,0.15)' : 'rgba(249,115,22,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {todayRec
                  ? <UserCheck size={36} color="#10b981"/>
                  : <XCircle  size={36} color="#f97316"/>
                }
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '20px', fontWeight: 800,
                  color: todayRec ? '#10b981' : '#f97316' }}>
                  {todayRec ? 'Present Today' : 'Not Checked In'}
                </p>
                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px' }}>
                  {todayRec
                    ? `Clocked in at ${todayRec.checkInTime?.substring(0, 5)}`
                    : 'Use the button below to clock in'}
                </p>
              </div>
            </div>

            {/* Time Row */}
            <div className="att-time-grid">
              <TimeBox label="Clock In"  value={todayRec?.checkInTime?.substring(0,5) || '—'}  color="#10b981" icon={<LogIn  size={16} color="#10b981"/>} />
              <TimeBox label="Clock Out" value={todayRec?.checkOutTime?.substring(0,5) || '—'} color="#f97316" icon={<LogOut size={16} color="#f97316"/>} />
              <TimeBox label="Hours"     value={todayHours || '—'}                              color="#60a5fa" icon={<Clock  size={16} color="#60a5fa"/>} />
            </div>

            {/* Clock Buttons */}
            <div className="att-clock-btns">
              {isAdmin && !todayRec && (
                <button onClick={handleClockIn} style={clockInBtn}>
                  <LogIn size={16}/> Clock In Now
                </button>
              )}
              {isAdmin && todayRec && !todayRec.checkOutTime && (
                <button onClick={handleClockOut} style={clockOutBtn}>
                  <LogOut size={16}/> Clock Out Now
                </button>
              )}
              {isAdmin && todayRec?.checkOutTime && (
                <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700 }}>
                  <CheckCircle size={18}/> Shift complete for today
                </div>
              )}
              {!isAdmin && (
                <div style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', padding: '10px 16px', backgroundColor: 'rgba(71,85,105,0.1)', borderRadius: '8px', border: '1px solid #334155' }}>
                  <AlertCircle size={15}/> Attendance is marked by your manager
                </div>
              )}
            </div>
          </div>

          {/* Summary Mini Cards */}
          <div className="att-summary-grid3">
            <SummaryMini
              label={`${MONTHS[now.getMonth()]} Present`}
              value={daysPresent}
              color="#10b981"
              icon={<CheckCircle size={18} color="#10b981"/>}
            />
            <SummaryMini
              label="Attendance %"
              value={`${Math.round((daysPresent / (now.getDate())) * 100) || 0}%`}
              color="#60a5fa"
              icon={<TrendingUp size={18} color="#60a5fa"/>}
            />
            <SummaryMini
              label="Hours This Month"
              value={totalHoursStr}
              color="#a78bfa"
              icon={<Clock size={18} color="#a78bfa"/>}
            />
          </div>
          <ChangePassword />
        </>
      )}

      {/* ══════════ HISTORY TAB ══════════ */}
      {tab === 'history' && (
        <>
          {/* Month/Year Picker */}
          <div className="att-picker-row">
            <button onClick={() => {
              if (historyMonth === 1) { setHistoryMonth(12); setHistoryYear(y => y - 1); }
              else setHistoryMonth(m => m - 1);
            }} style={arrowBtn}><ChevronLeft size={16}/></button>

            <select style={select} value={historyMonth} onChange={e => setHistoryMonth(Number(e.target.value))}>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select style={select} value={historyYear} onChange={e => setHistoryYear(Number(e.target.value))}>
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>

            <button onClick={() => {
              if (historyMonth === 12) { setHistoryMonth(1); setHistoryYear(y => y + 1); }
              else setHistoryMonth(m => m + 1);
            }} style={arrowBtn}><ChevronRight size={16}/></button>
          </div>

          {/* Stats Row */}
          <div className="att-summary-grid4">
            <SummaryMini label="Days Present" value={daysPresent} color="#10b981" icon={<CheckCircle size={16} color="#10b981"/>} />
            <SummaryMini
              label="Days Absent"
              value={Math.max(0, now.getMonth() + 1 === historyMonth && now.getFullYear() === historyYear
                ? now.getDate() - daysPresent
                : daysInMonth - daysPresent)}
              color="#ef4444" icon={<XCircle size={16} color="#ef4444"/>}
            />
            <SummaryMini label="Attendance %" value={`${pct}%`}      color="#60a5fa" icon={<TrendingUp size={16} color="#60a5fa"/>} />
            <SummaryMini label="Total Hours"  value={totalHoursStr}  color="#a78bfa" icon={<Clock size={16} color="#a78bfa"/>} />
          </div>

          {/* Table */}
          <div style={tableCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ color: '#f1f5f9', margin: 0, fontSize: '15px', fontWeight: 700 }}>
                {MONTHS[historyMonth - 1]} {historyYear} — Attendance Log
              </h3>
              {histLoading && <RefreshCw size={14} color="#60a5fa" style={{ animation: 'spin 1s linear infinite' }} />}
            </div>

            {/* Responsive table wrapper */}
            <div className="att-table-wrap">
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '480px' }}>
                <thead>
                  <tr>
                    {['Date', 'Day', 'Status', 'Clock In', 'Clock Out', 'Hours'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {monthRecords.length === 0 && !histLoading ? (
                    <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#475569', fontSize: '13px' }}>
                      No attendance records for this month.
                    </td></tr>
                  ) : monthRecords.map((rec, i) => {
                    const h  = hoursWorked(rec);
                    const dt = rec.date ? new Date(rec.date) : null;
                    const dayName = dt ? dt.toLocaleDateString('en-IN', { weekday: 'short' }) : '—';
                    const dateStr = dt ? dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : rec.date || '—';
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                        <td style={tdStyle}><span style={{ color: '#e2e8f0', fontWeight: 500 }}>{dateStr}</span></td>
                        <td style={tdStyle}><span style={{ color: '#64748b', fontSize: '12px' }}>{dayName}</span></td>
                        <td style={tdStyle}>
                          <span style={{
                            padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                            backgroundColor: rec.status === 'PRESENT' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)',
                            color: rec.status === 'PRESENT' ? '#10b981' : '#ef4444',
                            border: `1px solid ${rec.status === 'PRESENT' ? '#10b98133' : '#ef444433'}`,
                          }}>{rec.status === 'PRESENT' ? 'Present' : 'Absent'}</span>
                        </td>
                        <td style={tdStyle}><span style={{ color: '#10b981', fontSize: '13px' }}>{rec.checkInTime?.substring(0,5) || '—'}</span></td>
                        <td style={tdStyle}><span style={{ color: '#f97316', fontSize: '13px' }}>{rec.checkOutTime?.substring(0,5) || '—'}</span></td>
                        <td style={tdStyle}><span style={{ color: '#60a5fa', fontSize: '13px', fontWeight: 600 }}>{h || '—'}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* ── Page ── */
        .att-page {
          padding: 32px;
          background-color: #0f172a;
          min-height: 100vh;
          box-sizing: border-box;
        }

        /* ── Header ── */
        .att-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .att-h1 {
          color: #f1f5f9;
          margin: 0;
          font-size: 24px;
          font-weight: 700;
        }
        .att-subtitle {
          color: #64748b;
          margin: 0;
          font-size: 13px;
        }

        /* ── Tabs ── */
        .att-tab-row {
          display: flex;
          gap: 4px;
          background-color: #1e293b;
          padding: 4px;
          border-radius: 10px;
          border: 1px solid #334155;
          margin-bottom: 24px;
          width: fit-content;
          flex-wrap: wrap;
        }

        /* ── Status card ── */
        .att-status-card {
          background-color: #1e293b;
          border-radius: 16px;
          padding: 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* ── Time grid inside status card ── */
        .att-time-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
          margin-top: 24px;
          width: 100%;
        }

        /* ── Clock buttons row ── */
        .att-clock-btns {
          display: flex;
          gap: 12px;
          margin-top: 24px;
          justify-content: center;
          flex-wrap: wrap;
        }

        /* ── Summary grids ── */
        .att-summary-grid3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-top: 20px;
        }
        .att-summary-grid4 {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 20px;
        }

        /* ── Picker row ── */
        .att-picker-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        /* ── Table scroll wrapper ── */
        .att-table-wrap {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        /* ════════════════════════════════
           TABLET  (≤ 768px)
        ════════════════════════════════ */
        @media (max-width: 768px) {
          .att-page {
            padding: 16px;
          }
          .att-h1 {
            font-size: 20px;
          }
          .att-subtitle {
            font-size: 11px;
          }
          .att-status-card {
            padding: 20px 16px;
          }
          .att-time-grid {
            grid-template-columns: 1fr 1fr 1fr;
            gap: 10px;
          }
          .att-summary-grid3 {
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
          }
          .att-summary-grid4 {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
        }

        /* ════════════════════════════════
           MOBILE  (≤ 480px)
        ════════════════════════════════ */
        @media (max-width: 480px) {
          .att-page {
            padding: 12px;
          }
          .att-h1 {
            font-size: 18px;
          }
          .att-header-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .att-tab-row {
            width: 100%;
          }
          .att-tab-row button {
            flex: 1;
            justify-content: center;
          }
          .att-status-card {
            padding: 16px 12px;
            border-radius: 12px;
          }
          /* Stack time boxes 1-col on very small screens */
          .att-time-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          .att-summary-grid3 {
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          /* 3rd card spans full width on mobile */
          .att-summary-grid3 > *:last-child {
            grid-column: 1 / -1;
          }
          .att-summary-grid4 {
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          .att-picker-row {
            gap: 8px;
          }
          .att-clock-btns {
            flex-direction: column;
            align-items: stretch;
          }
          .att-clock-btns button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

const TimeBox = ({ label, value, color, icon }) => (
  <div style={{
    backgroundColor: '#0f172a', borderRadius: '10px', padding: '16px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
    border: '1px solid #1e293b',
  }}>
    {icon}
    <span style={{ color: '#64748b', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
    <span style={{ color, fontSize: '22px', fontWeight: 800 }}>{value}</span>
  </div>
);

const SummaryMini = ({ label, value, color, icon }) => (
  <div style={{
    backgroundColor: '#1e293b', border: `1px solid ${color}22`, borderRadius: '12px',
    padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px',
  }}>
    {icon}
    <span style={{ color: '#64748b', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
    <span style={{ color, fontSize: '22px', fontWeight: 800, lineHeight: 1 }}>{value}</span>
  </div>
);

// ── Inline styles (unchanged) ─────────────────────────────────────────────────
const loadingStyle = { height: '100vh', backgroundColor: '#0f172a', color: '#a78bfa', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontSize: '16px' };
const refreshBtn   = { display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid #334155', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 };
const toast        = { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', fontWeight: 600 };
const toastOk      = { backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid #10b98144' };
const toastErr     = { backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid #ef444444' };
const tabStyle     = { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', backgroundColor: 'transparent', color: '#94a3b8', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 };
const tabActive    = { ...tabStyle, backgroundColor: '#7c3aed', color: 'white' };
const clockInBtn   = { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px', backgroundColor: '#10b981', border: 'none', color: 'white', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '15px' };
const clockOutBtn  = { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px', backgroundColor: '#f97316', border: 'none', color: 'white', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '15px' };
const tableCard    = { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '22px' };
const thStyle      = { textAlign: 'left', padding: '8px 12px', color: '#475569', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, borderBottom: '1px solid #334155' };
const tdStyle      = { padding: '11px 12px', verticalAlign: 'middle' };
const select       = { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white', padding: '8px 12px', fontSize: '14px', outline: 'none', cursor: 'pointer' };
const arrowBtn     = { backgroundColor: '#1e293b', border: '1px solid #334155', color: '#94a3b8', borderRadius: '8px', padding: '8px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' };

// ── Change Password ───────────────────────────────────────────────────────────
const ChangePassword = () => {
  const [show,    setShow]    = useState(false);
  const [current, setCurrent] = useState('');
  const [newPwd,  setNewPwd]  = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwdMsg,  setPwdMsg]  = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = async () => {
    if (!current)           return setPwdMsg({ text: 'Enter current password.', type: 'error' });
    if (newPwd.length < 4)  return setPwdMsg({ text: 'New password must be at least 4 characters.', type: 'error' });
    if (newPwd !== confirm)  return setPwdMsg({ text: 'Passwords do not match.', type: 'error' });

    setLoading(true);
    try {
      await api.put('/staff/change-password', { currentPassword: current, newPassword: newPwd });
      setPwdMsg({ text: 'Password changed successfully!', type: 'success' });
      setCurrent(''); setNewPwd(''); setConfirm('');
      setTimeout(() => setShow(false), 2000);
    } catch (err) {
      setPwdMsg({ text: err.response?.data || 'Failed to change password.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '20px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ color: '#f1f5f9', margin: 0, fontSize: '14px', fontWeight: 700 }}>🔑 Change Password</h3>
        <button onClick={() => setShow(!show)}
          style={{ background: 'none', border: '1px solid #334155', color: '#94a3b8', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
          {show ? 'Cancel' : 'Change'}
        </button>
      </div>

      {show && (
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '400px', width: '100%' }}>
          {pwdMsg.text && (
            <div style={{
              padding: '10px 14px', borderRadius: '8px', fontSize: '13px',
              backgroundColor: pwdMsg.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              color: pwdMsg.type === 'success' ? '#10b981' : '#ef4444',
              border: `1px solid ${pwdMsg.type === 'success' ? '#10b98144' : '#ef444444'}`,
            }}>
              {pwdMsg.text}
            </div>
          )}
          {[
            { label: 'Current Password', val: current, set: setCurrent, ph: 'Enter current password' },
            { label: 'New Password',     val: newPwd,  set: setNewPwd,  ph: 'Min 4 characters'       },
            { label: 'Confirm New Password', val: confirm, set: setConfirm, ph: 'Repeat new password' },
          ].map(({ label, val, set, ph }) => (
            <div key={label}>
              <label style={{ color: '#94a3b8', fontSize: '12px', display: 'block', marginBottom: '6px' }}>{label}</label>
              <input type="password" value={val} onChange={e => set(e.target.value)} placeholder={ph}
                style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          ))}
          <button onClick={handleChange} disabled={loading}
            style={{ padding: '11px', backgroundColor: '#7c3aed', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '14px', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Changing...' : '🔑 Update Password'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Attendance;