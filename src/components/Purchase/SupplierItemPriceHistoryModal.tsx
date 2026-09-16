import React, { useState } from 'react';
import { PurchaseInvoice, Product, Supplier, PurchaseItem } from '../../types';
import { 
  X, 
  History, 
  Building2, 
  Truck, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Banknote, 
  ArrowRight, 
  Check, 
  Package,
  Sparkles
} from 'lucide-react';

interface SupplierItemPriceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | PurchaseItem | null;
  supplier: Supplier;
  purchases: PurchaseInvoice[];
  onApplyCost?: (cost: number) => void;
}

interface PurchasePriceRecord {
  branchName: string;
  purchaseNumber: string;
  purchaseDate: string;
  supplierInvoiceNo?: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  supplierName: string;
}

export const SupplierItemPriceHistoryModal: React.FC<SupplierItemPriceHistoryModalProps> = ({
  isOpen,
  onClose,
  product,
  supplier,
  purchases,
  onApplyCost,
}) => {
  const [appliedCost, setAppliedCost] = useState<number | null>(null);

  if (!isOpen || !product) return null;

  const prodId = 'product_id' in product ? product.product_id : product.id;
  const prodBarcode = product.barcode || product.sku;
  const standardCost = 'cost' in product ? product.cost : 0;

  // Build supplier price history records from purchase invoices
  const supplierRecords: PurchasePriceRecord[] = [];

  const sortedPurchases = [...purchases].sort(
    (a, b) => new Date(b.timestamp || b.date).getTime() - new Date(a.timestamp || a.date).getTime()
  );

  sortedPurchases.forEach((pur) => {
    if (pur.status === 'cancelled') return;

    const isMatchSupplier =
      (pur.supplier_id && pur.supplier_id === supplier.id) ||
      (pur.supplier_name && pur.supplier_name.trim().toLowerCase() === supplier.name.trim().toLowerCase()) ||
      (supplier.phone && pur.supplier_phone === supplier.phone);

    if (!isMatchSupplier) return;

    pur.items.forEach((item) => {
      const match = (item.product_id && item.product_id === prodId) ||
                    (item.barcode && item.barcode === prodBarcode) ||
                    (item.sku && item.sku === product.sku) ||
                    (item.name.toLowerCase() === product.name.toLowerCase());

      if (match) {
        supplierRecords.push({
          branchName: pur.section || 'Main Warehouse',
          purchaseNumber: pur.purchase_no,
          purchaseDate: pur.date || (pur.timestamp ? pur.timestamp.split('T')[0] : 'N/A'),
          supplierInvoiceNo: pur.supplier_invoice_no,
          quantity: item.qty,
          unit: item.unit || 'UNIT',
          unitCost: item.cost,
          totalCost: item.total,
          supplierName: pur.supplier_name,
        });
      }
    });
  });

  const displayRecords = supplierRecords.slice(0, 15);

  // Statistics
  const unitCosts = displayRecords.map((r) => r.unitCost);
  const lastPurchaseRate = unitCosts[0] !== undefined ? unitCosts[0] : standardCost;
  const avgCost = unitCosts.length > 0 
    ? unitCosts.reduce((a, b) => a + b, 0) / unitCosts.length 
    : lastPurchaseRate;
  const minCost = unitCosts.length > 0 ? Math.min(...unitCosts) : lastPurchaseRate;
  const maxCost = unitCosts.length > 0 ? Math.max(...unitCosts) : lastPurchaseRate;

  const handleSelectCost = (cost: number) => {
    if (onApplyCost) {
      onApplyCost(cost);
      setAppliedCost(cost);
      setTimeout(() => {
        onClose();
      }, 350);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-900/60 border border-blue-700 flex items-center justify-center text-blue-300 shrink-0 shadow-xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white tracking-wide">
                  Supplier-Wise Item Purchase Rate History
                </h2>
                <span className="bg-blue-950 text-blue-300 border border-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                  Last 15 Invoices
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Past procurement costs from supplier <strong className="text-blue-300">{supplier.name}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Strip: Product & Supplier context */}
        <div className="bg-slate-950/50 p-4 border-b border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* Product Info */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 flex items-start gap-3">
            <Package className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <div className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Item / Product</div>
              <div className="text-sm font-bold text-white truncate" title={product.name}>
                {product.name}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-1 font-mono">
                <span>Barcode: <strong className="text-slate-200">{product.barcode || product.sku}</strong></span>
                <span>•</span>
                <span>Unit: <strong className="text-blue-300">{product.unit}</strong></span>
                <span>•</span>
                <span>Standard Cost: <strong className="text-amber-400">KWD {standardCost.toFixed(3)}</strong></span>
              </div>
            </div>
          </div>

          {/* Supplier Info */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 flex items-start gap-3">
            <Truck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <div className="text-[10px] text-blue-400 uppercase font-black tracking-wider">Selected Supplier / Vendor</div>
              <div className="text-sm font-bold text-blue-200 truncate">
                {supplier.name}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-1">
                {supplier.company && (
                  <span className="text-slate-300 font-semibold">🏢 {supplier.company}</span>
                )}
                {supplier.phone && (
                  <span className="font-mono">📞 {supplier.phone}</span>
                )}
                <span className="text-rose-400 font-bold">Payable: KWD {(supplier.due_balance || 0).toFixed(3)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Statistics Tiles */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
              <span>Last Purchase Rate</span>
              <History className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-base font-black text-blue-300 font-mono mt-1">
              KWD {(lastPurchaseRate || 0).toFixed(3)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {displayRecords.length > 0 ? 'Last rate from this vendor' : 'Standard catalog cost'}
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
              <span>Average Cost</span>
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-base font-black text-cyan-300 font-mono mt-1">
              KWD {(avgCost || 0).toFixed(3)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Across {displayRecords.length} purchase bill(s)
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
              <span>Lowest Rate</span>
              <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-base font-black text-emerald-400 font-mono mt-1">
              KWD {(minCost || 0).toFixed(3)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Best purchase deal</div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
              <span>Highest Rate</span>
              <Banknote className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-base font-black text-amber-400 font-mono mt-1">
              KWD {(maxCost || 0).toFixed(3)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Peak purchase rate</div>
          </div>
        </div>

        {/* Action Header Banner */}
        <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-300 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Supplier Purchase Transactions ({displayRecords.length} recorded)</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Showing up to last 15 purchase bills from this supplier
          </span>
        </div>

        {/* Transactions Table */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/90 text-slate-300 uppercase text-[11px] font-black tracking-wider border-b border-slate-800">
                  <th className="py-2.5 px-3">Branch / Section</th>
                  <th className="py-2.5 px-3">Purchase No</th>
                  <th className="py-2.5 px-3">Bill Date</th>
                  <th className="py-2.5 px-3 text-center">Quantity</th>
                  <th className="py-2.5 px-3 text-right">Unit Rate (KWD)</th>
                  <th className="py-2.5 px-3 text-right">Total (KWD)</th>
                  {onApplyCost && <th className="py-2.5 px-3 text-center w-28">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 font-medium">
                {displayRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <History className="w-8 h-8 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-300">
                          No previous purchase history from {supplier.name}
                        </p>
                        <p className="text-xs text-slate-500 max-w-sm text-center mt-1">
                          This product has not been purchased from this supplier before. Using standard catalog cost (KWD {(standardCost || 0).toFixed(3)}).
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayRecords.map((rec, idx) => {
                    const isApplied = appliedCost === rec.unitCost;
                    return (
                      <tr 
                        key={`${rec.purchaseNumber}-${idx}`}
                        className="hover:bg-slate-800/50 transition-colors bg-blue-950/20"
                      >
                        {/* 1. Branch Name */}
                        <td className="py-2.5 px-3 font-semibold text-slate-200">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            <span className="truncate max-w-[140px]">{rec.branchName}</span>
                          </div>
                        </td>

                        {/* 2. Purchase Number */}
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-300">
                          {rec.purchaseNumber}
                          {rec.supplierInvoiceNo && (
                            <div className="text-[10px] text-slate-400">Ref: {rec.supplierInvoiceNo}</div>
                          )}
                        </td>

                        {/* 3. Invoice Date */}
                        <td className="py-2.5 px-3 text-slate-400 font-mono">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{rec.purchaseDate}</span>
                          </div>
                        </td>

                        {/* 4. Quantity */}
                        <td className="py-2.5 px-3 text-center font-bold text-slate-200 font-mono">
                          <span className="bg-slate-800 px-2 py-0.5 rounded text-white text-[11px]">
                            {rec.quantity} {rec.unit}
                          </span>
                        </td>

                        {/* 5. Unit Cost */}
                        <td className="py-2.5 px-3 text-right font-black text-blue-300 font-mono text-xs">
                          {(rec.unitCost || 0).toFixed(3)}
                        </td>

                        {/* 6. Total Cost */}
                        <td className="py-2.5 px-3 text-right font-black text-emerald-400 font-mono text-xs">
                          {(rec.totalCost || 0).toFixed(3)}
                        </td>

                        {/* Action: Apply this rate */}
                        {onApplyCost && (
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleSelectCost(rec.unitCost)}
                              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all flex items-center justify-center gap-1 w-full ${
                                isApplied
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-800 hover:bg-blue-700 text-slate-300 hover:text-white'
                              }`}
                              title={`Apply purchase rate KWD ${(rec.unitCost || 0).toFixed(3)} to active line`}
                            >
                              {isApplied ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>Applied</span>
                                </>
                              ) : (
                                <>
                                  <span>Apply</span>
                                  <ArrowRight className="w-3 h-3" />
                                </>
                              )}
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="text-slate-400 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-400"></span>
            <span>Click <strong>Apply</strong> to set that purchase rate on the active purchase line.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
