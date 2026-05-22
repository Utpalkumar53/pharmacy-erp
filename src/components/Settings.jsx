import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import {
  Save, Store, MapPin, Phone, Mail, FileText,
  ShieldCheck, Download, HardDrive, AlertCircle,
  CheckCircle, Landmark, Settings2, Tag, Package,
  Plus, X, IndianRupee, Calendar
} from 'lucide-react';

const DEFAULT_UNITS = ['Tablet', 'Strip', 'Bottle', 'Syrup', 'Injection', 'Capsule', 'Cream', 'Ointment', 'Drops', 'Sachet'];
const DEFAULT_CATS  = ['Antibiotic', 'Vitamin', 'Analgesic', 'Antacid', 'Antifungal', 'Antiviral', 'OTC', 'Surgical', 'Ayurvedic', 'Homeopathic'];

const Settings = () => {
  const [profile, setProfile] = useState({
    pharmacyName:      '',
    address:           '',
    contactNumber:     '',
    email:             '',
    gstNumber:         '',
    licenseNumber:     '',
    bankName:          '',
    bankAccountNumber: '',
    bankIfscCode:      '',
    bankBranch:        '',
    lowStockThreshold: 20,
    financialYearStart:'2026-04-01',
    invoiceFooterText: '',
    invoiceTerms:      '',
    unitMaster:        [...DEFAULT_UNITS],
    categoryMaster:    [...DEFAULT_CATS],
  });

  const [loading,     setLoading]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [msg,         setMsg]         = useState({ text: '', type: '' });
  const [newUnit,     setNewUnit]     = useState('');
  const [newCat,      setNewCat]      = useState('');
  const [smtpSaving,  setSmtpSaving]  = useState(false);
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [smtp, setSmtp] = useState({
    smtpEmail:           '',
    smtpAppPassword:     '',
    smtpHost:            'smtp.gmail.com',
    smtpPort:            587,
    backupRecipientEmail:''
  });

  useEffect(() => {
    api.get('/profile').then(res => {
      if (res.data) {
        setProfile(prev => ({
          ...prev,
          ...res.data,
          unitMaster:     res.data.unitMaster?.length     ? res.data.unitMaster     : [...DEFAULT_UNITS],
          categoryMaster: res.data.categoryMaster?.length ? res.data.categoryMaster : [...DEFAULT_CATS],
        }));
        if (res.data.smtpEmail) {
          setSmtp(prev => ({
            ...prev,
            smtpEmail:            res.data.smtpEmail || '',
            smtpHost:             res.data.smtpHost  || 'smtp.gmail.com',
            smtpPort:             res.data.smtpPort  || 587,
            backupRecipientEmail: res.data.backupRecipientEmail || '',
          }));
        }
      }
    }).catch(() => {});
  }, []);

  const showMsg = (text, type) => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 5000);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await api.post('/profile', profile);
      showMsg('All settings saved successfully!', 'success');
    } catch {
      showMsg('Error saving settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const addUnit = () => {
    const val = newUnit.trim();
    if (!val || profile.unitMaster.includes(val)) return;
    setProfile(p => ({ ...p, unitMaster: [...p.unitMaster, val] }));
    setNewUnit('');
  };
  const removeUnit = (u) =>
    setProfile(p => ({ ...p, unitMaster: p.unitMaster.filter(x => x !== u) }));

  const addCat = () => {
    const val = newCat.trim();
    if (!val || profile.categoryMaster.includes(val)) return;
    setProfile(p => ({ ...p, categoryMaster: [...p.categoryMaster, val] }));
    setNewCat('');
  };
  const removeCat = (c) =>
    setProfile(p => ({ ...p, categoryMaster: p.categoryMaster.filter(x => x !== c) }));

  const handleDownloadBackup = async () => {
    setLoading(true);
    try {
      const res = await api.get('/backup/download', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.setAttribute('download', `Pharma_Backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(a); a.click();
      showMsg('Backup downloaded!', 'success');
    } catch { showMsg('Failed to download backup.', 'error'); }
    finally { setLoading(false); }
  };

  const handleDownloadExcel = async () => {
    setLoading(true);
    try {
      const res = await api.get('/backup/sales/excel', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.setAttribute('download', `Sales_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(a); a.click();
      showMsg('Sales Excel exported!', 'success');
    } catch { showMsg('Excel export failed.', 'error'); }
    finally { setLoading(false); }
  };

  const handleEmailBackup = async () => {
    setLoading(true);
    try {
      await api.post('/backup/send-email');
      showMsg('Backup emailed successfully!', 'success');
    } catch (e) {
      const errMsg = e?.response?.data || e?.message || 'Email sending failed.';
      showMsg(`Email failed: ${errMsg}`, 'error');
    } finally { setLoading(false); }
  };

  const handleSaveSmtp = async () => {
    if (!smtp.smtpEmail || !smtp.smtpAppPassword) {
      showMsg('Email and App Password are required.', 'error'); return;
    }
    setSmtpSaving(true);
    try {
      await api.post('/profile/smtp', smtp);
      showMsg('Email config saved successfully!', 'success');
    } catch { showMsg('Failed to save email config.', 'error'); }
    finally { setSmtpSaving(false); }
  };

  const handleTestSmtp = async () => {
    if (!smtp.smtpEmail || !smtp.smtpAppPassword) {
      showMsg('Save email config first before testing.', 'error'); return;
    }
    setSmtpTesting(true);
    try {
      await api.post('/profile/smtp/test');
      showMsg('✅ Email connection successful!', 'success');
    } catch { showMsg('❌ Connection failed. Check your App Password.', 'error'); }
    finally { setSmtpTesting(false); }
  };

  return (
    <div className="set-page">
      <h1 style={s.h1}>Settings & Configuration</h1>

      {/* ── Toast ── */}
      {msg.text && (
        <div style={{
          ...s.toast,
          backgroundColor: msg.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
          color:           msg.type === 'success' ? '#10b981' : '#ef4444',
          border:          `1px solid ${msg.type === 'success' ? '#10b981' : '#ef4444'}`
        }}>
          {msg.type === 'success' ? <CheckCircle size={16}/> : <AlertCircle size={16}/>}
          {msg.text}
        </div>
      )}

      {/* ── SECTION 1: Pharmacy Profile ── */}
      <div className="set-card">
        <h2 style={s.sectionTitle}><Store size={20} color="#60a5fa"/> Pharmacy Profile</h2>
        <div style={s.group}>
          <label style={s.label}><Store size={13}/> Pharmacy Name</label>
          <input style={s.input} value={profile.pharmacyName}
            onChange={e => setProfile({ ...profile, pharmacyName: e.target.value })}/>
        </div>
        <div style={s.group}>
          <label style={s.label}><MapPin size={13}/> Address</label>
          <textarea style={{ ...s.input, height: '80px', resize: 'vertical' }}
            value={profile.address}
            onChange={e => setProfile({ ...profile, address: e.target.value })}/>
        </div>
        <div className="set-row2">
          <div style={s.group}>
            <label style={s.label}><Phone size={13}/> Contact No.</label>
            <input style={s.input} value={profile.contactNumber}
              onChange={e => setProfile({ ...profile, contactNumber: e.target.value })}/>
          </div>
          <div style={s.group}>
            <label style={s.label}><Mail size={13}/> Email</label>
            <input style={s.input} value={profile.email}
              onChange={e => setProfile({ ...profile, email: e.target.value })}/>
          </div>
        </div>
        <div className="set-row2">
          <div style={s.group}>
            <label style={s.label}><FileText size={13}/> GST Number</label>
            <input style={s.input} value={profile.gstNumber}
              onChange={e => setProfile({ ...profile, gstNumber: e.target.value.toUpperCase() })}/>
          </div>
          <div style={s.group}>
            <label style={s.label}><FileText size={13}/> Drug License No.</label>
            <input style={s.input} value={profile.licenseNumber}
              onChange={e => setProfile({ ...profile, licenseNumber: e.target.value })}/>
          </div>
        </div>
      </div>

      {/* ── SECTION 2: Bank Details ── */}
      <div className="set-card">
        <h2 style={s.sectionTitle}><Landmark size={20} color="#10b981"/> Bank Details</h2>
        <p style={s.hint}>Used on invoices and purchase order PDFs.</p>
        <div className="set-row2">
          <div style={s.group}>
            <label style={s.label}>Bank Name</label>
            <input style={s.input} placeholder="e.g. State Bank of India"
              value={profile.bankName}
              onChange={e => setProfile({ ...profile, bankName: e.target.value })}/>
          </div>
          <div style={s.group}>
            <label style={s.label}>Account Number</label>
            <input style={s.input} placeholder="e.g. 12345678901"
              value={profile.bankAccountNumber}
              onChange={e => setProfile({ ...profile, bankAccountNumber: e.target.value })}/>
          </div>
        </div>
        <div className="set-row2">
          <div style={s.group}>
            <label style={s.label}>IFSC Code</label>
            <input style={s.input} placeholder="e.g. SBIN0001234"
              value={profile.bankIfscCode}
              onChange={e => setProfile({ ...profile, bankIfscCode: e.target.value.toUpperCase() })}/>
          </div>
          <div style={s.group}>
            <label style={s.label}>Branch</label>
            <input style={s.input} placeholder="e.g. Lalganj, Vaishali"
              value={profile.bankBranch}
              onChange={e => setProfile({ ...profile, bankBranch: e.target.value })}/>
          </div>
        </div>
      </div>

      {/* ── SECTION 3: Business Settings ── */}
      <div className="set-card">
        <h2 style={s.sectionTitle}><Settings2 size={20} color="#f97316"/> Business Settings</h2>
        <div className="set-row2">
          <div style={s.group}>
            <label style={s.label}><IndianRupee size={13}/> Low Stock Threshold (units)</label>
            <input type="number" style={s.input}
              value={profile.lowStockThreshold}
              onChange={e => setProfile({ ...profile, lowStockThreshold: Number(e.target.value) })}/>
            <span style={s.hint}>Alert when stock falls below this level</span>
          </div>
          <div style={s.group}>
            <label style={s.label}><Calendar size={13}/> Financial Year Start</label>
            <input type="date" style={s.input}
              value={profile.financialYearStart}
              onChange={e => setProfile({ ...profile, financialYearStart: e.target.value })}/>
            <span style={s.hint}>Usually April 1st every year</span>
          </div>
        </div>
      </div>

      {/* ── SECTION 4: Invoice Settings ── */}
      <div className="set-card">
        <h2 style={s.sectionTitle}><FileText size={20} color="#a78bfa"/> Invoice Settings</h2>
        <div style={s.group}>
          <label style={s.label}>Invoice Footer Text</label>
          <input style={s.input}
            placeholder="e.g. Thank you for your business! Get well soon."
            value={profile.invoiceFooterText}
            onChange={e => setProfile({ ...profile, invoiceFooterText: e.target.value })}/>
        </div>
        <div style={s.group}>
          <label style={s.label}>Terms & Conditions</label>
          <textarea style={{ ...s.input, height: '70px', resize: 'vertical' }}
            placeholder="e.g. Goods once sold will not be taken back."
            value={profile.invoiceTerms}
            onChange={e => setProfile({ ...profile, invoiceTerms: e.target.value })}/>
        </div>
      </div>

      {/* ── SECTION 5: Unit Master ── */}
      <div className="set-card">
        <h2 style={s.sectionTitle}><Package size={20} color="#fbbf24"/> Unit Master</h2>
        <p style={s.hint}>Units available when adding medicines to inventory.</p>
        <div style={s.tagBox}>
          {(profile.unitMaster || []).map(u => (
            <div key={u} style={s.tag}>
              {u}
              <X size={12} style={{ cursor: 'pointer', marginLeft: '6px' }} onClick={() => removeUnit(u)}/>
            </div>
          ))}
        </div>
        <div className="set-add-row">
          <input style={{ ...s.input, flex: 1, marginBottom: 0 }}
            placeholder="Add new unit e.g. Vial"
            value={newUnit}
            onChange={e => setNewUnit(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addUnit()}/>
          <button onClick={addUnit} style={s.addBtn}><Plus size={16}/> Add</button>
        </div>
      </div>

      {/* ── SECTION 6: Category Master ── */}
      <div className="set-card">
        <h2 style={s.sectionTitle}><Tag size={20} color="#f472b6"/> Medicine Category Master</h2>
        <p style={s.hint}>Categories available when adding medicines to inventory.</p>
        <div style={s.tagBox}>
          {(profile.categoryMaster || []).map(c => (
            <div key={c} style={{ ...s.tag, backgroundColor: 'rgba(244,114,182,0.1)', borderColor: 'rgba(244,114,182,0.3)', color: '#f472b6' }}>
              {c}
              <X size={12} style={{ cursor: 'pointer', marginLeft: '6px' }} onClick={() => removeCat(c)}/>
            </div>
          ))}
        </div>
        <div className="set-add-row">
          <input style={{ ...s.input, flex: 1, marginBottom: 0 }}
            placeholder="Add new category e.g. Cardiac"
            value={newCat}
            onChange={e => setNewCat(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCat()}/>
          <button onClick={addCat} style={{ ...s.addBtn, backgroundColor: '#be185d' }}>
            <Plus size={16}/> Add
          </button>
        </div>
      </div>

      {/* ── SECTION 7: Email / SMTP ── */}
      <div className="set-card">
        <h2 style={s.sectionTitle}>
          <Mail size={20} color="#38bdf8"/> Email Configuration (SMTP)
        </h2>
        <p style={s.hint}>
          Configure your Gmail to send backup emails and notifications.
          <a href="https://myaccount.google.com/apppasswords"
             target="_blank" rel="noreferrer"
             style={{ color: '#60a5fa', marginLeft: '6px' }}>
            Generate App Password →
          </a>
        </p>
        <div className="set-row2">
          <div style={s.group}>
            <label style={s.label}><Mail size={13}/> Gmail Address</label>
            <input style={s.input} placeholder="yourshop@gmail.com"
              value={smtp.smtpEmail}
              onChange={e => setSmtp({ ...smtp, smtpEmail: e.target.value })}/>
          </div>
          <div style={s.group}>
            <label style={s.label}><ShieldCheck size={13}/> Gmail App Password</label>
            <input style={s.input} type="password" placeholder="16-character app password"
              value={smtp.smtpAppPassword}
              onChange={e => setSmtp({ ...smtp, smtpAppPassword: e.target.value })}/>
          </div>
        </div>
        <div style={s.group}>
          <label style={s.label}><Mail size={13}/> Backup Recipient Email</label>
          <input style={s.input}
            placeholder="Where to send backup emails (leave blank = use above)"
            value={smtp.backupRecipientEmail}
            onChange={e => setSmtp({ ...smtp, backupRecipientEmail: e.target.value })}/>
        </div>
        <div className="set-smtp-btns">
          <button onClick={handleTestSmtp} disabled={smtpTesting}
            style={{ ...s.smtpBtn, backgroundColor: '#0f766e' }}>
            {smtpTesting ? 'Testing...' : '🔌 Test Connection'}
          </button>
          <button onClick={handleSaveSmtp} disabled={smtpSaving}
            style={{ ...s.smtpBtn, backgroundColor: '#1d4ed8' }}>
            {smtpSaving ? 'Saving...' : '💾 Save Email Config'}
          </button>
        </div>
        <div style={{ ...s.infoBox, marginTop: '16px', color: '#38bdf8', backgroundColor: 'rgba(56,189,248,0.05)' }}>
          <ShieldCheck size={16}/>
          <span>App Password is <strong>encrypted</strong> before storing in database</span>
        </div>
      </div>

      {/* ── Save All Button ── */}
      <button onClick={handleSaveProfile} disabled={saving}
        style={{ ...s.saveBtn, opacity: saving ? 0.7 : 1 }}>
        <Save size={18}/>
        {saving ? 'Saving...' : 'SAVE ALL SETTINGS'}
      </button>

      {/* ── SECTION 8: Backup & Maintenance ── */}
      <div className="set-card" style={{ marginTop: '10px' }}>
        <h2 style={s.sectionTitle}><ShieldCheck size={20} color="#10b981"/> Database Maintenance</h2>
        <p style={s.hint}>Protect your data. Manually trigger backups or download a snapshot.</p>
        <div className="set-backup-btns">
          <button style={{ ...s.actionBtn, backgroundColor: '#064e3b' }}
            onClick={handleDownloadBackup} disabled={loading}>
            <Download size={18}/> {loading ? 'Processing...' : 'JSON Backup'}
          </button>
          <button style={{ ...s.actionBtn, backgroundColor: '#1e3a6e' }}
            onClick={handleDownloadExcel} disabled={loading}>
            <FileText size={18}/> {loading ? 'Processing...' : 'Sales Excel Report'}
          </button>
          <button style={{ ...s.actionBtn, backgroundColor: '#1e293b', border: '1px solid #334155' }}
            onClick={handleEmailBackup} disabled={loading}>
            <Mail size={18}/> {loading ? 'Sending...' : 'Email Backup'}
          </button>
        </div>
        <div style={s.infoBox}>
          <HardDrive size={16}/>
          <span>Automated Sunday Backup is <strong>Active (10:00 AM)</strong></span>
        </div>
      </div>

      <style>{`
        /* ── Page ── */
        .set-page {
          padding: 40px;
          background-color: #0f172a;
          min-height: 100vh;
          box-sizing: border-box;
        }

        /* ── Cards: max-width on desktop ── */
        .set-card {
          background-color: #1e293b;
          padding: 28px;
          border-radius: 16px;
          border: 1px solid #334155;
          max-width: 860px;
          margin-bottom: 20px;
          box-sizing: border-box;
        }

        /* ── 2-col rows ── */
        .set-row2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        /* ── Add-row (input + button) ── */
        .set-add-row {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        /* ── SMTP buttons ── */
        .set-smtp-btns {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        /* ── Backup buttons ── */
        .set-backup-btns {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
        }

        /* ════════════════════════════════
           TABLET  (≤ 900px)
        ════════════════════════════════ */
        @media (max-width: 900px) {
          .set-page {
            padding: 24px 16px;
          }
          .set-card {
            max-width: 100%;
            padding: 20px 16px;
          }
        }

        /* ════════════════════════════════
           MOBILE  (≤ 480px)
        ════════════════════════════════ */
        @media (max-width: 480px) {
          .set-page {
            padding: 14px 12px;
          }
          .set-card {
            padding: 16px 12px;
            border-radius: 12px;
          }
          /* Stack all 2-col rows */
          .set-row2 {
            grid-template-columns: 1fr;
            gap: 0;
          }
          /* Stack add-row */
          .set-add-row {
            flex-direction: column;
            align-items: stretch;
          }
          .set-add-row button {
            width: 100%;
            justify-content: center;
          }
          /* Stack SMTP buttons */
          .set-smtp-btns {
            flex-direction: column;
          }
          .set-smtp-btns button {
            width: 100% !important;
          }
          /* Stack backup buttons */
          .set-backup-btns {
            flex-direction: column;
            gap: 10px;
          }
          .set-backup-btns button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  h1:          { color: 'white', marginBottom: '28px', fontSize: '26px', fontWeight: '600', marginTop: 0 },
  toast:       { display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', maxWidth: '860px' },
  sectionTitle:{ color: 'white', fontSize: '17px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #334155', paddingBottom: '12px', marginTop: 0 },
  group:       { marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' },
  label:       { color: '#94a3b8', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' },
  input:       { backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '11px 14px', color: 'white', outline: 'none', fontSize: '14px', width: '100%', boxSizing: 'border-box' },
  hint:        { color: '#64748b', fontSize: '12px', marginTop: '2px', marginBottom: '12px' },
  saveBtn:     { width: '100%', maxWidth: '860px', padding: '16px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', fontSize: '15px', marginBottom: '20px', boxSizing: 'border-box' },
  actionBtn:   { flex: '1 1 180px', padding: '13px 16px', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', fontSize: '14px' },
  smtpBtn:     { padding: '11px 20px', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px' },
  infoBox:     { marginTop: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#10b981', fontSize: '13px', backgroundColor: 'rgba(16,185,129,0.05)', padding: '12px', borderRadius: '8px' },
  tagBox:      { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' },
  tag:         { display: 'flex', alignItems: 'center', backgroundColor: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24', padding: '5px 12px', borderRadius: '99px', fontSize: '13px', fontWeight: '500' },
  addBtn:      { display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#d97706', color: 'white', border: 'none', padding: '11px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap' },
};

export default Settings;