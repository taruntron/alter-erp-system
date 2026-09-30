import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { 
  RotateCcw, 
  Search, 
  Trash2, 
  CheckCircle, 
  Building, 
  Banknote, 
  FileText,
  Boxes,
  Printer
} from 'lucide-react';
import { Product, PurchaseReturnItem, PurchaseReturn } from '../../types';
import { PurchasePrintModal } from './PurchasePrintModal';

export const PurchaseReturnView: React.FC = () => {
  const { purchases, suppliers, products, purchaseReturns, createPurchaseReturn, activeSection } = useStore();
  const { user } = useAuth();

  const [selectedPurchaseNo, setSelectedPurchaseNo] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');

  const [returnItems, setReturnItems] = useState<PurchaseReturnItem[]>([]);
  const [refundMethod, setRefundMethod] = useState<'supplier_credit' | 'cash' | 'bank_transfer'>('supplier_credit');
  const [narration, setNarration] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [selectedReturnForPrint, setSelectedReturnForPrint] = useState<PurchaseReturn | null>(null);

  const [itemSearch, setItemSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [highlightedItemIndex, setHighlightedItemIndex] = useState<number>(0);

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
      const el = document.getElementById(`purchase-return-opt-${highlightedItemIndex}`);
      if (el) {
        el.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedItemIndex, showProductDropdown]);

  // Load from existing purchase
  const handleLoadPurchase = (purNo: string) => {
    setSelectedPurchaseNo(purNo);
    const foundPur = purchases.find((p) => p.purchase_no === purNo);
    if (foundPur) {
      setSupplierName(foundPur.supplier_name);
      setSupplierPhone(foundPur.supplier_phone || '');
      setSelectedSupplierId(foundPur.supplier_id || '');

      const converted: PurchaseReturnItem[] = foundPur.items.map((it) => ({
        product_id: it.product_id,
        sku: it.sku,
        barcode: it.barcode,
        name: it.name,
        unit: it.unit,
        qty: 1,
        cost: it.cost,
        total: Number((1 * it.cost).toFixed(3)),
        return_reason: 'Damaged / Expired / Vendor Recall',
      }));
      setReturnItems(converted);
    }
  };

  const handleAddManualProduct = (prod: Product) => {
    const existingIndex = returnItems.findIndex((it) => it.product_id === prod.id);
    if (existingIndex >= 0) {
      const updated = [...returnItems];
      const newQty = updated[existingIndex].qty + 1;
      updated[existingIndex] = {
        ...updated[existingIndex],
        qty: newQty,
        total: Number((newQty * updated[existingIndex].cost).toFixed(3)),
      };
      setReturnItems(updated);
    } else {
      setReturnItems((prev) => [
        ...prev,
        {
          product_id: prod.id,
          sku: prod.sku,
          barcode: prod.barcode,
          name: prod.name,
          unit: prod.unit,
          qty: 1,
          cost: prod.cost || 0,
          total: Number(((prod.cost || 0)).toFixed(3)),
          return_reason: 'Vendor Return',
        },
      ]);
    }
    setItemSearch('');
    setShowProductDropdown(false);
  };

  const handleUpdateQty = (index: number, newQty: number) => {
    const qty = Math.max(1, newQty);
    const updated = [...returnItems];
    updated[index] = {
      ...updated[index],
      qty,
      total: Number((qty * updated[index].cost).toFixed(3)),
    };
    setReturnItems(updated);
  };

  const handleUpdateCost = (index: number, newCost: number) => {
    const cost = Math.max(0, newCost);
    const updated = [...returnItems];
    updated[index] = {
      ...updated[index],
      cost,
      total: Number((updated[index].qty * cost).toFixed(3)),
    };
    setReturnItems(updated);
  };

  const handleUpdateReason = (index: number, reason: string) => {
    const updated = [...returnItems];
    updated[index] = {
      ...updated[index],
      return_reason: reason,
    };
    setReturnItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setReturnItems((prev) => prev.filter((_, i) => i !== index));
  };

  const subtotal = returnItems.reduce((sum, it) => sum + it.total, 0);

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (returnItems.length === 0 || !supplierName) return;

    setIsSubmitting(true);
    try {
      const created = await createPurchaseReturn({
        original_purchase_no: selectedPurchaseNo || undefined,
        supplier_id: selectedSupplierId || undefined,
        supplier_name: supplierName,
        supplier_phone: supplierPhone,
        items: returnItems,
        subtotal,
        refund_amount: subtotal,
        refund_method: refundMethod,
        status: 'completed',
        created_by: user?.displayName || 'Admin',
        narration: narration || 'Debit note return to supplier',
      });

      setShowSuccessToast(true);
      if (created) {
        setSelectedReturnForPrint(created);
      }
      setReturnItems([]);
      setSelectedPurchaseNo('');
      setSupplierName('');
      setNarration('');
      setTimeout(() => setShowSuccessToast(false), 4000);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-amber-400" />
            Purchase Return & Debit Note Register
          </h2>
          <p className="text-xs text-slate-400">
            Return goods to vendors, issue Debit Notes, auto-deduct stock quantity, and adjust supplier payables
          </p>
        </div>

        {showSuccessToast && (
          <div className="bg-emerald-500/20 border border-emerald-500 text-emerald-300 text-xs px-3 py-1.5 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Debit Note created & supplier balance deducted successfully!
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Return Entry */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              1. Vendor & Purchase Invoice Reference
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Purchase Lookup */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Load From Purchase Invoice # (Optional)
                </label>
                <select
                  value={selectedPurchaseNo}
                  onChange={(e) => handleLoadPurchase(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded px-2.5 py-1.5 outline-none focus:border-amber-500"
                >
                  <option value="">-- Select from recent purchases --</option>
                  {purchases.map((pur) => (
                    <option key={pur.id} value={pur.purchase_no}>
                      {pur.purchase_no} ({pur.supplier_name} - KWD {(pur.total_amount || pur.total || 0).toFixed(3)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Supplier Selection */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Supplier / Vendor Name
                </label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => {
                    setSelectedSupplierId(e.target.value);
                    const s = suppliers.find((supp) => supp.id === e.target.value);
                    if (s) {
                      setSupplierName(s.name);
                      setSupplierPhone(s.phone);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded px-2.5 py-1.5 outline-none focus:border-amber-500 font-bold"
                >
                  <option value="">-- Select or Type Supplier --</option>
                  {suppliers.map((supp) => (
                    <option key={supp.id} value={supp.id}>
                      {supp.name} (Due: KWD {(supp.due_balance || 0).toFixed(3)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Product Search */}
            <div ref={itemDropdownContainerRef} className="relative pt-2 border-t border-slate-800">
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Search & Add Product to Return to Vendor
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
                        handleAddManualProduct(visibleProducts[validIdx]);
                      }
                    } else if (e.key === 'Escape') {
                      setShowProductDropdown(false);
                    }
                  }}
                  placeholder="Search item by name, barcode, or SKU (Use Arrow Keys & Enter/Tab)..."
                  className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded pl-8 pr-3 py-2 outline-none focus:border-amber-500 font-medium"
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
                        id={`purchase-return-opt-${idx}`}
                        type="button"
                        onClick={() => handleAddManualProduct(prod)}
                        onMouseEnter={() => setHighlightedItemIndex(idx)}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between gap-3 transition-colors ${
                          isSelected ? 'bg-amber-950/70 ring-1 ring-inset ring-amber-500 font-semibold' : 'hover:bg-slate-800'
                        }`}
                      >
                        {/* Single Line: Item Code | Item Name */}
                        <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                          <span className="font-mono text-[11px] font-bold text-slate-400 shrink-0">
                            {prod.barcode || prod.sku}
                          </span>
                          <span className="text-slate-600 shrink-0">•</span>
                          <span className={`truncate ${isSelected ? 'text-amber-200 font-bold' : 'text-white'}`}>
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
                            <span className="text-[9px] bg-amber-600 text-white font-mono px-1.5 py-0.2 rounded font-bold">
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

          {/* Return Table */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                2. Return Items ({returnItems.length})
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Total Value: <strong className="text-amber-400 font-bold">KWD {(subtotal || 0).toFixed(3)}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold">
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-2 text-center w-20">Return Qty</th>
                    <th className="py-2.5 px-2 text-right w-24">Purchase Cost</th>
                    <th className="py-2.5 px-2 text-right w-24">Total (KWD)</th>
                    <th className="py-2.5 px-2">Reason</th>
                    <th className="py-2.5 px-2 text-center w-12">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {returnItems.length > 0 ? (
                    returnItems.map((item, idx) => (
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
                            className="w-16 bg-slate-950 border border-slate-700 text-center font-bold text-white text-xs py-1 rounded outline-none focus:border-amber-500 font-mono"
                          />
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <input
                            type="number"
                            step="0.001"
                            value={item.cost}
                            onChange={(e) => handleUpdateCost(idx, parseFloat(e.target.value) || 0)}
                            className="w-20 bg-slate-950 border border-slate-700 text-right font-bold text-white text-xs py-1 px-1.5 rounded outline-none focus:border-amber-500 font-mono"
                          />
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono font-bold text-amber-400">
                          {(item.total || 0).toFixed(3)}
                        </td>
                        <td className="py-2.5 px-2">
                          <input
                            type="text"
                            value={item.return_reason || ''}
                            onChange={(e) => handleUpdateReason(idx, e.target.value)}
                            placeholder="Reason for return..."
                            className="w-full bg-slate-950 border border-slate-700 text-slate-300 text-xs py-1 px-2 rounded outline-none focus:border-amber-500"
                          />
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
                      <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                        No items added to return yet. Select a purchase invoice or search product above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Settlement */}
        <div className="space-y-4">
          <form onSubmit={handleSubmitReturn} className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-4">
            <div className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-800">
              3. Debit Note Settlement
            </div>

            <div className="bg-amber-950/40 border border-amber-800/80 p-3 rounded-lg flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300">Debit Note Total:</span>
              <span className="text-xl font-black text-amber-400 font-mono">
                KWD {(subtotal || 0).toFixed(3)}
              </span>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                Settlement Type
              </label>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setRefundMethod('supplier_credit')}
                  className={`w-full py-2 px-3 rounded text-xs font-bold border transition-colors flex items-center justify-between ${
                    refundMethod === 'supplier_credit'
                      ? 'bg-amber-600 border-amber-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Deduct from Supplier Due Balance</span>
                  <span>✔</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRefundMethod('cash')}
                  className={`w-full py-2 px-3 rounded text-xs font-bold border transition-colors flex items-center justify-between ${
                    refundMethod === 'cash'
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-1.5"><Banknote className="w-3.5 h-3.5" /> Cash Refund from Vendor</span>
                  <span>✔</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Narration / Notes
              </label>
              <textarea
                rows={2}
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                placeholder="Debit note narration, defect reason..."
                className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded p-2 outline-none focus:border-amber-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={returnItems.length === 0 || isSubmitting || !supplierName}
              className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-black text-sm py-2.5 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              {isSubmitting ? 'Posting Debit Note...' : 'Issue Debit Note & Deduct'}
            </button>
          </form>

          {/* Past Debit Notes Log */}
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-white uppercase tracking-wider">
              Debit Notes History ({purchaseReturns.length})
            </div>
            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {purchaseReturns.map((ret) => (
                <div key={ret.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-amber-400">{ret.return_no}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedReturnForPrint(ret)}
                        title="Print Debit Note (80mm Thermal, A4, A5)"
                        className="bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Print</span>
                      </button>
                    </div>
                    <span className="font-mono font-bold text-emerald-400">KWD {(ret.refund_amount || 0).toFixed(3)}</span>
                  </div>
                  <div className="text-slate-300 font-medium truncate">{ret.supplier_name}</div>
                  <div className="text-[10px] text-slate-400 flex items-center justify-between">
                    <span>{ret.date} • {ret.refund_method}</span>
                    <span>{ret.items.length} item(s)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modern Multi-Format Purchase Return / Debit Note Print Modal */}
      {selectedReturnForPrint && (
        <PurchasePrintModal
          document={selectedReturnForPrint}
          type="purchase_return"
          initialFormat="thermal_80mm"
          onClose={() => setSelectedReturnForPrint(null)}
        />
      )}
    </div>
  );
};
