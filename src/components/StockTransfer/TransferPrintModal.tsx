import React from 'react';
import { StockTransfer } from '../../types';
import { Printer, X, Store } from 'lucide-react';

interface TransferPrintModalProps {
  transfer: StockTransfer;
  onClose: () => void;
}

export const TransferPrintModal: React.FC<TransferPrintModalProps> = ({ transfer, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 overflow-y-auto backdrop-blur-xs">
      <div className="bg-white text-slate-900 rounded-lg shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Actions Bar (No Print) */}
        <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-xs sm:text-sm">Stock Transfer #{transfer.transfer_no}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Transfer Voucher (Matching Video 2 screenshot exactly) */}
        <div className="p-6 overflow-y-auto flex-1 bg-white flex justify-center">
          <div className="w-full max-w-md bg-white border border-slate-300 p-5 rounded text-xs font-sans text-slate-900 shadow-xs">
            {/* Top Store Header */}
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <h1 className="text-xl font-black tracking-tight uppercase text-slate-950">
                  Store Sales
                </h1>
                <p className="text-[11px] font-semibold text-slate-600">Gift-Novelties-Beauty-Salon Items</p>
                <p className="text-[11px] font-semibold text-slate-600">Tel: +965 51311622 / +965 99792824</p>
              </div>
              <div className="text-right flex flex-col items-end">
                <div className="w-10 h-10 bg-slate-900 text-white flex items-center justify-center font-black text-xl rounded shadow-xs">
                  M
                </div>
              </div>
            </div>

            {/* Title & Voucher Meta */}
            <div className="py-2.5 text-center border-b">
              <span className="font-black text-sm uppercase tracking-wider text-slate-900 bg-slate-100 px-3 py-0.5 rounded">
                Stock Transfer
              </span>
            </div>

            <div className="py-2 border-b text-xs space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-black text-rose-600 text-sm">
                  Transfer No: {transfer.transfer_no}
                </span>
                <span className="font-bold text-slate-700">
                  Transfer Date: {transfer.date || new Date(transfer.timestamp).toISOString().split('T')[0]}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 text-[11px]">
                <div>
                  <span className="text-slate-500 font-semibold">From Section: </span>
                  <span className="font-bold text-slate-900">{transfer.from_section}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">To Section: </span>
                  <span className="font-bold text-slate-900">{transfer.to_section}</span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-left my-3 text-xs border-collapse">
              <thead>
                <tr className="border-y border-slate-300 font-black text-slate-800 text-[11px] uppercase bg-slate-50">
                  <th className="py-1.5 px-2 w-8">SN</th>
                  <th className="py-1.5 px-2">Item Name</th>
                  <th className="py-1.5 px-2 text-center w-16">Unit</th>
                  <th className="py-1.5 px-2 text-right w-12">Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {transfer.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-1.5 px-2 text-slate-500 font-bold">{idx + 1}</td>
                    <td className="py-1.5 px-2 text-slate-900 font-semibold">
                      <div>{item.name}</div>
                      {item.barcode && <div className="text-[9px] text-slate-400 font-mono">{item.barcode}</div>}
                    </td>
                    <td className="py-1.5 px-2 text-center font-bold text-purple-800">{item.unit}</td>
                    <td className="py-1.5 px-2 text-right font-black text-slate-950">{item.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total Items Count & Signature */}
            <div className="pt-2 border-t border-slate-300 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700">Total Items: {transfer.items.length}</span>
              <span className="font-bold text-slate-700">
                Total Qty: {transfer.items.reduce((s, i) => s + i.qty, 0)}
              </span>
            </div>

            {transfer.narration && (
              <div className="mt-2 p-1.5 bg-slate-50 border border-slate-200 rounded text-[10px] text-slate-600">
                <span className="font-bold">Narration:</span> {transfer.narration}
              </div>
            )}

            {/* Signatures */}
            <div className="mt-6 pt-4 border-t border-dashed border-slate-300 grid grid-cols-2 gap-4 text-center text-[10px] text-slate-600">
              <div className="border-t border-slate-400 pt-1">
                <span>Dispatched By / Signature</span>
              </div>
              <div className="border-t border-slate-400 pt-1">
                <span>Received By / Branch Stamp</span>
              </div>
            </div>

            {/* Dynamic Time of Print */}
            <div className="text-center pt-3 border-t border-slate-200 mt-4 text-[9px] text-slate-500 font-sans">
              Time of Print: <strong className="text-slate-800">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</strong> • Transfer Date: {transfer.date}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-4 py-2.5 border-t border-slate-200 flex justify-between items-center no-print">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
          >
            CLOSE
          </button>
          <button
            onClick={handlePrint}
            className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Transfer Voucher</span>
          </button>
        </div>
      </div>
    </div>
  );
};
