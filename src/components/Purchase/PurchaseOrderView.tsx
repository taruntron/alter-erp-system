import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { 
  PackageSearch, 
  Plus, 
  Search, 
  Trash2, 
  CheckCircle, 
  FileText, 
  Printer, 
  Building, 
  Calendar,
  Clock,
  ArrowRight,
  Send,
  History
} from 'lucide-react';
import { Product, PurchaseOrderItem, PurchaseOrder } from '../../types';
import { PurchasePrintModal } from './PurchasePrintModal';

interface PurchaseOrderViewProps {
  onConvertToPurchase?: (po: PurchaseOrder) => void;
}

export const PurchaseOrderView: React.FC<PurchaseOrderViewProps> = ({ onConvertToPurchase }) => {
  const { suppliers, products, purchaseOrders, createPurchaseOrder, activeSection } = useStore();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [expectedDate, setExpectedDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');

  const [poItems, setPoItems] = useState<PurchaseOrderItem[]>([]);
  const [itemSearch, setItemSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [highlightedItemIndex, setHighlightedItemIndex] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [poToPrint, setPoToPrint] = useState<PurchaseOrder | null>(null);

  const itemDropdownContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (itemDropdownContainerRef.current && !itemDropdownContainerRef.current.contains(e.target as Node)) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-scroll highlighted product into view
  useEffect(() => {
    if (showProductDropdown && highlightedItemIndex >= 0) {
      const el = document.getElementById(`purchase-order-opt-${highlightedItemIndex}`);
      if (el) {
        el.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedItemIndex, showProductDropdown]);

  const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null);

  const handleSelectSupplier = (suppId: string) => {
    setSelectedSupplierId(suppId);
    const s = suppliers.find((supp) => supp.id === suppId);
    if (s) {
      setSupplierName(s.name);
      setSupplierPhone(s.phone);
    }
  };

  const handleAddItem = (prod: Product) => {
    const existingIndex = poItems.findIndex((it) => it.product_id === prod.id);
    if (existingIndex >= 0) {
      const updated = [...poItems];
      const newQty = updated[existingIndex].qty + 1;
      updated[existingIndex] = {
        ...updated[existingIndex],
        qty: newQty,
        total: Number((newQty * updated[existingIndex].cost).toFixed(3)),
      };
      setPoItems(updated);
    } else {
      setPoItems((prev) => [
        ...prev,
        {
          product_id: prod.id,
          sku: prod.sku,
          barcode: prod.barcode,
          name: prod.name,
          unit: prod.unit,
          qty: 10,
          cost: prod.cost,
          total: Number((10 * prod.cost).toFixed(3)),
        },
      ]);
    }
    setItemSearch('');
    setShowProductDropdown(false);
  };

  const handleUpdateQty = (index: number, qty: number) => {
    const validQty = Math.max(1, qty);
    const updated = [...poItems];
    updated[index] = {
      ...updated[index],
      qty: validQty,
      total: Number((validQty * updated[index].cost).toFixed(3)),
    };
    setPoItems(updated);
  };

  const handleUpdateCost = (index: number, cost: number) => {
    const validCost = Math.max(0, cost);
    const updated = [...poItems];
    updated[index] = {
      ...updated[index],
      cost: validCost,
      total: Number((updated[index].qty * validCost).toFixed(3)),
    };
    setPoItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setPoItems((prev) => prev.filter((_, i) => i !== index));
  };

  const subtotal = poItems.reduce((sum, it) => sum + it.total, 0);

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName || poItems.length === 0) return;

    setIsSubmitting(true);
    try {
      await createPurchaseOrder({
        supplier_id: selectedSupplierId || undefined,
        supplier_name: supplierName,
        supplier_phone: supplierPhone,
        items: poItems,
        total_amount: subtotal,
        status: 'pending',
        expected_delivery_date: expectedDate,
        created_by: user?.displayName || 'Admin',
        notes: notes || undefined,
      });

      setShowToast(true);
      setPoItems([]);
      setSelectedSupplierId('');
      setSupplierName('');
      setNotes('');
      setActiveTab('list');
      setTimeout(() => setShowToast(false), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
      p.barcode.includes(itemSearch) ||
      p.sku.toLowerCase().includes(itemSearch.toLowerCase())
  );

  return (
    <div className="h-full overflow-y-auto bg-slate-950 text-slate-100 p-3 sm:p-4 space-y-4 custom-scrollbar">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <PackageSearch className="w-5 h-5 text-blue-400" />
            Purchase Order (PO) Management
          </h2>
          <p className="text-xs text-slate-400">
            Create supplier purchase orders, track incoming inventory shipments, and convert directly to purchase invoices
          </p>
        </div>

        {/* Tab Toggle (Compact Icon-only Buttons) */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            title="Create New PO"
            onClick={() => setActiveTab('create')}
            className={`p-2 rounded-md text-xs font-bold transition-colors flex items-center justify-center ${
              activeTab === 'create'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            title="PO History / List"
            onClick={() => setActiveTab('list')}
            className={`p-2 rounded-md text-xs font-bold transition-colors flex items-center justify-center relative ${
              activeTab === 'list'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            {purchaseOrders.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white text-[9px] px-1 py-0.2 rounded-full font-mono font-bold">
                {purchaseOrders.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {showToast && (
        <div className="bg-emerald-500/20 border border-emerald-500 text-emerald-300 text-xs px-3.5 py-2 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Purchase Order created and assigned official PO Number successfully!
        </div>
      )}

      {activeTab === 'create' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Entry Panel (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Vendor & Delivery Card */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                1. Supplier & Delivery Schedule
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Supplier Dropdown */}
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Select Supplier / Manufacturer *
                  </label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => handleSelectSupplier(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded px-2.5 py-2 outline-none focus:border-blue-500 font-bold"
                  >
                    <option value="">-- Choose registered vendor --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.category || 'Vendor'}) - Tel: {s.phone}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Expected Delivery */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Expected Arrival Date
                  </label>
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded px-2.5 py-2 outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Product Search */}
              <div ref={itemDropdownContainerRef} className="relative pt-2 border-t border-slate-800">
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Search & Add Products to Order
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={itemSearch}
                    onChange={(e) => {
                      setItemSearch(e.target.value);
                      setShowProductDropdown(true);
                      setHighlightedItemIndex(0);
                    }}
                    onFocus={() => {
                      setShowProductDropdown(true);
                      setHighlightedItemIndex(0);
                    }}
                    onKeyDown={(e) => {
                      const visibleProducts = filteredProducts.slice(0, 8);
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        if (!showProductDropdown) setShowProductDropdown(true);
                        if (visibleProducts.length > 0) {
                          setHighlightedItemIndex((prev) => (prev + 1) % visibleProducts.length);
                        }
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        if (!showProductDropdown) setShowProductDropdown(true);
                        if (visibleProducts.length > 0) {
                          setHighlightedItemIndex((prev) => (prev - 1 + visibleProducts.length) % visibleProducts.length);
                        }
                      } else if (e.key === 'Enter' || e.key === 'Tab') {
                        if (showProductDropdown && visibleProducts.length > 0) {
                          e.preventDefault();
                          const validIdx = highlightedItemIndex >= 0 && highlightedItemIndex < visibleProducts.length
                            ? highlightedItemIndex
                            : 0;
                          handleAddItem(visibleProducts[validIdx]);
                        }
                      } else if (e.key === 'Escape') {
                        setShowProductDropdown(false);
                      }
                    }}
                    placeholder="Search product name, barcode or SKU (Use Arrow Keys & Enter/Tab)..."
                    className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded pl-8 pr-3 py-2 outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                {showProductDropdown && itemSearch && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl max-h-56 overflow-y-auto divide-y divide-slate-800">
                    {filteredProducts.slice(0, 8).map((prod, idx) => {
                      const isSelected = idx === highlightedItemIndex;
                      const availableStock = (activeSection && prod.sectionStock && prod.sectionStock[activeSection] !== undefined)
                        ? prod.sectionStock[activeSection]
                        : prod.stock_quantity;
                      return (
                        <button
                          key={prod.id}
                          id={`purchase-order-opt-${idx}`}
                          type="button"
                          onClick={() => handleAddItem(prod)}
                          onMouseEnter={() => setHighlightedItemIndex(idx)}
                          className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between gap-3 transition-colors ${
                            isSelected ? 'bg-blue-950/70 ring-1 ring-inset ring-blue-500 font-semibold' : 'hover:bg-slate-800'
                          }`}
                        >
                          {/* Single Line: Item Code | Item Name */}
                          <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                            <span className="font-mono text-[11px] font-bold text-slate-400 shrink-0">
                              {prod.barcode || prod.sku}
                            </span>
                            <span className="text-slate-600 shrink-0">•</span>
                            <span className={`truncate ${isSelected ? 'text-blue-200 font-bold' : 'text-white'}`}>
                              {prod.name}
                            </span>
                          </div>

                          {/* Total Stock in selected branch */}
                          <div className="shrink-0 flex items-center gap-2 font-mono text-[11px]">
                            <span className={`font-bold ${
                              availableStock <= prod.lowStockThreshold 
                                ? 'text-rose-400' 
                                : 'text-slate-400'
                            }`}>
                              Stock: {availableStock}
                            </span>
                            {isSelected && (
                              <span className="text-[9px] bg-blue-600 text-white font-mono px-1.5 py-0.2 rounded font-bold">
                                ⏎
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* PO Line Items */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
              <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  2. Order Line Items ({poItems.length})
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  PO Total: <strong className="text-emerald-400 font-bold">KWD {(subtotal || 0).toFixed(3)}</strong>
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold">
                      <th className="py-2.5 px-3">Item Name</th>
                      <th className="py-2.5 px-2 text-center w-24">Order Qty</th>
                      <th className="py-2.5 px-2 text-right w-28">Est. Cost (KWD)</th>
                      <th className="py-2.5 px-2 text-right w-28">Total (KWD)</th>
                      <th className="py-2.5 px-2 text-center w-12">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {poItems.length > 0 ? (
                      poItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-white">{item.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{item.barcode}</div>
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) => handleUpdateQty(idx, parseInt(e.target.value) || 1)}
                              className="w-20 bg-slate-950 border border-slate-700 text-center font-bold text-white text-xs py-1 rounded outline-none focus:border-blue-500 font-mono"
                            />
                          </td>
                          <td className="py-2.5 px-2 text-right">
                            <input
                              type="number"
                              step="0.001"
                              value={item.cost}
                              onChange={(e) => handleUpdateCost(idx, parseFloat(e.target.value) || 0)}
                              className="w-24 bg-slate-950 border border-slate-700 text-right font-bold text-white text-xs py-1 px-1.5 rounded outline-none focus:border-blue-500 font-mono"
                            />
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono font-bold text-emerald-400">
                            {(item.total || 0).toFixed(3)}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-rose-500 hover:text-rose-400 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                          No items added to order yet. Search products above to build purchase order.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Panel: Summary & Issue PO */}
          <div className="space-y-4">
            <form onSubmit={handleCreatePO} className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-4">
              <div className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-800">
                3. Purchase Order Summary
              </div>

              <div className="bg-blue-950/40 border border-blue-800/80 p-3 rounded-lg flex items-center justify-between">
                <span className="text-xs font-bold text-blue-300">Estimated PO Value:</span>
                <span className="text-xl font-black text-blue-400 font-mono">
                  KWD {(subtotal || 0).toFixed(3)}
                </span>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Vendor Notes / Terms & Conditions
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Standard delivery to Salmiya Warehouse, payment 30 days net..."
                  className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded p-2 outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={poItems.length === 0 || isSubmitting || !supplierName}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black text-sm py-2.5 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Generating PO...' : 'Issue Purchase Order'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* PO List View */
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Purchase Orders Register ({purchaseOrders.length})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold">
                  <th className="py-2.5 px-3">PO Number</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Supplier Name</th>
                  <th className="py-2.5 px-2 text-center">Items</th>
                  <th className="py-2.5 px-3 text-right">Total Amount (KWD)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-300">
                      {po.po_no}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 font-mono">
                      {po.date}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-white">
                      {po.supplier_name}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-slate-300">
                      {(po.items || []).length}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                      {(po.total_amount || 0).toFixed(3)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        po.status === 'received'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : po.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-slate-700 text-slate-300'
                      }`}>
                        {po.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => setViewingPO(po)}
                        className="bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs px-2.5 py-1 rounded font-bold transition-colors"
                      >
                        Inspect / Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PO View / Print Modal */}
      {viewingPO && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white font-mono">{viewingPO.po_no}</h3>
                <p className="text-xs text-slate-400">Official Vendor Purchase Order</p>
              </div>
              <button
                onClick={() => setViewingPO(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-slate-400">Supplier:</div>
                <div className="font-bold text-white text-sm">{viewingPO.supplier_name}</div>
                <div className="text-slate-400 font-mono">Tel: {viewingPO.supplier_phone || 'N/A'}</div>
              </div>
              <div className="text-right">
                <div className="text-slate-400">Issue Date:</div>
                <div className="font-mono text-white font-bold">{viewingPO.date}</div>
                <div className="text-slate-400">Expected: {viewingPO.expected_delivery_date || 'N/A'}</div>
              </div>
            </div>

            <div className="border border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400">
                  <tr>
                    <th className="p-2">Item</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-right">Cost</th>
                    <th className="p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {viewingPO.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2 text-white font-medium">{it.name}</td>
                      <td className="p-2 text-center font-mono">{it.qty}</td>
                      <td className="p-2 text-right font-mono">KWD {(it.cost || 0).toFixed(3)}</td>
                      <td className="p-2 text-right font-mono font-bold text-emerald-400">KWD {(it.total || 0).toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <div className="font-mono text-base font-black text-white">
                Grand Total: <span className="text-emerald-400">KWD {(viewingPO.estimated_total || viewingPO.total_amount || 0).toFixed(3)}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPoToPrint(viewingPO)}
                  className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Print Purchase Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modern Multi-Format PO Print Modal */}
      {poToPrint && (
        <PurchasePrintModal
          document={poToPrint}
          type="purchase_order"
          onClose={() => setPoToPrint(null)}
        />
      )}
    </div>
  );
};
