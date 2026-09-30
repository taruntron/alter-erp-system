import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Receipt, 
  Banknote, 
  CreditCard, 
  CheckCircle, 
  Printer, 
  User, 
  Building, 
  FileText,
  Calendar,
  Search
} from 'lucide-react';
import { Voucher } from '../../types';
import { VoucherPrintModal } from './VoucherPrintModal';

interface VoucherViewProps {
  defaultType?: 'payment' | 'receipt';
}

export const VoucherView: React.FC<VoucherViewProps> = ({ defaultType = 'payment' }) => {
  const { customers, suppliers, vouchers, createVoucher } = useStore();
  const { user } = useAuth();

  const [voucherType, setVoucherType] = useState<'payment' | 'receipt'>(defaultType);
  const [partyType, setPartyType] = useState<'customer' | 'supplier'>(
    defaultType === 'payment' ? 'supplier' : 'customer'
  );

  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [partyName, setPartyName] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'cash' | 'bank_transfer' | 'cheque' | 'card'>('cash');
  const [referenceNo, setReferenceNo] = useState('');
  const [narration, setNarration] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [viewingVoucher, setViewingVoucher] = useState<Voucher | null>(null);

  const handleSelectParty = (id: string) => {
    setSelectedPartyId(id);
    if (partyType === 'customer') {
      const c = customers.find((cust) => cust.id === id);
      if (c) {
        setPartyName(c.name);
        setAmount(c.due_balance > 0 ? c.due_balance : 0);
      }
    } else {
      const s = suppliers.find((supp) => supp.id === id);
      if (s) {
        setPartyName(s.name);
        setAmount(s.due_balance > 0 ? s.due_balance : 0);
      }
    }
  };

  const handleSaveVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyName || amount <= 0) return;

    setIsSubmitting(true);
    try {
      const created = await createVoucher({
        type: voucherType,
        party_type: partyType,
        party_id: selectedPartyId || undefined,
        party_name: partyName,
        amount,
        payment_mode: paymentMode,
        reference_no: referenceNo || undefined,
        narration: narration || undefined,
        created_by: user?.displayName || 'Admin',
      });

      setToastMsg(`${voucherType === 'payment' ? 'Payment' : 'Receipt'} Voucher ${created.voucher_no} posted!`);
      setViewingVoucher(created);
      setSelectedPartyId('');
      setPartyName('');
      setAmount(0);
      setReferenceNo('');
      setNarration('');
      setTimeout(() => setToastMsg(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredVouchers = vouchers.filter((v) => v.type === voucherType);

  return (
    <div className="h-full overflow-y-auto bg-slate-950 text-slate-100 p-3 sm:p-4 space-y-4 custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-purple-400" />
            Financial Voucher Entry & Settlement
          </h2>
          <p className="text-xs text-slate-400">
            Issue Payment Vouchers (PV) to Vendors or Receipt Vouchers (RV) from Customers with instant ledger posting
          </p>
        </div>

        {/* Voucher Type Selector */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => {
              setVoucherType('payment');
              setPartyType('supplier');
              setSelectedPartyId('');
              setPartyName('');
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-1.5 transition-colors ${
              voucherType === 'payment' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" /> 1. Payment Voucher (PV)
          </button>
          <button
            onClick={() => {
              setVoucherType('receipt');
              setPartyType('customer');
              setSelectedPartyId('');
              setPartyName('');
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-1.5 transition-colors ${
              voucherType === 'receipt' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Banknote className="w-3.5 h-3.5" /> 2. Receipt Voucher (RV)
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="bg-emerald-500/20 border border-emerald-500 text-emerald-300 text-xs px-3.5 py-2 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {toastMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Entry Form */}
        <form onSubmit={handleSaveVoucher} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center justify-between">
            <span>Create {voucherType === 'payment' ? 'Payment' : 'Receipt'} Voucher</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-black ${
              voucherType === 'payment' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
            }`}>
              {voucherType === 'payment' ? 'DEBIT VOUCHER' : 'CREDIT VOUCHER'}
            </span>
          </div>

          {/* Party Selection */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-slate-400 block">
              {voucherType === 'payment' ? 'Pay To (Supplier / Beneficiary) *' : 'Received From (Customer / Client) *'}
            </label>
            <select
              value={selectedPartyId}
              onChange={(e) => handleSelectParty(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded px-2.5 py-2 outline-none focus:border-purple-500 font-bold"
            >
              <option value="">-- Choose Party --</option>
              {partyType === 'customer'
                ? customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Due: KWD {(c.due_balance || 0).toFixed(3)})
                    </option>
                  ))
                : suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Payable: KWD {(s.due_balance || 0).toFixed(3)})
                    </option>
                  ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Voucher Amount (KWD) *
            </label>
            <input
              type="number"
              required
              step="0.001"
              min="0.001"
              value={amount || ''}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              placeholder="0.000"
              className="w-full bg-slate-950 border border-slate-700 text-lg font-mono font-black text-emerald-400 rounded px-3 py-2 outline-none focus:border-purple-500"
            />
          </div>

          {/* Payment Mode */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">
              Payment Instrument / Mode
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPaymentMode('cash')}
                className={`py-1.5 px-2 rounded font-bold border transition-colors ${
                  paymentMode === 'cash'
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              >
                Cash
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode('bank_transfer')}
                className={`py-1.5 px-2 rounded font-bold border transition-colors ${
                  paymentMode === 'bank_transfer'
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              >
                Bank Transfer
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode('card')}
                className={`py-1.5 px-2 rounded font-bold border transition-colors ${
                  paymentMode === 'card'
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              >
                K-Net / Card
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode('cheque')}
                className={`py-1.5 px-2 rounded font-bold border transition-colors ${
                  paymentMode === 'cheque'
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              >
                Cheque
              </button>
            </div>
          </div>

          {/* Reference No */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Transaction / Cheque / Slip #
            </label>
            <input
              type="text"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder="e.g. TXN-890281 or Cheque #00451"
              className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded px-2.5 py-1.5 outline-none focus:border-purple-500 font-mono"
            />
          </div>

          {/* Narration */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Narration / Ledger Description
            </label>
            <textarea
              rows={2}
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              placeholder="Settlement of invoice dues..."
              className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded p-2 outline-none focus:border-purple-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || amount <= 0 || !partyName}
            className={`w-full text-white font-black text-xs py-2.5 rounded-lg shadow-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              voucherType === 'payment'
                ? 'bg-rose-600 hover:bg-rose-500'
                : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            <Printer className="w-4 h-4" />
            {isSubmitting ? 'Posting...' : `Post & Print ${voucherType === 'payment' ? 'Payment' : 'Receipt'} Voucher (80mm / A4)`}
          </button>
        </form>

        {/* Voucher History Table (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {voucherType === 'payment' ? 'Payment' : 'Receipt'} Vouchers Register ({filteredVouchers.length})
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold">
                    <th className="py-2.5 px-3">Voucher #</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Party Name</th>
                    <th className="py-2.5 px-2">Mode</th>
                    <th className="py-2.5 px-3 text-right">Amount (KWD)</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredVouchers.map((vouch) => (
                    <tr key={vouch.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono font-bold text-purple-300">{vouch.voucher_no}</td>
                      <td className="py-2.5 px-3 text-slate-300 font-mono">{vouch.date}</td>
                      <td className="py-2.5 px-3 font-medium text-white">{vouch.party_name}</td>
                      <td className="py-2.5 px-2 uppercase font-mono text-[10px] text-slate-400">{vouch.payment_mode}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                        {(vouch.amount || 0).toFixed(3)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => setViewingVoucher(vouch)}
                          className="bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs px-2.5 py-1 rounded font-bold transition-colors"
                        >
                          Print Slip
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Multi-Format Voucher Slip Modal (A4, A5, 80mm) */}
      {viewingVoucher && (
        <VoucherPrintModal
          voucher={viewingVoucher}
          onClose={() => setViewingVoucher(null)}
        />
      )}
    </div>
  );
};
