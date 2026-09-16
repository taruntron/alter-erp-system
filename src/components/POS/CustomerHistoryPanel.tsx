import React, { useState, useMemo } from 'react';
import { Customer, Invoice, InvoiceItem, Product } from '../../types';
import { 
  X, 
  History, 
  TrendingUp, 
  Calendar, 
  ShoppingBag, 
  Package, 
  Receipt, 
  Plus, 
  Check, 
  Printer, 
  ChevronRight, 
  Search, 
  Building2, 
  User, 
  Sparkles, 
  Clock,
  ArrowUpRight,
  RefreshCw,
  Phone,
  MapPin,
  FileText
} from 'lucide-react';

interface CustomerHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  invoices: Invoice[];
  products: Product[];
  onAddProductToBill: (product: Product | InvoiceItem) => void;
  onViewInvoice: (invoice: Invoice) => void;
  onReorderInvoice?: (invoice: Invoice) => void;
}

export const CustomerHistoryPanel: React.FC<CustomerHistoryPanelProps> = ({
  isOpen,
  onClose,
  customer,
  invoices,
  products,
  onAddProductToBill,
  onViewInvoice,
  onReorderInvoice,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'transactions' | 'preferences'>('transactions');
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

  // Filter invoices for this specific customer
  const customerInvoices = useMemo(() => {
    if (!customer) return [];
    return invoices.filter((inv) => {
      if (inv.status === 'voided') return false;
      const idMatch = inv.customer_id && inv.customer_id === customer.id;
      const nameMatch = inv.customer_name && inv.customer_name.trim().toLowerCase() === customer.name.trim().toLowerCase();
      const phoneMatch = customer.phone && customer.phone !== '00000000' && inv.customer_phone === customer.phone;
      return idMatch || nameMatch || phoneMatch;
    }).sort((a, b) => new Date(b.timestamp || b.date).getTime() - new Date(a.timestamp || a.date).getTime());
  }, [customer, invoices]);

  // Aggregate Customer Statistics & Preferences
  const customerStats = useMemo(() => {
    const totalTransactions = customerInvoices.length;
    const totalSpend = customerInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const avgSpend = totalTransactions > 0 ? totalSpend / totalTransactions : 0;
    
    const lastInvoice = customerInvoices[0];
    const firstInvoice = customerInvoices[customerInvoices.length - 1];

    // Calculate product frequency map
    const productFrequencyMap: Record<string, {
      product_id: string;
      name: string;
      barcode: string;
      sku: string;
      unit: string;
      count: number;
      totalUnits: number;
      totalSpend: number;
      lastPrice: number;
      lastPurchasedDate: string;
    }> = {};

    customerInvoices.forEach((inv) => {
      (inv.items || []).forEach((item) => {
        const key = item.product_id || item.barcode || item.name;
        if (!productFrequencyMap[key]) {
          productFrequencyMap[key] = {
            product_id: item.product_id,
            name: item.name,
            barcode: item.barcode || '',
            sku: item.sku || '',
            unit: item.unit || 'UNIT',
            count: 0,
            totalUnits: 0,
            totalSpend: 0,
            lastPrice: item.price || 0,
            lastPurchasedDate: inv.date || (inv.timestamp ? inv.timestamp.split('T')[0] : ''),
          };
        }
        productFrequencyMap[key].count += 1;
        productFrequencyMap[key].totalUnits += (item.qty || 1);
        productFrequencyMap[key].totalSpend += (item.total || 0);
      });
    });

    const topProducts = Object.values(productFrequencyMap).sort((a, b) => b.totalUnits - a.totalUnits);

    // Determine customer frequency category
    let frequencyLevel = 'First-time / Walk-in';
    let frequencyColor = 'text-slate-400 bg-slate-800 border-slate-700';

    if (totalTransactions >= 10) {
      frequencyLevel = 'VIP Salon / Platinum';
      frequencyColor = 'text-amber-300 bg-amber-950/80 border-amber-700';
    } else if (totalTransactions >= 5) {
      frequencyLevel = 'Frequent Regular';
      frequencyColor = 'text-purple-300 bg-purple-950/80 border-purple-700';
    } else if (totalTransactions >= 2) {
      frequencyLevel = 'Returning Customer';
      frequencyColor = 'text-cyan-300 bg-cyan-950/80 border-cyan-700';
    }

    return {
      totalTransactions,
      totalSpend,
      avgSpend,
      lastDate: lastInvoice?.date || (lastInvoice?.timestamp ? lastInvoice.timestamp.split('T')[0] : 'None'),
      firstDate: firstInvoice?.date || (firstInvoice?.timestamp ? firstInvoice.timestamp.split('T')[0] : 'None'),
      frequencyLevel,
      frequencyColor,
      topProducts,
    };
  }, [customerInvoices]);

  // Filtered Invoices based on search input
  const filteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) return customerInvoices;
    const q = searchQuery.toLowerCase();
    return customerInvoices.filter((inv) => {
      const matchNo = inv.invoice_no.toLowerCase().includes(q);
      const matchDate = (inv.date || '').toLowerCase().includes(q);
      const matchSection = (inv.section || '').toLowerCase().includes(q);
      const matchItem = inv.items.some((it) => it.name.toLowerCase().includes(q));
      return matchNo || matchDate || matchSection || matchItem;
    });
  }, [customerInvoices, searchQuery]);

  const handleQuickAdd = (topItem: typeof customerStats.topProducts[0]) => {
    // Find matching catalog product or create invoice item
    const found = products.find(
      (p) => p.id === topItem.product_id || p.barcode === topItem.barcode || p.sku === topItem.sku
    );

    if (found) {
      onAddProductToBill(found);
    } else {
      // Fallback
      onAddProductToBill({
        product_id: topItem.product_id || `prod-fav-${Date.now()}`,
        sku: topItem.sku || 'FAV',
        barcode: topItem.barcode || '',
        name: topItem.name,
        unit: topItem.unit as any || 'UNIT',
        qty: 1,
        stock: 50,
        price: topItem.lastPrice,
        total: topItem.lastPrice,
      });
    }

    setRecentlyAddedId(topItem.product_id || topItem.name);
    setTimeout(() => setRecentlyAddedId(null), 1500);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl text-slate-100 animate-slideInRight"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-900/60 border border-purple-700 flex items-center justify-center text-purple-300 shrink-0 shadow-xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white tracking-wide">
                  Customer History & Preferences
                </h2>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${customerStats.frequencyColor}`}>
                  {customerStats.frequencyLevel}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Past transactions, repeat purchase preferences, and pricing trends
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer Profile Card */}
        <div className="bg-slate-950/60 p-4 border-b border-slate-800">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-purple-700 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-xs">
                {customer.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-black text-white flex items-center gap-2">
                  <span>{customer.name}</span>
                  {customer.code && (
                    <span className="text-[10px] bg-slate-800 text-slate-400 font-mono px-1.5 py-0.5 rounded">
                      #{customer.code}
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                  {customer.firm_name && (
                    <span className="text-purple-300 font-semibold flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
                      {customer.firm_name}
                    </span>
                  )}
                  {customer.phone && customer.phone !== '00000000' && (
                    <span className="font-mono flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-500" />
                      {customer.phone}
                    </span>
                  )}
                  {(customer.location || customer.address) && (
                    <span className="text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      {customer.location || customer.address}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Due Balance Status */}
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Due Balance</div>
              <div className={`text-sm font-black font-mono mt-0.5 ${
                (customer.due_balance || 0) > 0 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                KWD {(customer.due_balance || 0).toFixed(3)}
              </div>
            </div>
          </div>

          {/* Quick Frequency & Intelligence Metrics */}
          <div className="grid grid-cols-3 gap-2.5 mt-3 pt-3 border-t border-slate-800/80">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5">
              <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
                <span>Total Orders</span>
                <Receipt className="w-3 h-3 text-purple-400" />
              </div>
              <div className="text-base font-black text-white font-mono mt-1">
                {customerStats.totalTransactions}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Last: {customerStats.lastDate}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5">
              <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
                <span>Lifetime Spend</span>
                <TrendingUp className="w-3 h-3 text-emerald-400" />
              </div>
              <div className="text-base font-black text-emerald-400 font-mono mt-1">
                KWD {(customerStats.totalSpend || 0).toFixed(3)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                All time completed
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5">
              <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
                <span>Avg Ticket</span>
                <ShoppingBag className="w-3 h-3 text-cyan-400" />
              </div>
              <div className="text-base font-black text-cyan-300 font-mono mt-1">
                KWD {(customerStats.avgSpend || 0).toFixed(3)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Per invoice average
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation & Search */}
        <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'transactions'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Past Invoices ({customerInvoices.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('preferences')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'preferences'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Favorite Items ({customerStats.topProducts.length})</span>
            </button>
          </div>

          {activeTab === 'transactions' && (
            <div className="relative min-w-[200px] flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by invoice or item..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-purple-500"
              />
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeTab === 'transactions' ? (
            /* Transactions List */
            filteredInvoices.length === 0 ? (
              <div className="py-16 text-center text-slate-500">
                <Receipt className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                <p className="text-sm font-semibold text-slate-400">No past transactions found for this party</p>
                <p className="text-xs text-slate-600 mt-1">
                  Once this customer completes an invoice, it will automatically appear here with full line-item details.
                </p>
              </div>
            ) : (
              filteredInvoices.map((inv) => (
                <div 
                  key={inv.id}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 hover:border-purple-800/80 transition-all shadow-xs space-y-2.5"
                >
                  {/* Top row: Invoice No, Branch, Date, Total */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-purple-300">
                        {inv.invoice_no}
                      </span>
                      <span className="text-[11px] bg-slate-800 text-slate-300 font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-purple-400" />
                        {inv.section || 'Main Branch'}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        inv.status === 'paid' 
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}>
                        {inv.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {inv.date || (inv.timestamp ? inv.timestamp.split('T')[0] : '')}
                      </span>
                      <span className="font-mono font-black text-base text-emerald-400">
                        KWD {(inv.total || 0).toFixed(3)}
                      </span>
                    </div>
                  </div>

                  {/* Items List in this invoice */}
                  <div className="bg-slate-900/80 rounded-lg p-2 border border-slate-800/80 divide-y divide-slate-800 text-xs">
                    {(inv.items || []).map((it, idx) => (
                      <div key={idx} className="py-1 flex items-center justify-between gap-2">
                        <div className="flex-1 truncate">
                          <span className="font-bold text-slate-200">{it.name}</span>
                          <span className="text-[11px] text-slate-500 font-mono ml-2">
                            ({it.qty} {it.unit} @ KWD {(it.price || 0).toFixed(3)})
                          </span>
                        </div>
                        <div className="font-mono font-bold text-slate-300 text-[11px]">
                          KWD {(it.total || 0).toFixed(3)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actions Bar: View / Print & Reorder */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <div className="text-[11px] text-slate-500">
                      Cashier: <strong className="text-slate-400">{inv.cashier_name || 'Staff'}</strong>
                      {inv.narration && <span> • <em>{inv.narration}</em></span>}
                    </div>

                    <div className="flex items-center gap-2">
                      {onReorderInvoice && (
                        <button
                          type="button"
                          onClick={() => onReorderInvoice(inv)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded font-bold text-[11px] flex items-center gap-1 transition-colors"
                          title="Copy all items from this invoice into the active bill"
                        >
                          <RefreshCw className="w-3 h-3 text-cyan-400" />
                          <span>Re-punch Bill</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onViewInvoice(inv)}
                        className="px-2.5 py-1 bg-purple-900/60 hover:bg-purple-800 text-purple-200 hover:text-white rounded font-bold text-[11px] flex items-center gap-1 border border-purple-700/60 transition-colors"
                      >
                        <Printer className="w-3 h-3 text-purple-300" />
                        <span>View Receipt</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )
          ) : (
            /* Customer Preferences / Top Purchased Products */
            <div className="space-y-3">
              <div className="p-3 bg-purple-950/30 border border-purple-800/40 rounded-xl text-xs text-purple-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Items this customer orders repeatedly. Click <strong>+ Add to Bill</strong> to immediately punch into active POS ticket.
                </span>
              </div>

              {customerStats.topProducts.length === 0 ? (
                <div className="py-16 text-center text-slate-500">
                  <Package className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                  <p className="text-sm font-semibold text-slate-400">No preference data yet</p>
                  <p className="text-xs text-slate-600 mt-1">
                    As this customer purchases products, their most ordered items will rank here for fast 1-click reorders.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {customerStats.topProducts.map((topItem, index) => {
                    const isRecentlyAdded = recentlyAddedId === (topItem.product_id || topItem.name);
                    return (
                      <div 
                        key={`${topItem.product_id}-${index}`}
                        className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 hover:border-purple-800 transition-all shadow-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center font-black text-xs text-purple-400 shrink-0">
                            #{index + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-white text-xs truncate" title={topItem.name}>
                              {topItem.name}
                            </div>
                            <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                              <span className="font-mono text-purple-300 font-bold">
                                Bought {topItem.totalUnits} {topItem.unit}s
                              </span>
                              <span>•</span>
                              <span>{topItem.count} order(s)</span>
                              <span>•</span>
                              <span className="text-emerald-400 font-mono font-semibold">
                                Last: KWD {(topItem.lastPrice || 0).toFixed(3)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleQuickAdd(topItem)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 shrink-0 shadow-xs ${
                            isRecentlyAdded
                              ? 'bg-emerald-600 text-white'
                              : 'bg-purple-700 hover:bg-purple-600 text-white'
                          }`}
                        >
                          {isRecentlyAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Added!</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>+ Add to Bill</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="text-slate-400">
            Total Invoices on Record: <strong className="text-white">{customerInvoices.length}</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors"
          >
            Close History
          </button>
        </div>
      </div>
    </div>
  );
};
