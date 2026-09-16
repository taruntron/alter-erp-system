import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { StockTransferItem, StockTransfer, Product, ProductUnit } from '../../types';
import { TransferPrintModal } from './TransferPrintModal';
import { 
  Search, 
  Plus, 
  Trash2, 
  Printer, 
  RotateCcw, 
  FileText, 
  ArrowLeftRight, 
  Check, 
  X,
  Eye,
  Edit,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';

export const StockTransferView: React.FC = () => {
  const { products, sections, stockTransfers, createStockTransfer, uoms } = useStore();
  const { user } = useAuth();

  // Section selectors
  const [fromSection, setFromSection] = useState<string>('Store Sales');
  const [toSection, setToSection] = useState<string>('SEENU CARE Co.');

  // Item Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showItemDropdown, setShowItemDropdown] = useState<boolean>(false);
  const [highlightedProductIndex, setHighlightedProductIndex] = useState<number>(0);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowItemDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-scroll highlighted product into view
  useEffect(() => {
    if (showItemDropdown && highlightedProductIndex >= 0) {
      const el = document.getElementById(`transfer-prod-opt-${highlightedProductIndex}`);
      if (el) {
        el.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedProductIndex, showItemDropdown]);

  // Global F2 keyboard shortcut to jump straight to Item Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Transfer Items
  const [items, setItems] = useState<StockTransferItem[]>([]);
  const [narration, setNarration] = useState<string>('');

  // Load Invoice / Search Past Transfers Modal
  const [showLoadInvoiceModal, setShowLoadInvoiceModal] = useState<boolean>(false);
  const [loadFromDate, setLoadFromDate] = useState<string>('2026-08-25');
  const [loadToDate, setLoadToDate] = useState<string>('2026-08-28');
  const [loadSearchFilter, setLoadSearchFilter] = useState<string>('');

  // Print voucher modal state
  const [activeTransferForPrint, setActiveTransferForPrint] = useState<StockTransfer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Available UOM list combining dynamic store UOMs and standard units
  const availableUomCodes = Array.from(
    new Set([
      'UNIT',
      'CTN24',
      'Box',
      'Pkt',
      'Dozen',
      'CTN',
      'Pcs',
      'Kg',
      'Gm',
      'Mtr',
      'Set',
      ...(uoms || []).map((u) => u.code),
    ])
  );

  // Helper to get available stock in fromSection
  const getProductStock = (prodId?: string, fallbackBarcode?: string): number => {
    const prod = products.find((p) => (prodId && p.id === prodId) || (fallbackBarcode && p.barcode === fallbackBarcode));
    if (!prod) return 0;
    if (fromSection && prod.sectionStock && prod.sectionStock[fromSection] !== undefined) {
      return prod.sectionStock[fromSection];
    }
    return prod.stock_quantity || 0;
  };

  // Filter products for autocomplete
  const filteredProducts = searchQuery.trim() === ''
    ? []
    : products.filter((p) => {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.barcode.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.additionalBarcodes && p.additionalBarcodes.some((b) => b.toLowerCase().includes(q))) ||
          (p.category && p.category.toLowerCase().includes(q))
        );
      });

  // Handle selecting an item to transfer: Workflow: Item -> Unit -> Qty -> Item Search
  const handleSelectItem = (prod: Product) => {
    let targetIndex = 0;
    const existingIndex = items.findIndex((it) => it.product_id === prod.id);

    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].qty += 1;
      setItems(updated);
      targetIndex = existingIndex;
    } else {
      const newItem: StockTransferItem = {
        product_id: prod.id,
        sku: prod.sku,
        barcode: prod.barcode,
        name: prod.name,
        unit: prod.unit,
        qty: 1,
      };
      targetIndex = items.length;
      setItems((prev) => [...prev, newItem]);
    }

    setSearchQuery('');
    setShowItemDropdown(false);

    // Auto-focus UNIT select dropdown of the newly added/updated item line
    setTimeout(() => {
      const unitEl = document.getElementById(`transfer-unit-select-${targetIndex}`) as HTMLElement | null;
      if (unitEl) {
        unitEl.focus();
      }
    }, 60);
  };

  const handleUpdateQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleDeleteItem(index);
      return;
    }
    const updated = [...items];
    updated[index] = { ...updated[index], qty: newQty };
    setItems(updated);
  };

  const handleUpdateUnit = (index: number, newUnit: ProductUnit) => {
    const updated = [...items];
    updated[index] = { ...updated[index], unit: newUnit };
    setItems(updated);
  };

  const handleDeleteItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    setItems([]);
    setNarration('');
    setSearchQuery('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Close & Print (Create and Print Transfer Slip)
  const handleCloseAndPrint = async () => {
    if (items.length === 0) {
      alert('Please add at least one item to transfer.');
      return;
    }

    if (fromSection === toSection) {
      alert('Source section and destination section cannot be the same.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newTransfer = await createStockTransfer({
        from_section: fromSection,
        to_section: toSection,
        items,
        no_of_items: items.length,
        user_uid: user?.uid || 'usr-1',
        user_name: user?.displayName || 'Admin',
        narration,
      });

      setActiveTransferForPrint(newTransfer);
      handleClearAll();
    } catch (err) {
      console.error('Error creating stock transfer:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter past transfers for Load Invoice modal
  const filteredPastTransfers = stockTransfers.filter((st) => {
    const matchesSearch =
      loadSearchFilter === '' ||
      st.transfer_no.toLowerCase().includes(loadSearchFilter.toLowerCase()) ||
      st.from_section.toLowerCase().includes(loadSearchFilter.toLowerCase()) ||
      st.to_section.toLowerCase().includes(loadSearchFilter.toLowerCase());

    const transferDate = st.date || st.timestamp.split('T')[0];
    const matchesDate =
      (!loadFromDate || transferDate >= loadFromDate) &&
      (!loadToDate || transferDate <= loadToDate);

    return matchesSearch && matchesDate;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-42px)] bg-slate-900 text-slate-100 overflow-hidden font-sans select-none">
      {/* Top Filter Bar (Matching Sales Invoice Flow) */}
      <div className="bg-slate-950 p-2 border-b border-slate-800 flex items-center justify-between gap-3 flex-wrap">
        {/* Search Item input with live dropdown */}
        <div ref={searchContainerRef} className="relative flex-1 min-w-[280px] max-w-lg">
          <div className="flex items-center bg-white rounded border border-slate-300 shadow-xs focus-within:ring-2 focus-within:ring-purple-500">
            <Search className="w-4 h-4 ml-2.5 text-purple-700 pointer-events-none shrink-0" />
            <input
              ref={searchInputRef}
              id="input-transfer-search-item"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowItemDropdown(true);
                setHighlightedProductIndex(0);
              }}
              onFocus={() => {
                if (searchQuery.trim() !== '') {
                  setShowItemDropdown(true);
                }
                setHighlightedProductIndex(0);
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  if (!showItemDropdown) setShowItemDropdown(true);
                  if (filteredProducts.length > 0) {
                    setHighlightedProductIndex((prev) => (prev + 1) % filteredProducts.length);
                  }
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  if (!showItemDropdown) setShowItemDropdown(true);
                  if (filteredProducts.length > 0) {
                    setHighlightedProductIndex((prev) => (prev - 1 + filteredProducts.length) % filteredProducts.length);
                  }
                } else if (e.key === 'Enter' || e.key === 'Tab') {
                  if (showItemDropdown && filteredProducts.length > 0) {
                    e.preventDefault();
                    const validIdx = highlightedProductIndex >= 0 && highlightedProductIndex < filteredProducts.length
                      ? highlightedProductIndex
                      : 0;
                    handleSelectItem(filteredProducts[validIdx]);
                  }
                } else if (e.key === 'Escape') {
                  setShowItemDropdown(false);
                }
              }}
              placeholder="Search Item (Code, Name, Barcode)... (Press Enter to Select -> Unit -> Qty)"
              className="w-full bg-transparent text-slate-950 font-bold text-xs px-2.5 py-1.5 outline-none placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setHighlightedProductIndex(0);
                  searchInputRef.current?.focus();
                }}
                className="text-slate-400 hover:text-slate-600 px-2 text-xs font-bold"
                title="Clear item search"
              >
                ✕
              </button>
            )}
            <div className="px-2 py-1 bg-purple-100 text-purple-800 text-[10px] font-mono font-bold rounded-r border-l border-purple-200 hidden sm:block">
              F2
            </div>
          </div>

          {/* Autocomplete Dropdown Popup - Single Line Clean List */}
          {showItemDropdown && filteredProducts.length > 0 && (
            <div className="absolute top-full left-0 mt-1 w-full bg-white text-slate-900 rounded-md shadow-2xl border border-slate-300 z-50 max-h-72 overflow-y-auto divide-y divide-slate-100">
              {filteredProducts.map((prod, idx) => {
                const isSelected = idx === highlightedProductIndex;
                const availableStock = getProductStock(prod.id, prod.barcode);
                return (
                  <div
                    key={prod.id}
                    id={`transfer-prod-opt-${idx}`}
                    onClick={() => handleSelectItem(prod)}
                    onMouseEnter={() => setHighlightedProductIndex(idx)}
                    className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                      isSelected ? 'bg-purple-100 ring-1 ring-inset ring-purple-500 font-semibold' : 'hover:bg-purple-50'
                    }`}
                  >
                    {/* Single Line: Item Code | Item Name */}
                    <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                      <span className="font-mono text-[11px] font-bold text-slate-500 shrink-0">
                        {prod.barcode || prod.sku}
                      </span>
                      <span className="text-slate-300 shrink-0">•</span>
                      <span className={`truncate ${isSelected ? 'text-purple-950 font-bold' : 'text-slate-900'}`}>
                        {prod.name}
                      </span>
                    </div>

                    {/* Total Stock in selected fromSection */}
                    <div className="shrink-0 flex items-center gap-2 font-mono text-[11px]">
                      <span className={`font-bold ${
                        availableStock <= prod.lowStockThreshold 
                          ? 'text-rose-600' 
                          : 'text-slate-600'
                      }`}>
                        Avail: {availableStock}
                      </span>
                      {isSelected && (
                        <span className="text-[9px] bg-purple-700 text-white font-mono px-1.5 py-0.2 rounded font-bold">
                          ⏎ Select
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* From Section Dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-300">From Section:</span>
          <select
            id="select-transfer-from-section"
            value={fromSection}
            onChange={(e) => setFromSection(e.target.value)}
            className="bg-white text-slate-950 font-bold text-xs rounded px-2.5 py-1.5 outline-none cursor-pointer shadow-xs border border-slate-300 min-w-[150px]"
          >
            {sections.map((sec) => (
              <option key={sec.id} value={sec.name}>
                {sec.name}
              </option>
            ))}
          </select>
        </div>

        {/* To Section Dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-300">To Section:</span>
          <select
            id="select-transfer-to-section"
            value={toSection}
            onChange={(e) => setToSection(e.target.value)}
            className="bg-white text-slate-950 font-bold text-xs rounded px-2.5 py-1.5 outline-none cursor-pointer shadow-xs border border-slate-300 min-w-[150px]"
          >
            {sections.map((sec) => (
              <option key={sec.id} value={sec.name}>
                {sec.name}
              </option>
            ))}
          </select>
        </div>

        {/* Workflow Guide Tooltip Badge */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-semibold text-purple-300 bg-purple-950/60 border border-purple-800/80 px-2.5 py-1 rounded">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Workflow: Search Item ➔ Unit ➔ QTY ➔ Search Item</span>
        </div>

        {/* Clear All Red Button */}
        <button
          id="btn-transfer-clear-all"
          onClick={handleClearAll}
          className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xs px-4 py-1.5 rounded shadow-xs uppercase tracking-wider transition-colors ml-auto cursor-pointer"
        >
          Clear All
        </button>
      </div>

      {/* Main Table (Matching Sales Invoice Table Flow) */}
      <div className="flex-1 overflow-auto bg-slate-950 p-2 sm:p-3">
        <div className="bg-slate-900 rounded border border-slate-800 overflow-hidden shadow-md">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-300 uppercase text-[11px] font-black tracking-wider border-b border-slate-800">
                <th className="py-2.5 px-3 w-12 text-center">SrNo</th>
                <th className="py-2.5 px-3 w-36">Barcode / SKU</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3 w-32 text-center">Unit</th>
                <th className="py-2.5 px-3 w-28 text-center">Avail Stock ({fromSection})</th>
                <th className="py-2.5 px-3 w-28 text-center">Transfer Qty</th>
                <th className="py-2.5 px-3 w-16 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ArrowLeftRight className="w-8 h-8 text-slate-600 stroke-[1.5]" />
                      <p className="text-sm font-semibold text-slate-400">No items selected for transfer</p>
                      <p className="text-xs text-slate-600">
                        Type in the item search bar above to add products. Press <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">Enter</kbd> to jump across Unit and QTY.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item, index) => {
                  const currentStock = getProductStock(item.product_id, item.barcode);
                  return (
                    <tr
                      key={`${item.product_id}-${index}`}
                      className="hover:bg-slate-850 transition-colors bg-slate-900/90 text-slate-200"
                    >
                      {/* SrNo */}
                      <td className="py-2 px-3 text-center font-bold text-slate-400">
                        {index + 1}
                      </td>

                      {/* Barcode / SKU */}
                      <td className="py-2 px-3 font-mono text-slate-400 text-[11px]">
                        {item.barcode || item.sku}
                      </td>

                      {/* Description */}
                      <td className="py-2 px-3 font-bold text-white text-xs">
                        {item.name}
                      </td>

                      {/* Unit Dropdown - Enter/Tab moves to QTY */}
                      <td className="py-2 px-2 text-center">
                        <select
                          id={`transfer-unit-select-${index}`}
                          value={item.unit}
                          onChange={(e) => handleUpdateUnit(index, e.target.value as ProductUnit)}
                          onKeyDown={(e) => {
                            if ((e.key === 'Tab' && !e.shiftKey) || e.key === 'Enter') {
                              e.preventDefault();
                              const qtyEl = document.getElementById(`transfer-qty-input-${index}`) as HTMLInputElement | null;
                              if (qtyEl) {
                                qtyEl.focus();
                                qtyEl.select();
                              }
                            } else if (e.key === 'Tab' && e.shiftKey) {
                              e.preventDefault();
                              if (searchInputRef.current) {
                                searchInputRef.current.focus();
                                searchInputRef.current.select();
                              }
                            }
                          }}
                          className="bg-slate-800 border border-slate-700 text-purple-300 font-bold text-[11px] rounded px-2 py-1 outline-none cursor-pointer focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                        >
                          {availableUomCodes.map((uCode) => (
                            <option key={uCode} value={uCode}>
                              {uCode}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Available Stock in Source Section */}
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                          currentStock <= 0 
                            ? 'bg-rose-950/80 text-rose-400 border border-rose-800' 
                            : currentStock <= 10
                            ? 'bg-amber-950/80 text-amber-400 border border-amber-800'
                            : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                        }`}>
                          {currentStock}
                        </span>
                      </td>

                      {/* QTY Input - Enter/Tab moves back to Search Item input */}
                      <td className="py-2 px-3 text-center">
                        <input
                          id={`transfer-qty-input-${index}`}
                          type="number"
                          min="1"
                          value={item.qty}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handleUpdateQty(index, parseInt(e.target.value) || 1)}
                          onKeyDown={(e) => {
                            if ((e.key === 'Tab' && !e.shiftKey) || e.key === 'Enter') {
                              e.preventDefault();
                              if (searchInputRef.current) {
                                searchInputRef.current.focus();
                                searchInputRef.current.select();
                              }
                            } else if (e.key === 'Tab' && e.shiftKey) {
                              e.preventDefault();
                              const unitEl = document.getElementById(`transfer-unit-select-${index}`) as HTMLElement | null;
                              unitEl?.focus();
                            }
                          }}
                          className="w-20 bg-slate-950 border border-slate-700 text-center font-black text-white text-xs py-1 px-1 rounded outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-mono"
                        />
                      </td>

                      {/* Action */}
                      <td className="py-2 px-3 text-center">
                        <button
                          title="Remove"
                          onClick={() => handleDeleteItem(index)}
                          className="text-rose-500 hover:text-rose-400 p-1 rounded hover:bg-rose-950/40 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Action Bar (Matching Video 2) */}
      <div className="bg-slate-950 border-t border-slate-800 p-3 select-none">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* No of Item Display Box */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="text-xs font-bold text-slate-300 whitespace-nowrap">No Of Item:</span>
            <div className="bg-slate-900 border border-slate-700 rounded px-6 py-1 text-center font-black text-sm text-white min-w-[80px] shadow-xs">
              {items.length}
            </div>
            <span className="text-xs font-bold text-slate-400 ml-2">
              Total Qty: <strong className="text-purple-400">{items.reduce((s, it) => s + (Number(it.qty) || 0), 0)}</strong>
            </span>
          </div>

          {/* Search Invoice Button & Narration */}
          <div className="flex items-center gap-2 flex-1 max-w-xl w-full">
            <button
              id="btn-transfer-search-invoice"
              onClick={() => setShowLoadInvoiceModal(true)}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-purple-300 font-bold text-xs px-4 py-2 rounded shadow-xs whitespace-nowrap flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-purple-400" />
              <span>Search Invoice / Load Past Transfers</span>
            </button>

            <input
              type="text"
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              placeholder="Narration..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 outline-none placeholder:text-slate-500 focus:border-purple-500"
            />
          </div>

          {/* Close & Print Red Primary Button (Matching Video 2) */}
          <button
            id="btn-transfer-close-and-print"
            disabled={items.length === 0 || isSubmitting}
            onClick={handleCloseAndPrint}
            className={`w-full md:w-auto px-6 py-2 rounded font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
              items.length === 0
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-rose-600 hover:bg-rose-500 active:scale-98 text-white shadow-rose-950/50'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>{isSubmitting ? 'Transferring...' : 'Close & Print'}</span>
          </button>
        </div>
      </div>

      {/* Load Invoice / Past Stock Transfers Modal (Matching Video 2 screenshots 01:21 - 01:30) */}
      {showLoadInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 overflow-y-auto backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            {/* Modal Title Bar */}
            <div className="bg-slate-950 text-white px-4 py-2.5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-sm">Load Invoice / Stock Transfer History</h3>
              </div>
              <button
                onClick={() => setShowLoadInvoiceModal(false)}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-2.5 py-1 rounded transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Filter controls */}
            <div className="p-3 bg-slate-950/80 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-bold whitespace-nowrap">From Date:</span>
                <input
                  type="date"
                  value={loadFromDate}
                  onChange={(e) => setLoadFromDate(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none w-full"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-bold whitespace-nowrap">To Date:</span>
                <input
                  type="date"
                  value={loadToDate}
                  onChange={(e) => setLoadToDate(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none w-full"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Search Transfer No, Section..."
                  value={loadSearchFilter}
                  onChange={(e) => setLoadSearchFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white outline-none w-full placeholder:text-slate-500"
                />
                <button className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded font-bold text-xs cursor-pointer">
                  SEARCH
                </button>
              </div>
            </div>

            {/* Transfers Table */}
            <div className="p-3 overflow-y-auto flex-1 bg-slate-900">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 uppercase text-[10px] font-black border-b border-slate-800">
                    <th className="py-2 px-2.5 w-12">SRNO</th>
                    <th className="py-2 px-2.5">TRANSFER DATE</th>
                    <th className="py-2 px-2.5">TRANSFER NO</th>
                    <th className="py-2 px-2.5">FROM SECTION</th>
                    <th className="py-2 px-2.5">TO SECTION</th>
                    <th className="py-2 px-2.5 text-center">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-medium">
                  {filteredPastTransfers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No stock transfers recorded in this date range
                      </td>
                    </tr>
                  ) : (
                    filteredPastTransfers.map((st, idx) => (
                      <tr key={st.id} className="hover:bg-slate-800/60 text-slate-200 transition-colors">
                        <td className="py-2 px-2.5 text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-2.5">{st.date || st.timestamp.split('T')[0]}</td>
                        <td className="py-2 px-2.5 font-bold font-mono text-rose-400">{st.transfer_no}</td>
                        <td className="py-2 px-2.5 font-semibold text-white">{st.from_section}</td>
                        <td className="py-2 px-2.5 font-semibold text-white">{st.to_section}</td>
                        <td className="py-2 px-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setActiveTransferForPrint(st);
                              }}
                              className="bg-purple-700 hover:bg-purple-600 text-white font-bold text-[11px] px-2.5 py-1 rounded shadow-xs transition-colors uppercase cursor-pointer"
                            >
                              VIEW & REPRINT
                            </button>
                            <button
                              onClick={() => {
                                setItems(st.items);
                                setFromSection(st.from_section);
                                setToSection(st.to_section);
                                if (st.narration) setNarration(st.narration);
                                setShowLoadInvoiceModal(false);
                              }}
                              className="bg-slate-700 hover:bg-slate-600 text-white font-bold text-[11px] px-2 py-1 rounded shadow-xs transition-colors uppercase cursor-pointer"
                            >
                              EDIT
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Print Slip Modal */}
      {activeTransferForPrint && (
        <TransferPrintModal
          transfer={activeTransferForPrint}
          onClose={() => setActiveTransferForPrint(null)}
        />
      )}
    </div>
  );
};

