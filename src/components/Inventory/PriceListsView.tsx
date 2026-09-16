import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  Tags, 
  Search, 
  Save, 
  CheckCircle, 
  Percent, 
  Banknote, 
  ShieldCheck 
} from 'lucide-react';
import { PriceListTier } from '../../types';

export const PriceListsView: React.FC = () => {
  const { priceLists, updatePriceList } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [localPrices, setLocalPrices] = useState<PriceListTier[]>(priceLists);
  const [toastMsg, setToastMsg] = useState('');

  const handlePriceChange = (
    id: string,
    field: 'retail_price' | 'wholesale_price' | 'special_spa_price',
    value: number
  ) => {
    setLocalPrices((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: Math.max(0, value) } : item))
    );
  };

  const handleSaveAll = () => {
    updatePriceList(localPrices);
    setToastMsg('All pricing tiers updated successfully!');
    setTimeout(() => setToastMsg(''), 3000);
  };

  const filteredItems = localPrices.filter(
    (item) =>
      item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-42px)] overflow-y-auto bg-slate-950 text-slate-100 p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Tags className="w-5 h-5 text-purple-400" />
            Price Lists & Multi-Tier Pricing Master
          </h2>
          <p className="text-xs text-slate-400">
            Define dynamic rate cards for Walk-in Retail, Bulk Wholesale, and Registered Salon/Spa accounts
          </p>
        </div>

        <div className="flex items-center gap-2">
          {toastMsg && (
            <span className="text-emerald-300 bg-emerald-500/20 text-xs px-3 py-1.5 rounded flex items-center gap-1.5 font-bold">
              <CheckCircle className="w-3.5 h-3.5" /> {toastMsg}
            </span>
          )}
          <button
            onClick={handleSaveAll}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" /> Save Price Lists
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search items by product name or SKU..."
          className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-purple-500"
        />
      </div>

      {/* Pricing Matrix Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Pricing Tiers Matrix ({filteredItems.length} Products)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold">
                <th className="py-2.5 px-3">Product Name & SKU</th>
                <th className="py-2.5 px-3 text-right">Standard Retail (KWD)</th>
                <th className="py-2.5 px-3 text-right">Bulk Wholesale (KWD)</th>
                <th className="py-2.5 px-3 text-right">VIP Salon & Spa (KWD)</th>
                <th className="py-2.5 px-3 text-center">Wholesale Discount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredItems.map((tier) => {
                const discount = tier.retail_price > 0
                  ? (((tier.retail_price - tier.wholesale_price) / tier.retail_price) * 100).toFixed(0)
                  : '0';

                return (
                  <tr key={tier.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-white">{tier.product_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{tier.sku}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        step="0.001"
                        value={tier.retail_price}
                        onChange={(e) =>
                          handlePriceChange(tier.id, 'retail_price', parseFloat(e.target.value) || 0)
                        }
                        className="w-28 bg-slate-950 border border-slate-700 text-right font-mono font-bold text-emerald-400 text-xs py-1 px-2 rounded outline-none focus:border-purple-500"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        step="0.001"
                        value={tier.wholesale_price}
                        onChange={(e) =>
                          handlePriceChange(tier.id, 'wholesale_price', parseFloat(e.target.value) || 0)
                        }
                        className="w-28 bg-slate-950 border border-slate-700 text-right font-mono font-bold text-blue-400 text-xs py-1 px-2 rounded outline-none focus:border-purple-500"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        step="0.001"
                        value={tier.special_spa_price}
                        onChange={(e) =>
                          handlePriceChange(tier.id, 'special_spa_price', parseFloat(e.target.value) || 0)
                        }
                        className="w-28 bg-slate-950 border border-slate-700 text-right font-mono font-bold text-purple-400 text-xs py-1 px-2 rounded outline-none focus:border-purple-500"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-400">
                      {discount}% OFF
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
