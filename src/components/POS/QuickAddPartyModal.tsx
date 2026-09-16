import React, { useState } from 'react';
import { Customer } from '../../types';
import { 
  X, 
  UserPlus, 
  Building2, 
  Phone, 
  MapPin, 
  FileText, 
  CreditCard, 
  Sparkles, 
  Check, 
  Hash,
  Scissors
} from 'lucide-react';

interface QuickAddPartyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerAdded: (customer: Customer) => void;
  initialQuery?: string;
}

export const QuickAddPartyModal: React.FC<QuickAddPartyModalProps> = ({
  isOpen,
  onClose,
  onCustomerAdded,
  initialQuery = '',
}) => {
  // Generate random customer code
  const generateCode = () => `CUST-${Math.floor(1000 + Math.random() * 9000)}`;

  const [name, setName] = useState(initialQuery);
  const [firmName, setFirmName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [civilIdOrLicense, setCivilIdOrLicense] = useState('');
  const [notes, setNotes] = useState('');
  const [code, setCode] = useState(generateCode());
  const [partyType, setPartyType] = useState<'regular' | 'spa' | 'salon' | 'corporate'>('salon');
  const [dueBalance, setDueBalance] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Party / Customer Name is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const newCustomerData: Omit<Customer, 'id'> = {
        name: name.trim(),
        firm_name: firmName.trim() || undefined,
        phone: phone.trim() || '00000000',
        location: location.trim() || undefined,
        address: location.trim() || undefined,
        civil_id_or_license: civilIdOrLicense.trim() || undefined,
        notes: notes.trim() || undefined,
        code: code.trim() || generateCode(),
        due_balance: Number(dueBalance) || 0,
        type: partyType,
      };

      // Let parent context add to store and receive the created customer
      // We also pass the data object
      const fullCustomer: Customer = {
        ...newCustomerData,
        id: `cust-${Date.now()}`,
      };

      onCustomerAdded(fullCustomer);
      onClose();
    } catch (err) {
      console.error('Error adding customer:', err);
      setErrorMsg('Failed to save party. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div 
        className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Quick Add Party / Customer
                <span className="text-[10px] font-semibold bg-purple-900/60 text-purple-300 px-2 py-0.5 rounded-full border border-purple-700/50">
                  Salon & Spa Registry
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">Add a new party profile directly to current bill</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="bg-rose-950/80 border border-rose-800 text-rose-300 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2">
              <X className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Party Name & Firm Name (2-Col Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Party&apos;s Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ahmed Al-Mutawa / Tarun"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium placeholder:text-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-purple-400" />
                Firm / Salon / Spa Name
              </label>
              <input
                type="text"
                value={firmName}
                onChange={(e) => setFirmName(e.target.value)}
                placeholder="e.g. Glow Beauty Lounge & Spa"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium placeholder:text-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-xs"
              />
            </div>
          </div>

          {/* Party Number & Party Location (2-Col Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                Party&apos;s Phone / Mobile Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 99792824 or +965 55978538"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium placeholder:text-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                Party&apos;s Location / Address
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Salmiya, Block 4, Salem Al Mubarak St"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium placeholder:text-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-xs"
              />
            </div>
          </div>

          {/* Civil ID / License Number & Party Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                Civil ID or Trade License ID Number
              </label>
              <input
                type="text"
                value={civilIdOrLicense}
                onChange={(e) => setCivilIdOrLicense(e.target.value)}
                placeholder="e.g. 294081503819 / CR-849204"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium placeholder:text-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-slate-400" />
                  Party Code / ID
                </span>
                <button
                  type="button"
                  onClick={() => setCode(generateCode())}
                  className="text-[10px] text-purple-400 hover:underline cursor-pointer"
                >
                  Regenerate
                </button>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:border-purple-500 outline-none text-xs"
              />
            </div>
          </div>

          {/* Party Type & Opening Due Balance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1">
                <Scissors className="w-3.5 h-3.5 text-pink-400" />
                Party Classification / Type
              </label>
              <div className="grid grid-cols-4 gap-1">
                {(['salon', 'spa', 'corporate', 'regular'] as const).map((type) => (
                  <button
                    type="button"
                    key={type}
                    onClick={() => setPartyType(type)}
                    className={`py-1.5 px-1 rounded-md text-[11px] font-bold uppercase transition-colors text-center border ${
                      partyType === type
                        ? 'bg-purple-600 text-white border-purple-400 shadow-xs'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Opening Due Balance (KWD)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={dueBalance}
                onChange={(e) => setDueBalance(parseFloat(e.target.value) || 0)}
                placeholder="0.000"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-purple-500 outline-none text-xs"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Notes & Commercial Remarks
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. VIP client, preferred payment via K-Net, deliveries to branch manager..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium placeholder:text-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-xs resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-900/30 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save & Select Party'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
