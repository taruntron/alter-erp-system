import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  Users, 
  Building, 
  Search, 
  Plus, 
  Phone, 
  MapPin, 
  Banknote, 
  CheckCircle,
  FileText,
  Edit2,
  PhoneCall,
  ShieldCheck,
  Building2,
  Mail,
  Info
} from 'lucide-react';
import { Customer, Supplier } from '../../types';

export const PartyMasterView: React.FC = () => {
  const { 
    customers, 
    suppliers, 
    addCustomer, 
    updateCustomer, 
    addSupplier, 
    updateSupplier
  } = useStore();

  const [partyType, setPartyType] = useState<'customer' | 'supplier'>('customer');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [firmName, setFirmName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [civilId, setCivilId] = useState('');
  const [category, setCategory] = useState('Salon & Spa');
  const [creditLimit, setCreditLimit] = useState(500);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Edit / Mobile number change modal state
  const [editingParty, setEditingParty] = useState<{
    type: 'customer' | 'supplier';
    id: string;
    code: string;
    name: string;
    firm_name: string;
    phone: string;
    email: string;
    location: string;
    civil_id_or_license: string;
    category: string;
    credit_limit: number;
    notes: string;
  } | null>(null);

  const handleOpenEdit = (type: 'customer' | 'supplier', party: Customer | Supplier) => {
    setEditingParty({
      type,
      id: party.id,
      code: party.code || '',
      name: party.name || '',
      firm_name: party.firm_name || '',
      phone: party.phone || '',
      email: (party as any).email || '',
      location: party.location || party.address || '',
      civil_id_or_license: party.civil_id_or_license || (party as any).civil_id || '',
      category: party.category || (type === 'customer' ? 'Salon & Spa' : 'Wholesale Distributor'),
      credit_limit: (party as any).credit_limit || 0,
      notes: party.notes || ''
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParty || !editingParty.phone.trim() || !editingParty.name.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingParty.type === 'customer') {
        await updateCustomer(editingParty.id, {
          name: editingParty.name.trim(),
          firm_name: editingParty.firm_name.trim() || undefined,
          phone: editingParty.phone.trim(),
          email: editingParty.email.trim() || undefined,
          location: editingParty.location.trim() || undefined,
          address: editingParty.location.trim() || undefined,
          civil_id_or_license: editingParty.civil_id_or_license.trim() || undefined,
          civil_id: editingParty.civil_id_or_license.trim() || undefined,
          category: editingParty.category.trim() || undefined,
          credit_limit: editingParty.credit_limit,
          notes: editingParty.notes.trim() || undefined,
        });
        setToastMsg(`Customer "${editingParty.name}" mobile number and details updated successfully!`);
      } else {
        await updateSupplier(editingParty.id, {
          name: editingParty.name.trim(),
          firm_name: editingParty.firm_name.trim() || undefined,
          phone: editingParty.phone.trim(),
          email: editingParty.email.trim() || undefined,
          location: editingParty.location.trim() || undefined,
          address: editingParty.location.trim() || undefined,
          civil_id_or_license: editingParty.civil_id_or_license.trim() || undefined,
          category: editingParty.category.trim() || undefined,
          notes: editingParty.notes.trim() || undefined,
        });
        setToastMsg(`Supplier "${editingParty.name}" mobile number and details updated successfully!`);
      }
      setEditingParty(null);
      setTimeout(() => setToastMsg(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveParty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    setIsSubmitting(true);
    try {
      if (partyType === 'customer') {
        const nextCode = `CUST-${String(customers.length + 1).padStart(4, '0')}`;
        await addCustomer({
          code: nextCode,
          name: name.trim(),
          firm_name: firmName.trim() || undefined,
          phone: phone.trim(),
          email: email.trim() || undefined,
          location: address.trim() || undefined,
          address: address.trim() || undefined,
          civil_id_or_license: civilId.trim() || undefined,
          civil_id: civilId.trim() || undefined,
          category,
          credit_limit: creditLimit,
          due_balance: 0,
        });
        setToastMsg(`Customer "${name}" created successfully with code ${nextCode}!`);
      } else {
        const nextCode = `SUPP-${String(suppliers.length + 1).padStart(4, '0')}`;
        await addSupplier({
          code: nextCode,
          name: name.trim(),
          firm_name: firmName.trim() || undefined,
          phone: phone.trim(),
          email: email.trim() || undefined,
          location: address.trim() || undefined,
          address: address.trim() || undefined,
          contact_person: name.trim(),
          category,
          due_balance: 0,
        });
        setToastMsg(`Supplier "${name}" created successfully with code ${nextCode}!`);
      }

      setShowAddModal(false);
      setName('');
      setFirmName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setCivilId('');
      setTimeout(() => setToastMsg(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.firm_name && c.firm_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.phone.includes(searchTerm) ||
      (c.code && c.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.category && c.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.location && c.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.firm_name && s.firm_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      s.phone.includes(searchTerm) ||
      (s.code && s.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.category && s.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.location && s.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalCustomerReceivables = customers.reduce((sum, c) => sum + (c.due_balance || 0), 0);
  const totalSupplierPayables = suppliers.reduce((sum, s) => sum + (s.due_balance || 0), 0);

  return (
    <div className="h-[calc(100vh-42px)] overflow-y-auto bg-slate-950 text-slate-100 p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-black text-white tracking-wide">
              Party Master (Customer & Supplier Directory)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete list ledger with client accounts, contact phone numbers, credit limits, and balances
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Switcher Tab */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setPartyType('customer')}
              className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-1.5 transition-colors ${
                partyType === 'customer' 
                  ? 'bg-purple-600 text-white shadow-xs' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Customers ({customers.length})</span>
            </button>
            <button
              onClick={() => setPartyType('supplier')}
              className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-1.5 transition-colors ${
                partyType === 'supplier' 
                  ? 'bg-purple-600 text-white shadow-xs' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Suppliers ({suppliers.length})</span>
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add {partyType === 'customer' ? 'Customer' : 'Supplier'}
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="bg-emerald-500/20 border border-emerald-500/60 text-emerald-300 text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Overview Statistics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {partyType === 'customer' ? 'Total Registered Customers' : 'Total Registered Suppliers'}
            </p>
            <p className="text-xl font-mono font-black text-white mt-0.5">
              {partyType === 'customer' ? customers.length : suppliers.length}
            </p>
          </div>
          <div className="p-2.5 bg-purple-950/60 border border-purple-800/40 text-purple-400 rounded-lg">
            {partyType === 'customer' ? <Users className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {partyType === 'customer' ? 'Total Receivables (Due)' : 'Total Payables (Due)'}
            </p>
            <p className={`text-xl font-mono font-black mt-0.5 ${partyType === 'customer' ? 'text-amber-400' : 'text-rose-400'}`}>
              KWD {(partyType === 'customer' ? totalCustomerReceivables : totalSupplierPayables).toFixed(3)}
            </p>
          </div>
          <div className="p-2.5 bg-amber-950/60 border border-amber-800/40 text-amber-400 rounded-lg">
            <Banknote className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Party Master Security
            </p>
            <p className="text-xs font-semibold text-emerald-400 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Direct Mobile Modification Enabled
            </p>
          </div>
          <div className="p-2.5 bg-slate-800 text-slate-400 rounded-lg">
            <PhoneCall className="w-5 h-5 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={`Search ${partyType === 'customer' ? 'customers by name, salon firm name, phone number, civil id, or location' : 'suppliers by vendor name, phone number, distributor category, or area'}...`}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-purple-500 transition-colors"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-2.5 text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded bg-slate-800"
          >
            Clear
          </button>
        )}
      </div>

      {/* Master List Table Format */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3 w-12 text-center">#</th>
                <th className="py-3 px-3 w-28">Party Code</th>
                <th className="py-3 px-4 min-w-[200px]">
                  {partyType === 'customer' ? 'Customer / Salon Name' : 'Supplier / Vendor Name'}
                </th>
                <th className="py-3 px-3 min-w-[130px]">Category</th>
                <th className="py-3 px-4 min-w-[160px] bg-slate-950/60 text-purple-300">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-purple-400" />
                    <span>Mobile Number</span>
                  </div>
                </th>
                <th className="py-3 px-3 text-right min-w-[120px]">
                  {partyType === 'customer' ? 'Due Balance' : 'Payable Balance'}
                </th>
                {partyType === 'customer' && (
                  <th className="py-3 px-3 text-right min-w-[110px]">Credit Limit</th>
                )}
                <th className="py-3 px-3 min-w-[130px]">
                  {partyType === 'customer' ? 'Civil ID / CR' : 'Contact Person / Email'}
                </th>
                <th className="py-3 px-4 min-w-[160px]">Location / Address</th>
                <th className="py-3 px-3 text-center w-28 sticky right-0 bg-slate-950 border-l border-slate-800">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {partyType === 'customer' ? (
                filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-500">
                      No customer records found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust, idx) => (
                    <tr 
                      key={cust.id} 
                      className="hover:bg-slate-800/50 transition-colors group"
                    >
                      <td className="py-3 px-3 text-center font-mono text-slate-500 text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-purple-400 text-xs">
                        {cust.code || `CUST-${String(idx + 1).padStart(4, '0')}`}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-xs">{cust.name}</div>
                        {cust.firm_name && (
                          <div className="text-[11px] text-slate-400 font-medium">{cust.firm_name}</div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-950/70 text-purple-300 border border-purple-800/50">
                          {cust.category || cust.type || 'Salon & Spa'}
                        </span>
                      </td>
                      {/* Highlighted Mobile Number Column with Quick Click */}
                      <td className="py-3 px-4 bg-slate-950/30">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-emerald-400 text-xs tracking-wide">
                            {cust.phone}
                          </span>
                          <button
                            onClick={() => handleOpenEdit('customer', cust)}
                            title="Edit Mobile Number"
                            className="p-1 rounded bg-slate-800 text-purple-300 hover:bg-purple-600 hover:text-white transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        <span className={`px-2 py-0.5 rounded ${
                          (cust.due_balance || 0) > 0 
                            ? 'bg-amber-950/80 text-amber-400 border border-amber-800/40' 
                            : 'bg-emerald-950/50 text-emerald-400'
                        }`}>
                          KWD {(cust.due_balance || 0).toFixed(3)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300">
                        KWD {(cust.credit_limit || 0).toFixed(3)}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">
                        {cust.civil_id_or_license || cust.civil_id || '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-300 text-[11px] max-w-[200px] truncate" title={cust.location || cust.address}>
                        {cust.location || cust.address || '-'}
                      </td>
                      <td className="py-3 px-3 text-center sticky right-0 bg-slate-900 group-hover:bg-slate-800/90 border-l border-slate-800">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => handleOpenEdit('customer', cust)}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                            title="Edit Customer"
                          >
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )
              ) : (
                filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500">
                      No supplier records found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((supp, idx) => (
                    <tr 
                      key={supp.id} 
                      className="hover:bg-slate-800/50 transition-colors group"
                    >
                      <td className="py-3 px-3 text-center font-mono text-slate-500 text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-blue-400 text-xs">
                        {supp.code || `SUPP-${String(idx + 1).padStart(4, '0')}`}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-xs">{supp.name}</div>
                        {supp.firm_name && (
                          <div className="text-[11px] text-slate-400 font-medium">{supp.firm_name}</div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-950/70 text-blue-300 border border-blue-800/50">
                          {supp.category || 'Distributor'}
                        </span>
                      </td>
                      {/* Highlighted Mobile Number Column with Quick Click */}
                      <td className="py-3 px-4 bg-slate-950/30">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-emerald-400 text-xs tracking-wide">
                            {supp.phone}
                          </span>
                          <button
                            onClick={() => handleOpenEdit('supplier', supp)}
                            title="Edit Mobile Number"
                            className="p-1 rounded bg-slate-800 text-blue-300 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        <span className={`px-2 py-0.5 rounded ${
                          (supp.due_balance || 0) > 0 
                            ? 'bg-rose-950/80 text-rose-400 border border-rose-800/40' 
                            : 'bg-emerald-950/50 text-emerald-400'
                        }`}>
                          KWD {(supp.due_balance || 0).toFixed(3)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[11px]">
                        <div>{supp.contact_person || '-'}</div>
                        {supp.email && <div className="text-[10px] text-slate-500 font-mono">{supp.email}</div>}
                      </td>
                      <td className="py-3 px-4 text-slate-300 text-[11px] max-w-[200px] truncate" title={supp.location || supp.address}>
                        {supp.location || supp.address || '-'}
                      </td>
                      <td className="py-3 px-3 text-center sticky right-0 bg-slate-900 group-hover:bg-slate-800/90 border-l border-slate-800">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => handleOpenEdit('supplier', supp)}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                            title="Edit Supplier"
                          >
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal (Specialized for Changing Mobile Number & Party Profile) */}
      {editingParty && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-500/20 text-purple-400 rounded-lg">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    Edit {editingParty.type === 'customer' ? 'Customer' : 'Supplier'} Details & Mobile
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Code: <span className="font-mono text-purple-400 font-bold">{editingParty.code || editingParty.id}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingParty(null)}
                className="text-slate-400 hover:text-white text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Helper Notice for Phone Number Replacement */}
            <div className="bg-purple-950/40 border border-purple-800/50 p-2.5 rounded-lg flex items-start gap-2 text-xs text-purple-300">
              <Info className="w-4 h-4 shrink-0 text-purple-400 mt-0.5" />
              <span>
                Update the mobile number below if the party has replaced their contact phone number. All transaction ledgers remain intact.
              </span>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              {/* Highlighted Mobile Number Field */}
              <div className="p-3 bg-slate-950 rounded-lg border border-purple-500/40 space-y-1">
                <label className="text-purple-300 block font-bold flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  Party Mobile / Phone Number *
                </label>
                <input
                  type="text"
                  required
                  value={editingParty.phone}
                  onChange={(e) => setEditingParty({ ...editingParty, phone: e.target.value })}
                  placeholder="e.g. 96590000000"
                  className="w-full bg-slate-900 border border-purple-500/60 rounded px-3 py-2 text-emerald-400 font-mono font-bold text-sm outline-none focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-[10px] text-slate-400 block">
                  Enter new phone number to replace existing contact
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Party Name *</label>
                  <input
                    type="text"
                    required
                    value={editingParty.name}
                    onChange={(e) => setEditingParty({ ...editingParty, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">
                    {editingParty.type === 'customer' ? 'Firm / Salon Name' : 'Company / Trade Name'}
                  </label>
                  <input
                    type="text"
                    value={editingParty.firm_name}
                    onChange={(e) => setEditingParty({ ...editingParty, firm_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Category</label>
                  <input
                    type="text"
                    value={editingParty.category}
                    onChange={(e) => setEditingParty({ ...editingParty, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Email Address</label>
                  <input
                    type="email"
                    value={editingParty.email}
                    onChange={(e) => setEditingParty({ ...editingParty, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {editingParty.type === 'customer' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1 font-semibold">Civil ID / CR #</label>
                    <input
                      type="text"
                      value={editingParty.civil_id_or_license}
                      onChange={(e) => setEditingParty({ ...editingParty, civil_id_or_license: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1 font-semibold">Credit Limit (KWD)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={editingParty.credit_limit}
                      onChange={(e) => setEditingParty({ ...editingParty, credit_limit: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Address / Location</label>
                <input
                  type="text"
                  value={editingParty.location}
                  onChange={(e) => setEditingParty({ ...editingParty, location: e.target.value })}
                  placeholder="e.g. Salmiya, Salem Al Mubarak St"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingParty(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Saving...' : 'Save & Update Mobile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Party Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveParty}
            className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-fade-in"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-400" />
                Add New {partyType === 'customer' ? 'Customer / Client' : 'Supplier / Vendor'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">
                  {partyType === 'customer' ? 'Customer / Salon Name *' : 'Company / Supplier Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Royal Beauty Salon or Milano Plus Trading"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">
                  {partyType === 'customer' ? 'Firm / Commercial Name (Optional)' : 'Contact Person (Optional)'}
                </label>
                <input
                  type="text"
                  value={firmName}
                  onChange={(e) => setFirmName(e.target.value)}
                  placeholder="e.g. Al-Rai Branch"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 96590000000"
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white outline-none focus:border-purple-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Salon, Spa, Clinic"
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {partyType === 'customer' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1 font-semibold">Civil ID / CR #</label>
                    <input
                      type="text"
                      value={civilId}
                      onChange={(e) => setCivilId(e.target.value)}
                      placeholder="e.g. 290101010101"
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1 font-semibold">Credit Limit (KWD)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={creditLimit}
                      onChange={(e) => setCreditLimit(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Address / Location</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Salmiya, Salem Al Mubarak St, Complex B"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm cursor-pointer"
              >
                {isSubmitting ? 'Saving...' : 'Save Party'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
