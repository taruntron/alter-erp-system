import React, { useState } from 'react';
import { Voucher } from '../../types';
import { Printer, X, CheckCircle2 } from 'lucide-react';
import { 
  getInvoicePrintSettings, 
  getEffectiveLogo, 
  getCurrentPrintTimestamp 
} from '../../utils/printSettings';

interface VoucherPrintModalProps {
  voucher: Voucher;
  onClose: () => void;
  branchName?: string;
}

export const VoucherPrintModal: React.FC<VoucherPrintModalProps> = ({
  voucher,
  onClose,
  branchName,
}) => {
  const settings = getInvoicePrintSettings();
  const defaultFmt = (settings.voucherPrintFormat as 'a4' | 'a5' | 'thermal_80mm') || 'a4';
  const [printFormat, setPrintFormat] = useState<'a4' | 'a5' | 'thermal_80mm'>(defaultFmt);
  const [printTime, setPrintTime] = useState<string>(getCurrentPrintTimestamp);

  const effectiveLogo = getEffectiveLogo(settings, branchName);
  const isReceipt = voucher.type === 'receipt';
  const voucherTitle = isReceipt ? 'OFFICIAL RECEIPT VOUCHER' : 'PAYMENT DISBURSEMENT VOUCHER';

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
              Voucher #{voucher.voucher_no} - {voucherTitle}
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
              { id: 'thermal_80mm' as const, label: 'Thermal Slip 80mm' },
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
            <span>Print Voucher</span>
          </button>
        </div>

        {/* Document Preview Body */}
        <div className="p-2 sm:p-6 overflow-auto flex-1 bg-slate-200/60 flex justify-center items-start custom-scrollbar">
          {printFormat === 'thermal_80mm' ? (
            /* Thermal Slip 80mm */
            <div className="w-[320px] bg-white p-4 shadow-xl border border-slate-300 text-slate-950 font-mono text-xs leading-tight paper-thermal-80mm printable-document">
              <div className="text-center pb-3 border-b border-dashed border-slate-400 space-y-1">
                {effectiveLogo && (
                  <div className="flex justify-center mb-1">
                    <img src={effectiveLogo} alt="Logo" className="max-h-12 max-w-[150px] object-contain" />
                  </div>
                )}
                {settings.showBranchHeader && (
                  <div className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded inline-block font-sans font-bold uppercase">
                    Branch: {branchName || 'Main Terminal'}
                  </div>
                )}
                <h2 className="text-base font-black uppercase">{settings.businessName || 'SEENU CARE CO.'}</h2>
                <p className="text-[10px] text-purple-700 font-bold uppercase tracking-wider">{voucherTitle}</p>
                {settings.phone && <p className="text-[10px] text-slate-500">Tel: {settings.phone}</p>}
              </div>

              <div className="py-2 border-b border-dashed border-slate-400 text-[11px] space-y-1">
                <div className="flex justify-between font-bold">
                  <span>VOUCHER #:</span>
                  <span>{voucher.voucher_no}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{voucher.date}</span>
                </div>
                <div className="flex justify-between">
                  <span>Party:</span>
                  <span className="truncate max-w-[170px] font-bold">{voucher.party_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Mode:</span>
                  <span className="uppercase font-semibold">{voucher.payment_mode || voucher.payment_method || 'CASH'}</span>
                </div>
                {voucher.reference_no && (
                  <div className="flex justify-between">
                    <span>Ref / Cheque #:</span>
                    <span>{voucher.reference_no}</span>
                  </div>
                )}
                {voucher.account_head && (
                  <div className="flex justify-between">
                    <span>Account:</span>
                    <span>{voucher.account_head}</span>
                  </div>
                )}
              </div>

              <div className="py-3 border-b border-dashed border-slate-400 space-y-1">
                <div className="flex justify-between text-sm font-black pt-1">
                  <span>AMOUNT SETTLED:</span>
                  <span className="text-emerald-700">KWD {(voucher.amount || 0).toFixed(3)}</span>
                </div>
              </div>

              {voucher.narration && (
                <div className="py-2 border-b border-dashed border-slate-300 text-[10px] text-slate-600">
                  <span className="font-bold">Narration:</span> {voucher.narration}
                </div>
              )}

              <div className="pt-4 grid grid-cols-2 gap-4 text-center text-[9px] text-slate-600">
                <div className="border-t border-slate-400 pt-1">Prepared By</div>
                <div className="border-t border-slate-400 pt-1">Authorized Sign</div>
              </div>

              {/* Dynamic Time of Print */}
              <div className="text-center pt-3 border-t border-slate-300 mt-4 text-[9px] text-slate-600 font-sans font-semibold">
                Time of Print: <span className="text-slate-950 font-bold">{printTime}</span>
              </div>
            </div>
          ) : (
            /* A4 / A5 Voucher Sheet */
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
                        Branch: {branchName || 'Main Terminal'}
                      </div>
                    )}
                    {settings.tagline && <p className="text-xs text-slate-600 mt-0.5">{settings.tagline}</p>}
                    {settings.address && <p className="text-xs text-slate-500">{settings.address}</p>}
                    {settings.phone && <p className="text-xs text-slate-500">Tel: {settings.phone}</p>}
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-xs uppercase font-black tracking-wider px-2.5 py-1 rounded ${
                    isReceipt ? 'text-emerald-800 bg-emerald-100' : 'text-blue-800 bg-blue-100'
                  }`}>
                    {voucherTitle}
                  </span>
                  <div className="text-xl font-black text-rose-600 mt-1 font-mono">
                    #{voucher.voucher_no}
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Voucher Date: {voucher.date}
                  </div>
                </div>
              </div>

              {/* Voucher Details Grid */}
              <div className="my-6 bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Party / Payee / Beneficiary</span>
                    <div className="text-base font-black text-slate-900 mt-0.5">{voucher.party_name}</div>
                    <div className="text-xs text-slate-500 uppercase font-semibold">Category: {voucher.party_type || 'General'}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Amount Settled</span>
                    <div className="text-2xl font-black text-emerald-700 font-mono mt-0.5">
                      KWD {(voucher.amount || 0).toFixed(3)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 font-semibold block">Payment Mode</span>
                    <span className="font-bold text-slate-800 uppercase">{voucher.payment_mode || voucher.payment_method || 'Cash'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block">Reference / Cheque #</span>
                    <span className="font-mono font-bold text-slate-800">{voucher.reference_no || voucher.cheque_no || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block">Account Head</span>
                    <span className="font-bold text-slate-800">{voucher.account_head || 'Main Ledger'}</span>
                  </div>
                </div>

                {voucher.narration && (
                  <div className="pt-3 border-t border-slate-200 text-xs">
                    <span className="text-slate-500 font-semibold block">Description & Particulars:</span>
                    <div className="text-slate-800 font-medium italic mt-0.5">{voucher.narration}</div>
                  </div>
                )}
              </div>

              {/* Signatures Area */}
              <div className="pt-8 grid grid-cols-3 gap-8 text-center text-xs text-slate-600">
                <div className="border-t-2 border-slate-300 pt-2">
                  <span className="font-bold">Prepared By</span>
                  <div className="text-[10px] text-slate-400 mt-0.5">{voucher.created_by || 'Admin'}</div>
                </div>
                <div className="border-t-2 border-slate-300 pt-2">
                  <span className="font-bold">Audited & Verified</span>
                  <div className="text-[10px] text-slate-400 mt-0.5">Accounts Department</div>
                </div>
                <div className="border-t-2 border-slate-300 pt-2">
                  <span className="font-bold">Receiver Signature</span>
                  <div className="text-[10px] text-slate-400 mt-0.5">Acknowledged in Good Faith</div>
                </div>
              </div>

              {/* DYNAMIC TIME OF PRINT */}
              <div className="text-center pt-6 border-t border-slate-300 mt-8 text-[10px] text-slate-500 font-medium">
                Time of Print: <strong className="text-slate-800">{printTime}</strong> • Voucher Date: {voucher.date}
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
            <span>Print Voucher</span>
          </button>
        </div>
      </div>
    </div>
  );
};
