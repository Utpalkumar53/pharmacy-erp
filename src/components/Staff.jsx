import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import {
  Plus, Edit, Trash2, UserCheck, UserX, Clock,
  LogIn, LogOut, IndianRupee, CheckCircle, AlertCircle,
  X, Save, Users, Calendar, BarChart2, Key
} from 'lucide-react';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const ROLE_OPTIONS = [
  { label: 'Manager',       value: 'Manager',      systemRole: 'ADMIN'      },
  { label: 'Pharmacist',    value: 'Pharmacist',   systemRole: 'PHARMACIST' },
  { label: 'Nurse',         value: 'Nurse',         systemRole: 'NURSE'      },
  { label: 'Cashier',       value: 'Cashier',       systemRole: 'EMPLOYEE'   },
  { label: 'Counter Staff', value: 'Counter Staff', systemRole: 'EMPLOYEE'   },
  { label: 'Helper',        value: 'Helper',        systemRole: 'EMPLOYEE'   },
  { label: 'Delivery Boy',  value: 'Delivery Boy',  systemRole: 'EMPLOYEE'   },
];

const now = new Date();

const emptyForm = { name: '', role: '', phone: '', monthlySalary: '', active: true };

const previewUsername = (name) =>
  name.trim().toLowerCase().replaceAll(/\s+/g, '_');

const Staff = () => {
  const [staff,         setStaff]         = useState([]);
  const [attendance,    setAttendance]    = useState([]);
  const [showModal,     setShowModal]     = useState(false);
  const [isEditing,     setIsEditing]     = useState(false);
  const [currentId,     setCurrentId]     = useState(null);
  const [form,          setForm]          = useState({ ...emptyForm });
  const [tab,           setTab]           = useState('staff');
  const [msg,           setMsg]           = useState({ text: '', type: '' });
  const [loading,       setLoading]       = useState(false);

  const [salaryStaff,   setSalaryStaff]   = useState('');
  const [salaryMonth,   setSalaryMonth]   = useState(now.getMonth() + 1);
  const [salaryYear,    setSalaryYear]    = useState(now.getFullYear());
  const [salaryReport,  setSalaryReport]  = useState(null);
  const [salaryLoading, setSalaryLoading] = useState(false);

  useEffect(() => {
    fetchStaff();
    fetchTodayAttendance();
  }, []);

  const fetchStaff = async () => {
    try {
      const res = await api.get('/staff');
      setStaff(Array.isArray(res.data) ? res.data : []);
    } catch { showMsg('Failed to load staff.', 'error'); }
  };

  const fetchTodayAttendance = async () => {
    try {
      const res = await api.get('/staff/attendance/today');
      setAttendance(Array.isArray(res.data) ? res.data : []);
    } catch { setAttendance([]); }
  };

  const showMsg = (text, type) => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 4000);
  };

  const openAdd = () => {
    setIsEditing(false); setCurrentId(null);
    setForm({ ...emptyForm }); setShowModal(true);
  };

  const openEdit = (m) => {
    setIsEditing(true); setCurrentId(m.id);
    setForm({ name: m.name || '', role: m.role || '', phone: m.phone || '',
      monthlySalary: m.monthlySalary || '', active: m.active !== false });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim())  return showMsg('Name is required.', 'error');
    if (!form.role.trim())  return showMsg('Role is required.', 'error');
    if (!form.phone.trim()) return showMsg('Phone is required.', 'error');
    setLoading(true);
    try {
      const payload = { ...form, monthlySalary: Number(form.monthlySalary) || 0 };
      if (isEditing) {
        const { username, ...updatePayload } = payload;
        await api.put(`/staff/${currentId}`, updatePayload);
        showMsg('Staff updated! Role access changed automatically.', 'success');
      } else {
        const res = await api.post('/staff', payload);
        const username = res.data.username;
        showMsg(`Staff added! Login: "${username}" | Password: "${username}" (default)`, 'success');
      }
      setShowModal(false); fetchStaff();
    } catch { showMsg('Failed to save staff.', 'error'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete staff "${name}"? Their login account will still exist.`)) return;
    try {
      await api.delete(`/staff/${id}`);
      showMsg('Staff deleted.', 'success'); fetchStaff();
    } catch { showMsg('Failed to delete.', 'error'); }
  };

  const handleClockIn = async (id) => {
    try {
      await api.post(`/staff/attendance/check-in/${id}`);
      showMsg('Clock-in recorded!', 'success'); fetchTodayAttendance();
    } catch (err) { showMsg(err.response?.data || 'Already clocked in today.', 'error'); }
  };

  const handleClockOut = async (id) => {
    try {
      await api.put(`/staff/attendance/check-out/${id}`);
      showMsg('Clock-out recorded!', 'success'); fetchTodayAttendance();
    } catch (err) { showMsg(err.response?.data || 'No active clock-in found.', 'error'); }
  };

  const fetchSalaryReport = async () => {
    if (!salaryStaff) return showMsg('Select a staff member.', 'error');
    setSalaryLoading(true); setSalaryReport(null);
    try {
      const res = await api.get(`/staff/salary-report/${salaryStaff}?month=${salaryMonth}&year=${salaryYear}`);
      setSalaryReport(res.data);
    } catch { showMsg('Failed to fetch salary report.', 'error'); }
    finally { setSalaryLoading(false); }
  };

  const isClockedIn  = (id) => attendance.some(a => a.staffId === id && a.status === 'PRESENT');
  const isClockedOut = (id) => attendance.some(a => a.staffId === id && a.checkOutTime !== null);

  const todayStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  });

  return (
    <div className="staff-page">

      {/* ── Header ── */}
      <div className="staff-header">
        <div>
          <h1 style={s.h1}>Staff Management</h1>
          <p style={s.subtitle}>Manage staff, attendance and salary — {todayStr}</p>
        </div>
        <button onClick={openAdd} style={s.addBtn}>
          <Plus size={18}/> ADD STAFF
        </button>
      </div>

      {/* ── Toast ── */}
      {msg.text && (
        <div style={{ ...s.toast, ...(msg.type === 'success' ? s.toastOk : s.toastErr) }}>
          {msg.type === 'success' ? <CheckCircle size={16}/> : <AlertCircle size={16}/>}
          <span style={{ flex: 1 }}>{msg.text}</span>
        </div>
      )}

      {/* ── Summary cards ── */}
      <div className="staff-card-grid">
        <div style={s.statCard}>
          <Users size={20} color="#60a5fa"/>
          <span style={s.statLabel}>TOTAL STAFF</span>
          <span style={{ ...s.statVal, color: '#60a5fa' }}>{staff.length}</span>
        </div>
        <div style={s.statCard}>
          <UserCheck size={20} color="#10b981"/>
          <span style={s.statLabel}>PRESENT TODAY</span>
          <span style={{ ...s.statVal, color: '#10b981' }}>
            {attendance.filter(a => a.status === 'PRESENT').length}
          </span>
        </div>
        <div style={s.statCard}>
          <UserX size={20} color="#f97316"/>
          <span style={s.statLabel}>NOT CHECKED IN</span>
          <span style={{ ...s.statVal, color: '#f97316' }}>
            {Math.max(0, staff.length - attendance.filter(a => a.status === 'PRESENT').length)}
          </span>
        </div>
        <div style={s.statCard}>
          <IndianRupee size={20} color="#a78bfa"/>
          <span style={s.statLabel}>MONTHLY PAYROLL</span>
          <span style={{ ...s.statVal, color: '#a78bfa', fontSize: '20px' }}>
            ₹{staff.reduce((sum, m) => sum + (m.monthlySalary || 0), 0).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="staff-tab-row">
        {[
          { key: 'staff',      label: 'Staff List',       icon: Users     },
          { key: 'attendance', label: 'Today Attendance',  icon: Clock     },
          { key: 'salary',     label: 'Salary Report',    icon: BarChart2 },
        ].map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={tab === t.key ? s.tabActive : s.tab}>
              <Icon size={14}/> <span className="staff-tab-label">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── STAFF LIST TAB ── */}
      {tab === 'staff' && (
        <div style={s.tableCard}>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ ...s.table, minWidth: '700px' }}>
              <thead>
                <tr>
                  <th style={s.th}>Name</th>
                  <th style={s.th} className="staff-col-role">Role</th>
                  <th style={s.th} className="staff-col-user">Username</th>
                  <th style={s.th} className="staff-col-phone">Phone</th>
                  <th style={s.th} className="staff-col-salary">Salary</th>
                  <th style={s.th} className="staff-col-join">Joining</th>
                  <th style={s.th}>Status</th>
                  <th style={s.th}>Attendance</th>
                  <th style={s.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={s.empty}>
                      No staff added yet. Click ADD STAFF to get started.
                    </td>
                  </tr>
                ) : staff.map(m => {
                  const checkedIn  = isClockedIn(m.id);
                  const checkedOut = isClockedOut(m.id);
                  return (
                    <tr key={m.id}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(96,165,250,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ ...s.td, color: 'white', fontWeight: '600' }}>{m.name}</td>
                      <td style={s.td} className="staff-col-role">
                        <span style={s.rolePill}>{m.role}</span>
                      </td>
                      <td style={s.td} className="staff-col-user">
                        <span style={{ color: '#60a5fa', fontFamily: 'monospace', fontSize: '12px' }}>
                          {m.username || '—'}
                        </span>
                      </td>
                      <td style={s.td} className="staff-col-phone">{m.phone}</td>
                      <td style={{ ...s.td, color: '#a78bfa', fontWeight: '600' }} className="staff-col-salary">
                        ₹{(m.monthlySalary || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ ...s.td, color: '#64748b' }} className="staff-col-join">
                        {m.joiningDate ? new Date(m.joiningDate).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td style={s.td}>
                        <span style={{
                          ...s.statusPill,
                          backgroundColor: m.active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                          color:           m.active ? '#10b981' : '#ef4444',
                          border:          `1px solid ${m.active ? '#10b981' : '#ef4444'}44`,
                        }}>
                          {m.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={s.td}>
                        {!checkedIn ? (
                          <button onClick={() => handleClockIn(m.id)} style={s.clockInBtn}>
                            <LogIn size={13}/> <span className="staff-btn-label">Clock In</span>
                          </button>
                        ) : !checkedOut ? (
                          <button onClick={() => handleClockOut(m.id)} style={s.clockOutBtn}>
                            <LogOut size={13}/> <span className="staff-btn-label">Clock Out</span>
                          </button>
                        ) : (
                          <span style={{ color: '#64748b', fontSize: '12px' }}>✓ Done</span>
                        )}
                      </td>
                      <td style={s.td}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button style={s.editBtn} onClick={() => openEdit(m)}><Edit size={13}/></button>
                          <button style={s.delBtn} onClick={() => handleDelete(m.id, m.name)}><Trash2 size={13}/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ATTENDANCE TAB ── */}
      {tab === 'attendance' && (
        <div style={s.tableCard}>
          <div className="staff-att-header">
            <h3 style={{ color: 'white', margin: 0, fontSize: '16px' }}>
              Today's Attendance — {todayStr}
            </h3>
            <button onClick={fetchTodayAttendance} style={{ ...s.clockInBtn, padding: '8px 14px' }}>
              Refresh
            </button>
          </div>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ ...s.table, minWidth: '440px' }}>
              <thead>
                <tr>
                  <th style={s.th}>Staff Name</th>
                  <th style={s.th}>Status</th>
                  <th style={s.th}>Clock In</th>
                  <th style={s.th} className="staff-col-cout">Clock Out</th>
                  <th style={s.th} className="staff-col-hrs">Hours</th>
                </tr>
              </thead>
              <tbody>
                {staff.map(m => {
                  const rec      = attendance.find(a => a.staffId === m.id);
                  const checkIn  = rec?.checkInTime;
                  const checkOut = rec?.checkOutTime;
                  let hours = '—';
                  if (checkIn && checkOut) {
                    const [ih, im] = checkIn.split(':').map(Number);
                    const [oh, om] = checkOut.split(':').map(Number);
                    const mins = (oh * 60 + om) - (ih * 60 + im);
                    hours = `${Math.floor(mins / 60)}h ${mins % 60}m`;
                  }
                  return (
                    <tr key={m.id}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(96,165,250,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ ...s.td, color: 'white', fontWeight: '500' }}>{m.name}</td>
                      <td style={s.td}>
                        {rec ? (
                          <span style={{ ...s.statusPill, backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid #10b98144' }}>Present</span>
                        ) : (
                          <span style={{ ...s.statusPill, backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid #ef444444' }}>Not checked in</span>
                        )}
                      </td>
                      <td style={{ ...s.td, color: '#10b981' }}>{checkIn  ? checkIn.substring(0, 5)  : '—'}</td>
                      <td style={{ ...s.td, color: '#f97316' }} className="staff-col-cout">{checkOut ? checkOut.substring(0, 5) : '—'}</td>
                      <td style={{ ...s.td, color: '#60a5fa' }} className="staff-col-hrs">{hours}</td>
                    </tr>
                  );
                })}
                {staff.length === 0 && (
                  <tr><td colSpan={5} style={s.empty}>No staff found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SALARY REPORT TAB ── */}
      {tab === 'salary' && (
        <div style={s.tableCard}>
          <h3 style={{ color: 'white', margin: '0 0 20px', fontSize: '16px' }}>Monthly Salary Report</h3>
          <div className="staff-salary-controls">
            <select style={s.select} value={salaryStaff}
              onChange={e => { setSalaryStaff(e.target.value); setSalaryReport(null); }}>
              <option value="">-- Select Staff --</option>
              {staff.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
              ))}
            </select>
            <select style={s.select} value={salaryMonth}
              onChange={e => setSalaryMonth(Number(e.target.value))}>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select style={s.select} value={salaryYear}
              onChange={e => setSalaryYear(Number(e.target.value))}>
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={fetchSalaryReport} disabled={salaryLoading} style={s.addBtn}>
              {salaryLoading ? 'Loading...' : <><BarChart2 size={15}/> Generate</>}
            </button>
          </div>

          {salaryReport && (
            <div style={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #334155', padding: '24px', maxWidth: '500px' }}>
              <h4 style={{ color: '#60a5fa', margin: '0 0 20px', fontSize: '16px' }}>
                Salary Report — {MONTHS[salaryMonth - 1]} {salaryYear}
              </h4>
              {[
                { label: 'Staff Name',           value: salaryReport.staffName,                                              color: 'white'   },
                { label: 'Role',                 value: salaryReport.role,                                                   color: '#94a3b8' },
                { label: 'Total Days in Month',  value: salaryReport.totalDaysInMonth,                                       color: '#cbd5e1' },
                { label: 'Days Present',         value: salaryReport.daysPresent,                                            color: '#10b981' },
                { label: 'Days Absent',          value: salaryReport.totalDaysInMonth - salaryReport.daysPresent,            color: '#f87171' },
                { label: 'Base Monthly Salary',  value: `₹${(salaryReport.baseMonthlySalary || 0).toLocaleString('en-IN')}`,color: '#a78bfa' },
                { label: 'Final Payable Amount', value: `₹${(salaryReport.finalPayableAmount || 0).toLocaleString('en-IN')}`,color: '#fbbf24', large: true },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1e293b' }}>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>{row.label}</span>
                  <span style={{ color: row.color, fontWeight: row.large ? '700' : '500', fontSize: row.large ? '18px' : '14px' }}>
                    {row.value}
                  </span>
                </div>
              ))}
              <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '8px', fontSize: '12px', color: '#fbbf24' }}>
                💡 Calculated as: (₹{salaryReport.baseMonthlySalary} ÷ {salaryReport.totalDaysInMonth} days)
                × {salaryReport.daysPresent} days present = <strong>₹{salaryReport.finalPayableAmount}</strong>
              </div>
            </div>
          )}
          {!salaryReport && !salaryLoading && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>
              Select staff, month and year then click Generate.
            </div>
          )}
        </div>
      )}

      {/* ── MODAL ── */}
      {showModal && (
        <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="staff-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ color: '#60a5fa', margin: 0, fontSize: '18px' }}>
                {isEditing ? 'Edit Staff' : 'Add New Staff'}
              </h2>
              <button onClick={() => setShowModal(false)} style={s.closeBtn}><X size={18}/></button>
            </div>

            <label style={s.label}>Full Name *</label>
            <input style={s.input} placeholder="e.g. Ramesh Kumar"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}/>

            {!isEditing && form.name.trim() && (
              <div style={{ marginTop: '-10px', marginBottom: '16px', padding: '8px 12px', backgroundColor: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: '6px', fontSize: '12px', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <Key size={12}/>
                Login: <strong>{previewUsername(form.name)}</strong>
                &nbsp;/ Password: <strong>{previewUsername(form.name)}</strong>
              </div>
            )}

            <label style={s.label}>Role *</label>
            <select style={{ ...s.input, cursor: 'pointer' }}
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="">-- Select Role --</option>
              {ROLE_OPTIONS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>

            {form.role && (
              <div style={{ marginTop: '-10px', marginBottom: '16px', fontSize: '11px', color: '#64748b' }}>
                {form.role === 'Manager'    && '🔑 Full access (same as Admin)'}
                {form.role === 'Pharmacist' && '💊 Billing, Inventory, Sales, Indents'}
                {form.role === 'Nurse'      && '🏥 Indents + read-only attendance'}
                {['Cashier','Counter Staff','Helper','Delivery Boy'].includes(form.role) && '👤 Read-only inventory + attendance'}
              </div>
            )}

            <label style={s.label}>Phone *</label>
            <input style={s.input} placeholder="e.g. 9801234567"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}/>

            <label style={s.label}>Monthly Salary (₹)</label>
            <input type="number" style={s.input} placeholder="e.g. 15000"
              value={form.monthlySalary}
              onChange={e => setForm({ ...form, monthlySalary: e.target.value })}/>

            <label style={s.label}>Status</label>
            <select style={{ ...s.input, marginBottom: '24px' }}
              value={form.active}
              onChange={e => setForm({ ...form, active: e.target.value === 'true' })}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>

            {isEditing && (
              <div style={{ marginBottom: '20px', padding: '10px 14px', backgroundColor: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '8px', fontSize: '12px', color: '#fbbf24' }}>
                ⚠️ Changing the role will automatically update this staff member's system access.
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
              <button onClick={() => setShowModal(false)} style={s.cancelBtn}>Cancel</button>
              <button onClick={handleSave} disabled={loading}
                style={{ ...s.addBtn, opacity: loading ? 0.6 : 1 }}>
                <Save size={15}/> {loading ? 'Saving...' : (isEditing ? 'Update' : 'Add Staff')}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* ── Page ── */
        .staff-page {
          padding: 40px;
          background-color: #0f172a;
          min-height: 100vh;
          box-sizing: border-box;
        }

        /* ── Header ── */
        .staff-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 12px;
        }

        /* ── Stat cards: 4-col desktop ── */
        .staff-card-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        /* ── Tab row ── */
        .staff-tab-row {
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

        /* ── Attendance header ── */
        .staff-att-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 10px;
        }

        /* ── Salary controls ── */
        .staff-salary-controls {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 24px;
          align-items: center;
        }

        /* ── Modal ── */
        .staff-modal {
          background-color: #1e293b;
          padding: 32px;
          border-radius: 16px;
          width: 100%;
          max-width: 460px;
          border: 1px solid #334155;
          max-height: 90vh;
          overflow-y: auto;
          box-sizing: border-box;
        }

        /* ════════════════════════════════
           TABLET  (≤ 900px)
        ════════════════════════════════ */
        @media (max-width: 900px) {
          .staff-page {
            padding: 24px 16px;
          }
          .staff-card-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          /* Hide less-critical table columns */
          .staff-col-user,
          .staff-col-join {
            display: none;
          }
          .staff-col-cout,
          .staff-col-hrs {
            display: none;
          }
        }

        /* ════════════════════════════════
           MOBILE  (≤ 480px)
        ════════════════════════════════ */
        @media (max-width: 480px) {
          .staff-page {
            padding: 14px 12px;
          }
          .staff-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .staff-header button {
            width: 100%;
            justify-content: center;
          }
          .staff-card-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
          .staff-card-grid > div {
            padding: 14px;
          }
          /* Tab row stretches full width */
          .staff-tab-row {
            width: 100%;
          }
          .staff-tab-row button {
            flex: 1;
            justify-content: center;
            padding: 8px 6px !important;
          }
          /* Hide tab label text — icons only */
          .staff-tab-label {
            display: none;
          }
          /* Hide more table columns */
          .staff-col-role,
          .staff-col-phone,
          .staff-col-salary {
            display: none;
          }
          /* Hide clock button labels */
          .staff-btn-label {
            display: none;
          }
          /* Salary controls stack */
          .staff-salary-controls {
            flex-direction: column;
            align-items: stretch;
          }
          .staff-salary-controls select,
          .staff-salary-controls button {
            width: 100%;
          }
          /* Modal full width */
          .staff-modal {
            padding: 20px 16px;
            border-radius: 12px;
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  h1:          { color: '#f1f5f9', margin: '0 0 4px', fontSize: '26px', fontWeight: '600' },
  subtitle:    { color: '#94a3b8', margin: 0, fontSize: '13px' },
  addBtn:      { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '11px 22px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' },
  toast:       { display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' },
  toastOk:     { backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid #10b981' },
  toastErr:    { backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid #ef4444' },
  statCard:    { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' },
  statLabel:   { color: '#94a3b8', fontSize: '11px', fontWeight: '800', letterSpacing: '0.05em' },
  statVal:     { color: '#f1f5f9', fontSize: '28px', fontWeight: '700' },
  tab:         { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', backgroundColor: 'transparent', color: '#94a3b8', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
  tabActive:   { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
  tableCard:   { backgroundColor: '#1e293b', borderRadius: '16px', border: '1px solid #334155', padding: '24px' },
  table:       { width: '100%', borderCollapse: 'collapse' },
  th:          { textAlign: 'left', padding: '12px 14px', backgroundColor: '#0f172a', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #334155', whiteSpace: 'nowrap' },
  td:          { padding: '13px 14px', color: '#cbd5e1', borderBottom: '1px solid #1e293b', fontSize: '14px' },
  empty:       { padding: '50px', textAlign: 'center', color: '#475569', fontSize: '14px' },
  rolePill:    { backgroundColor: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.25)', padding: '3px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: '500' },
  statusPill:  { padding: '3px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: '600' },
  clockInBtn:  { display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },
  clockOutBtn: { display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: 'rgba(249,115,22,0.15)', color: '#f97316', border: '1px solid rgba(249,115,22,0.3)', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },
  editBtn:     { backgroundColor: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)', color: '#60a5fa', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  delBtn:      { backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  select:      { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white', padding: '10px 14px', fontSize: '14px', outline: 'none', cursor: 'pointer' },
  overlay:     { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px' },
  label:       { color: '#94a3b8', fontSize: '12px', marginBottom: '6px', display: 'block' },
  input:       { width: '100%', padding: '10px 12px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', marginBottom: '16px', outline: 'none', fontSize: '14px', boxSizing: 'border-box' },
  cancelBtn:   { background: 'none', border: '1px solid #334155', color: '#94a3b8', cursor: 'pointer', fontSize: '14px', padding: '11px 16px', borderRadius: '8px' },
  closeBtn:    { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' },
};

export default Staff;