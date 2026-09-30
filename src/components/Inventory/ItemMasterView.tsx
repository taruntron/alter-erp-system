import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { Product, ProductUnit } from '../../types';
import { 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Barcode as BarcodeIcon,
  CheckCircle2, 
  Tag,
  Sparkles,
  X,
  Info,
  Layers,
  AlertCircle
} from 'lucide-react';

export const ItemMasterView: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, adjustProductStock } = useStore();
  const { isManager, isAdmin } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');

  // Product Modal State (Add or Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Form State
  const [sku, setSku] = useState(''); // Item Code / SKU (e.g. MS609, MS1991, KM2299)
  const [barcode, setBarcode] = useState(''); // Primary EAN / UPC Barcode (e.g. 619364570311)
  const [additionalBarcodes, setAdditionalBarcodes] = useState<string[]>([]); // Up to 5 barcodes
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Hair Care & Tools');
  const [cost, setCost] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);
  const [stockQuantity, setStockQuantity] = useState<number>(0);
  const [unit, setUnit] = useState<ProductUnit>('UNIT');
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(10);
  const [description, setDescription] = useState('');
  const [validationError, setValidationError] = useState('');

  // Quick Restock State
  const [restockModalProd, setRestockModalProd] = useState<Product | null>(null);
  const [restockQtyToAdd, setRestockQtyToAdd] = useState<number>(10);

  // Delete Confirmation State
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Categories list
  const categories = ['ALL', ...Array.from(new Set(products.map((p) => p.category)))];

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (q === '') {
      const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      let matchesStock = true;
      if (stockFilter === 'LOW') {
        matchesStock = p.stock_quantity <= p.lowStockThreshold && p.stock_quantity > 0;
      } else if (stockFilter === 'OUT') {
        matchesStock = p.stock_quantity <= 0;
      }
      return matchesCat && matchesStock;
    }

    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.barcode.toLowerCase().includes(q) ||
      (p.additionalBarcodes && p.additionalBarcodes.some((b) => b.toLowerCase().includes(q))) ||
      p.category.toLowerCase().includes(q);

    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;

    let matchesStock = true;
    if (stockFilter === 'LOW') {
      matchesStock = p.stock_quantity <= p.lowStockThreshold && p.stock_quantity > 0;
    } else if (stockFilter === 'OUT') {
      matchesStock = p.stock_quantity <= 0;
    }

    return matchesSearch && matchesCat && matchesStock;
  });

  const lowStockCount = products.filter((p) => p.stock_quantity <= p.lowStockThreshold).length;

  const generateRandomSku = () => {
    const prefixes = ['MS', 'KM', 'SC', 'MP', 'OX', 'HN', 'CB', 'PRF'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(100 + Math.random() * 900);
    return `${prefix}${num}`;
  };

  const generateRandomEan = () => {
    return `619${Math.floor(1000000000 + Math.random() * 9000000000)}`;
  };

  const handleOpenAdd = () => {
    setEditingProductId(null);
    setSku(generateRandomSku());
    setBarcode(generateRandomEan());
    setAdditionalBarcodes([]);
    setName('');
    setCategory('Hair Care & Tools');
    setCost(1.0);
    setPrice(2.5);
    setStockQuantity(50);
    setUnit('UNIT');
    setLowStockThreshold(10);
    setDescription('');
    setValidationError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProductId(p.id);
    setSku(p.sku);
    setBarcode(p.barcode);
    setAdditionalBarcodes(p.additionalBarcodes ? [...p.additionalBarcodes] : []);
    setName(p.name);
    setCategory(p.category);
    setCost(p.cost);
    setPrice(p.price);
    setStockQuantity(p.stock_quantity);
    setUnit(p.unit);
    setLowStockThreshold(p.lowStockThreshold);
    setDescription(p.description || '');
    setValidationError('');
    setIsModalOpen(true);
  };

  const handleAddBarcodeSlot = () => {
    if (additionalBarcodes.length >= 5) return;
    setAdditionalBarcodes([...additionalBarcodes, '']);
  };

  const handleUpdateBarcodeSlot = (index: number, val: string) => {
    const updated = [...additionalBarcodes];
    updated[index] = val;
    setAdditionalBarcodes(updated);
  };

  const handleRemoveBarcodeSlot = (index: number) => {
    const updated = additionalBarcodes.filter((_, i) => i !== index);
    setAdditionalBarcodes(updated);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    const cleanSku = sku.trim();
    const cleanBarcode = barcode.trim();

    if (!name.trim()) {
      setValidationError('Product Name is required.');
      return;
    }

    if (!cleanSku) {
      setValidationError('Item Code (SKU) is required (e.g. MS609, KM2299).');
      return;
    }

    if (!cleanBarcode) {
      setValidationError('Item Barcode is required (e.g. 619364570311).');
      return;
    }

    if (cleanSku.toLowerCase() === cleanBarcode.toLowerCase()) {
      setValidationError('Item Code (SKU) and Item Barcode must not be identical. Item Code is internal SKU (e.g. MS609), whereas Item Barcode is standard product EAN (e.g. 619364570311).');
      return;
    }

    // Filter valid non-empty additional barcodes (max 5)
    const cleanedAdditionalBarcodes = additionalBarcodes
      .map((b) => b.trim())
      .filter((b) => b.length > 0)
      .slice(0, 5);

    const payload: Omit<Product, 'id'> = {
      sku: cleanSku,
      barcode: cleanBarcode,
      additionalBarcodes: cleanedAdditionalBarcodes,
      name: name.trim(),
      category: category.trim() || 'General',
      cost: Number(cost) || 0,
      price: Number(price) || 0,
      stock_quantity: Number(stockQuantity) || 0,
      unit,
      lowStockThreshold: Number(lowStockThreshold) || 10,
      description: description.trim(),
    };

    if (editingProductId) {
      await updateProduct(editingProductId, payload);
    } else {
      await addProduct(payload);
    }

    setIsModalOpen(false);
  };

  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await deleteProduct(productToDelete.id);
    } catch (err) {
      console.error('Delete product error:', err);
    } finally {
      setIsDeleting(false);
      setProductToDelete(null);
    }
  };

  const handleApplyRestock = async () => {
    if (restockModalProd && restockQtyToAdd > 0) {
      await adjustProductStock(
        restockModalProd.id,
        restockModalProd.stock_quantity + Number(restockQtyToAdd)
      );
      setRestockModalProd(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {/* Header & Controls */}
      <div className="bg-slate-950 p-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-600/20 text-purple-400 rounded-lg border border-purple-500/30">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              Item Master & Inventory Catalog
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/60">
                Multi-Barcode Enabled (Up to 5 Barcodes)
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Total: {products.length} Products • Low Stock Alerts:{' '}
              <span className={lowStockCount > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                {lowStockCount} items
              </span>
            </p>
          </div>
        </div>

        {/* Add Product Button */}
        {isManager && (
          <button
            id="btn-add-product"
            onClick={handleOpenAdd}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-950/70 px-3 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[260px] max-w-lg">
          <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            id="input-item-master-search"
            type="text"
            placeholder="Search by Item Code (SKU), Primary Barcode, Alt Barcodes, Name, Category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-purple-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded bg-slate-800"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-bold">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs outline-none cursor-pointer"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Stock Level Filter */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setStockFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              stockFilter === 'ALL'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            All Stock
          </button>
          <button
            onClick={() => setStockFilter('LOW')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              stockFilter === 'LOW'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            Low Stock ({lowStockCount})
          </button>
          <button
            onClick={() => setStockFilter('OUT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              stockFilter === 'OUT'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            Out of Stock
          </button>
        </div>
      </div>

      {/* Main Products Grid Table */}
      <div className="flex-1 overflow-auto p-3 bg-slate-950">
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-md">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-300 uppercase text-[10px] font-black border-b border-slate-800 tracking-wider">
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th className="py-3 px-3 min-w-[110px]">
                  <div className="flex items-center gap-1">
                    <Tag className="w-3 h-3 text-purple-400" />
                    <span>Item Code (SKU)</span>
                  </div>
                </th>
                <th className="py-3 px-3 min-w-[140px]">
                  <div className="flex items-center gap-1">
                    <BarcodeIcon className="w-3 h-3 text-emerald-400" />
                    <span>Primary Barcode</span>
                  </div>
                </th>
                <th className="py-3 px-3 min-w-[160px]">
                  <span>Additional Barcodes (Max 5)</span>
                </th>
                <th className="py-3 px-3 min-w-[200px]">Product Name & Category</th>
                <th className="py-3 px-3 w-20 text-center">Unit</th>
                <th className="py-3 px-3 w-24 text-right">Cost</th>
                <th className="py-3 px-3 w-28 text-right">Sell Price</th>
                <th className="py-3 px-3 w-24 text-center">Stock</th>
                <th className="py-3 px-3 w-28 text-center">Status</th>
                <th className="py-3 px-3 w-28 text-center sticky right-0 bg-slate-950 border-l border-slate-800">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 font-medium">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500">
                    No products matched your search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod, idx) => {
                  const marginPct =
                    prod.price > 0 ? (((prod.price - prod.cost) / prod.price) * 100).toFixed(0) : 0;
                  const isLow = prod.stock_quantity <= prod.lowStockThreshold;
                  const isOut = prod.stock_quantity <= 0;
                  const altBarcodes = prod.additionalBarcodes || [];

                  return (
                    <tr key={prod.id} className="hover:bg-slate-850/80 transition-colors text-slate-200 group">
                      <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-[11px]">{idx + 1}</td>
                      
                      {/* Item Code (SKU) Column */}
                      <td className="py-2.5 px-3">
                        <span className="font-mono font-bold text-purple-300 text-xs px-2 py-0.5 rounded bg-purple-950/70 border border-purple-800/50">
                          {prod.sku}
                        </span>
                      </td>

                      {/* Primary Barcode (EAN) Column */}
                      <td className="py-2.5 px-3 font-mono text-emerald-400 font-bold text-xs tracking-wide">
                        {prod.barcode}
                      </td>

                      {/* Additional Multiple Barcodes (up to 5) Column */}
                      <td className="py-2.5 px-3">
                        {altBarcodes.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[220px]">
                            {altBarcodes.map((altB, bIdx) => (
                              <span 
                                key={bIdx} 
                                className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                                title={`Alternate Barcode #${bIdx + 1}`}
                              >
                                {altB}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-600 italic">None</span>
                        )}
                      </td>

                      {/* Product Name & Category */}
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-white text-xs">{prod.name}</div>
                        <div className="text-[10px] text-purple-400 font-medium">{prod.category}</div>
                      </td>

                      <td className="py-2.5 px-3 text-center font-bold text-purple-300">{prod.unit}</td>
                      
                      <td className="py-2.5 px-3 text-right text-slate-400 font-mono">
                        {(prod.cost || 0).toFixed(3)}
                      </td>
                      
                      <td className="py-2.5 px-3 text-right font-black text-emerald-400 font-mono">
                        {(prod.price || 0).toFixed(3)}
                        <span className="text-[9px] text-slate-500 block font-normal">
                          +{marginPct}% margin
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <span className="font-black text-sm text-white font-mono">{prod.stock_quantity}</span>
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        {isOut ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-950 text-rose-400 border border-rose-800">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-950 text-amber-400 border border-amber-800">
                            Low Stock ({prod.stock_quantity})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-950 text-emerald-400 border border-emerald-800">
                            In Stock
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-center sticky right-0 bg-slate-900 group-hover:bg-slate-800/90 border-l border-slate-800">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Quick Restock */}
                          <button
                            title="Quick Restock"
                            onClick={() => {
                              setRestockModalProd(prod);
                              setRestockQtyToAdd(10);
                            }}
                            className="bg-purple-900/60 hover:bg-purple-800 text-purple-300 px-2 py-1 rounded transition-colors text-[11px] font-bold cursor-pointer"
                          >
                            +Stock
                          </button>

                          {/* Edit (Manager/Admin) */}
                          {isManager && (
                            <button
                              title="Edit Product & Barcodes"
                              onClick={() => handleOpenEdit(prod)}
                              className="text-slate-300 hover:text-white p-1.5 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete (Manager or Admin) */}
                          {(isManager || isAdmin) && (
                            <button
                              title="Delete Product"
                              onClick={() => setProductToDelete(prod)}
                              className="text-rose-500 hover:text-rose-400 p-1.5 rounded hover:bg-rose-950/50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 overflow-y-auto backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-xl overflow-hidden animate-fade-in my-auto max-h-[95vh] flex flex-col">
            <div className="bg-slate-950 text-white px-4 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-600/20 text-purple-400 rounded-lg">
                  <Package className="w-4 h-4" />
                </div>
                <h3 className="font-black text-sm">
                  {editingProductId ? 'Edit Product & Barcodes' : 'Add New Inventory Product'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-4 space-y-3.5 text-xs overflow-y-auto">
              {validationError && (
                <div className="bg-rose-500/20 border border-rose-500/60 text-rose-300 text-xs px-3.5 py-2.5 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Informative Guidance Banner */}
              <div className="bg-purple-950/40 border border-purple-800/50 p-2.5 rounded-lg text-[11px] text-purple-300 space-y-1">
                <div className="font-bold text-white flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-purple-400" />
                  Item Code vs. Item Barcode Definition:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300 pt-1">
                  <p>• <strong className="text-purple-300">Item Code (SKU):</strong> Internal short model/SKU (e.g. MS609, KM2299, MS1991).</p>
                  <p>• <strong className="text-emerald-300">Item Barcode (EAN):</strong> Standard EAN-13/EAN-11 printed barcode (e.g. 619364570311).</p>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Product Description / Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. MILANO PLUS 5 IN 1 BRIGHTENING CREAM AKEA FASSI 500ML..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-bold outline-none focus:border-purple-500"
                />
              </div>

              {/* Code vs Barcode Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-purple-300 font-bold flex items-center gap-1">
                      <Tag className="w-3 h-3 text-purple-400" />
                      Item Code / SKU *
                    </label>
                    <button
                      type="button"
                      onClick={() => setSku(generateRandomSku())}
                      className="text-[10px] text-purple-400 hover:text-purple-200 flex items-center gap-0.5 cursor-pointer"
                      title="Generate random SKU code"
                    >
                      <Sparkles className="w-2.5 h-2.5" /> Auto SKU
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. MS609, KM2299"
                    className="w-full bg-slate-900 border border-purple-500/50 rounded-lg p-2 text-purple-300 font-mono font-bold outline-none focus:border-purple-400"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Alphanumeric SKU identifier</span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-emerald-300 font-bold flex items-center gap-1">
                      <BarcodeIcon className="w-3 h-3 text-emerald-400" />
                      Primary Item Barcode (EAN) *
                    </label>
                    <button
                      type="button"
                      onClick={() => setBarcode(generateRandomEan())}
                      className="text-[10px] text-emerald-400 hover:text-emerald-200 flex items-center gap-0.5 cursor-pointer"
                      title="Generate random EAN barcode"
                    >
                      <Sparkles className="w-2.5 h-2.5" /> Auto EAN
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="e.g. 619364570311"
                    className="w-full bg-slate-900 border border-emerald-500/50 rounded-lg p-2 text-emerald-400 font-mono font-bold outline-none focus:border-emerald-400"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Standard EAN-13 / EAN-11 barcode</span>
                </div>
              </div>

              {/* Additional Multiple Barcodes (up to 5) */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-400" />
                    Additional Multiple Barcodes ({additionalBarcodes.length}/5)
                  </label>
                  {additionalBarcodes.length < 5 && (
                    <button
                      type="button"
                      onClick={handleAddBarcodeSlot}
                      className="bg-purple-900/70 hover:bg-purple-800 text-purple-200 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Add Barcode Slot
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-500">
                  Assign up to 5 additional alternate barcodes (e.g. carton pack barcode, distributor batch barcode, unit barcode) for instant multi-code barcode scanning.
                </p>

                {additionalBarcodes.length === 0 ? (
                  <div className="text-center py-2 text-slate-600 italic text-[11px]">
                    No additional barcodes configured. Click &quot;Add Barcode Slot&quot; to add up to 5 alternate barcodes.
                  </div>
                ) : (
                  <div className="space-y-1.5 pt-1">
                    {additionalBarcodes.map((altB, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-500 w-16">
                          Barcode #{idx + 1}:
                        </span>
                        <input
                          type="text"
                          value={altB}
                          onChange={(e) => handleUpdateBarcodeSlot(idx, e.target.value)}
                          placeholder={`e.g. Alt Barcode #${idx + 1} (EAN-13 / Pack Barcode)`}
                          className="flex-1 bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono text-xs outline-none focus:border-purple-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveBarcodeSlot(idx)}
                          className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-950/50 cursor-pointer"
                          title="Remove this alternate barcode"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Hair Care, Henna, Perfumes..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Stock Unit (UOM)</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as ProductUnit)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-bold outline-none cursor-pointer"
                  >
                    <option value="UNIT">UNIT (Single Item)</option>
                    <option value="CTN24">CTN24 (Carton of 24)</option>
                    <option value="CTN">CTN (Carton of 12)</option>
                    <option value="Box">Box (Pack of 6)</option>
                    <option value="Pkt">Pkt (Packet of 10)</option>
                    <option value="Dozen">Dozen (12 Pcs)</option>
                    <option value="Pcs">Pcs (Pieces)</option>
                    <option value="Kg">Kg (Kilograms)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Cost Price (KWD)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={cost}
                    onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Selling Price (KWD)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-emerald-400 font-mono font-bold outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Initial Stock Quantity</label>
                  <input
                    type="number"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-black outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Low Stock Threshold Alert</label>
                  <input
                    type="number"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 10)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-amber-400 font-bold outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg font-bold text-slate-400 bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg font-black text-white bg-purple-700 hover:bg-purple-600 shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {editingProductId ? 'Save Product & Barcodes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Restock Modal */}
      {restockModalProd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4 max-w-sm w-full animate-fade-in">
            <h3 className="font-black text-sm text-white mb-2">Quick Restock / Stock Intake</h3>
            <p className="text-xs text-slate-400 mb-3">
              Item: <span className="font-bold text-white">{restockModalProd.name}</span>
              <br />
              Code: <span className="font-mono text-purple-400 font-bold">{restockModalProd.sku}</span> | EAN: <span className="font-mono text-emerald-400 font-bold">{restockModalProd.barcode}</span>
              <br />
              Current Stock: <span className="font-bold text-emerald-400">{restockModalProd.stock_quantity}</span>
            </p>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-300 mb-1">Quantity to Add:</label>
              <input
                type="number"
                min="1"
                value={restockQtyToAdd}
                onChange={(e) => setRestockQtyToAdd(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-black text-base outline-none focus:border-purple-500 text-center"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRestockModalProd(null)}
                className="px-3 py-1.5 rounded text-xs font-bold text-slate-400 bg-slate-800 hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyRestock}
                className="px-4 py-1.5 rounded text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xs cursor-pointer"
              >
                Update Stock ({restockModalProd.stock_quantity + Number(restockQtyToAdd)})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Product In-App Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-sm w-full p-5 space-y-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/20 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Confirm Delete Product
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Item SKU: <span className="font-mono text-purple-300 font-bold">{productToDelete.sku}</span>
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-1.5">
              <p className="text-slate-300">
                Are you sure you want to delete <strong className="text-white">{productToDelete.name}</strong>?
              </p>
              <div className="text-[11px] text-slate-400 font-mono">
                Primary Barcode: <span className="text-emerald-400">{productToDelete.barcode}</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Current On-Hand Stock: <span className="font-bold text-white">{productToDelete.stock_quantity} {productToDelete.unit}</span>
              </div>
              <p className="text-[10px] text-rose-400/90 pt-1">
                Warning: Removing this product will remove it from the catalog and barcode scanner index.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setProductToDelete(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDeleteProduct}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Product</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
