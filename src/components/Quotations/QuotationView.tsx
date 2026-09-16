import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { Product, InvoiceItem, Quotation, ProductUnit, Customer } from '../../types';
import { QuickAddPartyModal } from '../POS/QuickAddPartyModal';
import { QuickAddProductModal } from '../POS/QuickAddProductModal';
import { ClipboardList, Plus, Trash2, Printer, Search, ArrowRight, CheckCircle2, UserPlus, PackagePlus } from 'lucide-react';
import { QuotationPrintModal } from './QuotationPrintModal';

interface QuotationViewProps {
  onConvertToSale?: () => void;
}

export const QuotationView: React.FC<QuotationViewProps> = ({ onConvertToSale }) => {
  const { products, customers, quotations, createQuotation, addCustomer, addProduct } = useStore();
  const { user } = useAuth();

  const [customerName, setCustomerName] = useState('TARUN DINESH 99792824');
  const [customerPhone, setCustomerPhone] = useState('99792824');
  const [validDays, setValidDays] = useState<number>(15);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [discount, setDiscount] = useState<number>(0);
  const [activeQuoteForPrint, setActiveQuoteForPrint] = useState<Quotation | null>(null);

  // Modals
  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [highlightedProductIndex, setHighlightedProductIndex] = useState<number>(0);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProducts = searchQuery.trim() === ''
    ? []
    : products.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode.includes(searchQuery));

  // Auto-scroll highlighted product into view
  useEffect(() => {
    if (showDropdown && highlightedProductIndex >= 0) {
      const el = document.getElementById(`quotation-prod-opt-${highlightedProductIndex}`);
      if (el) {
        el.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedProductIndex, showDropdown]);

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const total = Math.max(0, subtotal - discount);

  const handleSelectItem = (prod: Product) => {
    const existing = items.findIndex((i) => i.product_id === prod.id);
    if (existing >= 0) {
      const copy = [...items];
      copy[existing].qty += 1;
      copy[existing].total = copy[existing].qty * copy[existing].price;
      setItems(copy);
    } else {
      setItems([
        ...items,
        {
          product_id: prod.id,
          sku: prod.sku,
          barcode: prod.barcode,
          name: prod.name,
          unit: prod.unit,
          qty: 1,
          stock: prod.stock_quantity,
          price: prod.price,
          total: prod.price,
          cost: prod.cost,
        },
      ]);
    }
    setSearchQuery('');
  };

  const handleCustomerAdded = async (newCust: Customer) => {
    const saved = await addCustomer(newCust);
    setCustomerName(saved.name);
    setCustomerPhone(saved.phone);
  };

  const handleProductAdded = async (newProd: Product, addToBillImmediately: boolean) => {
    const saved = await addProduct(newProd);
    if (addToBillImmediately) {
      handleSelectItem(saved);
    }
    setSearchQuery('');
  };

  const handleCreateQuotation = async () => {
    if (items.length === 0) {
      alert('Please add at least one item to quotation');
      return;
    }

    const today = new Date();
    const expiry = new Date();
    expiry.setDate(today.getDate() + validDays);

    const quote = await createQuotation({
      customer_name: customerName,
      customer_phone: customerPhone,
      items,
      subtotal,
      discount,
      total,
      valid_until: expiry.toISOString().split('T')[0],
      status: 'draft',
      created_by: user?.displayName || 'Admin',
    });

    setActiveQuoteForPrint(quote);
    setItems([]);
    setDiscount(0);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-42px)] bg-slate-900 text-slate-100 overflow-y-auto font-sans p-3 sm:p-4 space-y-4">
      {/* Top Header */}
      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-600/20 text-purple-400 rounded-lg border border-purple-500/30">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">Quotation & Price Estimates</h2>
            <p className="text-xs text-slate-400">Generate and print formal price offers for salon clients</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Form: Client & Item selection */}
        <div className="lg:col-span-7 bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-purple-400">
              1. Customer & Validity
            </h3>
            <button
              type="button"
              title="Quick Add Party"
              onClick={() => setIsPartyModalOpen(true)}
              className="text-purple-400 hover:text-purple-300 flex items-center justify-center bg-purple-950/60 border border-purple-800 p-1.5 rounded transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-bold outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Phone Number</label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Valid For (Days)</label>
              <input
                type="number"
                value={validDays}
                onChange={(e) => setValidDays(parseInt(e.target.value) || 15)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-bold outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-purple-400">
              2. Add Quotation Products
            </h3>
            <button
              type="button"
              title="Quick Add Item"
              onClick={() => setIsProductModalOpen(true)}
              className="text-emerald-400 hover:text-emerald-300 flex items-center justify-center bg-emerald-950/60 border border-emerald-800 p-1.5 rounded transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search */}
          <div ref={searchContainerRef} className="relative">
            <div className="flex items-center">
              <input
                type="text"
                placeholder="Search Item by Code, Name, Barcode, or SKU..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                  setHighlightedProductIndex(0);
                }}
                onFocus={() => {
                  setShowDropdown(true);
                  setHighlightedProductIndex(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (!showDropdown) setShowDropdown(true);
                    if (filteredProducts.length > 0) {
                      setHighlightedProductIndex((prev) => (prev + 1) % filteredProducts.length);
                    }
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (!showDropdown) setShowDropdown(true);
                    if (filteredProducts.length > 0) {
                      setHighlightedProductIndex((prev) => (prev - 1 + filteredProducts.length) % filteredProducts.length);
                    }
                  } else if (e.key === 'Enter' || e.key === 'Tab') {
                    if (showDropdown && filteredProducts.length > 0) {
                      e.preventDefault();
                      const validIdx = highlightedProductIndex >= 0 && highlightedProductIndex < filteredProducts.length
                        ? highlightedProductIndex
                        : 0;
                      handleSelectItem(filteredProducts[validIdx]);
                      setShowDropdown(false);
                    }
                  } else if (e.key === 'Escape') {
                    setShowDropdown(false);
                  }
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-l p-2 text-xs text-white outline-none focus:border-purple-500 font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setHighlightedProductIndex(0);
                  }}
                  className="bg-slate-900 border-y border-slate-700 text-slate-400 hover:text-white px-2 py-2 text-xs"
                >
                  ✕
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsProductModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-r flex items-center justify-center transition-colors shadow-xs"
                title="Quick Add Product"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {showDropdown && filteredProducts.length > 0 && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white text-slate-900 rounded shadow-2xl border border-slate-300 z-20 max-h-56 overflow-y-auto divide-y divide-slate-100">
                {filteredProducts.map((p, idx) => {
                  const isSelected = idx === highlightedProductIndex;
                  return (
                    <div
                      key={p.id}
                      id={`quotation-prod-opt-${idx}`}
                      onClick={() => {
                        handleSelectItem(p);
                        setShowDropdown(false);
                      }}
                      onMouseEnter={() => setHighlightedProductIndex(idx)}
                      className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                        isSelected ? 'bg-purple-100 ring-1 ring-inset ring-purple-500 font-semibold' : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Single Line: Item Code | Item Name */}
                      <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                        <span className="font-mono text-[11px] font-bold text-slate-500 shrink-0">
                          {p.barcode || p.sku}
                        </span>
                        <span className="text-slate-300 shrink-0">•</span>
                        <span className={`truncate ${isSelected ? 'text-purple-950 font-bold' : 'text-slate-900'}`}>
                          {p.name}
                        </span>
                      </div>

                      {/* Total Stock in selected branch */}
                      <div className="shrink-0 flex items-center gap-2 font-mono text-[11px]">
                        <span className={`font-bold ${
                          p.stock_quantity <= p.lowStockThreshold 
                            ? 'text-rose-600' 
                            : 'text-slate-600'
                        }`}>
                          Stock: {p.stock_quantity}
                        </span>
                        {isSelected && (
                          <span className="text-[9px] bg-purple-700 text-white font-mono px-1.5 py-0.2 rounded font-bold">
                            ⏎
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="border border-slate-800 rounded overflow-hidden mt-2">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-black">
                <tr>
                  <th className="p-2">Item</th>
                  <th className="p-2 text-center">Unit</th>
                  <th className="p-2 text-center">Qty</th>
                  <th className="p-2 text-right">Price</th>
                  <th className="p-2 text-right">Total</th>
                  <th className="p-2 text-center">✕</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-slate-500">
                      No items added to quotation
                    </td>
                  </tr>
                ) : (
                  items.map((it, idx) => (
                    <tr key={idx} className="text-slate-200">
                      <td className="p-2 font-semibold text-white">{it.name}</td>
                      <td className="p-2 text-center text-purple-300 font-bold">{it.unit}</td>
                      <td className="p-2 text-center font-black">{it.qty}</td>
                      <td className="p-2 text-right font-mono">{(it.price || 0).toFixed(3)}</td>
                      <td className="p-2 text-right font-bold text-emerald-400 font-mono">
                        {(it.total || 0).toFixed(3)}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => setItems(items.filter((_, i) => i !== idx))}
                          className="text-rose-400 hover:text-rose-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Total & Action */}
          <div className="flex justify-between items-center pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-bold">Discount:</span>
              <input
                type="number"
                step="0.001"
                value={discount === 0 ? '' : discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                placeholder="0.000"
                className="w-20 bg-slate-900 border border-slate-700 rounded p-1 text-xs text-white"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-slate-400 text-xs block">Quote Total:</span>
                <span className="text-lg font-black text-rose-400 font-mono">KWD {(total || 0).toFixed(3)}</span>
              </div>
              <button
                disabled={items.length === 0}
                onClick={handleCreateQuotation}
                className="bg-purple-700 hover:bg-purple-600 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-xs px-4 py-2 rounded shadow-xs"
              >
                Generate Quote
              </button>
            </div>
          </div>
        </div>

        {/* Right: Saved Quotations List */}
        <div className="lg:col-span-5 bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
            Active Price Quotations ({quotations.length})
          </h3>

          <div className="space-y-2 max-h-[420px] overflow-y-auto">
            {quotations.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                No price quotes created yet.
              </div>
            ) : (
              quotations.map((q) => (
                <div
                  key={q.id}
                  className="bg-slate-900 p-3 rounded border border-slate-800 text-xs space-y-1.5"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-rose-400">{q.quote_no}</span>
                    <span className="text-[10px] text-slate-400">Valid until {q.valid_until}</span>
                  </div>
                  <div className="font-bold text-white text-sm">{q.customer_name}</div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                    <span className="text-slate-400">{(q.items || []).length} items</span>
                    <span className="font-black text-emerald-400 font-mono text-sm">
                      KWD {(q.total || 0).toFixed(3)}
                    </span>
                  </div>
                  <div className="pt-1 flex justify-end gap-1.5">
                    <button
                      onClick={() => setActiveQuoteForPrint(q)}
                      className="bg-slate-800 hover:bg-slate-700 text-white px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Print</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modern Multi-Format Quotation / Sales Order Print Modal */}
      {activeQuoteForPrint && (
        <QuotationPrintModal
          quotation={activeQuoteForPrint}
          onClose={() => setActiveQuoteForPrint(null)}
        />
      )}

      {/* Quick Add Party Modal */}
      <QuickAddPartyModal
        isOpen={isPartyModalOpen}
        onClose={() => setIsPartyModalOpen(false)}
        onCustomerAdded={handleCustomerAdded}
        initialQuery={customerName}
      />

      {/* Quick Add Product Modal */}
      <QuickAddProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onProductAdded={handleProductAdded}
        initialName={searchQuery}
        existingCategories={Array.from(new Set(products.map((p) => p.category)))}
      />
    </div>
  );
};
