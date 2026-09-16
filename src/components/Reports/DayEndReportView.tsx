import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { Printer, Calendar, CreditCard, Banknote, ShieldCheck, CheckCircle } from 'lucide-react';

export const DayEndReportView: React.FC = () => {
  const { invoices } = useStore();
  const { user, activeSection } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Filter invoices by date
  const dayInvoices = invoices.filter((inv) => {
    const invDate = inv.date || inv.timestamp.split('T')[0];
    return invDate === selectedDate && inv.status !== 'voided';
  });

  const grossSales = dayInvoices.reduce((s, inv) => s + inv.subtotal, 0);
  const totalDiscounts = dayInvoices.reduce((s, inv) => s + inv.discount, 0);
  const netSales = dayInvoices.reduce((s, inv) => s + inv.total, 0);

  // Breakdown by payment methods
  const cashSales = dayInvoices.reduce((s, inv) => s + (inv.payments.cash || 0), 0);
  const knetSales = dayInvoices.reduce((s, inv) => s + (inv.payments.knet || 0), 0);
  const cardSales = dayInvoices.reduce((s, inv) => s + (inv.payments.card || 0) + (inv.payments.visa || 0), 0);
  const onlineSales = dayInvoices.reduce((s, inv) => s + (inv.payments.online || 0), 0);
  const chequeSales = dayInvoices.reduce((s, inv) => s + (inv.payments.cheque || 0), 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-42px)] bg-slate-900 text-slate-100 overflow-y-auto font-sans p-3 sm:p-4 space-y-4">
      {/* Header */}
      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-600/20 text-purple-400 rounded-lg border border-purple-500/30">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">Day End Cashier Settlement Report</h2>
            <p className="text-xs text-slate-400">Cash drawer balancing and payment channel totals</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-white outline-none"
          />
          <button
            onClick={handlePrint}
            className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 py-1.5 rounded shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Day End Slip</span>
          </button>
        </div>
      </div>

      {/* Printable Day End Settlement Slip */}
      <div className="flex justify-center">
        <div className="w-full max-w-xl bg-white text-slate-900 border border-slate-300 rounded-lg p-6 shadow-xl text-xs font-sans">
          {/* Header */}
          <div className="text-center pb-4 border-b border-slate-300">
            <h1 className="text-xl font-black uppercase text-slate-950">{activeSection || 'SEENU CARE CO.'}</h1>
            <p className="text-xs font-bold text-purple-900 uppercase tracking-widest mt-1">
              DAILY CASHIER CLOSING & SETTLEMENT
            </p>
            <p className="text-slate-500 text-[11px]">Date: {selectedDate} • Terminal: Main Counter</p>
            <p className="text-slate-500 text-[11px]">Printed At: {new Date().toLocaleTimeString()} by {user?.displayName}</p>
          </div>

          {/* Key Summary Totals */}
          <div className="grid grid-cols-3 gap-3 py-4 border-b border-slate-300 text-center">
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Total Invoices</span>
              <span className="text-base font-black text-slate-950">{dayInvoices.length}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Gross Sales</span>
              <span className="text-base font-black text-slate-950 font-mono">KWD {(grossSales || 0).toFixed(3)}</span>
            </div>
            <div className="bg-emerald-50 p-2.5 rounded border border-emerald-200">
              <span className="text-[10px] text-emerald-800 font-bold uppercase block">Net Collection</span>
              <span className="text-base font-black text-emerald-700 font-mono">KWD {(netSales || 0).toFixed(3)}</span>
            </div>
          </div>

          {/* Payment Method Breakdown Table */}
          <div className="py-4 border-b border-slate-300">
            <h3 className="font-black text-slate-900 uppercase text-xs mb-2">
              Payment Tender Reconciliation:
            </h3>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 font-bold text-slate-700 uppercase border-y border-slate-200">
                  <th className="py-1.5 px-2">Payment Method</th>
                  <th className="py-1.5 px-2 text-right">Transactions</th>
                  <th className="py-1.5 px-2 text-right">Settled Amount (KWD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2 px-2 font-bold text-slate-800">Cash in Drawer</td>
                  <td className="py-2 px-2 text-right text-slate-600">
                    {dayInvoices.filter((i) => (i.payments.cash || 0) > 0).length}
                  </td>
                  <td className="py-2 px-2 text-right font-black text-cyan-800 font-mono">{(cashSales || 0).toFixed(3)}</td>
                </tr>
                <tr>
                  <td className="py-2 px-2 font-bold text-slate-800">K-Net Debit Cards</td>
                  <td className="py-2 px-2 text-right text-slate-600">
                    {dayInvoices.filter((i) => ((i.payments && i.payments.knet) || 0) > 0).length}
                  </td>
                  <td className="py-2 px-2 text-right font-black text-purple-800 font-mono">{(knetSales || 0).toFixed(3)}</td>
                </tr>
                <tr>
                  <td className="py-2 px-2 font-bold text-slate-800">Card Payment</td>
                  <td className="py-2 px-2 text-right text-slate-600">
                    {dayInvoices.filter((i) => (((i.payments && i.payments.card) || 0) + ((i.payments && i.payments.visa) || 0)) > 0).length}
                  </td>
                  <td className="py-2 px-2 text-right font-black text-orange-800 font-mono">{(cardSales || 0).toFixed(3)}</td>
                </tr>
                <tr>
                  <td className="py-2 px-2 font-bold text-slate-800">Online Transfers</td>
                  <td className="py-2 px-2 text-right text-slate-600">
                    {dayInvoices.filter((i) => ((i.payments && i.payments.online) || 0) > 0).length}
                  </td>
                  <td className="py-2 px-2 text-right font-black text-slate-900 font-mono">{(onlineSales || 0).toFixed(3)}</td>
                </tr>
                <tr>
                  <td className="py-2 px-2 font-bold text-slate-800">Bank Cheques</td>
                  <td className="py-2 px-2 text-right text-slate-600">
                    {dayInvoices.filter((i) => ((i.payments && i.payments.cheque) || 0) > 0).length}
                  </td>
                  <td className="py-2 px-2 text-right font-black text-amber-800 font-mono">{(chequeSales || 0).toFixed(3)}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-black text-slate-950 border-t-2 border-slate-400">
                  <td className="py-2 px-2">GRAND TOTAL COLLECTION</td>
                  <td className="py-2 px-2 text-right">{dayInvoices.length}</td>
                  <td className="py-2 px-2 text-right text-sm font-mono text-emerald-700">KWD {(netSales || 0).toFixed(3)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Signatures */}
          <div className="pt-8 grid grid-cols-2 gap-6 text-center text-[10px] text-slate-600">
            <div className="border-t border-slate-400 pt-1">
              <span>Cashier Signature</span>
            </div>
            <div className="border-t border-slate-400 pt-1">
              <span>Manager / Auditor Sign & Verification</span>
            </div>
          </div>

          {/* Time of Print */}
          <div className="text-center pt-4 border-t border-slate-300 mt-6 text-[10px] text-slate-500 font-sans font-medium">
            Time of Print: <strong className="text-slate-800">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</strong> • Settlement Report for: {selectedDate}
          </div>
        </div>
      </div>
    </div>
  );
};
