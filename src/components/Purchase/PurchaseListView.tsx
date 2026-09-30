import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  ListOrdered, 
  Search, 
  Printer, 
  Building, 
  Eye, 
  Calendar,
  Banknote,
  CheckCircle,
  FileText
} from 'lucide-react';
import { PurchaseInvoice } from '../../types';
import { PurchasePrintModal } from './PurchasePrintModal';

export const PurchaseListView: React.FC = () => {
  const { purchases } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseInvoice | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [purchaseToPrint, setPurchaseToPrint] = useState<PurchaseInvoice | null>(null);

  const filteredPurchases = purchases.filter(
    (p) =>
      p.purchase_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.supplier_phone && p.supplier_phone.includes(searchTerm)) ||
      p.date.includes(searchTerm)
  );

  return (
    <div className="h-full overflow-y-auto bg-slate-950 text-slate-100 p-3 sm:p-4 space-y-4 custom-scrollbar">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-blue-400" />
            Purchase Invoices Register
          </h2>
          <p className="text-xs text-slate-400">
            Historical registry of all vendor purchase bills, warehouse stock receipts and payment status
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Purchase #, Supplier..."
            className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded-lg pl-8 pr-3 py-2 outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            All Purchase Invoices ({filteredPurchases.length})
          </span>
          <span className="text-xs text-slate-400 font-mono">
            Total Value: <strong className="text-emerald-400 font-bold">
              KWD {filteredPurchases.reduce((sum, p) => sum + (p.total_amount || p.total || 0), 0).toFixed(3)}
            </strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold">
                <th className="py-2.5 px-3">Purchase #</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Supplier Name</th>
                <th className="py-2.5 px-2 text-center">Items</th>
                <th className="py-2.5 px-3 text-right">Subtotal</th>
                <th className="py-2.5 px-3 text-right">Paid Amount</th>
                <th className="py-2.5 px-3 text-right">Due Balance</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredPurchases.map((p) => {
                const totalAmt = p.total_amount || p.total || 0;
                const paidAmt = p.paid_amount || 0;
                const dueAmt = p.due_amount || Math.max(0, totalAmt - paidAmt);

                return (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-300">
                      {p.purchase_no}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 font-mono">
                      {p.date}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-white">
                      {p.supplier_name}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-slate-300">
                      {(p.items || []).length}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                      {(totalAmt || 0).toFixed(3)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                      {(paidAmt || 0).toFixed(3)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400">
                      {(dueAmt || 0).toFixed(3)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        p.status === 'received' || p.status === 'paid'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {(p.status || 'RECEIVED').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setPurchaseToPrint(p);
                            setIsPrintModalOpen(true);
                          }}
                          title="Print Purchase Bill (A4, A5, 80mm)"
                          className="bg-slate-800 hover:bg-slate-700 text-blue-300 hover:text-white text-xs px-2.5 py-1 rounded font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" /> Print
                        </button>
                        <button
                          onClick={() => setSelectedPurchase(p)}
                          title="View Details"
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs px-2 py-1 rounded font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Details Modal */}
      {selectedPurchase && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white font-mono">{selectedPurchase.purchase_no}</h3>
                <p className="text-xs text-slate-400">Official Purchase Invoice Receipt</p>
              </div>
              <button
                onClick={() => setSelectedPurchase(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-slate-400">Supplier:</div>
                <div className="font-bold text-white text-sm">{selectedPurchase.supplier_name}</div>
                <div className="text-slate-400 font-mono">Tel: {selectedPurchase.supplier_phone || 'N/A'}</div>
              </div>
              <div className="text-right">
                <div className="text-slate-400">Invoice Date:</div>
                <div className="font-mono text-white font-bold">{selectedPurchase.date}</div>
                <div className="text-slate-400">Section: {selectedPurchase.section || 'General'}</div>
              </div>
            </div>

            <div className="border border-slate-800 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400">
                  <tr>
                    <th className="p-2">Item</th>
                    <th className="p-2 text-center">Unit</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-right">Unit Cost</th>
                    <th className="p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {selectedPurchase.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2 text-white font-medium">{it.name}</td>
                      <td className="p-2 text-center text-slate-400">{it.unit || 'PCS'}</td>
                      <td className="p-2 text-center font-mono font-bold text-white">{it.qty}</td>
                      <td className="p-2 text-right font-mono">KWD {(it.cost || 0).toFixed(3)}</td>
                      <td className="p-2 text-right font-mono font-bold text-emerald-400">KWD {(it.total || 0).toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <div className="space-y-0.5">
                <div className="font-mono text-sm font-black text-white">
                  Total Bill: <span className="text-emerald-400">KWD {(selectedPurchase.total_amount || selectedPurchase.total || 0).toFixed(3)}</span>
                </div>
                <div className="text-xs text-slate-400">
                  Paid: KWD {(selectedPurchase.paid_amount || 0).toFixed(3)} • Due: KWD {(selectedPurchase.due_amount || 0).toFixed(3)}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setPurchaseToPrint(selectedPurchase);
                    setIsPrintModalOpen(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Print Purchase Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modern Multi-Format Purchase Print Modal */}
      {isPrintModalOpen && purchaseToPrint && (
        <PurchasePrintModal
          document={purchaseToPrint}
          type="purchase_invoice"
          onClose={() => {
            setIsPrintModalOpen(false);
            setPurchaseToPrint(null);
          }}
        />
      )}
    </div>
  );
};
