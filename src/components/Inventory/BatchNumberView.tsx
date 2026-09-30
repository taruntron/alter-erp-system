import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  Boxes, 
  Search, 
  AlertTriangle, 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle,
  PackageCheck
} from 'lucide-react';
import { BatchStock } from '../../types';

export const BatchNumberView: React.FC = () => {
  const { batches } = useStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBatches = batches.filter(
    (b) =>
      b.batch_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.rack_location && b.rack_location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="h-full overflow-y-auto bg-slate-950 text-slate-100 p-3 sm:p-4 space-y-4 custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Boxes className="w-5 h-5 text-purple-400" />
            Batch Number & Expiration Register
          </h2>
          <p className="text-xs text-slate-400">
            Track product manufacturing lots, cosmetics expiry dates, and warehouse shelf/rack locations
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Batch #, Product, Rack..."
            className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded-lg pl-8 pr-3 py-2 outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Grid of Batch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredBatches.map((batch) => {
          const isNearExpiry = new Date(batch.expiry_date) < new Date(Date.now() + 180 * 86400000);

          return (
            <div
              key={batch.id}
              className={`bg-slate-900 rounded-xl border p-4 space-y-3 hover:border-slate-700 transition-colors ${
                isNearExpiry ? 'border-amber-800/80' : 'border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-purple-300 px-2 py-0.5 rounded bg-purple-950 border border-purple-800">
                  {batch.batch_number}
                </span>
                <span className="font-mono font-bold text-xs text-emerald-400">
                  Stock: {batch.quantity} Units
                </span>
              </div>

              <div>
                <h3 className="font-bold text-white text-sm">{batch.product_name}</h3>
                <div className="text-xs text-slate-400 space-y-1 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Calendar className="w-3.5 h-3.5" /> Mfg Date:
                    </span>
                    <span className="font-mono text-slate-300">{batch.mfg_date}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Clock className="w-3.5 h-3.5" /> Expiry Date:
                    </span>
                    <span className={`font-mono font-bold ${isNearExpiry ? 'text-amber-400' : 'text-slate-200'}`}>
                      {batch.expiry_date}
                    </span>
                  </div>
                  {batch.rack_location && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-purple-400" /> Warehouse Rack:
                      </span>
                      <span className="font-mono font-bold text-white">{batch.rack_location}</span>
                    </div>
                  )}
                </div>
              </div>

              {isNearExpiry && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded p-2 text-[11px] text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Approaching shelf expiry within 6 months</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
