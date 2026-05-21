import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import {
  UserCheck, Clock, Calendar, IndianRupee, RefreshCw,
  CheckCircle, XCircle, TrendingUp, Package, AlertTriangle,
  LogIn, LogOut, BarChart2
} from 'lucide-react';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const EmployeeDashboard = ({ onNavigate }) => {
  const { auth } = useAuth();
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [todayAtt, setTodayAtt]       = useState(null);
  const [monthAtt, setMonthAtt]       = useState([]);
  const [salary, setSalary]           = useState(null);
  const [inventory, setInventory]     = useState([]);
  const [salaryLoading, setSalaryLoading] = useState(false);

  const now       = new Date();
  const username  = auth?.username || 'Employee';
  const todayStr  = now.toLocaleDateString('en-IN', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  });

  const fetchAll = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);

      const [todayRes, monthRes, invRes] = await Promise.all([
        api.get('/staff/attendance/my/today').catch(() => ({ data: null })),
        api.get(`/staff/attendance/my/month?month=${now.getMonth() + 1}&year=${now.getFullYear()}`).catch(() => ({ data: [] })),
        api.get('/medicines').catch(() => ({ data: [] })),
      ]);

      setTodayAtt(todayRes.data);
      setMonthAtt(Array.isArray(monthRes.data) ? monthRes.data : []);
      setInventory((invRes.data || []).slice(0, 8));

    } catch (err) {
      console.error('EmployeeDashboard fetch error:', err);
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

  // Month attendance stats
  const daysPresent  = monthAtt.filter(a => a.status === 'PRESENT').length;
  const totalLogged  = monthAtt.length;
  const workingDays  = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const attendancePct = workingDays > 0 ? Math.round((daysPresent / workingDays) * 100) : 0;

  // Calc hours worked today
  let hoursToday = null;
  if (todayAtt?.checkInTime && todayAtt?.checkOutTime) {
    const [ih, im] = todayAtt.checkInTime.split(':').map(Number);
    const [oh, om] = todayAtt.checkOutTime.split(':').map(Number);
    const mins = (oh * 60 + om) - (ih * 60 + im);
    hoursToday = `${Math.floor(mins / 60)}h ${mins % 60}m`;
  }

  if (loading) return (
    <div style={loadingStyle}>
      <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
      Loading your dashboard…
    </div>
  );

  return (
    <div style={page}>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div style={headerRow}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <UserCheck size={22} color="#34d399" />
            <h1 style={h1}>Welcome, {username}</h1>
          </div>
          <p style={subtitle}>{todayStr}</p>
        </div>
        <button onClick={() => fetchAll(true)} style={refreshBtn}>
          <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* ── Today's Status Banner ─────────────────────────────────────── */}
      <div style={{
        ...banner,
        backgroundColor: todayAtt ? 'rgba(16,185,129,0.08)' : 'rgba(249,115,22,0.08)',
        borderColor: todayAtt ? 'rgba(16,185,129,0.3)' : 'rgba(249,115,22,0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {todayAtt
            ? <CheckCircle size={20} color="#10b981" />
            : <XCircle size={20} color="#f97316" />
          }
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '15px',
              color: todayAtt ? '#10b981' : '#f97316' }}>
              {todayAtt ? 'You are marked Present Today' : 'You have not checked in today'}
            </p>
            {todayAtt && (
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                In: {todayAtt.checkInTime?.substring(0, 5) || '—'}
                {todayAtt.checkOutTime && ` · Out: ${todayAtt.checkOutTime.substring(0, 5)}`}
                {hoursToday && ` · ${hoursToday} worked`}
              </p>
            )}
          </div>
        </div>
        <button onClick={() => onNavigate('ATTENDANCE')} style={linkBtn}>View Attendance →</button>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────── */}
      <div style={cardGrid}>
        <StatCard
          icon={<Calendar size={20} color="#60a5fa"/>}
          label="Days Present This Month"
          value={daysPresent}
          sub={`of ${workingDays} working days`}
          color="#60a5fa"
        />
        <StatCard
          icon={<TrendingUp size={20} color="#34d399"/>}
          label="Attendance This Month"
          value={`${attendancePct}%`}
          sub={totalLogged > 0 ? `${daysPresent} present / ${totalLogged} logged` : 'No records yet'}
          color="#34d399"
        />
        <StatCard
          icon={<Clock size={20} color="#a78bfa"/>}
          label="Today's Hours"
          value={hoursToday || (todayAtt ? 'In Progress' : '—')}
          sub={todayAtt?.checkInTime ? `In at ${todayAtt.checkInTime.substring(0,5)}` : 'Not clocked in'}
          color="#a78bfa"
          isText
        />
        <StatCard
          icon={<IndianRupee size={20} color="#fbbf24"/>}
          label="Est. Salary This Month"
          value={salary ? `₹${(salary.finalPayableAmount || 0).toLocaleString('en-IN')}` : salaryLoading ? '...' : '—'}
          sub={salary ? `Base: ₹${(salary.baseMonthlySalary || 0).toLocaleString('en-IN')}` : 'Not available'}
          color="#fbbf24"
          isText
        />
      </div>

      {/* ── Main Grid ───────────────────────────────────────────────────── */}
      <div style={mainGrid}>

        {/* LEFT — Monthly Attendance Calendar */}
        <div style={card}>
          <div style={cardHeader}>
            <h3 style={cardTitle}><Calendar size={16} color="#60a5fa"/> {MONTHS[now.getMonth()]} {now.getFullYear()} Attendance</h3>
            <button onClick={() => onNavigate('ATTENDANCE')} style={linkBtnSm}>Full History →</button>
          </div>

          {/* Mini calendar dots */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '16px' }}>
            {['S','M','T','W','T','F','S'].map((d, i) => (
              <div key={i} style={{ textAlign: 'center', color: '#475569', fontSize: '11px', fontWeight: 700, padding: '4px 0' }}>{d}</div>
            ))}
            {(() => {
              const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
              const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
              const cells = [];
              for (let i = 0; i < firstDay; i++) cells.push(<div key={`blank-${i}`} />);
              for (let d = 1; d <= daysInMonth; d++) {
                const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                const rec = monthAtt.find(a => a.date === dateStr || (a.checkInTime && new Date(a.date || a.checkInTime).getDate() === d));
                const isToday = d === now.getDate();
                const isPresent = rec?.status === 'PRESENT';
                const isFuture = d > now.getDate();
                cells.push(
                  <div key={d} style={{
                    width: '100%', aspectRatio: '1', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: isToday ? 800 : 500,
                    backgroundColor: isToday ? '#2563eb' : isPresent ? 'rgba(16,185,129,0.2)' : isFuture ? 'transparent' : 'rgba(239,68,68,0.08)',
                    color: isToday ? 'white' : isPresent ? '#10b981' : isFuture ? '#334155' : '#475569',
                    border: isToday ? '2px solid #3b82f6' : isPresent ? '1px solid rgba(16,185,129,0.3)' : '1px solid transparent',
                  }}>
                    {d}
                  </div>
                );
              }
              return cells;
            })()}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: '#64748b' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.3)' }}/>Present
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: 'rgba(239,68,68,0.08)' }}/>Absent
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#2563eb' }}/>Today
            </span>
          </div>
        </div>

        {/* RIGHT column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Salary Card */}
          <div style={card}>
            <div style={cardHeader}>
              <h3 style={cardTitle}><IndianRupee size={16} color="#fbbf24"/> Salary — {MONTHS[now.getMonth()]}</h3>
            </div>
            {salaryLoading ? (
              <div style={{ color: '#475569', fontSize: '13px', textAlign: 'center', padding: '16px' }}>Loading…</div>
            ) : salary ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {[
                  { label: 'Base Monthly Salary', value: `₹${(salary.baseMonthlySalary || 0).toLocaleString('en-IN')}`, color: '#94a3b8' },
                  { label: 'Days Present',         value: salary.daysPresent,      color: '#10b981' },
                  { label: 'Days Absent',          value: (salary.totalDaysInMonth || 0) - (salary.daysPresent || 0), color: '#f87171' },
                  { label: 'Net Payable',          value: `₹${(salary.finalPayableAmount || 0).toLocaleString('en-IN')}`, color: '#fbbf24', large: true },
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

          {/* Quick Links */}
          <div style={card}>
            <h3 style={{ ...cardTitle, marginBottom: '14px' }}>Quick Access</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <QuickAction icon={<Calendar size={15}/>}  label="My Attendance" color="#60a5fa" onClick={() => onNavigate('ATTENDANCE')} />
              <QuickAction icon={<Package size={15}/>}   label="View Inventory" color="#34d399" onClick={() => onNavigate('INVENTORY')} />
            </div>
          </div>

        </div>
      </div>

      {/* ── Inventory View (read-only) ─────────────────────────────────── */}
      <div style={{ ...card, marginTop: '20px' }}>
        <div style={cardHeader}>
          <h3 style={cardTitle}><Package size={16} color="#34d399"/> Inventory Overview (Read Only)</h3>
          <button onClick={() => onNavigate('INVENTORY')} style={linkBtnSm}>Full Inventory →</button>
        </div>
        {inventory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#475569', fontSize: '13px' }}>No inventory data.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Medicine', 'Rack', 'Batch No.', 'Expiry', 'Stock'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inventory.map((med, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={tdStyle}><span style={{ color: '#e2e8f0', fontWeight: 500 }}>{med.name}</span></td>
                  <td style={tdStyle}><span style={{ color: '#94a3b8', fontSize: '12px' }}>{med.rackNumber || '—'}</span></td>
                  <td style={tdStyle}><span style={{ color: '#64748b', fontFamily: 'monospace', fontSize: '12px' }}>{med.batchNo || '—'}</span></td>
                  <td style={tdStyle}>
                    <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                      {med.expiryDate ? new Date(med.expiryDate).toLocaleDateString('en-IN') : '—'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      color: med.stockQuantity <= (med.minStockLevel || 10) ? '#f97316' : '#10b981',
                      fontWeight: 700, fontSize: '13px'
                    }}>
                      {med.stockQuantity} units
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────────────

const StatCard = ({ icon, label, value, sub, color, isText }) => (
  <div style={{ backgroundColor: '#1e293b', border: `2px solid ${color}33`, borderRadius: '14px',
    padding: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
    {icon}
    <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</span>
    <span style={{ color, fontSize: isText ? '20px' : '30px', fontWeight: 800, lineHeight: 1 }}>{value}</span>
    {sub && <span style={{ color: '#475569', fontSize: '11px' }}>{sub}</span>}
  </div>
);

const QuickAction = ({ icon, label, color, onClick }) => (
  <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
    borderRadius: '8px', cursor: 'pointer', width: '100%', textAlign: 'left',
    backgroundColor: `${color}11`, border: `1px solid ${color}33`, color, fontWeight: 600, fontSize: '13px' }}>
    {icon} {label}
  </button>
);

// ── Styles ─────────────────────────────────────────────────────────────────────
const page       = { padding: '32px', marginLeft: '240px', backgroundColor: '#0f172a', minHeight: '100vh' };
const loadingStyle = { height: '100vh', backgroundColor: '#0f172a', color: '#34d399', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontSize: '16px', marginLeft: '240px' };
const headerRow  = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' };
const h1         = { color: '#f1f5f9', margin: 0, fontSize: '24px', fontWeight: 700 };
const subtitle   = { color: '#64748b', margin: 0, fontSize: '13px' };
const refreshBtn = { display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid #334155', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 };
const banner     = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderRadius: '12px', border: '1px solid', marginBottom: '24px', flexWrap: 'wrap', gap: '10px' };
const linkBtn    = { background: 'none', border: '1px solid #334155', color: '#60a5fa', cursor: 'pointer', fontSize: '12px', fontWeight: 600, padding: '6px 12px', borderRadius: '6px' };
const cardGrid   = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' };
const mainGrid   = { display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' };
const card       = { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '22px' };
const cardHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' };
const cardTitle  = { color: '#f1f5f9', margin: 0, fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' };
const linkBtnSm  = { background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: '12px', fontWeight: 600 };
const thStyle    = { textAlign: 'left', padding: '8px 10px', color: '#475569', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, borderBottom: '1px solid #334155' };
const tdStyle    = { padding: '10px 10px', verticalAlign: 'middle' };

export default EmployeeDashboard;