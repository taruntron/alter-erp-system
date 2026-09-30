import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { Invoice } from '../../types';
import { InvoicePrintModal } from '../POS/InvoicePrintModal';
import { 
  FileText, 
  Search, 
  Printer, 
  Ban, 
  Eye, 
  Calendar, 
  Filter, 
  Download, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export const InvoiceListView: React.FC = () => {
  const { invoices, voidInvoice } = useStore();
  const { isManager, isAdmin } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'credit' | 'voided'>('all');
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<Invoice | null>(null);

  const filteredInvoices = invoices.filter((inv) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      q === '' ||
      inv.invoice_no.toLowerCase().includes(q) ||
      inv.customer_name.toLowerCase().includes(q) ||
      inv.cashier_name.toLowerCase().includes(q) ||
      inv.section.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleVoid = async (inv: Invoice) => {
    if (inv.status === 'voided') return;
    if (
      window.confirm(
        `Are you sure you want to VOID invoice ${inv.invoice_no}? All ${(inv.items || []).length} items will be automatically restocked into inventory.`
      )
    ) {
      await voidInvoice(inv.id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {/* Top Header */}
      <div className="bg-slate-950 p-3 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-600/20 text-purple-400 rounded-lg border border-purple-500/30">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">Sales Invoices & Transactions</h2>
            <p className="text-xs text-slate-400">Total: {invoices.length} Invoices recorded in Firestore</p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-950/60 p-2.5 border-b border-slate-800 flex items-center justify-between gap-2 flex-wrap text-xs">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 absolute left-2.5 top-2 text-slate-400" />
          <input
            id="input-invoice-search"
            type="text"
            placeholder="Search by Invoice No, Customer, Cashier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded text-xs font-bold transition-all ${
              statusFilter === 'all' ? 'bg-purple-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            All Status
          </button>
          <button
            onClick={() => setStatusFilter('paid')}
            className={`px-3 py-1 rounded text-xs font-bold transition-all ${
              statusFilter === 'paid' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            Paid Cash/Card
          </button>
          <button
            onClick={() => setStatusFilter('credit')}
            className={`px-3 py-1 rounded text-xs font-bold transition-all ${
              statusFilter === 'credit' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            Credit Sales
          </button>
          <button
            onClick={() => setStatusFilter('voided')}
            className={`px-3 py-1 rounded text-xs font-bold transition-all ${
              statusFilter === 'voided' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            Voided
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="flex-1 overflow-auto p-3 bg-slate-950 custom-scrollbar">
        <div className="bg-slate-900 rounded border border-slate-800 overflow-hidden shadow-md">
          <table className="w-full text-left text-xs border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-slate-950 text-slate-400 uppercase text-[10px] font-black border-b border-slate-800 tracking-wider">
                <th className="py-2.5 px-3 w-12 text-center">#</th>
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3">Invoice No</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Section</th>
                <th className="py-2.5 px-3">Cashier</th>
                <th className="py-2.5 px-3 text-center">Items</th>
                <th className="py-2.5 px-3 text-right">Total (KWD)</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    No invoices match your search filters
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv, idx) => (
                  <tr key={inv.id} className="hover:bg-slate-850/80 text-slate-200 transition-colors">
                    <td className="py-2.5 px-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                      {new Date(inv.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-black text-rose-400 font-mono">
                      {inv.invoice_no}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-white">
                      {inv.customer_name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{inv.section}</td>
                    <td className="py-2.5 px-3 text-purple-300">{inv.cashier_name}</td>
                    <td className="py-2.5 px-3 text-center font-bold">{(inv.items || []).length}</td>
                    <td className="py-2.5 px-3 text-right font-black text-emerald-400 font-mono text-sm">
                      {(inv.total || 0).toFixed(3)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        inv.status === 'paid'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : inv.status === 'credit'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          title="View & Print Invoice"
                          onClick={() => setSelectedInvoiceForPrint(inv)}
                          className="bg-purple-800 hover:bg-purple-700 text-white px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 shadow-xs transition-colors"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Print</span>
                        </button>

                        {isManager && inv.status !== 'voided' && (
                          <button
                            title="Void Invoice & Restock"
                            onClick={() => handleVoid(inv)}
                            className="bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-colors"
                          >
                            <Ban className="w-3 h-3" />
                            <span>Void</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Print Modal */}
      {selectedInvoiceForPrint && (
        <InvoicePrintModal
          invoice={selectedInvoiceForPrint}
          onClose={() => setSelectedInvoiceForPrint(null)}
        />
      )}
    </div>
  );
};
