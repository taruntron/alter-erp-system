import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  Scale, 
  Layers, 
  Bookmark, 
  UserCheck, 
  Plus, 
  Trash2, 
  CheckCircle,
  Edit2,
  X,
  AlertTriangle,
  Info,
  Shield
} from 'lucide-react';
import { BrandMaster, CategoryMaster, UomMaster } from '../../types';

interface InventoryMastersViewProps {
  defaultTab?: 'uom' | 'category' | 'brand' | 'users';
}

export const InventoryMastersView: React.FC<InventoryMastersViewProps> = ({ defaultTab = 'uom' }) => {
  const { 
    uoms, 
    categories, 
    brands, 
    addUom, 
    updateUom, 
    deleteUom, 
    addCategory, 
    updateCategory, 
    deleteCategory, 
    addBrand, 
    updateBrand, 
    deleteBrand 
  } = useStore();

  const [activeTab, setActiveTab] = useState<'uom' | 'category' | 'brand' | 'users'>(defaultTab);
  const [toastMsg, setToastMsg] = useState('');

  // --- UOM State ---
  const [showAddUomModal, setShowAddUomModal] = useState(false);
  const [newUomCode, setNewUomCode] = useState('');
  const [newUomName, setNewUomName] = useState('');
  const [newUomDecimals, setNewUomDecimals] = useState(0);
  const [editingUom, setEditingUom] = useState<UomMaster | null>(null);

  // --- Category State ---
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDescription, setNewCatDescription] = useState('');
  const [editingCategory, setEditingCategory] = useState<CategoryMaster | null>(null);

  // --- Brand State ---
  const [showAddBrandModal, setShowAddBrandModal] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandOrigin, setNewBrandOrigin] = useState('Kuwait');
  const [editingBrand, setEditingBrand] = useState<BrandMaster | null>(null);

  // --- Delete Confirmation State ---
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'uom' | 'category' | 'brand';
    id: string;
    name: string;
    code?: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // --- UOM Handlers ---
  const handleAddUom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUomCode.trim() || !newUomName.trim()) return;

    await addUom({
      code: newUomCode.trim().toUpperCase(),
      name: newUomName.trim(),
      decimal_places: Number(newUomDecimals) || 0,
      is_base: false,
    });

    showToast(`UOM "${newUomCode.toUpperCase()}" created successfully!`);
    setNewUomCode('');
    setNewUomName('');
    setNewUomDecimals(0);
    setShowAddUomModal(false);
  };

  const handleUpdateUom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUom || !editingUom.code.trim() || !editingUom.name.trim()) return;

    await updateUom(editingUom.id, {
      code: editingUom.code.trim().toUpperCase(),
      name: editingUom.name.trim(),
      decimal_places: Number(editingUom.decimal_places) || 0,
    });

    showToast(`UOM "${editingUom.code}" updated successfully!`);
    setEditingUom(null);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      if (itemToDelete.type === 'uom') {
        await deleteUom(itemToDelete.id);
        showToast(`UOM "${itemToDelete.code || itemToDelete.name}" deleted successfully.`);
      } else if (itemToDelete.type === 'category') {
        await deleteCategory(itemToDelete.id);
        showToast(`Category "${itemToDelete.name}" deleted successfully.`);
      } else if (itemToDelete.type === 'brand') {
        await deleteBrand(itemToDelete.id);
        showToast(`Brand "${itemToDelete.name}" deleted successfully.`);
      }
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  // --- Category Handlers ---
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    await addCategory({
      name: newCatName.trim(),
      description: newCatDescription.trim(),
      is_active: true,
    });

    showToast(`Category "${newCatName}" added successfully!`);
    setNewCatName('');
    setNewCatDescription('');
    setShowAddCatModal(false);
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.name.trim()) return;

    await updateCategory(editingCategory.id, {
      name: editingCategory.name.trim(),
      description: editingCategory.description?.trim() || '',
      is_active: editingCategory.is_active,
    });

    showToast(`Category "${editingCategory.name}" updated successfully!`);
    setEditingCategory(null);
  };

  // --- Brand Handlers ---
  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;

    await addBrand({
      name: newBrandName.trim(),
      country_of_origin: newBrandOrigin.trim(),
      is_active: true,
    });

    showToast(`Brand "${newBrandName}" added successfully!`);
    setNewBrandName('');
    setNewBrandOrigin('Kuwait');
    setShowAddBrandModal(false);
  };

  const handleUpdateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand || !editingBrand.name.trim()) return;

    await updateBrand(editingBrand.id, {
      name: editingBrand.name.trim(),
      country_of_origin: editingBrand.country_of_origin?.trim() || '',
      is_active: editingBrand.is_active,
    });

    showToast(`Brand "${editingBrand.name}" updated successfully!`);
    setEditingBrand(null);
  };

  // --- End of Handlers ---

  return (
    <div className="h-full overflow-y-auto bg-slate-950 text-slate-100 p-3 sm:p-4 space-y-4 font-sans custom-scrollbar">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow-md">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" />
            Inventory & System Masters Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Create, alter/edit, and manage Unit of Measurement (UOM), Product Categories, Brands, and System Users
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 flex-wrap">
          <button
            onClick={() => setActiveTab('uom')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'uom' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Scale className="w-3.5 h-3.5" /> UOM Master ({uoms.length})
          </button>
          <button
            onClick={() => setActiveTab('category')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'category' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Category Master ({categories.length})
          </button>
          <button
            onClick={() => setActiveTab('brand')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'brand' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" /> Brand Master ({brands.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'users' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" /> Users Master
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="bg-emerald-500/20 border border-emerald-500/60 text-emerald-300 text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2.2 UOM MASTER */}
      {/* ========================================================================= */}
      {activeTab === 'uom' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <div className="text-xs text-slate-400">
              Define standard measurement units (e.g. <strong className="text-white">UNIT, CTN24, Box, Pcs, Dozen, Kg</strong>) for stock tracking and sales billing.
            </div>
            <button
              onClick={() => setShowAddUomModal(true)}
              className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" /> Add New UOM
            </button>
          </div>

          {/* UOMs Table / List */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-bold uppercase text-[11px] border-b border-slate-800 tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4 w-32">UOM Code</th>
                  <th className="py-3 px-4">Unit Name / Description</th>
                  <th className="py-3 px-4 w-36 text-center">Decimal Places</th>
                  <th className="py-3 px-4 w-32 text-center">Base Status</th>
                  <th className="py-3 px-4 w-36 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {uoms.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No Unit of Measurements defined yet.
                    </td>
                  </tr>
                ) : (
                  uoms.map((u, idx) => (
                    <tr key={u.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-slate-500 text-[11px]">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-purple-300 text-xs px-2.5 py-1 rounded bg-purple-950/70 border border-purple-800/60">
                          {u.code}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-white text-xs">
                        {u.name}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-300 font-mono">
                        {u.decimal_places > 0 ? (
                          <span className="text-amber-400 font-bold">{u.decimal_places} decimals</span>
                        ) : (
                          <span className="text-slate-400">0 (Whole units)</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {u.is_base ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800">
                            Base Unit
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400">
                            Standard
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setEditingUom(u)}
                            className="px-2.5 py-1 rounded bg-purple-600/20 text-purple-300 hover:bg-purple-600 hover:text-white font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                            title="Alter / Edit UOM"
                          >
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                          <button
                            onClick={() => setItemToDelete({ type: 'uom', id: u.id, name: u.name, code: u.code })}
                            className="p-1 rounded text-rose-400 hover:bg-rose-950/60 hover:text-rose-300 transition-colors cursor-pointer"
                            title="Delete UOM"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2.3 CATEGORY MASTER */}
      {/* ========================================================================= */}
      {activeTab === 'category' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <div className="text-xs text-slate-400">
              Manage product classification categories (e.g. <strong className="text-white">Hair Care & Tools, Henna, Creams, Salon Supplies</strong>).
            </div>
            <button
              onClick={() => setShowAddCatModal(true)}
              className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" /> Add Category
            </button>
          </div>

          {/* Category Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-bold uppercase text-[11px] border-b border-slate-800 tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4 min-w-[200px]">Category Name</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 w-28 text-center">Status</th>
                  <th className="py-3 px-4 w-36 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No categories defined yet.
                    </td>
                  </tr>
                ) : (
                  categories.map((cat, idx) => (
                    <tr key={cat.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-slate-500 text-[11px]">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-white text-xs">
                        {cat.name}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {cat.description || 'General cosmetics and salon supplies'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800">
                          Active
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setEditingCategory(cat)}
                            className="px-2.5 py-1 rounded bg-purple-600/20 text-purple-300 hover:bg-purple-600 hover:text-white font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                            title="Alter / Edit Category"
                          >
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                          <button
                            onClick={() => setItemToDelete({ type: 'category', id: cat.id, name: cat.name })}
                            className="p-1 rounded text-rose-400 hover:bg-rose-950/60 hover:text-rose-300 transition-colors cursor-pointer"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2.4 BRAND MASTER */}
      {/* ========================================================================= */}
      {activeTab === 'brand' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <div className="text-xs text-slate-400">
              Manage cosmetic and salon product brands with certified country of origin tracking.
            </div>
            <button
              onClick={() => setShowAddBrandModal(true)}
              className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" /> Add Brand
            </button>
          </div>

          {/* Brand Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-bold uppercase text-[11px] border-b border-slate-800 tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4 min-w-[200px]">Brand Name</th>
                  <th className="py-3 px-4 w-44">Country of Origin</th>
                  <th className="py-3 px-4 w-28 text-center">Status</th>
                  <th className="py-3 px-4 w-36 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {brands.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No brands defined yet.
                    </td>
                  </tr>
                ) : (
                  brands.map((b, idx) => (
                    <tr key={b.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-slate-500 text-[11px]">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-white text-xs">
                        {b.name}
                      </td>
                      <td className="py-3 px-4 text-blue-300 font-medium">
                        {b.country_of_origin || 'Imported'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800">
                          Active
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setEditingBrand(b)}
                            className="px-2.5 py-1 rounded bg-purple-600/20 text-purple-300 hover:bg-purple-600 hover:text-white font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                            title="Alter / Edit Brand"
                          >
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                          <button
                            onClick={() => setItemToDelete({ type: 'brand', id: b.id, name: b.name })}
                            className="p-1 rounded text-rose-400 hover:bg-rose-950/60 hover:text-rose-300 transition-colors cursor-pointer"
                            title="Delete Brand"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. USERS MASTER */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-md">
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" />
              Authorized System Operators & Permissions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                  <th className="p-3">User Name</th>
                  <th className="p-3">Login Email / Username</th>
                  <th className="p-3">System Role</th>
                  <th className="p-3">Accessible Branches</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                <tr className="hover:bg-slate-800/40">
                  <td className="p-3 font-bold text-white">Super Admin (HQ)</td>
                  <td className="p-3 font-mono text-purple-400">admin@cosmetics.pos</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-950 text-rose-400 border border-rose-800">
                      ADMIN / FULL CONTROL
                    </span>
                  </td>
                  <td className="p-3 text-slate-300">All Sections / Multi-Branch</td>
                  <td className="p-3 text-center">
                    <span className="text-emerald-400 font-bold text-xs">Active</span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-800/40">
                  <td className="p-3 font-bold text-white">Store Manager</td>
                  <td className="p-3 font-mono text-purple-400">manager@cosmetics.pos</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-950 text-purple-400 border border-purple-800">
                      MANAGER / SUPERVISOR
                    </span>
                  </td>
                  <td className="p-3 text-slate-300">Main Retail Counter</td>
                  <td className="p-3 text-center">
                    <span className="text-emerald-400 font-bold text-xs">Active</span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-800/40">
                  <td className="p-3 font-bold text-white">POS Cashier #1</td>
                  <td className="p-3 font-mono text-purple-400">cashier1@cosmetics.pos</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-950 text-blue-400 border border-blue-800">
                      CASHIER / OPERATOR
                    </span>
                  </td>
                  <td className="p-3 text-slate-300">Terminal #1 Counter</td>
                  <td className="p-3 text-center">
                    <span className="text-emerald-400 font-bold text-xs">Active</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS: ADD & EDIT FOR UOM, CATEGORY, BRAND */}
      {/* ========================================================================= */}

      {/* Add UOM Modal */}
      {showAddUomModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddUom} className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-purple-400" />
                Add New Unit of Measurement (UOM)
              </h3>
              <button type="button" onClick={() => setShowAddUomModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">UOM Code * (e.g. CTN24, Box, Pcs, Kg)</label>
                <input
                  type="text"
                  required
                  value={newUomCode}
                  onChange={(e) => setNewUomCode(e.target.value)}
                  placeholder="e.g. CTN24"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-purple-300 font-mono font-bold outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Unit Full Name *</label>
                <input
                  type="text"
                  required
                  value={newUomName}
                  onChange={(e) => setNewUomName(e.target.value)}
                  placeholder="e.g. Carton of 24 Units"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Decimal Precision (Places)</label>
                <input
                  type="number"
                  min="0"
                  max="4"
                  value={newUomDecimals}
                  onChange={(e) => setNewUomDecimals(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono outline-none focus:border-purple-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">0 for discrete items, 2 or 3 for weight/length units</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddUomModal(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-xs cursor-pointer"
              >
                Save UOM
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit UOM Modal */}
      {editingUom && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleUpdateUom} className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-purple-400" />
                Alter / Edit Unit of Measurement
              </h3>
              <button type="button" onClick={() => setEditingUom(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">UOM Code *</label>
                <input
                  type="text"
                  required
                  value={editingUom.code}
                  onChange={(e) => setEditingUom({ ...editingUom, code: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-purple-300 font-mono font-bold outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Unit Full Name *</label>
                <input
                  type="text"
                  required
                  value={editingUom.name}
                  onChange={(e) => setEditingUom({ ...editingUom, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Decimal Precision</label>
                <input
                  type="number"
                  min="0"
                  max="4"
                  value={editingUom.decimal_places}
                  onChange={(e) => setEditingUom({ ...editingUom, decimal_places: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingUom(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-xs cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCatModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddCategory} className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-400" />
                Add Product Category
              </h3>
              <button type="button" onClick={() => setShowAddCatModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Category Name *</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Organic Henna & Oils"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Description</label>
                <input
                  type="text"
                  value={newCatDescription}
                  onChange={(e) => setNewCatDescription(e.target.value)}
                  placeholder="e.g. Natural henna powders, essential extracts"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddCatModal(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-xs cursor-pointer"
              >
                Save Category
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleUpdateCategory} className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-purple-400" />
                Alter / Edit Category
              </h3>
              <button type="button" onClick={() => setEditingCategory(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Category Name *</label>
                <input
                  type="text"
                  required
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Description</label>
                <input
                  type="text"
                  value={editingCategory.description || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-xs cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Brand Modal */}
      {showAddBrandModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddBrand} className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-400" />
                Add Cosmetic Brand
              </h3>
              <button type="button" onClick={() => setShowAddBrandModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Brand Name *</label>
                <input
                  type="text"
                  required
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="e.g. K18 Hair / Moroccan Oil"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Country of Origin</label>
                <input
                  type="text"
                  value={newBrandOrigin}
                  onChange={(e) => setNewBrandOrigin(e.target.value)}
                  placeholder="e.g. USA, France, Italy, Kuwait"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddBrandModal(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-xs cursor-pointer"
              >
                Save Brand
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Brand Modal */}
      {editingBrand && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleUpdateBrand} className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-purple-400" />
                Alter / Edit Brand
              </h3>
              <button type="button" onClick={() => setEditingBrand(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Brand Name *</label>
                <input
                  type="text"
                  required
                  value={editingBrand.name}
                  onChange={(e) => setEditingBrand({ ...editingBrand, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Country of Origin</label>
                <input
                  type="text"
                  value={editingBrand.country_of_origin || ''}
                  onChange={(e) => setEditingBrand({ ...editingBrand, country_of_origin: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingBrand(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-xs cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation In-App Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/20 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Confirm Deletion
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Delete {itemToDelete.type === 'uom' ? 'Unit of Measurement' : itemToDelete.type === 'category' ? 'Category' : 'Brand'}
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs">
              <p className="text-slate-300">
                Are you sure you want to delete <strong className="text-white font-bold">{itemToDelete.name}</strong>
                {itemToDelete.code ? ` (${itemToDelete.code})` : ''}?
              </p>
              <p className="text-[11px] text-slate-500 mt-1.5">
                This item will be permanently removed from active selection lists.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setItemToDelete(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Permanently</span>
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
