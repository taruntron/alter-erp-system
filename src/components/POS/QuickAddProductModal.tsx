import React, { useState, useEffect } from 'react';
import { Product, ProductUnit } from '../../types';
import { 
  X, 
  PackagePlus, 
  Barcode, 
  Tag, 
  Banknote, 
  Layers, 
  Check, 
  Sparkles,
  RefreshCw,
  FileText
} from 'lucide-react';

interface QuickAddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: (product: Product, addToBillImmediately: boolean) => void;
  initialName?: string;
  existingCategories?: string[];
}

export const QuickAddProductModal: React.FC<QuickAddProductModalProps> = ({
  isOpen,
  onClose,
  onProductAdded,
  initialName = '',
  existingCategories = [
    'Hair Care & Tools',
    'Skin Care',
    'Body & Spa',
    'Hair Color & Oxidant',
    'Henna & Herbal',
    'Salon Accessories',
    'Cosmetics & Makeup',
    'Perfumes & Fragrances'
  ],
}) => {
  const generateRandomBarcode = () => {
    // 12-digit standard barcode format
    return Math.floor(100000000000 + Math.random() * 900000000000).toString();
  };

  const [name, setName] = useState(initialName);
  const [barcode, setBarcode] = useState(generateRandomBarcode());
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState(existingCategories[0] || 'Hair Care & Tools');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [unit, setUnit] = useState<ProductUnit>('UNIT');
  const [price, setPrice] = useState<number>(2.5);
  const [cost, setCost] = useState<number>(1.25);
  const [stockQuantity, setStockQuantity] = useState<number>(24);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(8);
  const [description, setDescription] = useState('');
  const [addToBillImmediately, setAddToBillImmediately] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialName) {
        setName(initialName);
      }
      const newBarcode = generateRandomBarcode();
      setBarcode(newBarcode);
      setSku(newBarcode);
    }
  }, [isOpen, initialName]);

  if (!isOpen) return null;

  const handleRegenerateBarcode = () => {
    const newBarcode = generateRandomBarcode();
    setBarcode(newBarcode);
    if (!sku || sku === barcode) {
      setSku(newBarcode);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Product / Item Name is required.');
      return;
    }

    if (price <= 0) {
      setErrorMsg('Selling Price must be greater than 0.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const finalCategory = isCustomCategory && customCategory.trim() 
        ? customCategory.trim() 
        : category;

      const newProductData: Product = {
        id: `prod-${Date.now()}`,
        name: name.trim(),
        barcode: barcode.trim() || generateRandomBarcode(),
        sku: sku.trim() || barcode.trim() || generateRandomBarcode(),
        category: finalCategory,
        unit,
        price: Number(price),
        cost: Number(cost) || 0,
        stock_quantity: Number(stockQuantity) || 0,
        lowStockThreshold: Number(lowStockThreshold) || 5,
        description: description.trim() || undefined,
      };

      onProductAdded(newProductData, addToBillImmediately);
      onClose();
    } catch (err) {
      console.error('Error adding quick product:', err);
      setErrorMsg('Failed to add product.');
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
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <PackagePlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Quick Add Item / Product
                <span className="text-[10px] font-semibold bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-700/50">
                  Instant POS Addition
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">Add a product to catalog and punch it into the current bill</p>
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

          {/* Product Name */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">
              Product / Item Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. MILANO PLUS ARGAN OIL 100ML"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-xs"
            />
          </div>

          {/* Barcode & SKU (2-Col Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-300 font-bold mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Barcode className="w-3.5 h-3.5 text-purple-400" />
                  Barcode / EAN
                </span>
                <button
                  type="button"
                  onClick={handleRegenerateBarcode}
                  className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  Generate
                </button>
              </label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => {
                  setBarcode(e.target.value);
                  if (!sku || sku === barcode) setSku(e.target.value);
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-emerald-500 outline-none text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                SKU / Item Code
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="SKU-..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-emerald-500 outline-none text-xs"
              />
            </div>
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-300 font-bold mb-1 flex items-center justify-between">
                <span>Category</span>
                <button
                  type="button"
                  onClick={() => setIsCustomCategory(!isCustomCategory)}
                  className="text-[10px] text-purple-400 hover:underline"
                >
                  {isCustomCategory ? 'Pick standard' : '+ Custom category'}
                </button>
              </label>
              {isCustomCategory ? (
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Enter custom category name..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none text-xs"
                />
              ) : (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:border-emerald-500 outline-none text-xs cursor-pointer"
                >
                  {existingCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                Unit of Measure
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as ProductUnit)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:border-emerald-500 outline-none text-xs cursor-pointer"
              >
                <option value="UNIT">UNIT (Single Item)</option>
                <option value="CTN24">CTN24 (Carton 24 pcs)</option>
                <option value="CTN">CTN (Carton)</option>
                <option value="Box">Box</option>
                <option value="Pkt">Pkt (Packet)</option>
                <option value="Dozen">Dozen (12 pcs)</option>
                <option value="Pcs">Pcs (Pieces)</option>
                <option value="Kg">Kg (Kilogram)</option>
              </select>
            </div>
          </div>

          {/* Selling Price & Cost Price (2-Col Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1">
                <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                Selling Price (KWD) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                step="0.001"
                min="0.001"
                required
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                placeholder="2.500"
                className="w-full bg-slate-950 border border-emerald-600/50 rounded-lg px-3 py-2 text-emerald-400 font-black font-mono focus:border-emerald-500 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Cost / Purchase Price (KWD)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={cost}
                onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                placeholder="1.250"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 font-mono focus:border-emerald-500 outline-none text-xs"
              />
            </div>
          </div>

          {/* Initial Stock & Low Stock Threshold (2-Col Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Initial Stock Quantity
              </label>
              <input
                type="number"
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
                placeholder="24"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-emerald-500 outline-none text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Low Stock Alert Threshold
              </label>
              <input
                type="number"
                min="1"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 5)}
                placeholder="8"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-emerald-500 outline-none text-xs"
              />
            </div>
          </div>

          {/* Notes / Description */}
          <div>
            <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Item Description & Notes
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 500ml jar with safety seal, salon professional grade"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium placeholder:text-slate-500 focus:border-emerald-500 outline-none text-xs"
            />
          </div>

          {/* Checkbox: Add to current bill immediately */}
          <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 flex items-center gap-2.5 cursor-pointer">
            <input
              id="chk-add-to-bill"
              type="checkbox"
              checked={addToBillImmediately}
              onChange={(e) => setAddToBillImmediately(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-500 accent-emerald-500 cursor-pointer"
            />
            <label htmlFor="chk-add-to-bill" className="text-slate-200 text-xs font-semibold cursor-pointer select-none">
              Immediately punch 1 unit of this item into the active invoice
            </label>
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
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-900/30 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
