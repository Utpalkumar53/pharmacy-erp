import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { 
  RotateCcw, Search, Plus, Trash2, Save, 
  Package, Truck, AlertCircle, CheckCircle 
} from 'lucide-react';

const ReturnSupplier = () => {
    // --- State ---
    const [inventory, setInventory] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [supplierName, setSupplierName] = useState('');
    const [invoiceRef, setInvoiceRef] = useState('');
    const [returnReason, setReason] = useState('Expired');
    const [returnList, setReturnList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ text: '', type: '' });

    // --- Load Inventory for Search ---
    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            const res = await api.get('/medicines');
            setInventory(res.data || []);
        } catch (err) {
            console.error("Failed to load inventory", err);
        }
    };

    // --- Search Logic ---
    const filteredInventory = inventory.filter(m => 
        (m.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
         m.batchNo?.toLowerCase().includes(searchQuery.toLowerCase())) &&
         m.stockQuantity > 0
    ).slice(0, 5); // Limit results for clean UI

    // --- Add to Return List ---
    const addToReturn = (item) => {
        const exists = returnList.find(r => r.medicineId === item.id);
        if (exists) return;

        setReturnList([...returnList, {
            medicineId: item.id,
            medicineName: item.name,
            batchNo: item.batchNo,
            availableStock: item.stockQuantity,
            quantityReturned: 1,
            unitPrice: item.costPrice || 0,
            subTotal: item.costPrice || 0
        }]);
        setSearchQuery('');
    };

    const handleQtyChange = (index, val) => {
        const list = [...returnList];
        const qty = parseInt(val) || 0;
        
        // Validation: Cannot return more than what is in stock
        if (qty > list[index].availableStock) {
            showMsg(`Only ${list[index].availableStock} units available!`, 'error');
            return;
        }

        list[index].quantityReturned = qty;
        list[index].subTotal = qty * list[index].unitPrice;
        setReturnList(list);
    };

    const removeItem = (index) => {
        setReturnList(returnList.filter((_, i) => i !== index));
    };

    const showMsg = (text, type) => {
        setMsg({ text, type });
        setTimeout(() => setMsg({ text: '', type: '' }), 4000);
    };

    // --- Final Submit ---
    const handleSubmit = async () => {
        if (!supplierName || !invoiceRef || returnList.length === 0) {
            showMsg("Please fill supplier details and add items.", "error");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                supplierName,
                referenceInvoiceNo: invoiceRef,
                reason: returnReason,
                items: returnList, // Matches your backend helper class
                totalReturnAmount: returnList.reduce((sum, i) => sum + i.subTotal, 0)
            };

            await api.post('/returns/process', payload);
            showMsg("Return to Supplier processed successfully!", "success");
            
            // Reset Form
            setReturnList([]);
            setSupplierName('');
            setInvoiceRef('');
            fetchInventory(); // Refresh stock counts
        } catch (err) {
            showMsg("Error processing return. Check stock levels.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.title}><RotateCcw size={24} /> Return to Supplier</h1>
                <p style={styles.subtitle}>Deduct stock and request credit from distributors</p>
            </header>

            {msg.text && (
                <div style={{ ...styles.alert, backgroundColor: msg.type === 'success' ? '#064e3b' : '#7f1d1d' }}>
                    {msg.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    {msg.text}
                </div>
            )}

            <div style={styles.grid}>
                {/* Left Side: Supplier & Search */}
                <div style={styles.leftCol}>
                    <div style={styles.card}>
                        <h3 style={styles.cardTitle}><Truck size={18} /> Supplier Details</h3>
                        <input 
                            placeholder="Supplier Name" 
                            style={styles.input} 
                            value={supplierName}
                            onChange={e => setSupplierName(e.target.value)}
                        />
                        <input 
                            placeholder="Original Invoice Reference" 
                            style={styles.input} 
                            value={invoiceRef}
                            onChange={e => setInvoiceRef(e.target.value)}
                        />
                        <select style={styles.input} value={returnReason} onChange={e => setReason(e.target.value)}>
                            <option value="Expired">Expired Stock</option>
                            <option value="Damaged">Damaged / Leaked</option>
                            <option value="Wrong Item">Wrong Item Received</option>
                            <option value="Near Expiry">Near Expiry (Slow Moving)</option>
                        </select>
                    </div>

                    <div style={styles.card}>
                        <h3 style={styles.cardTitle}><Search size={18} /> Search Inventory</h3>
                        <input 
                            placeholder="Search medicine or batch..." 
                            style={styles.input}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <div style={styles.results}>
                                {filteredInventory.map(m => (
                                    <div key={m.id} style={styles.resultItem} onClick={() => addToReturn(m)}>
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>{m.name}</div>
                                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Batch: {m.batchNo} | Stock: {m.stockQuantity}</div>
                                        </div>
                                        <Plus size={16} color="#10b981" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Return List */}
                <div style={styles.rightCol}>
                    <div style={styles.card}>
                        <h3 style={styles.cardTitle}><Package size={18} /> Return Items</h3>
                        <table style={styles.table}>
                            <thead>
                                <tr style={styles.thRow}>
                                    <th style={styles.th}>Medicine</th>
                                    <th style={styles.th}>Batch</th>
                                    <th style={styles.th}>Qty</th>
                                    <th style={styles.th}>Subtotal</th>
                                    <th style={styles.th}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {returnList.map((item, index) => (
                                    <tr key={index} style={styles.tr}>
                                        <td style={styles.td}>{item.medicineName}</td>
                                        <td style={styles.td}>{item.batchNo}</td>
                                        <td style={styles.td}>
                                            <input 
                                                type="number" 
                                                style={styles.qtyInput} 
                                                value={item.quantityReturned}
                                                onChange={e => handleQtyChange(index, e.target.value)}
                                            />
                                        </td>
                                        <td style={styles.td}>₹{item.subTotal.toFixed(2)}</td>
                                        <td style={styles.td}>
                                            <Trash2 size={16} color="#ef4444" style={{ cursor: 'pointer' }} onClick={() => removeItem(index)} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {returnList.length > 0 && (
                            <div style={styles.footer}>
                                <div style={styles.total}>Total Return Value: ₹{returnList.reduce((sum, i) => sum + i.subTotal, 0).toFixed(2)}</div>
                                <button 
                                    style={styles.submitBtn} 
                                    disabled={loading}
                                    onClick={handleSubmit}
                                >
                                    <Save size={18} /> {loading ? 'Processing...' : 'Submit Return'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- CSS Styles ---
const styles = {
    container: { padding: '40px', marginLeft: '240px', backgroundColor: '#0f172a', minHeight: '100vh', color: 'white' },
    header: { marginBottom: '30px' },
    title: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '24px', color: '#60a5fa' },
    subtitle: { color: '#94a3b8', fontSize: '14px' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' },
    card: { backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155', marginBottom: '20px' },
    cardTitle: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', color: '#f1f5f9', fontSize: '16px' },
    input: { width: '100%', padding: '12px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', marginBottom: '10px', outline: 'none' },
    results: { backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', overflow: 'hidden' },
    resultItem: { padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: '1px solid #1e293b' },
    table: { width: '100%', borderCollapse: 'collapse' },
    thRow: { borderBottom: '1px solid #334155' },
    th: { textAlign: 'left', padding: '10px', color: '#94a3b8', fontSize: '12px' },
    td: { padding: '10px', borderBottom: '1px solid #1e293b', fontSize: '14px' },
    qtyInput: { width: '60px', padding: '5px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: 'white' },
    footer: { marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    total: { fontSize: '18px', fontWeight: 'bold', color: '#10b981' },
    submitBtn: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#2563eb', padding: '12px 24px', borderRadius: '8px', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer' },
    alert: { padding: '15px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }
};

export default ReturnSupplier;