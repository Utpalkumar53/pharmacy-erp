import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { Plus, Edit, Trash2, Search, RefreshCw, UserPlus } from 'lucide-react';

const Inventory = ({ readOnly = false }) => {
    const [medicines, setMedicines]               = useState([]);
    const [showModal, setShowModal]               = useState(false);
    const [showBulkPriceModal, setShowBulkPriceModal] = useState(false);
    const [isEditing, setIsEditing]               = useState(false);
    const [currentId, setCurrentId]               = useState(null);
    const [searchQuery, setSearchQuery]           = useState('');
    const [isBulkMode, setIsBulkMode]             = useState(false);
    const [suppliers, setSuppliers]               = useState([]);
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [newSupplier, setNewSupplier]           = useState({ name: '', contactPhone: '', email: '' });

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
        if (!isValid) { alert("Please fill Name, Batch, and Expiry for all rows."); return; }
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
            alert("Please select a medicine and enter new price."); return;
        }
        if (isNaN(bulkPriceData.newPrice)) { alert("Price must be a valid number."); return; }
        try {
            await api.put(`/medicines/bulk-update-by-name?name=${bulkPriceData.name}&newPrice=${bulkPriceData.newPrice}`);
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
        if (diffDays <= 0)  return { label: "EXPIRED",    color: "#ef4444", bg: "rgba(239,68,68,0.1)" };
        if (diffDays <= 90) return { label: "SELL FIRST", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" };
        if (medicine.stockQuantity <= (medicine.minStockLevel || 10))
            return { label: "LOW STOCK", color: "#f87171", bg: "rgba(248,113,113,0.1)" };
        return { label: "HEALTHY", color: "#10b981", bg: "rgba(16,185,129,0.1)" };
    };

    const filteredMedicines = (medicines || []).filter(m => {
        const name  = m.name  ? m.name.toLowerCase()  : "";
        const batch = m.batchNo ? m.batchNo.toLowerCase() : "";
        const query = searchQuery ? searchQuery.toLowerCase() : "";
        return name.includes(query) || batch.includes(query);
    });

    return (
        <div className="inv-page">

            {/* ── Header ── */}
            <div className="inv-header">
                <h1 style={{ color: '#f1f5f9', margin: 0, fontSize: '24px', fontWeight: 700 }}>
                    Inventory Management
                </h1>
                <div className="inv-header-btns">
                    {!readOnly && (
                        <button onClick={() => setShowBulkPriceModal(true)} style={s.bulkBtn}>
                            <RefreshCw size={16} /> <span className="inv-btn-label">UPDATE ALL PRICES</span>
                        </button>
                    )}
                    {!readOnly && (
                        <button onClick={openAddModal} style={s.addBtn}>
                            <Plus size={16} /> <span className="inv-btn-label">ADD MEDICINE</span>
                        </button>
                    )}
                </div>
            </div>

            {/* ── Search ── */}
            <div className="inv-search-bar">
                <Search size={18} color="#94a3b8" />
                <input type="text" placeholder="Filter by name or batch..."
                    style={s.searchInput} value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)} />
            </div>

            {/* ── Search result banner ── */}
            {searchQuery && filteredMedicines.length > 1 && !readOnly && (
                <div className="inv-search-banner">
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
                            cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap' }}
                    >
                        UPDATE ALL PRICES
                    </button>
                </div>
            )}

            {/* ── Table ── */}
            <div style={s.tableWrapper}>
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '640px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #334155' }}>
                                <th style={s.th}>Product Name</th>
                                <th style={s.th} className="inv-col-batch">Batch</th>
                                <th style={s.th}>Stock</th>
                                <th style={s.th}>MRP</th>
                                <th style={s.th} className="inv-col-cost">Cost Price</th>
                                <th style={s.th} className="inv-col-rack">Rack No.</th>
                                <th style={s.th} className="inv-col-cat">Category</th>
                                <th style={s.th} className="inv-col-exp">Expiry</th>
                                <th style={s.th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMedicines.length > 0 ? filteredMedicines.map((med) => (
                                <tr key={med.id || med._id}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(96,165,250,0.04)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <td style={s.td}>{med.name}</td>
                                    <td style={s.td} className="inv-col-batch">
                                        <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{med.batchNo}</span>
                                    </td>
                                    <td style={s.td}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span style={{ fontWeight: 'bold', color: '#f1f5f9' }}>{med.stockQuantity} Units</span>
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
                                    <td style={s.td}>₹{med.mrp}</td>
                                    <td style={{ ...s.td, color: med.costPrice > 0 ? '#10b981' : '#ef4444', fontWeight: 'bold' }} className="inv-col-cost">
                                        {med.costPrice > 0 ? `₹${med.costPrice}` : '⚠ Missing'}
                                    </td>
                                    <td style={{ ...s.td, color: '#f59e0b', fontWeight: 'bold' }} className="inv-col-rack">
                                        {med.rackLocation || 'N/A'}
                                    </td>
                                    <td style={{ ...s.td, color: '#a78bfa' }} className="inv-col-cat">
                                        {med.category || 'N/A'}
                                    </td>
                                    <td style={{ ...s.td, color: '#a78bfa' }} className="inv-col-exp">
                                        {med.expiryDate ? new Date(med.expiryDate).toLocaleDateString('en-IN') : 'N/A'}
                                    </td>
                                    <td style={s.td}>
                                        {!readOnly ? (
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                <Edit size={16} style={{ cursor: 'pointer', color: '#60a5fa' }}
                                                    onClick={() => openEditModal(med)} />
                                                <Trash2 size={16} style={{ cursor: 'pointer', color: '#ef4444' }}
                                                    onClick={() => handleDelete(med.id || med._id)} />
                                            </div>
                                        ) : (
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
            </div>

            {/* ── Add / Edit Modal ── */}
            {showModal && (
                <div style={s.modalOverlay}>
                    <div style={{ ...s.modalContent, maxWidth: isBulkMode ? '900px' : '600px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ color: '#60a5fa', margin: 0, fontSize: '18px' }}>
                                {isBulkMode ? 'Bulk Entry' : (isEditing ? 'Update Medicine' : 'Add New Stock')}
                            </h2>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                {!isEditing && (
                                    <button onClick={() => setIsBulkMode(!isBulkMode)}
                                        style={{ background: 'none', border: '1px solid #60a5fa',
                                            color: '#60a5fa', padding: '5px 10px',
                                            borderRadius: '5px', cursor: 'pointer', fontSize: '13px' }}>
                                        {isBulkMode ? 'Single Entry' : 'Bulk Entry'}
                                    </button>
                                )}
                                <button onClick={() => setShowModal(false)}
                                    style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}>
                                    ×
                                </button>
                            </div>
                        </div>

                        {/* Required notice */}
                        <div style={{ backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid #f59e0b',
                            borderRadius: '8px', padding: '10px 15px', marginBottom: '20px',
                            fontSize: '12px', color: '#fbbf24' }}>
                            ⚠️ <strong>Cost Price is mandatory</strong> — required for profit margins and dead stock loss calculations.
                        </div>

                        {isBulkMode ? (
                            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px', minWidth: '640px' }}>
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
                                                    <input style={s.smallInput} value={row.name}
                                                        onChange={(e) => handleRowChange(index, 'name', e.target.value)} />
                                                </td>
                                                <td style={{ padding: '4px' }}>
                                                    <input style={s.smallInput} value={row.batchNo}
                                                        onChange={(e) => handleRowChange(index, 'batchNo', e.target.value)} />
                                                </td>
                                                <td style={{ padding: '4px' }}>
                                                    <input type="date" style={s.smallInput} value={row.expiryDate}
                                                        onChange={(e) => handleRowChange(index, 'expiryDate', e.target.value)} />
                                                </td>
                                                <td style={{ padding: '4px' }}>
                                                    <input type="number" style={s.smallInput} value={row.mrp}
                                                        onChange={(e) => handleRowChange(index, 'mrp', e.target.value)} />
                                                </td>
                                                <td style={{ padding: '4px' }}>
                                                    <input type="number" style={s.smallRequiredInput} placeholder="Required!"
                                                        value={row.costPrice}
                                                        onChange={(e) => handleRowChange(index, 'costPrice', e.target.value)} />
                                                </td>
                                                <td style={{ padding: '4px' }}>
                                                    <input style={s.smallInput} placeholder="A-1"
                                                        value={row.rackLocation}
                                                        onChange={(e) => handleRowChange(index, 'rackLocation', e.target.value)} />
                                                </td>
                                                <td style={{ padding: '4px' }}>
                                                    <input style={s.smallInput} placeholder="e.g. Antibiotic"
                                                        value={row.category || ''}
                                                        onChange={(e) => handleRowChange(index, 'category', e.target.value)} />
                                                </td>
                                                <td style={{ padding: '4px' }}>
                                                    <Trash2 size={16} color="#ef4444" style={{ cursor: 'pointer' }}
                                                        onClick={() => removeRow(index)} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <button onClick={addBulkRow}
                                    style={{ color: '#10b981', background: 'none', border: 'none',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px' }}>
                                    <Plus size={16} /> Add Row
                                </button>
                            </div>
                        ) : (
                            <div>
                                <label style={s.label}>Medicine Name *</label>
                                <input value={formData.name} style={s.formInput}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })} />

                                <div className="inv-form-row">
                                    <div style={{ flex: 1 }}>
                                        <label style={s.label}>Batch No *</label>
                                        <input value={formData.batchNo} style={s.formInput}
                                            onChange={e => setFormData({ ...formData, batchNo: e.target.value })} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={s.label}>HSN Code</label>
                                        <input value={formData.hsnCode} style={s.formInput}
                                            onChange={e => setFormData({ ...formData, hsnCode: e.target.value })} />
                                    </div>
                                </div>

                                <div className="inv-form-row3">
                                    <div style={{ flex: 1 }}>
                                        <label style={s.label}>Expiry Date</label>
                                        <input type="date" value={formData.expiryDate} style={s.formInput}
                                            onChange={e => setFormData({ ...formData, expiryDate: e.target.value })} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={s.label}>MRP (₹) *</label>
                                        <input type="number" value={formData.mrp} style={s.formInput}
                                            onChange={e => setFormData({ ...formData, mrp: e.target.value })} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={s.requiredLabel}>Cost Price (₹) ⚠️ *</label>
                                        <input type="number" value={formData.costPrice} min="0.01" step="0.01"
                                            placeholder="Purchase price" style={s.requiredInput}
                                            onChange={e => setFormData({ ...formData, costPrice: e.target.value })} />
                                        <span style={{ fontSize: '10px', color: '#f59e0b', display: 'block', marginBottom: '10px' }}>
                                            Required for profit & dead stock reports
                                        </span>
                                    </div>
                                </div>

                                <div className="inv-form-row">
                                    <div style={{ flex: 1 }}>
                                        {isEditing ? (
                                            <div>
                                                <label style={{ ...s.label, color: '#fbbf24' }}>Stock Qty (Manual Adjustment ⚠️)</label>
                                                <input type="number" value={formData.stockQuantity}
                                                    style={{ ...s.formInput, border: '1px solid #fbbf24' }}
                                                    onChange={e => setFormData({ ...formData, stockQuantity: e.target.value })} />
                                            </div>
                                        ) : (
                                            <div>
                                                <label style={s.label}>Initial Catalog Stock</label>
                                                <input disabled value="0" style={{ ...s.formInput, opacity: 0.5, cursor: 'not-allowed' }} />
                                                <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginTop: '-10px', marginBottom: '15px' }}>
                                                    Stock will populate via Purchase Orders.
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={s.label}>GST %</label>
                                        <input type="number" value={formData.gstPercentage} style={s.formInput}
                                            onChange={e => setFormData({ ...formData, gstPercentage: e.target.value })} />
                                    </div>
                                </div>

                                <div className="inv-form-row">
                                    <div style={{ flex: 1 }}>
                                        <label style={s.label}>Rack Location / Shelf Number</label>
                                        <input placeholder="e.g. Rack A-3, Box 12" value={formData.rackLocation} style={s.formInput}
                                            onChange={e => setFormData({ ...formData, rackLocation: e.target.value })} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={s.label}>Category</label>
                                        <input placeholder="e.g. Antibiotic, Vitamin" value={formData.category} style={s.formInput}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })} />
                                    </div>
                                </div>

                                {/* Supplier */}
                                <label style={s.label}>Preferred Supplier (For One-Click Orders)</label>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
                                    <select style={{ ...s.formInput, flex: 1, marginBottom: 0 }}
                                        value={formData.supplierId}
                                        onChange={e => {
                                            const selected = suppliers.find(sup => sup.id === e.target.value);
                                            setFormData({ ...formData, supplierId: e.target.value, supplierName: selected ? selected.name : '' });
                                        }}>
                                        <option value="">-- Select Supplier --</option>
                                        {suppliers.map(sup => (
                                            <option key={sup.id} value={sup.id}>{sup.name}</option>
                                        ))}
                                    </select>
                                    <button type="button" onClick={() => setShowSupplierModal(true)}
                                        style={{ ...s.addBtn, padding: '10px', flexShrink: 0 }}>
                                        <UserPlus size={18} />
                                    </button>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                            <button type="button" onClick={() => setShowModal(false)} style={s.cancelBtn}>Cancel</button>
                            <button type="button" onClick={isBulkMode ? handleBulkSave : handleSubmit} style={s.saveBtn}>
                                {isBulkMode ? 'Save All' : (isEditing ? 'Update' : 'Save')}
                            </button>
                        </div>
                    </div>

                    {/* Quick Add Supplier Modal */}
                    {showSupplierModal && (
                        <div style={s.modalOverlay}>
                            <div style={{ ...s.modalContent, maxWidth: '400px' }}>
                                <h3 style={{ color: 'white', marginTop: 0 }}>Quick Add Supplier</h3>
                                <label style={s.label}>Supplier Name</label>
                                <input style={s.formInput} placeholder="e.g. Vinod Pharma"
                                    value={newSupplier.name}
                                    onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })} />
                                <label style={s.label}>WhatsApp Number</label>
                                <input style={s.formInput} placeholder="91XXXXXXXXXX"
                                    value={newSupplier.contactPhone}
                                    onChange={e => setNewSupplier({ ...newSupplier, contactPhone: e.target.value })} />
                                <label style={s.label}>Email</label>
                                <input style={s.formInput} placeholder="email@supplier.com"
                                    value={newSupplier.email}
                                    onChange={e => setNewSupplier({ ...newSupplier, email: e.target.value })} />
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                    <button onClick={() => setShowSupplierModal(false)} style={s.cancelBtn}>Cancel</button>
                                    <button onClick={handleAddSupplier} style={s.saveBtn}>Add & Link</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Bulk Price Update Modal ── */}
            {showBulkPriceModal && (
                <div style={s.modalOverlay}>
                    <div style={{ ...s.modalContent, maxWidth: '450px' }}>
                        <h2 style={{ color: '#7c3aed', margin: '0 0 20px' }}>Update All Prices</h2>
                        <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px' }}>
                            Updates MRP for ALL batches of selected medicine.
                        </p>
                        <label style={s.label}>Select Medicine</label>
                        <select style={{ ...s.formInput, cursor: 'pointer' }}
                            value={bulkPriceData.name}
                            onChange={e => setBulkPriceData({ ...bulkPriceData, name: e.target.value })}>
                            <option value="">-- Select Medicine --</option>
                            {[...new Set(medicines.map(m => m.name))].map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                        <label style={s.label}>New MRP (₹)</label>
                        <input type="number" value={bulkPriceData.newPrice} placeholder="e.g. 45.50"
                            style={s.formInput}
                            onChange={e => setBulkPriceData({ ...bulkPriceData, newPrice: e.target.value })} />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                            <button onClick={() => { setShowBulkPriceModal(false); setBulkPriceData({ name: '', newPrice: '' }); }}
                                style={s.cancelBtn}>Cancel</button>
                            <button onClick={handleBulkPriceUpdate}
                                style={{ ...s.saveBtn, backgroundColor: '#7c3aed' }}>
                                Update All Batches
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                /* ── Page ── */
                .inv-page {
                    padding: 40px;
                    background-color: #0f172a;
                    min-height: 100vh;
                    box-sizing: border-box;
                }

                /* ── Header ── */
                .inv-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                    flex-wrap: wrap;
                    gap: 12px;
                }
                .inv-header-btns {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                }

                /* ── Search bar ── */
                .inv-search-bar {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background-color: #1e293b;
                    padding: 12px;
                    border-radius: 10px;
                    border: 1px solid #334155;
                    margin-bottom: 20px;
                    max-width: 400px;
                }

                /* ── Search banner ── */
                .inv-search-banner {
                    background-color: rgba(96,165,250,0.1);
                    padding: 10px 20px;
                    border-radius: 8px;
                    margin-bottom: 15px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border: 1px solid #60a5fa;
                    gap: 12px;
                    flex-wrap: wrap;
                }

                /* ── Modal form rows ── */
                .inv-form-row {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 0;
                }
                .inv-form-row3 {
                    display: flex;
                    gap: 10px;
                }

                /* ════════════════════════════════
                   TABLET  (≤ 900px)
                ════════════════════════════════ */
                @media (max-width: 900px) {
                    .inv-page {
                        padding: 24px 16px;
                    }
                    .inv-search-bar {
                        max-width: 100%;
                    }
                    /* Hide less-critical columns */
                    .inv-col-rack,
                    .inv-col-cat {
                        display: none;
                    }
                }

                /* ════════════════════════════════
                   MOBILE  (≤ 480px)
                ════════════════════════════════ */
                @media (max-width: 480px) {
                    .inv-page {
                        padding: 14px 12px;
                    }
                    .inv-header {
                        flex-direction: column;
                        align-items: flex-start;
                    }
                    .inv-header-btns {
                        width: 100%;
                    }
                    .inv-header-btns button {
                        flex: 1;
                        justify-content: center;
                    }
                    /* Hide more columns on mobile — keep Name, Stock, MRP, Actions */
                    .inv-col-batch,
                    .inv-col-cost,
                    .inv-col-exp {
                        display: none;
                    }
                    /* Stack modal form rows */
                    .inv-form-row,
                    .inv-form-row3 {
                        flex-direction: column;
                    }
                    /* Full-width search */
                    .inv-search-bar {
                        max-width: 100%;
                    }
                }
            `}</style>
        </div>
    );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
    addBtn:         { backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' },
    bulkBtn:        { backgroundColor: '#7c3aed', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' },
    searchInput:    { background: 'none', border: 'none', color: 'white', outline: 'none', width: '100%', fontSize: '14px' },
    tableWrapper:   { backgroundColor: '#1e293b', borderRadius: '16px', border: '1px solid #334155', overflow: 'hidden' },
    th:             { textAlign: 'left', padding: '15px', color: '#94a3b8', fontSize: '13px', textTransform: 'uppercase', whiteSpace: 'nowrap' },
    td:             { padding: '15px', color: '#cbd5e1', borderBottom: '1px solid #334155', fontSize: '14px' },
    modalOverlay:   { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px' },
    modalContent:   { backgroundColor: '#1e293b', padding: '28px', borderRadius: '16px', width: '100%', maxWidth: '600px', border: '1px solid #334155', maxHeight: '90vh', overflowY: 'auto' },
    formInput:      { width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', marginBottom: '15px', outline: 'none', boxSizing: 'border-box', fontSize: '14px' },
    requiredInput:  { width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #f59e0b', borderRadius: '8px', color: 'white', marginBottom: '4px', outline: 'none', boxSizing: 'border-box', fontSize: '14px' },
    smallInput:     { width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: 'white', fontSize: '13px', outline: 'none', boxSizing: 'border-box' },
    smallRequiredInput: { width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #f59e0b', borderRadius: '4px', color: 'white', fontSize: '13px', outline: 'none', boxSizing: 'border-box' },
    label:          { color: '#94a3b8', fontSize: '12px', marginBottom: '5px', display: 'block' },
    requiredLabel:  { color: '#f59e0b', fontSize: '12px', marginBottom: '5px', display: 'block', fontWeight: 'bold' },
    saveBtn:        { backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
    cancelBtn:      { background: 'none', border: '1px solid #334155', color: '#94a3b8', cursor: 'pointer', padding: '10px 16px', borderRadius: '6px', fontSize: '14px' },
};

export default Inventory;