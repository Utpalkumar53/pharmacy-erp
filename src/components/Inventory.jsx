import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { Plus, Edit, Trash2, Search, RefreshCw, UserPlus } from 'lucide-react'; // ✅ Fix 1: Added UserPlus import

// --- STYLES ---
const containerStyle = { padding: '40px', marginLeft: '240px', backgroundColor: '#0f172a', minHeight: '100vh' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' };
const addBtnStyle = { backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' };
const bulkPriceBtnStyle = { backgroundColor: '#7c3aed', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' };
const searchBarStyle = { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#1e293b', padding: '12px', borderRadius: '10px', border: '1px solid #334155', marginBottom: '20px', maxWidth: '400px' };
const searchInputStyle = { background: 'none', border: 'none', color: 'white', outline: 'none', width: '100%' };
const tableWrapper = { backgroundColor: '#1e293b', borderRadius: '16px', border: '1px solid #334155', overflow: 'hidden' };
const invTable = { width: '100%', borderCollapse: 'collapse' };
const thRow = { borderBottom: '1px solid #334155' };
const thStyle = { textAlign: 'left', padding: '15px', color: '#94a3b8', fontSize: '13px', textTransform: 'uppercase' };
const tdStyle = { padding: '15px', color: '#cbd5e1', borderBottom: '1px solid #334155' };
const trStyle = { backgroundColor: 'transparent' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center' };
const modalContent = { backgroundColor: '#1e293b', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '600px', border: '1px solid #334155', maxHeight: '90vh', overflowY: 'auto' };
const formInput = { width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', marginBottom: '15px', outline: 'none', boxSizing: 'border-box' };
const requiredInput = { width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #f59e0b', borderRadius: '8px', color: 'white', marginBottom: '4px', outline: 'none', boxSizing: 'border-box' };
const smallInput = { width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: 'white', fontSize: '13px', outline: 'none', boxSizing: 'border-box' };
const smallRequiredInput = { width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #f59e0b', borderRadius: '4px', color: 'white', fontSize: '13px', outline: 'none', boxSizing: 'border-box' };
const labelStyle = { color: '#94a3b8', fontSize: '12px', marginBottom: '5px', display: 'block' };
const requiredLabel = { color: '#f59e0b', fontSize: '12px', marginBottom: '5px', display: 'block', fontWeight: 'bold' };
const saveBtn = { backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
const cancelBtn = { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' };

const Inventory =  ({ readOnly = false }) => {
    const [medicines, setMedicines] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showBulkPriceModal, setShowBulkPriceModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [newSupplier, setNewSupplier] = useState({ name: '', contactPhone: '', email: '' });

    const [bulkRows, setBulkRows] = useState([
        { name: '', batchNo: '', expiryDate: '', mrp: 0, costPrice: 0,
          hsnCode: 'NA', gstPercentage: 12, rackLocation: '' }
    ]);

    const [bulkPriceData, setBulkPriceData] = useState({ name: '', newPrice: '' });

    const [formData, setFormData] = useState({
        name: '', batchNo: '', expiryDate: '', mrp: 0,
        stockQuantity: 0, costPrice: 0, hsnCode: 'NA',
        gstPercentage: 12, rackLocation: '', category: '', supplierId: '',
        supplierName: ''
    });

    // ✅ Fix 2: Single useEffect — no duplicate fetchInventory call
    useEffect(() => {
        fetchInventory();
        fetchSuppliers();
    }, []);

    const fetchInventory = async () => {
        try {
            const res = await api.get('/medicines');
            setMedicines(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Failed to fetch inventory", err);
            setMedicines([]);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const res = await api.get('/suppliers');
            setSuppliers(res.data || []);
        } catch (err) {
            console.error("Suppliers load failed");
        }
    };

    const openAddModal = () => {
        setIsEditing(false);
        setIsBulkMode(false);
        setFormData({
            name: '', batchNo: '', expiryDate: '', mrp: 0,
            stockQuantity: 0, costPrice: 0, hsnCode: 'NA',
            gstPercentage: 12, rackLocation: '', category: '', supplierId: '', supplierName: ''
        });
        setBulkRows([{ name: '', batchNo: '', expiryDate: '',
            mrp: 0, costPrice: 0, hsnCode: 'NA', gstPercentage: 12, rackLocation: '' }]);
        setShowModal(true);
    };

    const openEditModal = (med) => {
        if (!med) return;
        setIsEditing(true);
        setIsBulkMode(false);
        setCurrentId(med.id || med._id);
        setFormData({
            name: med.name || '',
            batchNo: med.batchNo || '',
            expiryDate: med.expiryDate ? med.expiryDate.split('T')[0] : '',
            mrp: med.mrp || 0,
            stockQuantity: med.stockQuantity || 0,
            hsnCode: med.hsnCode || 'NA',
            gstPercentage: med.gstPercentage || 12,
            costPrice: med.costPrice || 0,
            rackLocation: med.rackLocation || '',
            category: med.category || '',
            supplierId: med.supplierId || '',
            supplierName: med.supplierName || ''
        });
        setShowModal(true);
    };

    const addBulkRow = () => {
        setBulkRows([...bulkRows, { name: '', batchNo: '', expiryDate: '',
            mrp: 0, costPrice: 0, hsnCode: 'NA', gstPercentage: 12, rackLocation: '' }]);
    };

    const handleRowChange = (index, field, value) => {
        const updatedRows = [...bulkRows];
        updatedRows[index][field] = value;
        setBulkRows(updatedRows);
    };

    const removeRow = (index) => {
        if (bulkRows.length > 1) {
            setBulkRows(bulkRows.filter((_, i) => i !== index));
        }
    };

    const handleDelete = async (id) => {
        if (!id) return;
        if (window.confirm("Are you sure you want to delete this medicine?")) {
            try {
                await api.delete(`/medicines/${id}`);
                fetchInventory();
            } catch (err) {
                alert("Could not delete. Check server connection.");
            }
        }
    };

    const handleAddSupplier = async () => {
        try {
            const res = await api.post('/suppliers', newSupplier);
            setSuppliers([...suppliers, res.data]);
            setFormData({ ...formData, supplierId: res.data.id, supplierName: res.data.name });
            setShowSupplierModal(false);
            setNewSupplier({ name: '', contactPhone: '', email: '' });
        } catch (err) {
            alert("Failed to add supplier");
        }
    };

    // ✅ Fix 3: handleSubmit now handles the full form including supplier fields,
    // and no longer relies on a hidden submit button hack — modal save button calls this directly.
    const handleSubmit = async () => {
        if (!formData.name || !formData.batchNo) {
            alert("Medicine Name and Batch No are required.");
            return;
        }

        if (!formData.costPrice || Number(formData.costPrice) <= 0) {
            alert("⚠️ Cost Price is required and must be greater than 0!\n\nThis is needed for profit and dead stock calculations.");
            return;
        }

        try {
            if (isEditing) {
                await api.put(`/medicines/${currentId}`, formData);
            } else {
                const existing = (medicines || []).find(
                    (m) => m.name?.toLowerCase() === formData.name.toLowerCase() &&
                        m.batchNo?.toLowerCase() === formData.batchNo.toLowerCase()
                );
                if (existing) {
                    // ✅ Fix 4: supplierId and supplierName now included in merge update
                    const updatedData = {
                        ...existing,
                        stockQuantity: Number(existing.stockQuantity) + Number(formData.stockQuantity),
                        mrp: formData.mrp,
                        costPrice: formData.costPrice,
                        rackLocation: formData.rackLocation,
                        supplierId: formData.supplierId,
                        supplierName: formData.supplierName,
                    };
                    await api.put(`/medicines/${existing.id || existing._id}`, updatedData);
                    alert("Batch found! Stock quantity has been merged.");
                } else {
                    const newMedicinePayload = { ...formData, stockQuantity: 0 };
                    await api.post('/medicines', newMedicinePayload);
                }
            }
            setShowModal(false);
            fetchInventory();
        } catch (err) {
            alert("Error saving. Please ensure all fields are correct.");
        }
    };

    const handleBulkSave = async () => {
        const isValid = bulkRows.every(row => row.name && row.batchNo && row.expiryDate);
        if (!isValid) {
            alert("Please fill Name, Batch, and Expiry for all rows.");
            return;
        }

        const missingCostPrice = bulkRows.some(row => !row.costPrice || Number(row.costPrice) <= 0);
        if (missingCostPrice) {
            alert("⚠️ Cost Price is required for all rows!\n\nThis is needed for profit and dead stock calculations.");
            return;
        }

        const sanitizedRows = bulkRows.map(row => ({ ...row, stockQuantity: 0 }));
        try {
            await api.post('/medicines/bulk', sanitizedRows);
            alert("Bulk Inventory Catalog Registered!");
            setShowModal(false);
            setIsBulkMode(false);
            fetchInventory();
        } catch (err) {
            alert("Error during bulk save.");
        }
    };

    const handleBulkPriceUpdate = async () => {
        if (!bulkPriceData.name || !bulkPriceData.newPrice) {
            alert("Please select a medicine and enter new price.");
            return;
        }
        if (isNaN(bulkPriceData.newPrice)) {
            alert("Price must be a valid number.");
            return;
        }
        try {
            await api.put(
                `/medicines/bulk-update-by-name?name=${bulkPriceData.name}&newPrice=${bulkPriceData.newPrice}`
            );
            alert(`Success! All ${bulkPriceData.name} batches updated to ₹${bulkPriceData.newPrice}`);
            setBulkPriceData({ name: '', newPrice: '' });
            setShowBulkPriceModal(false);
            fetchInventory();
        } catch (err) {
            alert("Update failed. Check backend connection.");
        }
    };

    const getPriorityStyle = (medicine) => {
        const today = new Date();
        const expiry = new Date(medicine.expiryDate);
        const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
        if (diffDays <= 0) return { label: "EXPIRED", color: "#ef4444", bg: "rgba(239,68,68,0.1)" };
        if (diffDays <= 90) return { label: "SELL FIRST", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" };
        if (medicine.stockQuantity <= (medicine.minStockLevel || 10))
            return { label: "LOW STOCK", color: "#f87171", bg: "rgba(248,113,113,0.1)" };
        return { label: "HEALTHY", color: "#10b981", bg: "rgba(16,185,129,0.1)" };
    };

    const filteredMedicines = (medicines || []).filter(m => {
        const name = m.name ? m.name.toLowerCase() : "";
        const batch = m.batchNo ? m.batchNo.toLowerCase() : "";
        const query = searchQuery ? searchQuery.toLowerCase() : "";
        return name.includes(query) || batch.includes(query);
    });

    return (
        <div style={containerStyle}>

            {/* Header */}
            <header style={headerStyle}>
                <h1 style={{ color: '#f1f5f9', margin: 0 }}>Inventory Management</h1>
                <div style={{ display: 'flex', gap: '12px' }}>
                    {!readOnly && (
                        <button onClick={() => setShowBulkPriceModal(true)} style={bulkPriceBtnStyle}>
                            <RefreshCw size={18} /> UPDATE ALL PRICES
                        </button>
                    )}
                    {!readOnly && (
                        <button onClick={openAddModal} style={addBtnStyle}>
                            <Plus size={18} /> ADD MEDICINE
                        </button>
                    )}
                </div>
            </header>

            {/* Search */}
            <div style={searchBarStyle}>
                <Search size={18} color="#94a3b8" />
                <input type="text" placeholder="Filter by name or batch..."
                    style={searchInputStyle} value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)} />
            </div>

            {/* Search result banner */}
            {searchQuery && filteredMedicines.length > 1 && !readOnly &&(
                <div style={{
                    backgroundColor: 'rgba(96,165,250,0.1)', padding: '10px 20px',
                    borderRadius: '8px', marginBottom: '15px', display: 'flex',
                    alignItems: 'center', justifyContent: 'space-between',
                    border: '1px solid #60a5fa'
                }}>
                    <span style={{ color: '#60a5fa', fontSize: '14px' }}>
                        Found {filteredMedicines.length} batches for <strong>"{searchQuery}"</strong>
                    </span>
                    <button
                        onClick={() => {
                            setBulkPriceData({ name: filteredMedicines[0].name, newPrice: '' });
                            setShowBulkPriceModal(true);
                        }}
                        style={{ backgroundColor: '#60a5fa', color: '#0f172a', border: 'none',
                            padding: '6px 12px', borderRadius: '4px', fontWeight: 'bold',
                            cursor: 'pointer', fontSize: '12px' }}
                    >
                        UPDATE ALL PRICES
                    </button>
                </div>
            )}

            {/* Table */}
            <div style={tableWrapper}>
                <table style={invTable}>
                    <thead>
                        <tr style={thRow}>
                            <th style={thStyle}>Product Name</th>
                            <th style={thStyle}>Batch</th>
                            <th style={thStyle}>Stock</th>
                            <th style={thStyle}>MRP</th>
                            <th style={thStyle}>Cost Price</th>
                            <th style={thStyle}>Rack No.</th>
                            <th style={thStyle}>Category</th>
                            <th style={thStyle}>Expiry</th>
                            <th style={thStyle}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredMedicines.length > 0 ? filteredMedicines.map((med) => (
                            <tr key={med.id || med._id} style={trStyle}>
                                <td style={tdStyle}>{med.name}</td>
                                <td style={tdStyle}>{med.batchNo}</td>
                                <td style={tdStyle}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontWeight: 'bold' }}>{med.stockQuantity} Units</span>
                                        <span style={{
                                            padding: '2px 8px', borderRadius: '4px', fontSize: '10px', width: 'fit-content',
                                            color: getPriorityStyle(med).color,
                                            backgroundColor: getPriorityStyle(med).bg,
                                            border: `1px solid ${getPriorityStyle(med).color}22`
                                        }}>
                                            {getPriorityStyle(med).label}
                                        </span>
                                    </div>
                                </td>
                                <td style={tdStyle}>₹{med.mrp}</td>
                                <td style={{
                                    ...tdStyle,
                                    color: med.costPrice > 0 ? '#10b981' : '#ef4444',
                                    fontWeight: 'bold'
                                }}>
                                    {med.costPrice > 0 ? `₹${med.costPrice}` : '⚠ Missing'}
                                </td>
                                <td style={{ ...tdStyle, color: '#f59e0b', fontWeight: 'bold' }}>
                                    {med.rackLocation || 'N/A'}
                                </td>
                                <td style={{ ...tdStyle, color: '#a78bfa' }}>
                                    {med.category || 'N/A'}
                                </td>
                                <td style={{ ...tdStyle, color: '#a78bfa' }}>
                                    {med.expiryDate ?
                                        new Date(med.expiryDate).toLocaleDateString('en-IN') : 'N/A'}
                                </td>
                                <td style={tdStyle}>
                                    {!readOnly && (
                                        <>
                                            <Edit size={16}
                                                style={{ cursor: 'pointer', marginRight: '15px', color: '#60a5fa' }}
                                                onClick={() => openEditModal(med)} />
                                            <Trash2 size={16}
                                                style={{ cursor: 'pointer', color: '#ef4444' }}
                                                onClick={() => handleDelete(med.id || med._id)} />
                                        </>
                                    )}
                                    {readOnly && (
                                        <span style={{ color: '#475569', fontSize: '12px' }}>View Only</span>
                                    )}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="9" style={{ padding: '40px', textAlign: 'center', color: '#475569' }}>
                                    No records found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add / Edit Modal */}
            {showModal && (
                <div style={modalOverlay}>
                    <div style={{ ...modalContent, maxWidth: isBulkMode ? '1000px' : '600px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h2 style={{ color: '#60a5fa', margin: 0 }}>
                                {isBulkMode ? 'Bulk Entry' : (isEditing ? 'Update Medicine' : 'Add New Stock')}
                            </h2>
                            {!isEditing && (
                                <button onClick={() => setIsBulkMode(!isBulkMode)}
                                    style={{ background: 'none', border: '1px solid #60a5fa',
                                        color: '#60a5fa', padding: '5px 10px',
                                        borderRadius: '5px', cursor: 'pointer' }}>
                                    {isBulkMode ? 'Single Entry' : 'Bulk Entry'}
                                </button>
                            )}
                        </div>

                        {/* Required fields notice */}
                        <div style={{
                            backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid #f59e0b',
                            borderRadius: '8px', padding: '10px 15px', marginBottom: '20px',
                            fontSize: '12px', color: '#fbbf24'
                        }}>
                            ⚠️ <strong>Cost Price is mandatory</strong> — required for profit margins and dead stock loss calculations.
                        </div>

                        {isBulkMode ? (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
                                    <thead>
                                        <tr style={{ color: '#94a3b8', fontSize: '12px', textAlign: 'left' }}>
                                            <th style={{ padding: '4px' }}>Name *</th>
                                            <th style={{ padding: '4px' }}>Batch *</th>
                                            <th style={{ padding: '4px' }}>Expiry *</th>
                                            <th style={{ padding: '4px' }}>MRP *</th>
                                            <th style={{ padding: '4px', color: '#f59e0b' }}>Cost Price ⚠️ *</th>
                                            <th style={{ padding: '4px' }}>Rack No</th>
                                            <th style={{ padding: '4px' }}>Category</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bulkRows.map((row, index) => (
                                            <tr key={index}>
                                                <td style={{ padding: '4px' }}>
                                                    <input style={smallInput} value={row.name}
                                                        onChange={(e) => handleRowChange(index, 'name', e.target.value)} />
                                                </td>
                                                <td style={{ padding: '4px' }}>
                                                    <input style={smallInput} value={row.batchNo}
                                                        onChange={(e) => handleRowChange(index, 'batchNo', e.target.value)} />
                                                </td>
                                                <td style={{ padding: '4px' }}>
                                                    <input type="date" style={smallInput} value={row.expiryDate}
                                                        onChange={(e) => handleRowChange(index, 'expiryDate', e.target.value)} />
                                                </td>
                                                <td style={{ padding: '4px' }}>
                                                    <input type="number" style={smallInput} value={row.mrp}
                                                        onChange={(e) => handleRowChange(index, 'mrp', e.target.value)} />
                                                </td>
                                                <td style={{ padding: '4px' }}>
                                                    <input
                                                        type="number"
                                                        style={smallRequiredInput}
                                                        placeholder="Required!"
                                                        value={row.costPrice}
                                                        onChange={(e) => handleRowChange(index, 'costPrice', e.target.value)}
                                                    />
                                                </td>
                                                <td style={{ padding: '4px' }}>
                                                    <input style={smallInput} placeholder="A-1"
                                                        value={row.rackLocation}
                                                        onChange={(e) => handleRowChange(index, 'rackLocation', e.target.value)} />
                                                </td>
                                                <td style={{ padding: '4px' }}>
                                                    <input style={smallInput} placeholder="e.g. Antibiotic"
                                                        value={row.category || ''}
                                                        onChange={(e) => handleRowChange(index, 'category', e.target.value)} />
                                                </td>
                                                <td>
                                                    <Trash2 size={16} color="#ef4444"
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => removeRow(index)} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <button onClick={addBulkRow}
                                    style={{ color: '#10b981', background: 'none', border: 'none',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <Plus size={16} /> Add Row
                                </button>
                            </div>
                        ) : (
                            // ✅ Fix 3: Supplier dropdown is now inside the form, no hidden submit button
                            <div>
                                <label style={labelStyle}>Medicine Name *</label>
                                <input value={formData.name} style={formInput}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })} />

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={labelStyle}>Batch No *</label>
                                        <input value={formData.batchNo} style={formInput}
                                            onChange={e => setFormData({ ...formData, batchNo: e.target.value })} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={labelStyle}>HSN Code</label>
                                        <input value={formData.hsnCode} style={formInput}
                                            onChange={e => setFormData({ ...formData, hsnCode: e.target.value })} />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={labelStyle}>Expiry Date</label>
                                        <input type="date" value={formData.expiryDate} style={formInput}
                                            onChange={e => setFormData({ ...formData, expiryDate: e.target.value })} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={labelStyle}>MRP (₹) *</label>
                                        <input type="number" value={formData.mrp} style={formInput}
                                            onChange={e => setFormData({ ...formData, mrp: e.target.value })} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={requiredLabel}>Cost Price (₹) ⚠️ *</label>
                                        <input
                                            type="number"
                                            value={formData.costPrice}
                                            min="0.01"
                                            step="0.01"
                                            placeholder="Purchase price"
                                            style={requiredInput}
                                            onChange={e => setFormData({ ...formData, costPrice: e.target.value })}
                                        />
                                        <span style={{ fontSize: '10px', color: '#f59e0b', display: 'block', marginBottom: '10px' }}>
                                            Required for profit & dead stock reports
                                        </span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <div style={{ flex: 1 }}>
                                        {isEditing ? (
                                            <div>
                                                <label style={{ ...labelStyle, color: '#fbbf24' }}>
                                                    Stock Qty (Manual Adjustment ⚠️)
                                                </label>
                                                <input type="number" value={formData.stockQuantity}
                                                    style={{ ...formInput, border: '1px solid #fbbf24' }}
                                                    onChange={e => setFormData({ ...formData, stockQuantity: e.target.value })} />
                                            </div>
                                        ) : (
                                            <div>
                                                <label style={labelStyle}>Initial Catalog Stock</label>
                                                <input disabled value="0"
                                                    style={{ ...formInput, opacity: 0.5, cursor: 'not-allowed' }} />
                                                <span style={{ fontSize: '10px', color: '#94a3b8',
                                                    display: 'block', marginTop: '-10px', marginBottom: '15px' }}>
                                                    Stock will populate via Purchase Orders.
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={labelStyle}>GST %</label>
                                        <input type="number" value={formData.gstPercentage} style={formInput}
                                            onChange={e => setFormData({ ...formData, gstPercentage: e.target.value })} />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={labelStyle}>Rack Location / Shelf Number</label>
                                        <input placeholder="e.g. Rack A-3, Box 12"
                                            value={formData.rackLocation} style={formInput}
                                            onChange={e => setFormData({ ...formData, rackLocation: e.target.value })} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={labelStyle}>Category</label>
                                        <input placeholder="e.g. Antibiotic, Vitamin"
                                            value={formData.category} style={formInput}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })} />
                                    </div>
                                </div>

                                {/* ✅ Supplier dropdown now inside the form section */}
                                <label style={labelStyle}>Preferred Supplier (For One-Click Orders)</label>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
                                    <select
                                        style={{ ...formInput, flex: 1, marginBottom: 0 }}
                                        value={formData.supplierId}
                                        onChange={e => {
                                            const selected = suppliers.find(s => s.id === e.target.value);
                                            setFormData({
                                                ...formData,
                                                supplierId: e.target.value,
                                                supplierName: selected ? selected.name : ''
                                            });
                                        }}
                                    >
                                        <option value="">-- Select Supplier --</option>
                                        {suppliers.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => setShowSupplierModal(true)}
                                        style={{ ...addBtnStyle, padding: '10px', marginBottom: '0' }}
                                    >
                                        <UserPlus size={18} />
                                    </button>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                            <button type="button" onClick={() => setShowModal(false)} style={cancelBtn}>
                                Cancel
                            </button>
                            {/* ✅ Fix 3: Save button directly calls handleSubmit or handleBulkSave — no hidden button */}
                            <button
                                type="button"
                                onClick={isBulkMode ? handleBulkSave : handleSubmit}
                                style={saveBtn}
                            >
                                {isBulkMode ? 'Save All' : (isEditing ? 'Update' : 'Save')}
                            </button>
                        </div>
                    </div>

                    {/* Quick Add Supplier Modal */}
                    {showSupplierModal && (
                        <div style={modalOverlay}>
                            <div style={{ ...modalContent, maxWidth: '400px' }}>
                                <h3 style={{ color: 'white' }}>Quick Add Supplier</h3>
                                <div style={{ marginTop: '20px' }}>
                                    <label style={labelStyle}>Supplier Name</label>
                                    <input style={formInput} placeholder="e.g. Vinod Pharma"
                                        value={newSupplier.name}
                                        onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })} />

                                    <label style={labelStyle}>WhatsApp Number</label>
                                    <input style={formInput} placeholder="91XXXXXXXXXX"
                                        value={newSupplier.contactPhone}
                                        onChange={e => setNewSupplier({ ...newSupplier, contactPhone: e.target.value })} />

                                    <label style={labelStyle}>Email</label>
                                    <input style={formInput} placeholder="email@supplier.com"
                                        value={newSupplier.email}
                                        onChange={e => setNewSupplier({ ...newSupplier, email: e.target.value })} />

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                        <button onClick={() => setShowSupplierModal(false)} style={cancelBtn}>Cancel</button>
                                        <button onClick={handleAddSupplier} style={saveBtn}>Add & Link</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Bulk Price Update Modal */}
            {showBulkPriceModal && (
                <div style={modalOverlay}>
                    <div style={{ ...modalContent, maxWidth: '450px' }}>
                        <h2 style={{ color: '#7c3aed', margin: '0 0 20px' }}>Update All Prices</h2>
                        <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px' }}>
                            Updates MRP for ALL batches of selected medicine.
                        </p>

                        <label style={labelStyle}>Select Medicine</label>
                        <select style={{ ...formInput, cursor: 'pointer' }}
                            value={bulkPriceData.name}
                            onChange={e => setBulkPriceData({ ...bulkPriceData, name: e.target.value })}>
                            <option value="">-- Select Medicine --</option>
                            {[...new Set(medicines.map(m => m.name))].map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>

                        <label style={labelStyle}>New MRP (₹)</label>
                        <input type="number" value={bulkPriceData.newPrice}
                            placeholder="e.g. 45.50" style={formInput}
                            onChange={e => setBulkPriceData({ ...bulkPriceData, newPrice: e.target.value })} />

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                            <button onClick={() => {
                                setShowBulkPriceModal(false);
                                setBulkPriceData({ name: '', newPrice: '' });
                            }} style={cancelBtn}>Cancel</button>
                            <button onClick={handleBulkPriceUpdate}
                                style={{ ...saveBtn, backgroundColor: '#7c3aed' }}>
                                Update All Batches
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Inventory;