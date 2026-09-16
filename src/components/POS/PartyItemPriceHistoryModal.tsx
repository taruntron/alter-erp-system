import React, { useState } from 'react';
import { Invoice, Product, Customer, InvoiceItem } from '../../types';
import { 
  X, 
  History, 
  Building2, 
  User, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Banknote, 
  ArrowRight, 
  Check, 
  Package,
  Sparkles
} from 'lucide-react';

interface PartyItemPriceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | InvoiceItem | null;
  customer: Customer;
  invoices: Invoice[];
  onApplyPrice?: (price: number) => void;
}

interface PriceRecord {
  branchName: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceTimestamp: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  customerName: string;
  status: string;
}

export const PartyItemPriceHistoryModal: React.FC<PartyItemPriceHistoryModalProps> = ({
  isOpen,
  onClose,
  product,
  customer,
  invoices,
  onApplyPrice,
}) => {
  const [appliedPrice, setAppliedPrice] = useState<number | null>(null);

  if (!isOpen || !product) return null;

  // Extract all invoice items matching this product ID or Barcode/SKU
  const prodId = 'product_id' in product ? product.product_id : product.id;
  const prodBarcode = product.barcode || product.sku;
  const standardSellingPrice = 'price' in product ? product.price : 0;

  // Build price history records from invoices strictly for this party/customer
  const partyRecords: PriceRecord[] = [];

  // Sort invoices newest first
  const sortedInvoices = [...invoices].sort(
    (a, b) => new Date(b.timestamp || b.date).getTime() - new Date(a.timestamp || a.date).getTime()
  );

  sortedInvoices.forEach((inv) => {
    if (inv.status === 'voided') return;

    const isParty = 
      (inv.customer_id && inv.customer_id === customer.id) ||
      (inv.customer_name && inv.customer_name.trim().toLowerCase() === customer.name.trim().toLowerCase()) ||
      (customer.phone && customer.phone !== '00000000' && inv.customer_phone === customer.phone);

    if (!isParty) return;

    inv.items.forEach((item) => {
      const match = (item.product_id && item.product_id === prodId) || 
                    (item.barcode && item.barcode === prodBarcode) ||
                    (item.sku && item.sku === product.sku) ||
                    (item.name.toLowerCase() === product.name.toLowerCase());

      if (match) {
        partyRecords.push({
          branchName: inv.section || 'Main Branch',
          invoiceNumber: inv.invoice_no,
          invoiceDate: inv.date || (inv.timestamp ? inv.timestamp.split('T')[0] : 'N/A'),
          invoiceTimestamp: inv.timestamp || inv.date,
          quantity: item.qty,
          unit: item.unit || 'UNIT',
          unitPrice: item.price,
          totalPrice: item.total,
          customerName: inv.customer_name,
          status: inv.status,
        });
      }
    });
  });

  // Limit to last 15 transactions
  const displayRecords = partyRecords.slice(0, 15);

  // Price calculations
  const unitPrices = displayRecords.map((r) => r.unitPrice);
  const lastBilledPrice = unitPrices[0] !== undefined ? unitPrices[0] : standardSellingPrice;
  const avgPrice = unitPrices.length > 0 
    ? unitPrices.reduce((a, b) => a + b, 0) / unitPrices.length 
    : lastBilledPrice;
  const minPrice = unitPrices.length > 0 ? Math.min(...unitPrices) : lastBilledPrice;
  const maxPrice = unitPrices.length > 0 ? Math.max(...unitPrices) : lastBilledPrice;

  const handleSelectPrice = (price: number) => {
    if (onApplyPrice) {
      onApplyPrice(price);
      setAppliedPrice(price);
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
            <div className="w-10 h-10 rounded-lg bg-purple-900/60 border border-purple-700 flex items-center justify-center text-purple-300 shrink-0 shadow-xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white tracking-wide">
                  Party-Wise Item Price History
                </h2>
                <span className="bg-purple-950 text-purple-300 border border-purple-800 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                  Last 15 Transactions
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Past transaction prices charged to <strong className="text-purple-300">{customer.name}</strong>
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

        {/* Info Strip: Product & Party context */}
        <div className="bg-slate-950/50 p-4 border-b border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* Product Info */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 flex items-start gap-3">
            <Package className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <div className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Item / Product</div>
              <div className="text-sm font-bold text-white truncate" title={product.name}>
                {product.name}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-1 font-mono">
                <span>Barcode: <strong className="text-slate-200">{product.barcode || product.sku}</strong></span>
                <span>•</span>
                <span>Unit: <strong className="text-purple-300">{product.unit}</strong></span>
                <span>•</span>
                <span>Last Selling Price: <strong className="text-emerald-400">KWD {standardSellingPrice.toFixed(3)}</strong></span>
              </div>
            </div>
          </div>

          {/* Party Info */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 flex items-start gap-3">
            <User className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <div className="text-[10px] text-purple-400 uppercase font-black tracking-wider">Selected Customer / Party</div>
              <div className="text-sm font-bold text-purple-200 truncate">
                {customer.name}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-1">
                {customer.firm_name && (
                  <span className="text-slate-300 font-semibold">🏢 {customer.firm_name}</span>
                )}
                {customer.phone && customer.phone !== '00000000' && (
                  <span className="font-mono">📞 {customer.phone}</span>
                )}
                <span className="text-amber-400 font-bold">Due: KWD {(customer.due_balance || 0).toFixed(3)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Statistics Tiles */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
              <span>Last Billed Rate</span>
              <History className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-base font-black text-purple-300 font-mono mt-1">
              KWD {(lastBilledPrice || 0).toFixed(3)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {displayRecords.length > 0 ? 'Last rate to this party' : 'Standard selling price'}
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
              <span>Average Rate</span>
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-base font-black text-cyan-300 font-mono mt-1">
              KWD {(avgPrice || 0).toFixed(3)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Across {displayRecords.length} sale(s) to this party
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
              <span>Lowest Rate</span>
              <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-base font-black text-emerald-400 font-mono mt-1">
              KWD {(minPrice || 0).toFixed(3)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Best discount given</div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
              <span>Highest Rate</span>
              <Banknote className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-base font-black text-amber-400 font-mono mt-1">
              KWD {(maxPrice || 0).toFixed(3)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Max charged price</div>
          </div>
        </div>

        {/* Action Header Banner */}
        <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-300 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Party Transaction History ({displayRecords.length} recorded)</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Showing up to last 15 invoices for this customer
          </span>
        </div>

        {/* Transactions Table */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/90 text-slate-300 uppercase text-[11px] font-black tracking-wider border-b border-slate-800">
                  <th className="py-2.5 px-3">Branch Name</th>
                  <th className="py-2.5 px-3">Invoice Number</th>
                  <th className="py-2.5 px-3">Invoice Date</th>
                  <th className="py-2.5 px-3 text-center">Quantity</th>
                  <th className="py-2.5 px-3 text-right">Unit Price (KWD)</th>
                  <th className="py-2.5 px-3 text-right">Total Price (KWD)</th>
                  {onApplyPrice && <th className="py-2.5 px-3 text-center w-28">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 font-medium">
                {displayRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <History className="w-8 h-8 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-300">
                          No previous transaction history for {customer.name}
                        </p>
                        <p className="text-xs text-slate-500 max-w-sm text-center mt-1">
                          This product has not been billed to this customer before. The current line is using the Last Selling Price (KWD {(standardSellingPrice || 0).toFixed(3)}).
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayRecords.map((rec, idx) => {
                    const isApplied = appliedPrice === rec.unitPrice;
                    return (
                      <tr 
                        key={`${rec.invoiceNumber}-${idx}`}
                        className="hover:bg-slate-800/50 transition-colors bg-purple-950/20"
                      >
                        {/* 1. Branch Name */}
                        <td className="py-2.5 px-3 font-semibold text-slate-200">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            <span className="truncate max-w-[140px]">{rec.branchName}</span>
                          </div>
                        </td>

                        {/* 2. Invoice Number */}
                        <td className="py-2.5 px-3 font-mono font-bold text-purple-300">
                          {rec.invoiceNumber}
                        </td>

                        {/* 3. Invoice Date */}
                        <td className="py-2.5 px-3 text-slate-400 font-mono">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{rec.invoiceDate}</span>
                          </div>
                        </td>

                        {/* 4. Quantity */}
                        <td className="py-2.5 px-3 text-center font-bold text-slate-200 font-mono">
                          <span className="bg-slate-800 px-2 py-0.5 rounded text-white text-[11px]">
                            {rec.quantity} {rec.unit}
                          </span>
                        </td>

                        {/* 5. Unit Price */}
                        <td className="py-2.5 px-3 text-right font-black text-amber-300 font-mono text-xs">
                          {(rec.unitPrice || 0).toFixed(3)}
                        </td>

                        {/* 6. Total Price */}
                        <td className="py-2.5 px-3 text-right font-black text-emerald-400 font-mono text-xs">
                          {(rec.totalPrice || 0).toFixed(3)}
                        </td>

                        {/* Action: Apply this price */}
                        {onApplyPrice && (
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleSelectPrice(rec.unitPrice)}
                              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all flex items-center justify-center gap-1 w-full ${
                                isApplied
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-800 hover:bg-purple-700 text-slate-300 hover:text-white'
                              }`}
                              title={`Apply unit price KWD ${(rec.unitPrice || 0).toFixed(3)} to active line`}
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
            <span className="inline-block w-2 h-2 rounded-full bg-purple-400"></span>
            <span>Click <strong>Apply</strong> on any row to set that price on the current bill line.</span>
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
