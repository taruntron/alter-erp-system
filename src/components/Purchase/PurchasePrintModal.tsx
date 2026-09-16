import React, { useState } from 'react';
import { PurchaseInvoice, PurchaseOrder } from '../../types';
import { Printer, X, CheckCircle2 } from 'lucide-react';
import { 
  getInvoicePrintSettings, 
  getEffectiveLogo, 
  getCurrentPrintTimestamp,
  PaperPrintFormat 
} from '../../utils/printSettings';

interface PurchasePrintModalProps {
  document: PurchaseInvoice | PurchaseOrder;
  type: 'purchase_invoice' | 'purchase_order';
  onClose: () => void;
  initialFormat?: 'a4' | 'a5' | 'thermal_80mm';
}

export const PurchasePrintModal: React.FC<PurchasePrintModalProps> = ({
  document: doc,
  type,
  onClose,
  initialFormat,
}) => {
  const settings = getInvoicePrintSettings();
  const defaultFmt = initialFormat || (settings.purchasePrintFormat as 'a4' | 'a5' | 'thermal_80mm') || 'a4';
  const [printFormat, setPrintFormat] = useState<'a4' | 'a5' | 'thermal_80mm'>(defaultFmt);
  const [printTime, setPrintTime] = useState<string>(getCurrentPrintTimestamp);

  const effectiveLogo = getEffectiveLogo(settings, doc.section);

  const isPO = type === 'purchase_order';
  const docNumber = isPO ? (doc as PurchaseOrder).po_no : ((doc as PurchaseInvoice).purchase_no || (doc as PurchaseInvoice).id);
  const docTitle = isPO ? 'PURCHASE ORDER' : 'PURCHASE INVOICE';
  const totalAmount = isPO ? (doc as PurchaseOrder).estimated_total : ((doc as PurchaseInvoice).total_amount || (doc as PurchaseInvoice).total || 0);

  const handlePrint = () => {
    setPrintTime(getCurrentPrintTimestamp());
    setTimeout(() => {
      window.print();
    }, 50);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-2 sm:p-4 overflow-y-auto backdrop-blur-xs">
      <div className="bg-white text-slate-900 rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 no-print">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm sm:text-base">
              {docTitle} #{docNumber}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Paper Format Selector Bar */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 no-print">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <span className="mr-1 text-slate-500 font-bold">Paper Format:</span>
            {[
              { id: 'a4' as const, label: 'Standard A4' },
              { id: 'a5' as const, label: 'Half Sheet A5' },
              { id: 'thermal_80mm' as const, label: 'Thermal Roll 80mm' },
            ].map((fmt) => (
              <button
                key={fmt.id}
                type="button"
                onClick={() => setPrintFormat(fmt.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  printFormat === fmt.id
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                }`}
              >
                {fmt.label}
              </button>
            ))}
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-lg font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print {docTitle}</span>
          </button>
        </div>

        {/* Document Preview Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-200/60 flex justify-center items-start">
          {printFormat === 'thermal_80mm' ? (
            /* Thermal 80mm Layout */
            <div className="w-[320px] bg-white p-4 shadow-xl border border-slate-300 text-slate-950 font-mono text-xs leading-tight paper-thermal-80mm printable-document">
              {/* Header */}
              <div className="text-center pb-3 border-b border-dashed border-slate-400 space-y-1">
                {effectiveLogo && (
                  <div className="flex justify-center mb-1">
                    <img src={effectiveLogo} alt="Logo" className="max-h-12 max-w-[150px] object-contain" />
                  </div>
                )}
                {settings.showBranchHeader && (
                  <div className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded inline-block font-sans font-bold uppercase">
                    Branch: {doc.section || 'Store Sales'}
                  </div>
                )}
                <h2 className="text-base font-black uppercase">{settings.businessName || 'SEENU CARE CO.'}</h2>
                <p className="text-[10px] text-purple-700 font-bold uppercase tracking-wider">{docTitle}</p>
                {settings.phone && <p className="text-[10px] text-slate-500">Tel: {settings.phone}</p>}
              </div>

              {/* Meta */}
              <div className="py-2 border-b border-dashed border-slate-400 text-[11px] space-y-0.5">
                <div className="flex justify-between font-bold">
                  <span>REF #:</span>
                  <span>{docNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{doc.date || new Date().toISOString().slice(0, 10)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Supplier:</span>
                  <span className="truncate max-w-[170px] font-bold">{doc.supplier_name}</span>
                </div>
              </div>

              {/* Items - Item name, quantity, UOM (Pcs, Dzn etc), Unit Price, Total price amount */}
              <div className="py-2 border-b border-dashed border-slate-400">
                <div className="grid grid-cols-12 font-bold pb-1 text-[10px] border-b border-slate-300">
                  <span className="col-span-5">Item</span>
                  <span className="col-span-2 text-center">Qty</span>
                  <span className="col-span-2 text-center">UOM</span>
                  <span className="col-span-1 text-right">Cost</span>
                  <span className="col-span-2 text-right">Total</span>
                </div>
                <div className="divide-y divide-slate-100 py-1">
                  {(doc.items || []).map((item, idx) => (
                    <div key={idx} className="py-1 text-[10px]">
                      <div className="font-semibold text-slate-900 truncate">{item.name}</div>
                      <div className="grid grid-cols-12 text-slate-700 items-center">
                        <span className="col-span-5 text-[9px] text-slate-400 truncate">
                          {item.sku || ''}
                        </span>
                        <span className="col-span-2 text-center font-bold">{item.qty || 1}</span>
                        <span className="col-span-2 text-center text-purple-800 font-semibold">{item.unit || 'Pcs'}</span>
                        <span className="col-span-1 text-right">{(item.cost || 0).toFixed(3)}</span>
                        <span className="col-span-2 text-right font-bold text-slate-950">
                          {(item.total || 0).toFixed(3)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-xs">
                <div className="flex justify-between text-sm font-black pt-1 border-t border-slate-800">
                  <span>TOTAL AMOUNT:</span>
                  <span>KWD {(totalAmount || 0).toFixed(3)}</span>
                </div>
              </div>

              {/* Dynamic Time of Print */}
              <div className="text-center pt-3 border-t border-slate-300 mt-3 text-[9px] text-slate-600 font-sans font-semibold">
                Time of Print: <span className="text-slate-950 font-bold">{printTime}</span>
              </div>
            </div>
          ) : (
            /* A4 / A5 Sheet Layout */
            <div 
              className={`bg-white shadow-xl border border-slate-300 text-slate-900 rounded-lg printable-document ${
                printFormat === 'a5' 
                  ? 'w-full max-w-[560px] p-4 text-xs paper-a5' 
                  : 'w-full max-w-[760px] p-6 text-xs paper-a4'
              }`}
            >
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-300 pb-4">
                <div className="flex items-start gap-4">
                  {effectiveLogo && (
                    <img src={effectiveLogo} alt="Logo" className="max-h-16 max-w-[140px] object-contain rounded" />
                  )}
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                      {settings.businessName || 'SEENU CARE CO.'}
                    </h1>
                    {settings.showBranchHeader && (
                      <div className="text-xs font-bold text-purple-700 uppercase">
                        Branch: {doc.section || 'Store Sales'}
                      </div>
                    )}
                    {settings.tagline && <p className="text-xs text-slate-600 mt-0.5">{settings.tagline}</p>}
                    {settings.address && <p className="text-xs text-slate-500">{settings.address}</p>}
                    {settings.phone && <p className="text-xs text-slate-500">Tel: {settings.phone}</p>}
                    {settings.taxNumber && <p className="text-xs font-bold text-slate-700">TRN/VAT: {settings.taxNumber}</p>}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs uppercase font-black tracking-wider text-purple-800 bg-purple-100 px-2.5 py-1 rounded">
                    {docTitle}
                  </span>
                  <div className="text-xl font-black text-rose-600 mt-1 font-mono">
                    #{docNumber}
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Doc Date: {doc.date || new Date().toISOString().slice(0, 10)}
                  </div>
                  {isPO && (doc as PurchaseOrder).expected_delivery_date && (
                    <div className="text-[11px] text-amber-700 font-semibold">
                      Expected Delivery: {(doc as PurchaseOrder).expected_delivery_date}
                    </div>
                  )}
                </div>
              </div>

              {/* Supplier Info */}
              <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 text-xs">
                <div>
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Vendor / Supplier:</span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{doc.supplier_name}</div>
                  {doc.supplier_phone && <div className="text-slate-600">Tel: {doc.supplier_phone}</div>}
                  {!(isPO) && (doc as PurchaseInvoice).supplier_invoice_no && (
                    <div className="text-slate-600">Supplier Bill Ref: {(doc as PurchaseInvoice).supplier_invoice_no}</div>
                  )}
                </div>
                <div className="text-right space-y-0.5">
                  <div><span className="font-semibold text-slate-500">Created By:</span> <span className="font-bold text-slate-800">{doc.created_by || 'Admin'}</span></div>
                  <div><span className="font-semibold text-slate-500">Status:</span> <span className="font-bold text-emerald-700 uppercase bg-emerald-50 px-1.5 py-0.5 rounded">{doc.status}</span></div>
                </div>
              </div>

              {/* Items Table - Item name, quantity, UOM (Pcs, Dzn etc), Unit Price, Total price amount */}
              <table className="w-full text-left my-4 text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 uppercase font-bold border-y border-slate-300">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-center">UOM</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Total Price Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(doc.items || []).map((it, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-slate-400">{i + 1}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{it.name}</div>
                        {it.sku && <div className="text-[10px] text-slate-400 font-mono">SKU: {it.sku}</div>}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900">{it.qty || 1}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-purple-700 bg-purple-50/60 rounded">
                        {it.unit || 'Pcs'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium">
                        {(it.cost || 0).toFixed(3)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-950 font-mono">
                        {(it.total || 0).toFixed(3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Bottom Totals */}
              <div className="flex justify-between items-start pt-3 border-t border-slate-300">
                <div className="space-y-1 text-xs text-slate-500 max-w-sm">
                  {doc.narration && (
                    <div>
                      <span className="font-bold text-slate-700">Remarks / Notes:</span> {doc.narration}
                    </div>
                  )}
                  <div>Authorized signature verified for warehouse receipt.</div>
                </div>

                <div className="w-72 space-y-1.5 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-semibold">KWD {(doc.subtotal || 0).toFixed(3)}</span>
                  </div>
                  {(doc.discount || 0) > 0 && (
                    <div className="flex justify-between text-rose-600 font-semibold">
                      <span>Discount:</span>
                      <span className="font-mono">-KWD {(doc.discount || 0).toFixed(3)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-slate-950 pt-2 border-t border-slate-300">
                    <span>Total Amount:</span>
                    <span className="text-rose-600 font-mono">KWD {(totalAmount || 0).toFixed(3)}</span>
                  </div>
                </div>
              </div>

              {/* DYNAMIC TIME OF PRINT */}
              <div className="text-center pt-4 border-t border-slate-300 mt-6 text-[10px] text-slate-500 font-medium">
                Time of Print: <strong className="text-slate-800">{printTime}</strong> • Document created on: {doc.date}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-4 py-3 border-t border-slate-200 flex justify-end gap-2 no-print">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-lg font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print {docTitle}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
