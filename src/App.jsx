import React, { useState, useEffect } from 'react';
import api from './api/axiosConfig';
import { AuthProvider, useAuth } from './context/AuthContext';

import Dashboard         from './components/Dashboard';
import NurseDashboard    from './components/NurseDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import Attendance        from './components/Attendance';
import Login             from './components/Login';
import Billing           from './components/Billing';
import Inventory         from './components/Inventory';
import Transactions      from './components/Transactions';
import Customers         from './components/Customers';
import SalesHistory      from './components/SalesHistory';
import Purchase          from './components/Purchase';
import PurchaseHistory   from './components/PurchaseHistory';
import ReturnSupplier    from './components/ReturnSupplier';
import SaleReturn        from './components/SaleReturn';
import SaleReturnHistory from './components/SaleReturnHistory';
import ReturnSupplierHistory from './components/ReturnSupplierHistory';
import Suppliers         from './components/Suppliers';
import ExpenseLedger     from './components/ExpenseLedger';
import GstReport         from './components/GstReport';
import Finance           from './components/Finance';
import Staff             from './components/Staff';
import BalanceSheet      from './components/BalanceSheet';
import Indents           from './components/Indents';
import Settings          from './components/Settings';

import {
  Layout, TrendingUp, ShoppingCart, Package, LogOut, Menu, X,
  Settings as NavSettingsIcon, ClipboardList, Users, History,
  RotateCcw, FileClock, Undo2, ReceiptText, ShoppingBag,
  Truck, Boxes, Warehouse, CircleDollarSignIcon, RefreshCcw,
  BarChart2, Scale, Calendar, Eye
} from 'lucide-react';

// ─── Read-only Inventory wrapper ─────────────────────────────────────────────
const InventoryReadOnly = () => (
  <>
    <style>{`
      .inv-add-btn, .inv-edit-btn, .inv-delete-btn,
      [data-inv-action="add"], [data-inv-action="edit"], [data-inv-action="delete"] {
        display: none !important;
      }
    `}</style>
    <Inventory readOnly={true} />
  </>
);

// ─── Hash / Screen maps ───────────────────────────────────────────────────────
const SCREEN_TO_HASH = {
  DASHBOARD:              '#/dashboard',
  BILLING:                '#/billing',
  INVENTORY:              '#/inventory',
  TRANSACTIONS:           '#/stock-ledger',
  CUSTOMERS:              '#/credit-ledger',
  SALES_HISTORY:          '#/sales-history',
  SALE_RETURN:            '#/sale-return',
  RETURN_HISTORY:         '#/return-history',
  PURCHASE:               '#/purchase',
  SUPPLIERS:              '#/suppliers',
  RETURN_SUPPLIER:        '#/return-to-supplier',
  RETURN_SUPPLIER_HISTORY:'#/return-history-supplier',
  EXPENSES:               '#/expenses',
  GST_REPORT:             '#/gst-report',
  FINANCE:                '#/finance',
  STAFF:                  '#/staff',
  SETTINGS:               '#/settings',
  BALANCE_SHEET:          '#/balance-sheet',
  INDENTS:                '#/indents',
  ATTENDANCE:             '#/attendance',
};

const HASH_TO_SCREEN = Object.fromEntries(
  Object.entries(SCREEN_TO_HASH).map(([k, v]) => [v, k])
);

const getScreenFromHash = () => HASH_TO_SCREEN[window.location.hash] || 'DASHBOARD';

// ─── useWindowWidth hook ──────────────────────────────────────────────────────
const useWindowWidth = () => {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return width;
};

// ─── AppContent ───────────────────────────────────────────────────────────────
const AppContent = () => {
  const { hasRole, login, logout, auth } = useAuth();
  const width = useWindowWidth();
  const isMobile = width < 1024;

  const [isReady,         setIsReady]         = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeScreen,    setActiveScreen]    = useState('DASHBOARD');
  const [sidebarOpen,     setSidebarOpen]     = useState(false);

  const isAdmin      = hasRole('ADMIN');
  const isPharmacist = hasRole('PHARMACIST');
  const isNurse      = hasRole('NURSE');
  const isEmployee   = hasRole('EMPLOYEE');

  // Close sidebar when switching to desktop
  useEffect(() => {
    if (!isMobile) setSidebarOpen(false);
  }, [isMobile]);

  useEffect(() => {
    const checkAuth = async () => {
      const token         = localStorage.getItem('token');
      const activeSession = sessionStorage.getItem('activeSession');
      if (!token || !activeSession) {
        localStorage.clear();
        setIsAuthenticated(false);
        setIsReady(true);
        return;
      }
      try {
        await api.get('/auth/verify');
        setIsAuthenticated(true);
        setActiveScreen(getScreenFromHash());
      } catch {
        localStorage.clear();
        sessionStorage.clear();
        setIsAuthenticated(false);
      } finally {
        setIsReady(true);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
      if (!loggedIn) { window.history.pushState(null, '', window.location.pathname); return; }
      setActiveScreen(getScreenFromHash());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (screen) => {
    setActiveScreen(screen);
    setSidebarOpen(false); // close sidebar on mobile after navigation
    window.history.pushState({ screen }, '', SCREEN_TO_HASH[screen] || '#/dashboard');
  };

  const handleLoginSuccess = (data) => {
    login(data);
    localStorage.setItem('isLoggedIn', 'true');
    setIsAuthenticated(true);
    window.history.pushState({ screen: 'DASHBOARD' }, '', SCREEN_TO_HASH.DASHBOARD);
    setActiveScreen('DASHBOARD');
  };

  const handleLogout = () => {
    logout();
    sessionStorage.clear();
    setIsAuthenticated(false);
    setActiveScreen('DASHBOARD');
    setSidebarOpen(false);
    window.history.replaceState(null, '', window.location.pathname);
  };

  if (!isReady) return <div style={loadingStyle}>Verifying System Integrity…</div>;
  if (!isAuthenticated) return <Login onLoginSuccess={handleLoginSuccess} />;

  const DashboardComponent = () => {
    if (isNurse)    return <NurseDashboard    onNavigate={navigate} />;
    if (isEmployee) return <EmployeeDashboard onNavigate={navigate} />;
    return <Dashboard onNavigate={navigate} />;
  };

  const sidebarProps = {
    activeScreen,
    navigate,
    onLogout: handleLogout,
    isMobile,
    sidebarOpen,
    onClose: () => setSidebarOpen(false),
  };

  const renderSidebar = () => {
    if (isNurse)    return <NurseSidebar    {...sidebarProps} />;
    if (isEmployee) return <EmployeeSidebar {...sidebarProps} />;
    return <AdminPharmacistSidebar {...sidebarProps} isAdmin={isAdmin} isPharmacist={isPharmacist} />;
  };

  return (
    <div style={{ display: 'flex', backgroundColor: '#0f172a', minHeight: '100vh' }}>

      {/* ── Mobile overlay — dims background when sidebar open ── */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 20,
          }}
        />
      )}

      {/* ── Hamburger button — only on mobile ── */}
      {isMobile && (
        <button
          onClick={() => setSidebarOpen(prev => !prev)}
          style={{
            position: 'fixed', top: '16px', left: '16px',
            zIndex: 30,
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            padding: '8px',
            cursor: 'pointer',
            color: '#60a5fa',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      )}

      {/* ── Sidebar ── */}
      {renderSidebar()}

      {/* ── Content area ── */}
      <div style={{
        flex: 1,
        backgroundColor: '#0f172a',
        minHeight: '100vh',
        marginLeft: isMobile ? '0' : '240px',
        width: isMobile ? '100%' : 'calc(100% - 240px)',
        overflowX: 'hidden',
        boxSizing: 'border-box',
        paddingTop: isMobile ? '60px' : '0', // space for hamburger on mobile
      }}>
        {activeScreen === 'DASHBOARD'               && <DashboardComponent />}
        {activeScreen === 'ATTENDANCE'              && <Attendance />}
        {activeScreen === 'BILLING'                 && (isAdmin || isPharmacist) && <Billing />}
        {activeScreen === 'TRANSACTIONS'            && (isAdmin || isPharmacist) && <Transactions />}
        {activeScreen === 'CUSTOMERS'               && (isAdmin || isPharmacist) && <Customers />}
        {activeScreen === 'SALES_HISTORY'           && (isAdmin || isPharmacist) && <SalesHistory />}
        {activeScreen === 'SALE_RETURN'             && (isAdmin || isPharmacist) && <SaleReturn />}
        {activeScreen === 'RETURN_HISTORY'          && (isAdmin || isPharmacist) && <SaleReturnHistory />}
        {activeScreen === 'PURCHASE'                && isAdmin && <Purchase />}
        {activeScreen === 'SUPPLIERS'               && isAdmin && <Suppliers />}
        {activeScreen === 'RETURN_SUPPLIER'         && isAdmin && <ReturnSupplier />}
        {activeScreen === 'RETURN_SUPPLIER_HISTORY' && isAdmin && <ReturnSupplierHistory />}
        {activeScreen === 'EXPENSES'                && isAdmin && <ExpenseLedger />}
        {activeScreen === 'GST_REPORT'              && isAdmin && <GstReport />}
        {activeScreen === 'BALANCE_SHEET'           && isAdmin && <BalanceSheet />}
        {activeScreen === 'FINANCE'                 && isAdmin && <Finance />}
        {activeScreen === 'STAFF'                   && isAdmin && <Staff />}
        {activeScreen === 'SETTINGS'                && isAdmin && <Settings />}
        {activeScreen === 'INVENTORY' && (isAdmin || isPharmacist) && <Inventory />}
        {activeScreen === 'INVENTORY' && (isNurse || isEmployee)   && <InventoryReadOnly />}
        {activeScreen === 'INDENTS'   && (isNurse || isPharmacist || isAdmin) && <Indents />}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SHARED SIDEBAR WRAPPER — handles slide in/out on mobile
// ─────────────────────────────────────────────────────────────────────────────
const SidebarWrapper = ({ isMobile, sidebarOpen, onClose, children }) => (
  <div style={{
    width: '240px',
    backgroundColor: '#1e293b',
    borderRight: '1px solid #334155',
    position: 'fixed',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 25,
    overflowY: 'auto',
    // Slide transition on mobile
    transform: isMobile
      ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)')
      : 'translateX(0)',
    transition: 'transform 0.3s ease',
    top: 0,
    left: 0,
  }}>
    {children}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR: Admin + Pharmacist
// ─────────────────────────────────────────────────────────────────────────────
const AdminPharmacistSidebar = ({ activeScreen, navigate, onLogout, isAdmin, isPharmacist, isMobile, sidebarOpen, onClose }) => (
  <SidebarWrapper isMobile={isMobile} sidebarOpen={sidebarOpen} onClose={onClose}>
    <div style={logoStyle}><Layout size={24} style={{ marginRight: '10px' }} /> RxManager Pro</div>

    <div style={sectionLabel}>Main</div>
    <NavBtn label="Dashboard"   icon={<TrendingUp size={18}/>}           screen="DASHBOARD"   active={activeScreen} navigate={navigate} />
    {(isAdmin || isPharmacist) && <>
      <NavBtn label="New Billing" icon={<CircleDollarSignIcon size={18}/>} screen="BILLING"     active={activeScreen} navigate={navigate} />
      <NavBtn label="Inventory"   icon={<Warehouse size={18}/>}            screen="INVENTORY"   active={activeScreen} navigate={navigate} />
    </>}

    {(isAdmin || isPharmacist) && <>
      <div style={sectionLabel}>Sales</div>
      <NavBtn label="Stock Ledger"   icon={<ClipboardList size={18}/>} screen="TRANSACTIONS"   active={activeScreen} navigate={navigate} />
      <NavBtn label="Credit Ledger"  icon={<Users size={18}/>}         screen="CUSTOMERS"      active={activeScreen} navigate={navigate} />
      <NavBtn label="Sales History"  icon={<FileClock size={18}/>}     screen="SALES_HISTORY"  active={activeScreen} navigate={navigate} />
      <NavBtn label="Sale Return"    icon={<RefreshCcw size={18}/>}    screen="SALE_RETURN"    active={activeScreen} navigate={navigate} />
      <NavBtn label="Return History" icon={<History size={18}/>}       screen="RETURN_HISTORY" active={activeScreen} navigate={navigate} />
    </>}

    {isAdmin && <>
      <div style={sectionLabel}>Purchase</div>
      <NavBtn label="Purchase"              icon={<ShoppingCart size={18}/>} screen="PURCHASE"                active={activeScreen} navigate={navigate} />
      <NavBtn label="Suppliers"             icon={<Users size={18}/>}        screen="SUPPLIERS"               active={activeScreen} navigate={navigate} />
      <NavBtn label="Return to Supplier"    icon={<Truck size={18}/>}        screen="RETURN_SUPPLIER"         active={activeScreen} navigate={navigate} />
      <NavBtn label="Return History (Sup.)" icon={<History size={18}/>}      screen="RETURN_SUPPLIER_HISTORY" active={activeScreen} navigate={navigate} />
    </>}

    {isAdmin && <>
      <div style={sectionLabel}>Finance</div>
      <NavBtn label="Expenses"      icon={<CircleDollarSignIcon size={18}/>} screen="EXPENSES"      active={activeScreen} navigate={navigate} />
      <NavBtn label="GST Report"    icon={<ReceiptText size={18}/>}          screen="GST_REPORT"    active={activeScreen} navigate={navigate} />
      <NavBtn label="Balance Sheet" icon={<Scale size={18}/>}                screen="BALANCE_SHEET" active={activeScreen} navigate={navigate} />
      <NavBtn label="Finance & P&L" icon={<BarChart2 size={18}/>}            screen="FINANCE"       active={activeScreen} navigate={navigate} />
    </>}

    {isAdmin && <>
      <div style={sectionLabel}>HR</div>
      <NavBtn label="Staff" icon={<Users size={18}/>} screen="STAFF" active={activeScreen} navigate={navigate} />
    </>}

    <div style={sectionLabel}>My Account</div>
    <NavBtn label="My Attendance" icon={<Calendar size={18}/>} screen="ATTENDANCE" active={activeScreen} navigate={navigate} />

    {(isPharmacist || isAdmin) && <>
      <div style={sectionLabel}>Hospital</div>
      <NavBtn label="Indents" icon={<ClipboardList size={18}/>} screen="INDENTS" active={activeScreen} navigate={navigate} />
    </>}

    {isAdmin && <>
      <div style={sectionLabel}>System</div>
      <NavBtn label="Settings" icon={<NavSettingsIcon size={18}/>} screen="SETTINGS" active={activeScreen} navigate={navigate} />
    </>}

    <LogoutBtn onLogout={onLogout} />
  </SidebarWrapper>
);

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR: Nurse
// ─────────────────────────────────────────────────────────────────────────────
const NurseSidebar = ({ activeScreen, navigate, onLogout, isMobile, sidebarOpen, onClose }) => (
  <SidebarWrapper isMobile={isMobile} sidebarOpen={sidebarOpen} onClose={onClose}>
    <div style={logoStyle}><Layout size={24} style={{ marginRight: '10px' }} /> RxManager Pro</div>
    <div style={sectionLabel}>Main</div>
    <NavBtn label="Dashboard"     icon={<TrendingUp size={18}/>}    screen="DASHBOARD"  active={activeScreen} navigate={navigate} />
    <div style={sectionLabel}>Hospital</div>
    <NavBtn label="My Indents"    icon={<ClipboardList size={18}/>} screen="INDENTS"    active={activeScreen} navigate={navigate} />
    <div style={sectionLabel}>My Account</div>
    <NavBtn label="My Attendance" icon={<Calendar size={18}/>}      screen="ATTENDANCE" active={activeScreen} navigate={navigate} />
    <LogoutBtn onLogout={onLogout} />
  </SidebarWrapper>
);

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR: Employee
// ─────────────────────────────────────────────────────────────────────────────
const EmployeeSidebar = ({ activeScreen, navigate, onLogout, isMobile, sidebarOpen, onClose }) => (
  <SidebarWrapper isMobile={isMobile} sidebarOpen={sidebarOpen} onClose={onClose}>
    <div style={logoStyle}><Layout size={24} style={{ marginRight: '10px' }} /> RxManager Pro</div>
    <div style={sectionLabel}>Main</div>
    <NavBtn label="Dashboard"     icon={<TrendingUp size={18}/>} screen="DASHBOARD"  active={activeScreen} navigate={navigate} />
    <div style={sectionLabel}>Inventory</div>
    <NavBtn label="Inventory"     icon={<Eye size={18}/>}        screen="INVENTORY"  active={activeScreen} navigate={navigate} />
    <div style={sectionLabel}>My Account</div>
    <NavBtn label="My Attendance" icon={<Calendar size={18}/>}   screen="ATTENDANCE" active={activeScreen} navigate={navigate} />
    <LogoutBtn onLogout={onLogout} />
  </SidebarWrapper>
);

// ─────────────────────────────────────────────────────────────────────────────
// Shared atoms
// ─────────────────────────────────────────────────────────────────────────────
const NavBtn = ({ label, icon, screen, active, navigate }) => (
  <button onClick={() => navigate(screen)} style={active === screen ? navBtnActive : navBtn}>
    {icon} {label}
  </button>
);

const LogoutBtn = ({ onLogout }) => (
  <button onClick={onLogout} style={logoutBtnStyle}>
    <LogOut size={18} /> Logout
  </button>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const logoStyle      = { padding: '30px 20px', fontSize: '20px', fontWeight: 'bold', color: '#60a5fa', display: 'flex', alignItems: 'center' };
const navBtn         = { display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '15px 20px', background: 'none', border: 'none', borderLeft: '4px solid transparent', color: '#94a3b8', cursor: 'pointer', textAlign: 'left', fontSize: '15px' };
const navBtnActive   = { ...navBtn, color: '#60a5fa', backgroundColor: 'rgba(96,165,250,0.1)', borderLeft: '4px solid #60a5fa' };
const logoutBtnStyle = { ...navBtn, marginTop: 'auto', color: '#ef4444', marginBottom: '20px' };
const loadingStyle   = { height: '100vh', backgroundColor: '#0f172a', color: '#60a5fa', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px' };
const sectionLabel   = { padding: '16px 20px 4px', fontSize: '10px', fontWeight: '600', color: '#475569', letterSpacing: '1px', textTransform: 'uppercase' };

// ─── Root ─────────────────────────────────────────────────────────────────────
const App = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;