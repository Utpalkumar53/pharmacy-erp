import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { 
  AlertCircle, Package, Clock, AlertTriangle, TrendingUp, 
  BarChart2, Activity, FileText, IndianRupee, RotateCcw,
  RefreshCw, Wallet, Send, Mail, Download, UserCheck
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
PieChart, Pie, Cell } from 'recharts';

// ─── Responsive hook ──────────────────────────────────────────────────────────
const useWindowWidth = () => {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return width;
};

const Dashboard = ({ onNavigate }) => {
    const width = useWindowWidth();
    const isMobile  = width < 640;
    const isTablet  = width >= 640 && width < 1024;
    const isDesktop = width >= 1024;

    const [loading, setLoading]       = useState(true);
    const [refreshing, setRefreshing] = useState(false); 
    const [activeTab, setActiveTab]   = useState('30');
    const [alertCounts, setAlertCounts] = useState({ expiry30: 0, expiry60: 0, expiry90: 0, lowStockCount: 0, pendingSupplierReturns: 0 });
    const [recentActivity, setRecentActivity] = useState([]);
    const [displayList, setDisplayList]       = useState([]); 
    const [revenueData, setRevenueData]       = useState([]);
    const [topMedicines, setTopMedicines]     = useState([]);
    const [finance, setFinance] = useState({ totalRevenue: 0, netProfit: 0, taxToPay: 0, deadStockLoss: 0, profitMargin: 0, totalReturnValue: 0, totalOutstanding: 0, totalExpenses: 0 });
    const [orderModal, setOrderModal] = useState({ show: false, data: null, qty: 0 });
    const [pdfLoading, setPdfLoading] = useState(false);
    const [monthlyOverview, setMonthlyOverview] = useState({ monthlyGrossProfit: 0, monthlyExpenses: 0, netSavings: 0 });
    const [todayStaff, setTodayStaff] = useState([]);
    const [recentBills, setRecentBills] = useState([]);
    const [mySalary, setMySalary] = useState(null);
    
    const handleGenerateOrder = async (medId) => {
        try {
            const res = await api.get(`/orders/prepare/${medId}`);
            setOrderModal({ show: true, data: res.data, qty: res.data.suggestedQty });
        } catch (err) {
            alert(err.response?.data || "An unexpected error occurred");
        }
    };

    const generatePDF = (forAction) => {
        const { data, qty } = orderModal;
        if (forAction === 'whatsapp') sendWhatsApp();
        if (forAction === 'email') sendEmail();

        const htmlContent = `<html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;color:#1a1a1a;padding:30px}.letterhead{border-bottom:3px solid #2563eb;padding-bottom:20px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:flex-start}.pharmacy-name{font-size:26px;font-weight:bold;color:#2563eb;margin-bottom:6px}.pharmacy-details{font-size:12px;color:#555;line-height:1.6}.order-badge{background:#2563eb;color:white;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:bold;text-align:center}.section-title{font-size:13px;font-weight:bold;color:#2563eb;text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;padding-bottom:4px;border-bottom:1px solid #e2e8f0}.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:24px}.info-row{display:flex;gap:8px;font-size:13px}.info-label{color:#666;min-width:110px}.info-value{font-weight:600;color:#1a1a1a}table{width:100%;border-collapse:collapse;margin-bottom:24px}th{background:#2563eb;color:white;padding:10px 14px;font-size:12px;text-align:left}td{padding:10px 14px;font-size:13px;border-bottom:1px solid #e2e8f0}tr:nth-child(even) td{background:#f8fafc}.qty-cell{font-size:18px;font-weight:bold;color:#2563eb}.note-box{background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px;font-size:12px;color:#1e40af;margin-bottom:24px}.footer{border-top:1px solid #e2e8f0;padding-top:16px;font-size:11px;color:#888;display:flex;justify-content:space-between}.stamp{border:2px dashed #2563eb;border-radius:8px;padding:14px 24px;text-align:center;color:#2563eb;font-size:12px;font-weight:bold}</style></head><body>
        <div class="letterhead">
        <div>
            <div class="pharmacy-name">${data.pharmacyName || 'Pharmacy'}</div>
            <div class="pharmacy-details">
            ${data.pharmacyAddress || ''}<br/>
            Phone: ${data.pharmacyPhone || ''} | Email: ${data.pharmacyEmail || ''}<br/>
            GST: ${data.pharmacyGst || ''} | License: ${data.pharmacyLicense || ''}
            </div>
        </div>
        <div class="order-badge">
            PURCHASE ORDER<br/>${data.orderNumber}<br/>
            <span style="margin-top:4px;display:block">Date: ${data.orderDate}</span>
        </div>
        </div>
        <div class="section-title">Supplier Details</div>
        <div class="info-grid">
        <div class="info-row"><span class="info-label">Supplier Name:</span><span class="info-value">${data.supplierName}</span></div>
        <div class="info-row"><span class="info-label">Contact Person:</span><span class="info-value">${data.contactPerson || '—'}</span></div>
        <div class="info-row"><span class="info-label">Phone:</span><span class="info-value">${data.contactPhone || '—'}</span></div>
        <div class="info-row"><span class="info-label">Email:</span><span class="info-value">${data.email || '—'}</span></div>
        <div class="info-row"><span class="info-label">GST Number:</span><span class="info-value">${data.supplierGst || '—'}</span></div>
        <div class="info-row"><span class="info-label">Address:</span><span class="info-value">${data.supplierAddress || '—'}</span></div>
        </div>
        <div class="section-title">Order Details</div>
        <table>
        <thead><tr><th>#</th><th>Medicine Name</th><th>Current Stock</th><th>Min Stock Level</th><th>Order Quantity</th></tr></thead>
        <tbody>
            <tr>
            <td>1</td>
            <td><strong>${data.medicineName}</strong></td>
            <td style="color:#ef4444;font-weight:bold">${data.currentStock} units</td>
            <td>${data.minStockLevel} units</td>
            <td class="qty-cell">${qty} units</td>
            </tr>
        </tbody>
        </table>
        <div class="note-box">
        Note: Please supply the above medicine at the earliest. Kindly share the invoice/bill along with the delivery.
        For any queries, contact us at ${data.pharmacyPhone || 'our pharmacy'}.
        </div>
        <div class="footer">
        <div>
            <strong>${data.pharmacyName}</strong><br/>
            Authorized Signatory<br/><br/>
            <div class="stamp">PURCHASE ORDER<br/>${data.orderNumber}</div>
        </div>
        <div style="text-align:right;font-size:11px;color:#aaa">
            Generated by RxManager Pro<br/>${new Date().toLocaleString('en-IN')}
        </div>
        </div>
        </body></html>`;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Popup blocked! Please allow popups for this site in your browser settings, then try again.');
            return;
        }
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); }, 800);
    };

    const sendWhatsApp = () => {
        const { data, qty } = orderModal;
        const msg = `*PURCHASE ORDER — ${data.orderNumber}*\nDate: ${data.orderDate}\n\n*From:* ${data.pharmacyName}\n${data.pharmacyAddress}\nPhone: ${data.pharmacyPhone}\nGST: ${data.pharmacyGst}\n\n*To:* ${data.supplierName}\nContact: ${data.contactPerson || ''}\n\n*Order Details:*\nMedicine: *${data.medicineName}*\nQuantity Required: *${qty} units*\nCurrent Stock: ${data.currentStock} units\n\nPlease supply at the earliest and share invoice along with delivery.\n\nThank you.`;
        let supplierPhone = (data.contactPhone || '').replace(/\D/g, '');
        if (supplierPhone.startsWith('0')) supplierPhone = '91' + supplierPhone.slice(1);
        if (!supplierPhone.startsWith('91')) supplierPhone = '91' + supplierPhone;
        if (!supplierPhone || supplierPhone.length < 10) {
            alert('Supplier WhatsApp number is missing. Please update the supplier record in Suppliers page.');
            return;
        }
        window.open(`https://wa.me/${supplierPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const sendEmail = () => {
        const { data, qty } = orderModal;
        if (!data.email || data.email === '—') {
            alert('Supplier email is missing. Please update the supplier record.');
            return;
        }
        const subject = `Purchase Order ${data.orderNumber} — ${data.medicineName}`;
        const body = `Dear ${data.contactPerson || data.supplierName},\n\nPlease find our purchase order details:\n\nOrder Number : ${data.orderNumber}\nOrder Date   : ${data.orderDate}\nMedicine     : ${data.medicineName}\nQuantity     : ${qty} units\nCurrent Stock: ${data.currentStock} units\n\nKindly supply at the earliest and share the invoice along with delivery.\n\nFrom,\n${data.pharmacyName}\n${data.pharmacyAddress}\nPhone: ${data.pharmacyPhone}\nGST: ${data.pharmacyGst}\nLicense: ${data.pharmacyLicense}`;
        window.location.href = `mailto:${data.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    const fetchDashboardData = async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true); else setLoading(true);
            const now = new Date();
            const [
                intelligenceRes, activityRes, revRes, topRes,
                financeRes, overviewRes, todayStaffRes, recentBillsRes, mySalaryRes
            ] = await Promise.all([
                api.get('/intelligence/alerts').catch(() => ({ data: {} })),
                api.get('/intelligence/recent-activity').catch(() => ({ data: [] })),
                api.get('/analytics/revenue-weekly').catch(() => ({ data: [] })),
                api.get('/analytics/top-medicines').catch(() => ({ data: [] })),
                api.get('/intelligence/finance-summary').catch(() => ({ data: {} })),
                api.get('/finance/monthly-overview').catch(() => ({ data: {} })),
                api.get('/staff/attendance/today').catch(() => ({ data: [] })),
                api.get('/sales/recent').catch(() => ({ data: [] })),
                api.get(`/staff/salary-report/my?month=${now.getMonth()+1}&year=${now.getFullYear()}`).catch(() => ({ data: null })),
            ]);

            let listUrl = `/medicines/near-expiry?days=${activeTab}`;
            if (activeTab === 'low') listUrl = '/medicines/low-stock';
            const listRes = await api.get(listUrl);

            setAlertCounts(intelligenceRes.data);
            setRecentActivity(activityRes.data || []);
            setDisplayList(listRes.data || []);
            setRevenueData(revRes.data || []);
            setTopMedicines(topRes.data || []);
            setFinance(financeRes.data || { totalRevenue: 0, netProfit: 0, taxToPay: 0, deadStockLoss: 0, profitMargin: 0, totalReturnValue: 0, totalOutstanding: 0, totalExpenses: 0 });
            setMonthlyOverview(overviewRes.data);
            setTodayStaff(todayStaffRes.data || []);
            setRecentBills(recentBillsRes.data || []);
            setMySalary(mySalaryRes.data || null);
        } catch (error) { console.error('Dashboard Fetch Error:', error); }
        finally { setLoading(false); setRefreshing(false); }
    };

    useEffect(() => { fetchDashboardData(); }, [activeTab]);

    const COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#c084fc'];

    if (loading) return (
        <div style={{ height: '100vh', backgroundColor: '#0f172a', color: '#60a5fa', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px' }}>
            Synchronizing Database...
        </div>
    );

    // ── Responsive grid helpers ──────────────────────────────────────────────
    // Row 1 & 3: 3 cards  → desktop: 3 cols | tablet: 2 cols | mobile: 1 col
    const grid3 = {
        display: 'grid',
        gridTemplateColumns: isDesktop ? 'repeat(3, 1fr)' : isTablet ? 'repeat(2, 1fr)' : '1fr',
        gap: '16px',
        marginBottom: '16px',
    };

    // Row 2: 2 cards → desktop/tablet: 2 cols | mobile: 1 col
    const grid2 = {
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
        gap: '16px',
        marginBottom: '16px',
    };

    // Row 4: [90-day][low-stock wide][staff][salary]
    // desktop: 1fr 2fr 1fr 1fr | tablet: 1fr 1fr | mobile: 1 col
    const grid4 = {
        display: 'grid',
        gridTemplateColumns: isDesktop ? '1fr 2fr 1fr 1fr' : isTablet ? 'repeat(2, 1fr)' : '1fr',
        gap: '16px',
        marginBottom: '30px',
    };

    // Charts: desktop 2-col | mobile 1-col
    const chartsGridResponsive = {
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
        gap: '20px',
        marginBottom: '30px',
    };

    return (
        <div style={{ display: 'flex', backgroundColor: '#0f172a', minHeight: '100vh' }}>
            <div style={{ padding: isMobile ? '16px' : '30px', width: '100%', boxSizing: 'border-box' }}>

                {/* ── HEADER ── */}
                <header style={{
                    marginBottom: '24px',
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    justifyContent: 'space-between',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    gap: '12px',
                }}>
                    <h1 style={{ color: '#f1f5f9', margin: 0, fontSize: isMobile ? '20px' : '26px' }}>
                        Pharmacy Intelligence
                    </h1>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button onClick={() => fetchDashboardData(true)} style={refreshBtn}>
                            <RefreshCw size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
                            {refreshing ? 'Refreshing...' : 'Refresh'}
                        </button>
                        <button onClick={() => onNavigate('BILLING')} style={billingActionBtn}>
                            + QUICK BILL
                        </button>
                    </div>
                </header>

                {/* ── ROW 1: Net Profit | GST | Dead Stock ── */}
                <div style={grid3}>
                    <div style={metricCard('#10b981')}>
                        <TrendingUp color="#10b981" size={20} />
                        <span style={labelStyle}>NET PROFIT (THIS MONTH)</span>
                        <span style={{ ...valueStyle, color: '#10b981' }}>₹{(finance.netProfit||0).toFixed(2)}</span>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>Margin: {(finance.profitMargin||0).toFixed(1)}%</span>
                    </div>
                    <div style={metricCard('#3b82f6')}>
                        <FileText color="#3b82f6" size={20} />
                        <span style={labelStyle}>ESTIMATED GST PAYABLE</span>
                        <span style={valueStyle}>₹{(finance.taxToPay||0).toFixed(2)}</span>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>Total Sales: ₹{(finance.totalRevenue||0).toLocaleString('en-IN')}</span>
                    </div>
                    <div style={metricCard(finance.deadStockLoss > 0 ? '#ef4444' : '#334155')}>
                        <IndianRupee color="#f87171" size={20} />
                        <span style={labelStyle}>DEAD STOCK LOSS</span>
                        <span style={{ ...valueStyle, color: finance.deadStockLoss > 0 ? '#f87171' : '#10b981' }}>₹{(finance.deadStockLoss||0).toFixed(2)}</span>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>{finance.deadStockLoss > 0 ? 'Value of expired inventory' : '✓ No expired stock'}</span>
                    </div>
                </div>

                {/* ── ROW 2: Udhaar | Expenses ── */}
                <div style={grid2}>
                    <div style={{ ...metricCard('#f472b6'), cursor: 'default' }}>
                        <Wallet color="#f472b6" size={20} />
                        <span style={labelStyle}>TOTAL PENDING (UDHAAR)</span>
                        <span style={{ ...valueStyle, color: '#f472b6' }}>₹{(finance.totalOutstanding||0).toFixed(2)}</span>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>Market credit collection</span>
                        <button onClick={() => onNavigate('CUSTOMERS')} style={viewHistoryBtn}>View Ledger →</button>
                    </div>
                    <div style={{ ...metricCard('#f87171'), cursor: 'default' }}>
                        <IndianRupee color="#f87171" size={20} />
                        <span style={labelStyle}>TOTAL SHOP EXPENSES</span>
                        <span style={{ ...valueStyle, color: '#f87171' }}>₹{(finance.totalExpenses || 0).toFixed(2)}</span>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>Utilities, Food, Rent</span>
                    </div>
                </div>

                {/* ── ROW 3: Returns | 30-day | 60-day ── */}
                <div style={grid3}>
                    <div style={metricCard('#a78bfa')}>
                        <RotateCcw color="#a78bfa" size={20} />
                        <span style={labelStyle}>RETURNED TO SUPPLIERS</span>
                        <span style={{ ...valueStyle, color: '#a78bfa' }}>₹{(finance.totalReturnValue||0).toFixed(2)}</span>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>{alertCounts.pendingSupplierReturns > 0 ? `⚠ ${alertCounts.pendingSupplierReturns} pending settlement` : 'All returns settled'}</span>
                        <button onClick={(e) => { e.stopPropagation(); onNavigate('RETURN_SUPPLIER_HISTORY'); }} style={viewHistoryBtn}>View History →</button>
                    </div>
                    <div onClick={() => setActiveTab('30')} style={metricCard(activeTab === '30' ? '#ef4444' : '#334155')}>
                        <AlertCircle color="#f87171" size={20} />
                        <span style={labelStyle}>30-DAY EXPIRY</span>
                        <span style={valueStyle}>{alertCounts.expiry30} Items</span>
                    </div>
                    <div onClick={() => setActiveTab('60')} style={metricCard(activeTab === '60' ? '#eab308' : '#334155')}>
                        <Clock color="#fbbf24" size={20} />
                        <span style={labelStyle}>60-DAY EXPIRY</span>
                        <span style={valueStyle}>{alertCounts.expiry60} Items</span>
                    </div>
                </div>

                {/* ── ROW 4: 90-day | Low Stock | Staff | Salary ── */}
                <div style={grid4}>
                    <div onClick={() => setActiveTab('90')} style={metricCard(activeTab === '90' ? '#3b82f6' : '#334155')}>
                        <Package color="#60a5fa" size={20} />
                        <span style={labelStyle}>90-DAY MONITOR</span>
                        <span style={valueStyle}>{alertCounts.expiry90} Items</span>
                    </div>

                    <div onClick={() => setActiveTab('low')} style={{
                        ...metricCard(activeTab === 'low' ? '#f97316' : '#334155'),
                        flexDirection: isMobile ? 'column' : 'row',
                        justifyContent: 'space-between',
                        alignItems: isMobile ? 'flex-start' : 'center',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <AlertTriangle color="#f97316" size={24} />
                            <span style={{ ...labelStyle, fontSize: '14px' }}>
                                {activeTab === 'low' ? 'VIEWING LOW STOCK ITEMS' : 'CRITICAL LOW STOCK ALERT'}
                            </span>
                        </div>
                        <span style={valueStyle}>{alertCounts.lowStockCount} Items</span>
                    </div>

                    <div style={{ ...metricCard('#10b981'), cursor: 'default' }}>
                        <UserCheck color="#10b981" size={20} />
                        <span style={labelStyle}>STAFF ON DUTY TODAY</span>
                        <span style={{ ...valueStyle, fontSize: '22px', color: '#10b981' }}>
                            {todayStaff.length} Present
                        </span>
                        {todayStaff.map((a, i) => (
                            <span key={i} style={{ fontSize: '12px', color: '#94a3b8' }}>
                                ✓ {a.staffName} — in {a.checkInTime?.substring(0, 5)}
                            </span>
                        ))}
                        <button onClick={() => onNavigate('STAFF')} style={viewHistoryBtn}>
                            Manage Staff →
                        </button>
                    </div>

                    <div style={{ ...metricCard('#fbbf24'), cursor: 'default' }}>
                        <IndianRupee color="#fbbf24" size={20} />
                        <span style={labelStyle}>MY SALARY THIS MONTH</span>
                        {mySalary ? (
                            <>
                                <span style={{ ...valueStyle, color: '#fbbf24', fontSize: '22px' }}>
                                    ₹{(mySalary.finalPayableAmount || 0).toLocaleString('en-IN')}
                                </span>
                                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                    {mySalary.daysPresent} days present of {mySalary.totalDaysInMonth}
                                </span>
                                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                    Base: ₹{(mySalary.baseMonthlySalary || 0).toLocaleString('en-IN')}
                                </span>
                                <button onClick={() => onNavigate('ATTENDANCE')} style={viewHistoryBtn}>
                                    My Attendance →
                                </button>
                            </>
                        ) : (
                            <span style={{ fontSize: '13px', color: '#475569' }}>Not available</span>
                        )}
                    </div>
                </div>

                {/* ── ANALYTICS CHARTS ── */}
                <div style={chartsGridResponsive}>
                    <div style={chartCard}>
                        <h3 style={chartTitle}><TrendingUp size={18} color="#34d399" /> Weekly Revenue Trend</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={revenueData}>
                                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                />
                                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div style={chartCard}>
                        <h3 style={chartTitle}><Activity size={18} color="#a78bfa" /> Recent Activity Audit</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {recentActivity.length > 0 ? recentActivity.map((log, i) => (
                                <div key={i} style={activityRow}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={activityAction}>{log.action?.replace('_', ' ')}</span>
                                        <span style={activityDetails}>{log.details}</span>
                                    </div>
                                    <span style={activityTime}>
                                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            )) : (
                                <div style={{ color: '#475569', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                                    No activity
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Top 5 Products — full width */}
                    <div style={{ ...chartCard, gridColumn: isMobile ? '1' : 'span 2' }}>
                        <h3 style={chartTitle}><BarChart2 size={18} color="#60a5fa" /> Top 5 Selling Products</h3>
                        {topMedicines.length > 0 ? (
                            <div style={{
                                display: 'flex',
                                flexDirection: isMobile ? 'column' : 'row',
                                alignItems: 'center',
                                justifyContent: 'space-around',
                                minHeight: '200px',
                                gap: '20px',
                            }}>
                                <ResponsiveContainer width={isMobile ? '100%' : '40%'} height={200}>
                                    <PieChart>
                                        <Pie data={topMedicines} dataKey="sales" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={5}>
                                            {topMedicines.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                            formatter={(value, name) => [`${value} Units`, name]}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                                    gap: '12px',
                                    width: isMobile ? '100%' : 'auto',
                                }}>
                                    {topMedicines.map((item, index) => (
                                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
                                            <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: COLORS[index % COLORS.length], flexShrink: 0 }} />
                                            <span style={{ color: '#cbd5e1', fontWeight: '600' }}>{item.name}:</span>
                                            <span style={{ color: '#94a3b8' }}>{item.sales} Units</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div style={{ color: '#475569', textAlign: 'center', padding: '40px' }}>No sales data</div>
                        )}
                    </div>
                </div>

                {/* ── RECENT BILLS ── */}
                <div style={{ backgroundColor: '#1e293b', padding: isMobile ? '16px' : '25px', borderRadius: '16px', border: '1px solid #334155', marginBottom: '30px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                        <h3 style={{ color: '#f1f5f9', margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FileText size={18} color="#60a5fa" /> Today's Recent Bills
                        </h3>
                        <button onClick={() => onNavigate('SALES_HISTORY')}
                            style={{ backgroundColor: 'transparent', color: '#60a5fa', border: '1px solid #60a5fa', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                            View All →
                        </button>
                    </div>

                    {recentBills.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '30px', color: '#475569', fontSize: '14px' }}>
                            No bills generated today yet.
                        </div>
                    ) : (
                        /* Horizontal scroll wrapper on mobile */
                        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '480px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #334155' }}>
                                        <th style={thStyle}>Customer Name</th>
                                        <th style={thStyle}>Time</th>
                                        <th style={thStyle}>Items</th>
                                        <th style={{ ...thStyle, textAlign: 'right' }}>Amount</th>
                                        <th style={thStyle}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentBills.map((bill, i) => {
                                        const isCredit = bill.paymentMethod === 'CREDIT' || bill.creditSale === true;
                                        return (
                                            <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                                                <td style={{ padding: '12px 10px', color: 'white', fontWeight: '500', fontSize: '14px' }}>
                                                    {bill.patientName || bill.customerName || 'Walk-in Customer'}
                                                </td>
                                                <td style={{ padding: '12px 10px', color: '#94a3b8', fontSize: '13px' }}>
                                                    {bill.saleDate ? new Date(bill.saleDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                                                </td>
                                                <td style={{ padding: '12px 10px', color: '#94a3b8', fontSize: '13px' }}>
                                                    {(bill.saleItems || []).length} items
                                                </td>
                                                <td style={{ padding: '12px 10px', color: '#60a5fa', fontWeight: '700', fontSize: '14px', textAlign: 'right' }}>
                                                    ₹{(bill.totalAmount || 0).toFixed(2)}
                                                </td>
                                                <td style={{ padding: '12px 10px' }}>
                                                    <span style={{
                                                        padding: '3px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: '700',
                                                        backgroundColor: isCredit ? 'rgba(249,115,22,0.15)' : 'rgba(16,185,129,0.15)',
                                                        color: isCredit ? '#f97316' : '#10b981',
                                                        border: `1px solid ${isCredit ? '#f9731644' : '#10b98144'}`,
                                                    }}>
                                                        {isCredit ? 'CREDIT' : 'PAID'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* ── EXPIRY / LOW STOCK TABLE ── */}
                <div style={{ backgroundColor: '#1e293b', padding: isMobile ? '16px' : '30px', borderRadius: '16px', border: '1px solid #334155', marginBottom: '30px' }}>
                    <h2 style={{ color: activeTab === 'low' ? '#f97316' : (activeTab === '30' ? '#f87171' : '#60a5fa'), fontSize: isMobile ? '15px' : '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Package size={20} />
                        {activeTab === 'low' ? 'Reorder List: Low Stock Items' : `Priority Sale List: Expiring within ${activeTab} Days`}
                    </h2>
                    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
                            <thead>
                                <tr style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'left', borderBottom: '1px solid #334155' }}>
                                    <th style={{ padding: '15px' }}>MEDICINE NAME</th>
                                    <th style={{ padding: '15px' }}>BATCH</th>
                                    <th style={{ padding: '15px' }}>EXPIRY</th>
                                    <th style={{ padding: '15px', textAlign: 'right' }}>STOCK</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayList.length > 0 ? displayList.map((med, i) => (
                                    <tr key={i} style={{ color: '#cbd5e1', borderBottom: '1px solid #334155', fontSize: '14px' }}>
                                        <td style={{ padding: '15px' }}>{med.name}</td>
                                        <td style={{ padding: '15px' }}>{med.batchNo}</td>
                                        <td style={{ padding: '15px', color: activeTab === '30' ? '#f87171' : '#cbd5e1' }}>
                                            {med.expiryDate ? new Date(med.expiryDate).toLocaleDateString('en-IN') : 'N/A'}
                                        </td>
                                        <td style={{ padding: '15px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
                                                <span style={{ color: med.stockQuantity <= (med.minStockLevel || 10) ? '#f97316' : '#10b981', fontWeight: 'bold' }}>
                                                    {med.stockQuantity} Units
                                                </span>
                                                {med.stockQuantity <= (med.minStockLevel || 10) && (
                                                    <button onClick={(e) => { e.stopPropagation(); handleGenerateOrder(med.id); }} style={orderBtnStyle}>
                                                        📦 ORDER
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#475569' }}>No records found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ── ORDER MODAL ── */}
                {orderModal.show && (
                    <div style={modalOverlay} onClick={() => setOrderModal({ show: false, data: null, qty: 0 })}>
                        <div
                            style={{
                                ...modalContent,
                                width: isMobile ? '92vw' : '400px',
                                padding: isMobile ? '20px' : '28px',
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ color: 'white', margin: 0 }}>📦 Purchase Order</h3>
                                <button onClick={() => setOrderModal({ show: false, data: null, qty: 0 })} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 20, cursor: 'pointer' }}>×</button>
                            </div>
                            <div style={{ background: '#0f172a', borderRadius: 8, padding: '14px', marginBottom: '16px' }}>
                                <div style={modalRow}><span style={modalLabel}>Order No:</span><span style={{ color: '#60a5fa', fontWeight: 700 }}>{orderModal.data.orderNumber}</span></div>
                                <div style={modalRow}><span style={modalLabel}>Medicine:</span><span style={{ color: 'white', fontWeight: 600 }}>{orderModal.data.medicineName}</span></div>
                                <div style={modalRow}><span style={modalLabel}>Supplier:</span><span style={{ color: 'white' }}>{orderModal.data.supplierName}</span></div>
                                <div style={modalRow}><span style={modalLabel}>Phone:</span><span style={{ color: '#94a3b8' }}>{orderModal.data.contactPhone}</span></div>
                                <div style={modalRow}><span style={modalLabel}>Email:</span><span style={{ color: '#94a3b8' }}>{orderModal.data.email}</span></div>
                                <div style={modalRow}><span style={modalLabel}>Current Stock:</span><span style={{ color: '#f97316', fontWeight: 700 }}>{orderModal.data.currentStock} units</span></div>
                            </div>
                            <label style={{ color: '#cbd5e1', fontSize: '12px', display: 'block', marginBottom: '8px', fontWeight: 700 }}>
                                CONFIRM QUANTITY TO ORDER:
                            </label>
                            <input
                                type="number"
                                value={orderModal.qty}
                                onChange={(e) => setOrderModal({ ...orderModal, qty: e.target.value })}
                                style={modalInput}
                            />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                                <button onClick={() => generatePDF('whatsapp')} disabled={pdfLoading} style={{ ...modalBtn, backgroundColor: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <Send size={16} />{pdfLoading ? 'Generating...' : 'Generate PDF & Send WhatsApp'}
                                </button>
                                <button onClick={() => generatePDF('email')} disabled={pdfLoading} style={{ ...modalBtn, backgroundColor: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <Mail size={16} />Generate PDF & Send Email
                                </button>
                                <button onClick={() => generatePDF(null)} disabled={pdfLoading} style={{ ...modalBtn, backgroundColor: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <Download size={16} />Download PDF Only
                                </button>
                                <button onClick={() => setOrderModal({ show: false, data: null, qty: 0 })} style={{ ...modalBtn, backgroundColor: 'transparent', border: '1px solid #334155', color: '#94a3b8' }}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

// ── Shared styles (no marginLeft anywhere) ─────────────────────────────────────
const billingActionBtn  = { backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const refreshBtn        = { backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid #334155', padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' };
const viewHistoryBtn    = { backgroundColor: 'transparent', color: '#a78bfa', border: '1px solid #a78bfa', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', marginTop: '4px', width: 'fit-content' };
const metricCard        = (borderColor) => ({ backgroundColor: '#1e293b', padding: '20px', borderRadius: '16px', border: `2px solid ${borderColor}`, display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer' });
const labelStyle        = { color: '#94a3b8', fontSize: '12px', fontWeight: '800' };
const valueStyle        = { color: '#f1f5f9', fontSize: '28px', fontWeight: 'bold' };
const chartCard         = { backgroundColor: '#1e293b', padding: '25px', borderRadius: '16px', border: '1px solid #334155' };
const chartTitle        = { color: '#cbd5e1', fontSize: '15px', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' };
const activityRow       = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '3px solid #60a5fa' };
const activityAction    = { fontSize: '11px', fontWeight: 'bold', color: '#f1f5f9', textTransform: 'uppercase' };
const activityDetails   = { fontSize: '10px', color: '#94a3b8' };
const activityTime      = { fontSize: '9px', color: '#64748b', fontWeight: 'bold' };
const orderBtnStyle     = { backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' };
const thStyle           = { padding: '10px', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', textAlign: 'left' };
const modalOverlay      = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContent      = { backgroundColor: '#1e293b', borderRadius: '20px', border: '1px solid #334155', maxHeight: '90vh', overflowY: 'auto' };
const modalInput        = { width: '100%', padding: '12px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: '10px', boxSizing: 'border-box', outline: 'none', fontSize: '18px', fontWeight: 'bold' };
const modalBtn          = { width: '100%', padding: '12px', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' };
const modalRow          = { display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' };
const modalLabel        = { color: '#64748b', fontSize: '12px' };

export default Dashboard;