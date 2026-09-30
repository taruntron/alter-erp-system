import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { 
  RotateCcw, 
  Search, 
  Plus, 
  Trash2, 
  CheckCircle, 
  FileText, 
  User, 
  Banknote, 
  Calendar,
  CreditCard,
  Building,
  AlertCircle,
  Printer
} from 'lucide-react';
import { Product, ProductUnit, SalesReturnItem, Invoice } from '../../types';
import { InvoicePrintModal } from '../POS/InvoicePrintModal';

export const SalesReturnView: React.FC = () => {
  const { invoices, customers, products, salesReturns, createSalesReturn } = useStore();
  const { user, activeSection } = useAuth();

  const [selectedInvoiceNo, setSelectedInvoiceNo] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('CASH CUSTOMER');
  const [customerPhone, setCustomerPhone] = useState('');

  const [returnItems, setReturnItems] = useState<SalesReturnItem[]>([]);
  const [refundMethod, setRefundMethod] = useState<'cash' | 'credit_note' | 'card' | 'knet'>('cash');
  const [narration, setNarration] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [selectedReturnForPrint, setSelectedReturnForPrint] = useState<any | null>(null);

  const mapReturnToInvoice = (ret: any): Invoice => ({
    id: ret.id,
    invoice_no: ret.return_no,
    customer_name: ret.customer_name || 'Cash Customer',
    customer_phone: ret.customer_phone,
    customer_id: ret.customer_id,
    items: (ret.items && ret.items.length > 0)
      ? ret.items.map((i: any) => ({
          product_id: i.product_id || 'ret-item',
          sku: i.sku || '',
          barcode: i.barcode || '',
          name: `${i.name}${i.return_reason ? ` (${i.return_reason})` : ''}`,
          unit: i.unit || 'UNIT',
          qty: i.qty || 1,
          stock: 0,
          price: i.price || 0,
          total: i.total || ((i.qty || 1) * (i.price || 0)),
        }))
      : [{
          product_id: 'ret-item',
          sku: 'RET',
          barcode: '',
          name: `Sales Return (${ret.original_invoice_no ? `Ref #${ret.original_invoice_no}` : ret.narration || 'Credit Note'})`,
          unit: 'UNIT',
          qty: 1,
          stock: 0,
          price: ret.refund_amount || 0,
          total: ret.refund_amount || 0,
        }],
    subtotal: ret.subtotal || ret.refund_amount || 0,
    discount: 0,
    other_amt: 0,
    total: ret.refund_amount || 0,
    paid_amount: ret.refund_amount || 0,
    due_amount: 0,
    credit_amount: 0,
    payments: {
      cash: ret.refund_method === 'cash' ? ret.refund_amount : 0,
      visa: 0,
      card: ret.refund_method === 'card' ? ret.refund_amount : 0,
      online: 0,
      knet: ret.refund_method === 'knet' ? ret.refund_amount : 0,
      cheque: 0,
      credit: ret.refund_method === 'credit_note' ? ret.refund_amount : 0,
      upi: 0,
    },
    status: 'paid',
    tender_cash: 0,
    return_amt: 0,
    cashier_uid: 'cashier',
    cashier_name: ret.cashier_name || 'Cashier',
    section: ret.section || 'SEENU CARE Co.',
    narration: `Sales Return Credit Note / Refund: ${ret.narration || ''} (Orig Inv: ${ret.original_invoice_no || 'N/A'})`,
    timestamp: ret.created_at || ret.date || new Date().toISOString(),
    date: ret.date || new Date().toISOString().split('T')[0],
  });

  // Filter products for manual item return
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
      const el = document.getElementById(`sales-return-opt-${highlightedItemIndex}`);
      if (el) {
        el.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedItemIndex, showProductDropdown]);

  // Load from existing invoice
  const handleLoadInvoice = (invNo: string) => {
    setSelectedInvoiceNo(invNo);
    const foundInv = invoices.find((inv) => inv.invoice_no === invNo);
    if (foundInv) {
      setCustomerName(foundInv.customer_name);
      setCustomerPhone(foundInv.customer_phone || '');
      setSelectedCustomerId(foundInv.customer_id || '');
      
      const converted: SalesReturnItem[] = foundInv.items.map((it) => ({
        product_id: it.product_id,
        sku: it.sku,
        barcode: it.barcode,
        name: it.name,
        unit: it.unit,
        qty: 1, // default 1 for return
        price: it.price,
        total: Number((1 * it.price).toFixed(3)),
        return_reason: 'Customer Return',
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
        total: Number((newQty * updated[existingIndex].price).toFixed(3)),
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
          price: prod.price || 0,
          total: Number(((prod.price || 0)).toFixed(3)),
          return_reason: 'Defect / Exchange',
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
      total: Number((qty * updated[index].price).toFixed(3)),
    };
    setReturnItems(updated);
  };

  const handleUpdatePrice = (index: number, newPrice: number) => {
    const price = Math.max(0, newPrice);
    const updated = [...returnItems];
    updated[index] = {
      ...updated[index],
      price,
      total: Number((updated[index].qty * price).toFixed(3)),
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
    if (returnItems.length === 0) return;

    setIsSubmitting(true);
    try {
      const created = await createSalesReturn({
        original_invoice_no: selectedInvoiceNo || undefined,
        customer_id: selectedCustomerId || undefined,
        customer_name: customerName,
        customer_phone: customerPhone,
        items: returnItems,
        subtotal,
        refund_amount: subtotal,
        refund_method: refundMethod,
        status: 'completed',
        cashier_name: user?.displayName || 'Cashier',
        section: activeSection || 'SEENU CARE Co.',
        narration: narration || 'Sales return processed',
      });

      setShowSuccessToast(true);
      if (created) {
        setSelectedReturnForPrint(created);
      }
      setReturnItems([]);
      setSelectedInvoiceNo('');
      setCustomerName('CASH CUSTOMER');
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
            <RotateCcw className="w-5 h-5 text-rose-400" />
            Sales Return & Credit Note Management
          </h2>
          <p className="text-xs text-slate-400">
            Accept product returns, restock inventory automatically, and refund cash or issue store credit notes
          </p>
        </div>

        {showSuccessToast && (
          <div className="bg-emerald-500/20 border border-emerald-500 text-emerald-300 text-xs px-3 py-1.5 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Sales return recorded & inventory restocked successfully!
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Return Entry Form */}
        <div className="lg:col-span-2 space-y-4">
          {/* Lookup & Party Details Card */}
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              1. Return Reference & Customer Information
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Invoice Lookup */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Load From Original Invoice # (Optional)
                </label>
                <div className="flex gap-1.5">
                  <select
                    value={selectedInvoiceNo}
                    onChange={(e) => handleLoadInvoice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded px-2.5 py-1.5 outline-none focus:border-rose-500"
                  >
                    <option value="">-- Select from recent sales --</option>
                    {invoices.map((inv) => (
                      <option key={inv.id} value={inv.invoice_no}>
                        {inv.invoice_no} ({inv.customer_name} - KWD {(inv.total || 0).toFixed(3)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Customer / Party Name */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Customer / Salon Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded px-2.5 py-1.5 outline-none focus:border-rose-500 font-bold"
                  placeholder="e.g. CASH CUSTOMER or Salon Name"
                />
              </div>
            </div>

            {/* Product Search & Add */}
            <div ref={itemDropdownContainerRef} className="relative pt-2 border-t border-slate-800">
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Search & Add Product to Return
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
                  className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded pl-8 pr-3 py-2 outline-none focus:border-rose-500 font-medium"
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
                        id={`sales-return-opt-${idx}`}
                        type="button"
                        onClick={() => handleAddManualProduct(prod)}
                        onMouseEnter={() => setHighlightedItemIndex(idx)}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between gap-3 transition-colors ${
                          isSelected ? 'bg-rose-950/70 ring-1 ring-inset ring-rose-500 font-semibold' : 'hover:bg-slate-800'
                        }`}
                      >
                        {/* Single Line: Item Code | Item Name */}
                        <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                          <span className="font-mono text-[11px] font-bold text-slate-400 shrink-0">
                            {prod.barcode || prod.sku}
                          </span>
                          <span className="text-slate-600 shrink-0">•</span>
                          <span className={`truncate ${isSelected ? 'text-rose-200 font-bold' : 'text-white'}`}>
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
                            <span className="text-[9px] bg-rose-600 text-white font-mono px-1.5 py-0.2 rounded font-bold">
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

          {/* Returned Items Table */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                2. Returned Items ({returnItems.length})
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Subtotal: <strong className="text-emerald-400 font-bold">KWD {(subtotal || 0).toFixed(3)}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold">
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-2 text-center w-20">Return Qty</th>
                    <th className="py-2.5 px-2 text-right w-24">Refund Rate</th>
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
                            className="w-16 bg-slate-950 border border-slate-700 text-center font-bold text-white text-xs py-1 rounded outline-none focus:border-rose-500 font-mono"
                          />
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <input
                            type="number"
                            step="0.001"
                            value={item.price}
                            onChange={(e) => handleUpdatePrice(idx, parseFloat(e.target.value) || 0)}
                            className="w-20 bg-slate-950 border border-slate-700 text-right font-bold text-white text-xs py-1 px-1.5 rounded outline-none focus:border-rose-500 font-mono"
                          />
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono font-bold text-emerald-400">
                          {(item.total || 0).toFixed(3)}
                        </td>
                        <td className="py-2.5 px-2">
                          <input
                            type="text"
                            value={item.return_reason || ''}
                            onChange={(e) => handleUpdateReason(idx, e.target.value)}
                            placeholder="Reason..."
                            className="w-full bg-slate-950 border border-slate-700 text-slate-300 text-xs py-1 px-2 rounded outline-none focus:border-rose-500"
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
                        No items added to return yet. Select an invoice or search product above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Settlement & Submission */}
        <div className="space-y-4">
          <form onSubmit={handleSubmitReturn} className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-4">
            <div className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-800">
              3. Refund & Settlement
            </div>

            {/* Total Refund Display */}
            <div className="bg-rose-950/40 border border-rose-800/80 p-3 rounded-lg flex items-center justify-between">
              <span className="text-xs font-bold text-rose-300">Total Refund Amount:</span>
              <span className="text-xl font-black text-rose-400 font-mono">
                KWD {(subtotal || 0).toFixed(3)}
              </span>
            </div>

            {/* Refund Mode */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                Refund Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRefundMethod('cash')}
                  className={`py-2 px-2.5 rounded text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                    refundMethod === 'cash'
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5" /> Cash Refund
                </button>
                <button
                  type="button"
                  onClick={() => setRefundMethod('credit_note')}
                  className={`py-2 px-2.5 rounded text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                    refundMethod === 'credit_note'
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" /> Credit Note
                </button>
                <button
                  type="button"
                  onClick={() => setRefundMethod('knet')}
                  className={`py-2 px-2.5 rounded text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                    refundMethod === 'knet'
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" /> K-Net
                </button>
                <button
                  type="button"
                  onClick={() => setRefundMethod('card')}
                  className={`py-2 px-2.5 rounded text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                    refundMethod === 'card'
                      ? 'bg-amber-600 border-amber-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" /> Card / Visa
                </button>
              </div>
            </div>

            {/* Narration */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Remarks / Return Notes
              </label>
              <textarea
                rows={2}
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                placeholder="Reason for return, condition of item, etc."
                className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded p-2 outline-none focus:border-rose-500 resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={returnItems.length === 0 || isSubmitting}
              className="w-full bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-black text-sm py-2.5 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              {isSubmitting ? 'Processing Return...' : 'Complete & Restock'}
            </button>
          </form>

          {/* Past Returns Log */}
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-white uppercase tracking-wider">
              Recent Sales Returns History ({salesReturns.length})
            </div>
            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {salesReturns.map((ret) => (
                <div key={ret.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-rose-400">{ret.return_no}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedReturnForPrint(ret)}
                        title="Print Credit Note / Return Slip (80mm Thermal, A4, A5)"
                        className="bg-slate-800 hover:bg-slate-700 text-rose-300 hover:text-white px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Print</span>
                      </button>
                    </div>
                    <span className="font-mono font-bold text-emerald-400">KWD {(ret.refund_amount || 0).toFixed(3)}</span>
                  </div>
                  <div className="text-slate-300 font-medium truncate">{ret.customer_name}</div>
                  <div className="text-[10px] text-slate-400 flex items-center justify-between">
                    <span>{ret.date} • {ret.refund_method.toUpperCase()}</span>
                    <span>{ret.items.length} item(s)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sales Return Credit Note Print Modal */}
      {selectedReturnForPrint && (
        <InvoicePrintModal
          invoice={mapReturnToInvoice(selectedReturnForPrint)}
          initialFormat="thermal_80mm"
          onClose={() => setSelectedReturnForPrint(null)}
        />
      )}
    </div>
  );
};
