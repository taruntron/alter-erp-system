import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Layers, Search, Barcode, AlertCircle, Banknote, TrendingUp, Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';
import { exportToCSV, exportToPDF } from '../../utils/exportUtils';

export const CurrentStockView: React.FC = () => {
  const { products } = useStore();
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [showExportMenu, setShowExportMenu] = useState(false);

  const categories = ['ALL', ...Array.from(new Set(products.map((p) => p.category)))];

  const filtered = products.filter((p) => {
    const q = query.toLowerCase();
    const matchesSearch =
      q === '' ||
      p.name.toLowerCase().includes(q) ||
      p.barcode.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q);

    const matchesCat = categoryFilter === 'ALL' || p.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const totalStockUnits = products.reduce((sum, p) => sum + p.stock_quantity, 0);
  const totalCostValuation = products.reduce((sum, p) => sum + p.cost * p.stock_quantity, 0);
  const totalRetailValuation = products.reduce((sum, p) => sum + p.price * p.stock_quantity, 0);

  const handleExportStock = (type: 'csv' | 'pdf') => {
    setShowExportMenu(false);
    const headers = [
      '#',
      'Barcode',
      'Product Name',
      'Category',
      'Unit',
      'Stock Qty',
      'Cost Price (KWD)',
      'Selling Price (KWD)',
      'Total Cost Value (KWD)',
      'Total Retail Value (KWD)',
    ];

    const rows = filtered.map((p, idx) => [
      idx + 1,
      p.barcode || p.sku || '-',
      p.name,
      p.category || 'General',
      p.unit,
      p.stock_quantity || 0,
      (p.cost || 0).toFixed(3),
      (p.price || 0).toFixed(3),
      ((p.cost || 0) * (p.stock_quantity || 0)).toFixed(3),
      ((p.price || 0) * (p.stock_quantity || 0)).toFixed(3),
    ]);

    const summaryMetrics = [
      { label: 'Total SKUs', value: `${filtered.length}` },
      { label: 'Total Units', value: `${totalStockUnits.toLocaleString()}` },
      { label: 'Cost Valuation', value: `KWD ${totalCostValuation.toFixed(3)}` },
      { label: 'Retail Valuation', value: `KWD ${totalRetailValuation.toFixed(3)}` },
    ];

    const filename = `Stock_Report_${categoryFilter.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;

    if (type === 'csv') {
      exportToCSV({
        title: 'Current Stock & Inventory Matrix Report',
        filename,
        headers,
        rows,
        summaryMetrics,
      });
    } else {
      exportToPDF({
        title: 'Current Stock & Inventory Matrix Report',
        subtitle: `Category: ${categoryFilter} | Active SKUs: ${filtered.length}`,
        filename,
        headers,
        rows,
        summaryMetrics,
      });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-42px)] bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {/* Top Header & Valuation Cards */}
      <div className="bg-slate-950 p-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-lg border border-emerald-500/30">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">Current Stock & Inventory Matrix</h2>
            <p className="text-xs text-slate-400">Live multi-product inventory valuation</p>
          </div>
        </div>

        {/* Valuation Badges & Export Button */}
        <div className="flex items-center gap-3 text-xs flex-wrap">
          <div className="bg-slate-900 border border-slate-700 px-3 py-1.5 rounded">
            <span className="text-slate-400 font-bold block text-[10px]">Total Stock Units:</span>
            <span className="font-black text-white text-sm">{totalStockUnits.toLocaleString()} units</span>
          </div>

          <div className="bg-slate-900 border border-slate-700 px-3 py-1.5 rounded">
            <span className="text-slate-400 font-bold block text-[10px]">Inventory Cost Value:</span>
            <span className="font-black text-purple-400 text-sm font-mono">KWD {totalCostValuation.toFixed(3)}</span>
          </div>

          <div className="bg-slate-900 border border-slate-700 px-3 py-1.5 rounded">
            <span className="text-slate-400 font-bold block text-[10px]">Estimated Retail Value:</span>
            <span className="font-black text-emerald-400 text-sm font-mono">KWD {totalRetailValuation.toFixed(3)}</span>
          </div>

          {/* Download Stock Report Button */}
          <div className="relative">
            <button
              id="btn-download-stock-report"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Report</span>
              <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
            </button>

            {showExportMenu && (
              <div 
                id="menu-download-stock-dropdown"
                className="absolute right-0 mt-1.5 w-52 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-1.5 z-50 text-slate-200 animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="text-[10px] uppercase font-black tracking-wider text-slate-400 px-2 py-1">
                  Export Stock Data
                </div>
                <button
                  id="btn-export-stock-csv"
                  onClick={() => handleExportStock('csv')}
                  className="w-full text-left px-2.5 py-2 rounded hover:bg-slate-800 text-xs flex items-center gap-2 transition-colors font-medium text-emerald-400"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Download CSV (Excel)</span>
                </button>
                <button
                  id="btn-export-stock-pdf"
                  onClick={() => handleExportStock('pdf')}
                  className="w-full text-left px-2.5 py-2 rounded hover:bg-slate-800 text-xs flex items-center gap-2 transition-colors font-medium text-rose-400"
                >
                  <FileText className="w-4 h-4" />
                  <span>Download PDF Document</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-slate-950/60 p-2.5 border-b border-slate-800 flex items-center justify-between gap-2 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-2.5 top-2 text-slate-400" />
          <input
            type="text"
            placeholder="Scan barcode or type item name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-bold">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white rounded px-2.5 py-1.5 text-xs outline-none cursor-pointer"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stock Matrix Table */}
      <div className="flex-1 overflow-auto p-3 bg-slate-950">
        <div className="bg-slate-900 rounded border border-slate-800 overflow-hidden shadow-md">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 uppercase text-[10px] font-black border-b border-slate-800 tracking-wider">
                <th className="py-2.5 px-3 w-12 text-center">#</th>
                <th className="py-2.5 px-3 w-36">Barcode</th>
                <th className="py-2.5 px-3">Product Name</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-center">Unit</th>
                <th className="py-2.5 px-3 text-center font-black">Stock On Hand</th>
                <th className="py-2.5 px-3 text-right">Cost Price</th>
                <th className="py-2.5 px-3 text-right">Selling Price</th>
                <th className="py-2.5 px-3 text-right">Total Cost Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium">
              {filtered.map((prod, idx) => (
                <tr key={prod.id} className="hover:bg-slate-850/80 text-slate-200 transition-colors">
                  <td className="py-2 px-3 text-center text-slate-400">{idx + 1}</td>
                  <td className="py-2 px-3 font-mono text-[11px] text-slate-400">{prod.barcode}</td>
                  <td className="py-2 px-3 font-bold text-white text-xs">{prod.name}</td>
                  <td className="py-2 px-3 text-purple-400">{prod.category}</td>
                  <td className="py-2 px-3 text-center font-bold text-purple-300">{prod.unit}</td>
                  <td className="py-2 px-3 text-center">
                    <span className={`px-2.5 py-1 rounded text-xs font-black ${
                      prod.stock_quantity <= 0 
                        ? 'bg-rose-950 text-rose-400 border border-rose-800' 
                        : prod.stock_quantity <= prod.lowStockThreshold
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}>
                      {prod.stock_quantity}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-slate-400">{(prod.cost || 0).toFixed(3)}</td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">{(prod.price || 0).toFixed(3)}</td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-purple-300">
                    {((prod.cost || 0) * (prod.stock_quantity || 0)).toFixed(3)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
