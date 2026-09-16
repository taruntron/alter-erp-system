import React, { useState } from 'react';
import { Invoice } from '../../types';
import { Printer, X, CheckCircle2, QrCode as QrCodeIcon } from 'lucide-react';
import { 
  getInvoicePrintSettings, 
  getEffectiveLogo, 
  getCurrentPrintTimestamp,
  PaperPrintFormat 
} from '../../utils/printSettings';

interface InvoicePrintModalProps {
  invoice: Invoice;
  onClose: () => void;
  initialFormat?: PaperPrintFormat | 'thermal';
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({ 
  invoice, 
  onClose,
  initialFormat
}) => {
  const settings = getInvoicePrintSettings();
  
  // Normalize initial format
  const getStartingFormat = (): PaperPrintFormat => {
    if (initialFormat === 'thermal' || initialFormat === 'thermal_80mm') return 'thermal_80mm';
    if (initialFormat === 'a4' || initialFormat === 'a5') return initialFormat;
    return settings.salesPrintFormat || settings.defaultFormat || 'thermal_80mm';
  };

  const [printFormat, setPrintFormat] = useState<PaperPrintFormat>(getStartingFormat);
  const [printTime, setPrintTime] = useState<string>(getCurrentPrintTimestamp);

  const effectiveLogo = getEffectiveLogo(settings, invoice.section);

  const handlePrint = () => {
    setPrintTime(getCurrentPrintTimestamp());
    setTimeout(() => {
      window.print();
    }, 50);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-2 sm:p-4 overflow-y-auto backdrop-blur-xs">
      <div className="bg-white text-slate-900 rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 no-print">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm sm:text-base">
              Invoice #{invoice.invoice_no} Generated
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
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-700">
            <span className="mr-1 text-slate-500 font-bold">Paper Format:</span>
            {[
              { id: 'thermal_80mm' as PaperPrintFormat, label: 'Thermal 80mm' },
              { id: 'a4' as PaperPrintFormat, label: 'Standard A4' },
              { id: 'a5' as PaperPrintFormat, label: 'Half Sheet A5' },
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
            <span>Print Invoice</span>
          </button>
        </div>

        {/* Invoice Preview Container */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-200/60 flex justify-center items-start">
          {/* 1. THERMAL 80mm */}
          {printFormat === 'thermal_80mm' && (
            <div 
              className="bg-white p-4 shadow-xl border border-slate-300 text-slate-950 font-mono leading-tight printable-document w-[320px] text-xs paper-thermal-80mm"
            >
              {/* Store & Branch Logo / Header */}
              <div className="text-center pb-3 border-b border-dashed border-slate-400 space-y-1">
                {effectiveLogo && (
                  <div className="flex justify-center mb-1">
                    <img 
                      src={effectiveLogo} 
                      alt="Branch Logo" 
                      className="max-h-12 max-w-[150px] object-contain"
                    />
                  </div>
                )}
                {settings.showBranchHeader && (
                  <div className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded inline-block font-sans font-bold uppercase">
                    Branch: {invoice.section || 'Store Sales'}
                  </div>
                )}
                <h2 className="text-base font-black tracking-tight uppercase">
                  {settings.businessName || invoice.section || 'SEENU CARE CO.'}
                </h2>
                {settings.tagline && <p className="text-[10px] text-slate-600">{settings.tagline}</p>}
                {settings.address && <p className="text-[10px] text-slate-500">{settings.address}</p>}
                {settings.phone && <p className="text-[10px] text-slate-500">Tel: {settings.phone}</p>}
                {settings.taxNumber && <p className="text-[10px] font-bold text-slate-700">TRN/VAT: {settings.taxNumber}</p>}
              </div>

              {/* Invoice Meta */}
              <div className="py-2 border-b border-dashed border-slate-400 text-[11px] space-y-0.5">
                <div className="flex justify-between font-bold">
                  <span>INVOICE:</span>
                  <span>{invoice.invoice_no}</span>
                </div>
                <div className="flex justify-between">
                  <span>Invoice Date:</span>
                  <span>{new Date(invoice.timestamp).toLocaleString()}</span>
                </div>
                {settings.showCashierName && (
                  <div className="flex justify-between">
                    <span>Cashier:</span>
                    <span>{invoice.cashier_name}</span>
                  </div>
                )}
                {settings.showCustomerDetails && (
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span className="truncate max-w-[170px] font-semibold">{invoice.customer_name}</span>
                  </div>
                )}
              </div>

              {/* Items Table - Item name, quantity, UOM (Pcs, Dzn etc), Unit Price, Total price amount */}
              <div className="py-2 border-b border-dashed border-slate-400">
                <div className="grid grid-cols-12 font-bold pb-1 text-[10px] border-b border-slate-300">
                  <span className="col-span-5">Item</span>
                  <span className="col-span-2 text-center">Qty</span>
                  <span className="col-span-2 text-center">UOM</span>
                  <span className="col-span-1 text-right">Price</span>
                  <span className="col-span-2 text-right">Total</span>
                </div>
                <div className="divide-y divide-slate-100 py-1">
                  {(invoice.items || []).map((item, idx) => (
                    <div key={idx} className="py-1 text-[10px]">
                      <div className="font-semibold text-slate-900 truncate">{item.name}</div>
                      <div className="grid grid-cols-12 text-slate-700 items-center">
                        <span className="col-span-5 text-[9px] text-slate-400 truncate">
                          {settings.showSku && item.sku ? item.sku : ''}
                        </span>
                        <span className="col-span-2 text-center font-bold">{item.qty || 1}</span>
                        <span className="col-span-2 text-center text-purple-800 font-semibold">{item.unit || 'Pcs'}</span>
                        <span className="col-span-1 text-right">{(item.price || 0).toFixed(3)}</span>
                        <span className="col-span-2 text-right font-bold text-slate-950">
                          {(item.total || 0).toFixed(3)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Totals */}
              <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{(invoice.subtotal || 0).toFixed(3)}</span>
                </div>
                {(invoice.discount || 0) > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Discount:</span>
                    <span>-{(invoice.discount || 0).toFixed(3)}</span>
                  </div>
                )}
                {(invoice.other_amt || 0) !== 0 && (
                  <div className="flex justify-between">
                    <span>Other Amt:</span>
                    <span>{(invoice.other_amt || 0).toFixed(3)}</span>
                  </div>
                )}
                {settings.showTaxColumn && (
                  <div className="flex justify-between text-slate-500">
                    <span>Tax:</span>
                    <span>0.000</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black pt-1 border-t border-slate-800">
                  <span>NET TOTAL:</span>
                  <span>KWD {(invoice.total || 0).toFixed(3)}</span>
                </div>
              </div>

              {/* Payment Allocation Breakdown */}
              {settings.showPaymentBreakdown && (
                <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-0.5">
                  <div className="font-bold text-slate-700">Payment Breakdown:</div>
                  {(invoice.payments?.cash || 0) > 0 && (
                    <div className="flex justify-between">
                      <span>Cash Tendered:</span>
                      <span>{(invoice.payments?.cash || 0).toFixed(3)}</span>
                    </div>
                  )}
                  {(invoice.payments?.knet || 0) > 0 && (
                    <div className="flex justify-between">
                      <span>K-Net:</span>
                      <span>{(invoice.payments?.knet || 0).toFixed(3)}</span>
                    </div>
                  )}
                  {(invoice.payments?.card || 0) > 0 && (
                    <div className="flex justify-between">
                      <span>Card:</span>
                      <span>{(invoice.payments?.card || 0).toFixed(3)}</span>
                    </div>
                  )}
                  {(invoice.payments?.online || 0) > 0 && (
                    <div className="flex justify-between">
                      <span>Online Transfer:</span>
                      <span>{(invoice.payments?.online || 0).toFixed(3)}</span>
                    </div>
                  )}
                  {((invoice.credit_amount || 0) > 0 || (invoice.due_amount || 0) > 0) && (
                    <div className="flex justify-between font-bold text-amber-800">
                      <span>Party Due / Credit:</span>
                      <span>{(invoice.credit_amount || invoice.due_amount || 0).toFixed(3)}</span>
                    </div>
                  )}
                  {(invoice.return_amt || 0) > 0 && (
                    <div className="flex justify-between font-bold text-emerald-700 pt-0.5">
                      <span>Change / Return:</span>
                      <span>{(invoice.return_amt || 0).toFixed(3)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* QR Code (Custom Image or Auto QR) */}
              {settings.showQrCode && (
                <div className="py-3 text-center flex flex-col items-center justify-center space-y-1">
                  {settings.qrCodeImage ? (
                    <img 
                      src={settings.qrCodeImage} 
                      alt="Payment QR" 
                      className="w-20 h-20 object-contain mx-auto"
                    />
                  ) : (
                    <div className="p-1 border border-slate-300 rounded bg-white">
                      <QrCodeIcon className="w-14 h-14 text-slate-900 mx-auto" />
                    </div>
                  )}
                  <span className="text-[8px] text-slate-500 font-sans">E-Invoice Scannable Code</span>
                </div>
              )}

              {/* Footer Note & Terms */}
              <div className="text-center pt-2 text-[10px] text-slate-500 space-y-1">
                {settings.termsAndConditions && <p>{settings.termsAndConditions}</p>}
                {settings.footerNote && <p className="font-bold text-slate-700">{settings.footerNote}</p>}
                {invoice.narration && (
                  <p className="italic text-slate-600">Note: {invoice.narration}</p>
                )}
              </div>

              {/* DYNAMIC TIME OF PRINT */}
              <div className="text-center pt-3 border-t border-slate-300 mt-3 text-[9px] text-slate-600 font-sans font-semibold">
                Time of Print: <span className="text-slate-950 font-bold">{printTime}</span>
              </div>
            </div>
          )}

          {/* 2. SHEET FORMATS (A4, A5) */}
          {(printFormat === 'a4' || printFormat === 'a5') && (
            <div 
              className={`bg-white shadow-xl border border-slate-300 text-slate-900 rounded-lg printable-document ${
                printFormat === 'a5' 
                  ? 'w-full max-w-[560px] p-4 text-xs paper-a5' 
                  : 'w-full max-w-[760px] p-6 text-xs paper-a4'
              }`}
            >
              {/* Header with Branch Logo & Business Info */}
              <div className="flex justify-between items-start border-b border-slate-300 pb-4">
                <div className="flex items-start gap-4">
                  {effectiveLogo && (
                    <img 
                      src={effectiveLogo} 
                      alt="Branch Logo" 
                      className="max-h-16 max-w-[140px] object-contain rounded"
                    />
                  )}
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                      {settings.businessName || invoice.section || 'SEENU CARE CO.'}
                    </h1>
                    {settings.showBranchHeader && (
                      <div className="text-xs font-bold text-purple-700 uppercase">
                        Branch: {invoice.section || 'Store Sales'}
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
                    TAX-FREE SALES INVOICE
                  </span>
                  <div className="text-xl font-black text-rose-600 mt-1 font-mono">
                    #{invoice.invoice_no}
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Invoice Date: {new Date(invoice.timestamp).toLocaleDateString()}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Time: {new Date(invoice.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {/* Customer & Cashier Section */}
              <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 text-xs">
                <div>
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Billed To:</span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{invoice.customer_name}</div>
                  {invoice.customer_phone && (
                    <div className="text-slate-600">Tel: {invoice.customer_phone}</div>
                  )}
                </div>
                <div className="text-right space-y-0.5">
                  <div><span className="font-semibold text-slate-500">Cashier:</span> <span className="font-bold text-slate-800">{invoice.cashier_name}</span></div>
                  <div><span className="font-semibold text-slate-500">Payment Status:</span> <span className="font-bold text-emerald-700 uppercase bg-emerald-50 px-1.5 py-0.5 rounded">{invoice.status}</span></div>
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
                    <th className="py-2.5 px-3 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(invoice.items || []).map((it, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-slate-400">{i + 1}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{it.name}</div>
                        {settings.showSku && it.sku && (
                          <div className="text-[10px] text-slate-400 font-mono">SKU: {it.sku}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900">{it.qty || 1}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-purple-700 bg-purple-50/60 rounded">
                        {it.unit || 'Pcs'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium">
                        {(it.price || 0).toFixed(3)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-950 font-mono">
                        {(it.total || 0).toFixed(3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Bottom Section: QR & Financial Totals */}
              <div className="grid grid-cols-2 gap-6 pt-3 border-t border-slate-300">
                {/* QR Code & Notes */}
                <div className="space-y-3">
                  {settings.showQrCode && (
                    <div className="flex items-center gap-3">
                      {settings.qrCodeImage ? (
                        <img 
                          src={settings.qrCodeImage} 
                          alt="Custom QR" 
                          className="w-20 h-20 object-contain border border-slate-200 rounded p-1"
                        />
                      ) : (
                        <div className="p-2 border border-slate-300 rounded bg-slate-50">
                          <QrCodeIcon className="w-14 h-14 text-slate-800" />
                        </div>
                      )}
                      <div className="text-[11px] text-slate-600">
                        <div className="font-bold text-slate-800">Verified Invoice</div>
                        <div>Scan to verify transaction</div>
                      </div>
                    </div>
                  )}

                  {settings.termsAndConditions && (
                    <div className="text-[11px] text-slate-500 leading-relaxed">
                      <span className="font-bold text-slate-700 block">Terms & Policy:</span>
                      {settings.termsAndConditions}
                    </div>
                  )}
                  {settings.footerNote && (
                    <div className="text-[11px] font-bold text-slate-700">
                      {settings.footerNote}
                    </div>
                  )}
                </div>

                {/* Totals Summary */}
                <div className="space-y-1.5 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-semibold">KWD {(invoice.subtotal || 0).toFixed(3)}</span>
                  </div>
                  {(invoice.discount || 0) > 0 && (
                    <div className="flex justify-between text-rose-600 font-semibold">
                      <span>Discount:</span>
                      <span className="font-mono">-KWD {(invoice.discount || 0).toFixed(3)}</span>
                    </div>
                  )}
                  {(invoice.other_amt || 0) > 0 && (
                    <div className="flex justify-between text-purple-700">
                      <span>Other Charges:</span>
                      <span className="font-mono">+KWD {(invoice.other_amt || 0).toFixed(3)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-slate-950 pt-2 border-t border-slate-300">
                    <span>Grand Total:</span>
                    <span className="text-rose-600 font-mono">KWD {(invoice.total || 0).toFixed(3)}</span>
                  </div>
                  {((invoice.paid_amount !== undefined && invoice.paid_amount > 0) || (invoice.payments?.cash || 0) > 0 || (invoice.payments?.knet || 0) > 0) && (
                    <div className="flex justify-between text-slate-700 font-semibold pt-1 border-t border-dashed border-slate-300">
                      <span>Paid Amount:</span>
                      <span className="font-mono">KWD {(invoice.paid_amount || (invoice.total - (invoice.due_amount || 0))).toFixed(3)}</span>
                    </div>
                  )}
                  {((invoice.credit_amount || 0) > 0 || (invoice.due_amount || 0) > 0) && (
                    <div className="flex justify-between text-amber-800 font-bold">
                      <span>Credit Amount (Due):</span>
                      <span className="font-mono">KWD {(invoice.credit_amount || invoice.due_amount || 0).toFixed(3)}</span>
                    </div>
                  )}
                  {(invoice.return_amt || 0) > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Change / Return:</span>
                      <span className="font-mono">KWD {(invoice.return_amt || 0).toFixed(3)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* DYNAMIC TIME OF PRINT AT THE BOTTOM */}
              <div className="text-center pt-4 border-t border-slate-300 mt-6 text-[10px] text-slate-500 font-medium">
                Time of Print: <strong className="text-slate-800">{printTime}</strong> • Document created on: {new Date(invoice.timestamp).toLocaleString()}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-4 py-3 border-t border-slate-200 flex justify-end gap-2 no-print">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Done / Close
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-lg font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
