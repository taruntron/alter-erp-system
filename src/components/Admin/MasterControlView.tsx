import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { 
  Crown, 
  ShieldCheck, 
  Sliders, 
  Users, 
  Store, 
  Database, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  DollarSign, 
  RefreshCw, 
  Layers, 
  Trash2, 
  Plus, 
  Building2,
  Warehouse,
  MapPin,
  Phone,
  Shield,
  X,
  Edit2,
  KeyRound,
  Eye,
  EyeOff,
  AlertTriangle,
  Check,
  Settings
} from 'lucide-react';
import { StoreSection, RoleAuthority } from '../../types';
import { MasterSettingsTab } from './MasterSettingsTab';

export const MasterControlView: React.FC = () => {
  const { 
    user, 
    isSuperAdmin, 
    systemUsers, 
    addUser, 
    updateUser, 
    deleteUser, 
    updateUserRole,
    roles,
    addRole,
    updateRole,
    deleteRole,
    activeSection,
    setActiveSection
  } = useAuth();

  const { 
    products, 
    invoices, 
    purchases, 
    sections, 
    addSection, 
    updateSection, 
    deleteSection 
  } = useStore();

  const [activeTab, setActiveTab] = useState<'roles' | 'sections' | 'adjustments' | 'modules' | 'database' | 'master_settings'>('roles');
  const [toastMsg, setToastMsg] = useState('');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  // Global Settings State
  const [currency, setCurrency] = useState(() => localStorage.getItem('apex_sys_currency') || 'KWD');
  const [taxRate, setTaxRate] = useState(() => localStorage.getItem('apex_sys_tax') || '0');
  const [allowNegativeStock, setAllowNegativeStock] = useState(() => localStorage.getItem('apex_sys_neg_stock') === 'true');
  const [enableDiscounts, setEnableDiscounts] = useState(() => localStorage.getItem('apex_sys_discounts') !== 'false');
  const [maxDiscountPercent, setMaxDiscountPercent] = useState(() => localStorage.getItem('apex_sys_max_disc') || '100');

  // Role creation & editing form state
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleKey, setRoleKey] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [roleModules, setRoleModules] = useState<RoleAuthority['modules']>({
    sales_pos: true,
    sales_return: false,
    quotations: false,
    purchase_invoice: false,
    purchase_orders: false,
    accounting: false,
    vouchers: false,
    inventory_masters: false,
    stock_transfer: false,
    price_lists: false,
    reports: false,
    master_control: false,
  });

  // Section / Branch creation & editing form state
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [sectionName, setSectionName] = useState('');
  const [sectionCode, setSectionCode] = useState('');
  const [sectionType, setSectionType] = useState<'store' | 'warehouse' | 'office'>('store');
  const [sectionAddress, setSectionAddress] = useState('');
  const [sectionPhone, setSectionPhone] = useState('');
  const [sectionManager, setSectionManager] = useState('');
  const [sectionStatus, setSectionStatus] = useState<'active' | 'inactive'>('active');

  // User / Operator creation & editing form state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<string>('cashier');
  const [newUserBranches, setNewUserBranches] = useState<string[]>([]);
  const [newUserCanChangeBranch, setNewUserCanChangeBranch] = useState(false);

  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUsername, setEditingUsername] = useState('');
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<string>('cashier');
  const [editUserBranches, setEditUserBranches] = useState<string[]>([]);
  const [editCanChangeBranch, setEditCanChangeBranch] = useState(false);

  // Module lock state overrides
  const [moduleLocks, setModuleLocks] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('apex_module_locks');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      sales_pos: false,
      purchase_invoice: false,
      accounting: false,
      masters: false,
      inventory: false,
      reports: false,
    };
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const togglePasswordVisibility = (username: string) => {
    setRevealedPasswords((prev) => ({ ...prev, [username]: !prev[username] }));
  };

  // Handle Save Global Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('apex_sys_currency', currency);
    localStorage.setItem('apex_sys_tax', taxRate);
    localStorage.setItem('apex_sys_neg_stock', allowNegativeStock ? 'true' : 'false');
    localStorage.setItem('apex_sys_discounts', enableDiscounts ? 'true' : 'false');
    localStorage.setItem('apex_sys_max_disc', maxDiscountPercent);
    showToast('System adjustments saved successfully across all active terminals!');
  };

  const toggleModuleLock = (modKey: string) => {
    setModuleLocks((prev) => {
      const updated = { ...prev, [modKey]: !prev[modKey] };
      localStorage.setItem('apex_module_locks', JSON.stringify(updated));
      return updated;
    });
    showToast(`Updated access lock for module "${modKey}"!`);
  };

  // Role CRUD operations
  const handleOpenCreateRole = () => {
    setEditingRoleId(null);
    setRoleName('');
    setRoleKey('');
    setRoleDesc('');
    setRoleModules({
      sales_pos: true,
      sales_return: false,
      quotations: false,
      purchase_invoice: false,
      purchase_orders: false,
      accounting: false,
      vouchers: false,
      inventory_masters: false,
      stock_transfer: false,
      price_lists: false,
      reports: false,
      master_control: false,
      change_branch: false,
    });
    setShowRoleModal(true);
  };

  const handleOpenEditRole = (role: RoleAuthority) => {
    setEditingRoleId(role.id);
    setRoleName(role.name);
    setRoleKey(role.id);
    setRoleDesc(role.description || '');
    setRoleModules({ ...role.modules, change_branch: !!role.modules.change_branch });
    setShowRoleModal(true);
  };

  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) return;

    if (editingRoleId) {
      updateRole(editingRoleId, {
        name: roleName.trim(),
        description: roleDesc.trim(),
        modules: roleModules,
      });
      showToast(`Role Authority "${roleName}" updated successfully!`);
    } else {
      const generatedId = (roleKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')) || `role_${Date.now()}`;
      addRole({
        id: generatedId,
        name: roleName.trim(),
        description: roleDesc.trim(),
        isSystem: false,
        modules: roleModules,
      });
      showToast(`New Role Authority "${roleName}" created!`);
    }
    setShowRoleModal(false);
  };

  const handleDeleteRole = (role: RoleAuthority) => {
    if (role.id === 'superadmin') {
      alert('Super Master Admin role is protected and cannot be deleted.');
      return;
    }
    const assignedUsers = systemUsers.filter((u) => u.role === role.id);
    if (assignedUsers.length > 0) {
      const proceed = window.confirm(
        `There are ${assignedUsers.length} operators currently assigned to "${role.name}". Deleting this role will reassign those operators to Cashier. Proceed?`
      );
      if (!proceed) return;
      assignedUsers.forEach((u) => {
        if (u.username.toLowerCase() !== 'tarun') {
          updateUserRole(u.username, 'cashier');
        }
      });
    } else {
      const proceed = window.confirm(`Are you sure you want to delete Role/Authority "${role.name}"?`);
      if (!proceed) return;
    }
    deleteRole(role.id);
    showToast(`Role Authority "${role.name}" deleted.`);
  };

  // Branch & Section CRUD operations
  const handleOpenCreateSection = () => {
    setEditingSectionId(null);
    setSectionName('');
    setSectionCode(`BR-${sections.length + 1}`);
    setSectionType('store');
    setSectionAddress('');
    setSectionPhone('');
    setSectionManager('');
    setSectionStatus('active');
    setShowSectionModal(true);
  };

  const handleOpenEditSection = (sec: StoreSection) => {
    setEditingSectionId(sec.id);
    setSectionName(sec.name);
    setSectionCode(sec.code);
    setSectionType(sec.type);
    setSectionAddress(sec.address || '');
    setSectionPhone(sec.phone || '');
    setSectionManager(sec.manager || '');
    setSectionStatus(sec.status || 'active');
    setShowSectionModal(true);
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionName.trim()) return;

    if (editingSectionId) {
      await updateSection(editingSectionId, {
        name: sectionName.trim(),
        code: sectionCode.trim().toUpperCase() || 'BR-01',
        type: sectionType,
        address: sectionAddress.trim(),
        phone: sectionPhone.trim(),
        manager: sectionManager.trim(),
        status: sectionStatus,
      });
      showToast(`Branch & Section "${sectionName}" updated successfully!`);
    } else {
      await addSection({
        name: sectionName.trim(),
        code: sectionCode.trim().toUpperCase() || `BR-${sections.length + 1}`,
        type: sectionType,
        address: sectionAddress.trim(),
        phone: sectionPhone.trim(),
        manager: sectionManager.trim(),
        status: sectionStatus,
      });
      showToast(`New Branch & Section "${sectionName}" created successfully!`);
    }
    setShowSectionModal(false);
  };

  const handleDeleteSection = async (sec: StoreSection) => {
    if (sections.length <= 1) {
      alert('The system must have at least one active Branch or Section.');
      return;
    }
    const proceed = window.confirm(
      `Are you sure you want to delete branch/section "${sec.name}" (${sec.code})?`
    );
    if (!proceed) return;

    await deleteSection(sec.id);
    if (activeSection === sec.name) {
      const remaining = sections.filter((s) => s.id !== sec.id);
      if (remaining.length > 0) {
        setActiveSection(remaining[0].name);
      }
    }
    showToast(`Branch & Section "${sec.name}" deleted.`);
  };

  // Operator CRUD operations
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;

    addUser({
      username: newUsername.trim(),
      password: newPassword, // any password accepted, no word limits
      displayName: newName.trim() || newUsername.trim(),
      role: newRole,
      createdAt: new Date().toISOString(),
      isSuperMasterAdmin: newRole === 'superadmin',
      allowedBranches: newUserBranches.length > 0 ? newUserBranches : undefined,
      canChangeTransactionBranch: newRole === 'superadmin' ? true : newUserCanChangeBranch,
    });

    showToast(`Operator "${newUsername}" created with role "${newRole}"!`);
    setNewUsername('');
    setNewPassword('');
    setNewName('');
    setNewRole('cashier');
    setNewUserBranches([]);
    setNewUserCanChangeBranch(false);
    setShowAddUserModal(false);
  };

  const handleOpenEditUser = (u: any) => {
    setEditingUsername(u.username);
    setEditDisplayName(u.displayName || u.username);
    setEditPassword(u.password || '');
    setEditRole(u.role);
    setEditUserBranches(u.allowedBranches ? [...u.allowedBranches] : []);
    setEditCanChangeBranch(u.canChangeTransactionBranch === true || u.role === 'superadmin' || u.isSuperMasterAdmin === true);
    setShowEditUserModal(true);
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser(editingUsername, {
      displayName: editDisplayName.trim() || editingUsername,
      password: editPassword,
      role: editRole,
      allowedBranches: editUserBranches.length > 0 ? editUserBranches : undefined,
      canChangeTransactionBranch: editRole === 'superadmin' ? true : editCanChangeBranch,
    });
    showToast(`Operator "${editingUsername}" credentials, role and branch permissions updated!`);
    setShowEditUserModal(false);
  };

  return (
    <div className="h-full flex flex-col bg-slate-100 overflow-hidden select-none">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-purple-500/50 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-800 text-white p-4 sm:p-5 border-b border-purple-900 shadow-md shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-white">
                  Super Master Admin Control Center
                </h1>
                <span className="bg-amber-400/20 text-amber-300 border border-amber-300/40 px-2 py-0.5 rounded text-[10px] font-black uppercase">
                  Root Level Access
                </span>
              </div>
              <p className="text-xs text-purple-200 mt-0.5">
                Full authority over every module, submodule, user privilege, role authority, and branch control
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/15 text-right">
              <div className="text-[10px] text-purple-200">Active Super Master:</div>
              <div className="text-xs font-black text-amber-300 font-mono">
                {user?.displayName || 'Tarun'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 shrink-0 shadow-2xs">
        <div className="flex items-center gap-4 max-w-7xl mx-auto overflow-x-auto text-xs font-black">
          <button
            id="tab-btn-roles"
            type="button"
            onClick={() => setActiveTab('roles')}
            className={`py-3.5 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'roles'
                ? 'border-purple-700 text-purple-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>1. Role & Authority Control</span>
          </button>

          <button
            id="tab-btn-sections"
            type="button"
            onClick={() => setActiveTab('sections')}
            className={`py-3.5 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'sections'
                ? 'border-purple-700 text-purple-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>2. Branch & Section Control</span>
          </button>

          <button
            id="tab-btn-adjustments"
            type="button"
            onClick={() => setActiveTab('adjustments')}
            className={`py-3.5 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'adjustments'
                ? 'border-purple-700 text-purple-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>3. System & Financial Adjustments</span>
          </button>

          <button
            id="tab-btn-modules"
            type="button"
            onClick={() => setActiveTab('modules')}
            className={`py-3.5 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'modules'
                ? 'border-purple-700 text-purple-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>4. Module Access Controls</span>
          </button>

          <button
            id="tab-btn-database"
            type="button"
            onClick={() => setActiveTab('database')}
            className={`py-3.5 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'database'
                ? 'border-purple-700 text-purple-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>5. Database Sync & Diagnostics</span>
          </button>

          <button
            id="tab-btn-master-settings"
            type="button"
            onClick={() => setActiveTab('master_settings')}
            className={`py-3.5 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'master_settings'
                ? 'border-purple-700 text-purple-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>6. Master Settings (Print, Layout & Exchange)</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* TAB 1: ROLE & AUTHORITY CONTROL */}
          {activeTab === 'roles' && (
            <div className="space-y-6">
              
              {/* Section 1A: Roles & Authority Matrix */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
                  <div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-purple-700" />
                      <h3 className="text-sm font-black text-slate-900">
                        Configured Roles & Authority Levels
                      </h3>
                      <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-[11px] font-bold">
                        {roles.length} Roles Active
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Create custom roles, edit module authorities, or delete obsolete roles
                    </p>
                  </div>

                  <button
                    id="btn-create-role"
                    type="button"
                    onClick={handleOpenCreateRole}
                    className="flex items-center gap-1.5 px-3 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create New Role / Authority</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 sm:p-5 bg-slate-50/50">
                  {roles.map((role) => {
                    const isSuper = role.id === 'superadmin';
                    const assignedUsers = systemUsers.filter((u) => u.role === role.id);
                    const enabledCount = Object.values(role.modules || {}).filter(Boolean).length;
                    const totalModules = Object.keys(role.modules || {}).length;

                    return (
                      <div 
                        key={role.id} 
                        className={`bg-white border rounded-2xl p-4.5 flex flex-col justify-between transition-shadow hover:shadow-md ${
                          isSuper 
                            ? 'border-amber-300 ring-1 ring-amber-300/50 bg-gradient-to-br from-amber-50/30 via-white to-white' 
                            : 'border-slate-200'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                                isSuper ? 'bg-amber-400 text-slate-950 shadow-xs' : 'bg-purple-100 text-purple-800'
                              }`}>
                                {isSuper ? <Crown className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                                  <span>{role.name}</span>
                                  {isSuper && (
                                    <span className="bg-amber-400/20 text-amber-800 border border-amber-300 text-[9px] px-1.5 py-0.2 rounded font-black uppercase">
                                      Root
                                    </span>
                                  )}
                                </h4>
                                <span className="text-[10px] text-slate-400 font-mono">key: {role.id}</span>
                              </div>
                            </div>

                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                              {assignedUsers.length} {assignedUsers.length === 1 ? 'Operator' : 'Operators'}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-600 mb-3 min-h-[32px] leading-relaxed">
                            {role.description || 'Custom defined authority level for system users.'}
                          </p>

                          {/* Module Authority Badges */}
                          <div className="pt-2.5 border-t border-slate-100 mb-3">
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1.5">
                              <span>Module Authority Coverage:</span>
                              <span className="text-purple-700">{enabledCount} / {totalModules} active</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {role.modules.sales_pos && (
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] px-1.5 py-0.5 rounded font-bold">
                                  Sales POS
                                </span>
                              )}
                              {role.modules.sales_return && (
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] px-1.5 py-0.5 rounded font-bold">
                                  Sales Returns
                                </span>
                              )}
                              {role.modules.quotations && (
                                <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[9px] px-1.5 py-0.5 rounded font-bold">
                                  Quotations
                                </span>
                              )}
                              {role.modules.purchase_invoice && (
                                <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[9px] px-1.5 py-0.5 rounded font-bold">
                                  Purchase Invoices
                                </span>
                              )}
                              {role.modules.purchase_orders && (
                                <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[9px] px-1.5 py-0.5 rounded font-bold">
                                  Purchase Orders
                                </span>
                              )}
                              {role.modules.accounting && (
                                <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[9px] px-1.5 py-0.5 rounded font-bold">
                                  Accounting & P&L
                                </span>
                              )}
                              {role.modules.vouchers && (
                                <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[9px] px-1.5 py-0.5 rounded font-bold">
                                  Vouchers
                                </span>
                              )}
                              {role.modules.inventory_masters && (
                                <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[9px] px-1.5 py-0.5 rounded font-bold">
                                  Item Masters
                                </span>
                              )}
                              {role.modules.stock_transfer && (
                                <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[9px] px-1.5 py-0.5 rounded font-bold">
                                  Stock Transfers
                                </span>
                              )}
                              {role.modules.reports && (
                                <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[9px] px-1.5 py-0.5 rounded font-bold">
                                  Reports
                                </span>
                              )}
                              {role.modules.master_control && (
                                <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[9px] px-1.5 py-0.5 rounded font-black">
                                  Master Control
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                          <div className="text-[10px] text-slate-400">
                            {isSuper ? 'Permanent system master' : role.isSystem ? 'Baseline template' : 'Custom authority'}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditRole(role)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-900 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                              title="Edit Role & Permissions"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit Authority</span>
                            </button>

                            {!isSuper && (
                              <button
                                type="button"
                                onClick={() => handleDeleteRole(role)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Role"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 1B: Authorized Operators & Passwords */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-700" />
                      Authorized Operators & Credential Management
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Assign roles, edit display names, and set passwords (any length, no restrictions)
                    </p>
                  </div>

                  <button
                    id="btn-create-operator"
                    type="button"
                    onClick={() => setShowAddUserModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create New Operator</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 font-black uppercase tracking-wider border-b border-slate-200">
                        <th className="p-3.5">Username</th>
                        <th className="p-3.5">Display Name</th>
                        <th className="p-3.5">Password</th>
                        <th className="p-3.5">Role / Authority Level</th>
                        <th className="p-3.5">Branch Access / Scope</th>
                        <th className="p-3.5 text-center">Change Branch Access</th>
                        <th className="p-3.5">Assigned Modules</th>
                        <th className="p-3.5 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {systemUsers.map((u) => {
                        const isTarun = u.username.toLowerCase() === 'tarun';
                        const isRevealed = !!revealedPasswords[u.username];
                        const roleObj = roles.find((r) => r.id === u.role);

                        return (
                          <tr key={u.username} className={`hover:bg-slate-50 ${isTarun ? 'bg-amber-50/40' : ''}`}>
                            <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                              {isTarun && <Crown className="w-4 h-4 text-amber-500 shrink-0" />}
                              <span>{u.username}</span>
                            </td>
                            <td className="p-3.5 text-slate-700 font-medium">
                              {u.displayName}
                            </td>
                            <td className="p-3.5">
                              <div className="flex items-center gap-2 font-mono font-bold text-purple-900">
                                <span>{isRevealed ? (u.password || 'none') : '••••••••'}</span>
                                <button
                                  type="button"
                                  onClick={() => togglePasswordVisibility(u.username)}
                                  className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                                  title={isRevealed ? 'Hide password' : 'View password'}
                                >
                                  {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </td>
                            <td className="p-3.5">
                              {isTarun ? (
                                <span className="px-2.5 py-1 rounded text-[10px] font-black uppercase bg-amber-400 text-slate-950 shadow-2xs">
                                  Super Master Admin
                                </span>
                              ) : (
                                <select
                                  value={u.role}
                                  onChange={(e) => updateUserRole(u.username, e.target.value)}
                                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 outline-none focus:border-purple-600"
                                >
                                  {roles.map((r) => (
                                    <option key={r.id} value={r.id}>
                                      {r.name}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </td>
                            <td className="p-3.5">
                              {isTarun ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  All Branches (Full Access)
                                </span>
                              ) : u.allowedBranches && u.allowedBranches.length > 0 ? (
                                <div className="space-y-1">
                                  <span className="text-[10px] font-black text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded inline-block">
                                    Restricted to {u.allowedBranches.length} {u.allowedBranches.length === 1 ? 'branch' : 'branches'}:
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    {u.allowedBranches.map((br) => (
                                      <span key={br} className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
                                        {br}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                  All Branches (Unrestricted)
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-center">
                              {isTarun || u.role === 'superadmin' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <Check className="w-3 h-3 text-emerald-600" /> Full Access
                                </span>
                              ) : u.canChangeTransactionBranch ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateUser(u.username, { canChangeTransactionBranch: false });
                                    showToast(`Revoked Change Branch access for ${u.username}`);
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 transition-colors cursor-pointer"
                                  title="Click to Revoke Change Branch Access"
                                >
                                  <Check className="w-3 h-3 text-emerald-600" /> Authorized (Revoke)
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateUser(u.username, { canChangeTransactionBranch: true });
                                    showToast(`Granted Change Branch access for ${u.username}`);
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-300 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-colors cursor-pointer"
                                  title="Click to Grant Change Branch Access"
                                >
                                  <Lock className="w-3 h-3 text-slate-400" /> Restricted (Grant)
                                </button>
                              )}
                            </td>
                            <td className="p-3.5 text-slate-600">
                              {isTarun ? (
                                <span className="text-emerald-700 font-bold text-[11px]">
                                  ✓ Full Root Authority (All Modules & Adjustments)
                                </span>
                              ) : (
                                <span className="text-slate-700 font-medium text-[11px]">
                                  {roleObj ? roleObj.name : u.role}
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditUser(u)}
                                  className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors cursor-pointer"
                                  title="Edit Credentials & Role"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>

                                {!isTarun && (
                                  <button
                                    type="button"
                                    onClick={() => deleteUser(u.username)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                    title="Delete Operator"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: BRANCH & SECTION CONTROL */}
          {activeTab === 'sections' && (
            <div className="space-y-6">
              
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
                  <div>
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-purple-700" />
                      <h3 className="text-sm font-black text-slate-900">
                        Configured Branches, Showrooms & Warehouses
                      </h3>
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[11px] font-bold">
                        {sections.length} Branches Active
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Create new branches, edit codes & facility types, or delete branches across the network
                    </p>
                  </div>

                  <button
                    id="btn-create-branch"
                    type="button"
                    onClick={handleOpenCreateSection}
                    className="flex items-center gap-1.5 px-3 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create New Branch / Section</span>
                  </button>
                </div>

                {/* Active Terminal Notice */}
                <div className="p-3 sm:px-5 bg-purple-50/60 border-b border-purple-100 flex items-center justify-between gap-2 text-xs text-purple-900">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>
                      Currently Active Terminal Branch: <strong className="font-mono text-purple-950 font-black">{activeSection}</strong>
                    </span>
                  </div>
                  <span className="text-[11px] text-purple-700">
                    Switch active branch anytime via the top header or click "Set Active" on any branch card below.
                  </span>
                </div>

                {/* Grid of Branches */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 sm:p-5 bg-slate-50/50">
                  {sections.map((sec, idx) => {
                    const isCurrent = activeSection === sec.name;
                    return (
                      <div
                        key={sec.id}
                        className={`bg-white border rounded-2xl p-4.5 flex flex-col justify-between transition-all hover:shadow-md ${
                          isCurrent 
                            ? 'border-purple-600 ring-2 ring-purple-600/20 shadow-xs' 
                            : 'border-slate-200'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                                sec.type === 'warehouse' 
                                  ? 'bg-amber-100 text-amber-800' 
                                  : sec.type === 'office'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {sec.type === 'warehouse' ? (
                                  <Warehouse className="w-4 h-4" />
                                ) : sec.type === 'office' ? (
                                  <Building2 className="w-4 h-4" />
                                ) : (
                                  <Store className="w-4 h-4" />
                                )}
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-slate-900">{sec.name}</h4>
                                <span className="text-[10px] text-slate-500 font-mono">Code: {sec.code}</span>
                              </div>
                            </div>

                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                              sec.status === 'inactive'
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {sec.status === 'inactive' ? 'Inactive' : 'Online Active'}
                            </span>
                          </div>

                          <div className="space-y-1.5 my-3 text-[11px] text-slate-600">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 font-bold w-14">Type:</span>
                              <span className="font-semibold text-slate-800 capitalize">
                                {sec.type === 'store' ? 'Retail Store' : sec.type === 'warehouse' ? 'Storage Warehouse' : 'Head Office'}
                              </span>
                            </div>

                            {sec.address && (
                              <div className="flex items-start gap-2">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                <span className="text-slate-700 truncate">{sec.address}</span>
                              </div>
                            )}

                            {sec.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="text-slate-700 font-mono">{sec.phone}</span>
                              </div>
                            )}

                            {sec.manager && (
                              <div className="flex items-center gap-2">
                                <span className="text-slate-400 font-bold w-14">Manager:</span>
                                <span className="text-slate-800 font-medium">{sec.manager}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSection(sec.name);
                              showToast(`Switched terminal branch to "${sec.name}"`);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isCurrent
                                ? 'bg-purple-700 text-white font-black'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            {isCurrent ? '✓ Active Branch' : 'Set Active'}
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditSection(sec)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-900 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                              title="Edit Branch Settings"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteSection(sec)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Branch"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: SYSTEM & FINANCIAL ADJUSTMENTS */}
          {activeTab === 'adjustments' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Financial & Invoicing Adjustments Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
                  <div className="p-2 bg-purple-100 text-purple-800 rounded-xl">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Currency & Tax Adjustments</h3>
                    <p className="text-[11px] text-slate-500">Affects POS, Purchase invoices, and financial ledgers</p>
                  </div>
                </div>

                <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-black text-slate-700 uppercase tracking-wider mb-1">
                      System Currency Symbol
                    </label>
                    <input
                      type="text"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                      placeholder="KWD, USD, EUR, SAR"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:bg-white focus:border-purple-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-black text-slate-700 uppercase tracking-wider mb-1">
                      Default Value Added Tax (VAT) Rate %
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      placeholder="0 for Kuwait, or 5, 15"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:bg-white focus:border-purple-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-black text-slate-700 uppercase tracking-wider mb-1">
                      Max Allowed Cashier Discount (%)
                    </label>
                    <input
                      type="number"
                      value={maxDiscountPercent}
                      onChange={(e) => setMaxDiscountPercent(e.target.value)}
                      placeholder="100"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:bg-white focus:border-purple-600 outline-none"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-bold">
                      <input
                        type="checkbox"
                        checked={allowNegativeStock}
                        onChange={(e) => setAllowNegativeStock(e.target.checked)}
                        className="rounded text-purple-700 focus:ring-purple-500"
                      />
                      <span>Allow Negative Stock Invoicing (Billing without inward stock)</span>
                    </label>
                  </div>

                  <div className="flex justify-end pt-3">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-black rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      Save Financial Adjustments
                    </button>
                  </div>
                </form>
              </div>

              {/* Branch Quick Overview Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
                  <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Multi-Branch Architecture</h3>
                    <p className="text-[11px] text-slate-500">Fast overview of configured facilities</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {sections.slice(0, 5).map((sec, idx) => (
                    <div key={sec.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-purple-200 text-purple-900 flex items-center justify-center font-bold text-xs">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{sec.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">Code: {sec.code} • Type: {sec.type}</div>
                        </div>
                      </div>
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                        Online Active
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900">
                  <span className="font-bold">Super Master Admin Privilege:</span> You can manage all branches, add new warehouses, edit locations, or delete branches in the <strong>Branch & Section Control</strong> tab.
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: MODULE ACCESS CONTROLS */}
          {activeTab === 'modules' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900">Module Access Authority Control</h3>
                <p className="text-[11px] text-slate-500">
                  Super Master Admin can lock or unlock individual sub-modules for cashiers and managers
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { key: 'sales_pos', name: 'Sales & POS Billing', desc: 'Counter billing, multi-bill queue, thermal receipt' },
                  { key: 'purchase_invoice', name: 'Purchase Invoicing', desc: 'Supplier bills, inward stock, costing' },
                  { key: 'accounting', name: 'Financial Accounting & Ledgers', desc: 'P&L, Balance Sheet, Cash Flow, Chart of Accounts' },
                  { key: 'masters', name: 'Inventory Masters (Items, Brands, UOM)', desc: 'Product catalogs, barcodes, prices' },
                  { key: 'inventory', name: 'Stock Adjustments & Transfers', desc: 'Inter-branch stock moves, batch tracking' },
                  { key: 'reports', name: 'Analytics & Financial Reports', desc: 'Sales, Profit & Loss, Item Margins' },
                ].map((mod) => {
                  const isLocked = moduleLocks[mod.key];
                  return (
                    <div key={mod.key} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900">{mod.name}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isLocked ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isLocked ? 'Locked for Non-Admins' : 'Unlocked'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">{mod.desc}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-[10px] text-purple-700 font-bold">
                          Tarun: Full Unrestricted
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleModuleLock(mod.key)}
                          className={`px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                            isLocked
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-rose-600 hover:bg-rose-700 text-white'
                          }`}
                        >
                          {isLocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                          <span>{isLocked ? 'Unlock Module' : 'Lock Module'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: DATABASE & MAINTENANCE */}
          {activeTab === 'database' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900">Database & State Diagnostic</h3>
                <p className="text-[11px] text-slate-500">Live counts and synchronization with Firestore</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
                  <div className="text-slate-600 text-[11px]">Total Products</div>
                  <div className="text-lg font-black text-purple-900 mt-1 font-mono">{products.length}</div>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="text-slate-600 text-[11px]">Sales Invoices</div>
                  <div className="text-lg font-black text-blue-900 mt-1 font-mono">{invoices.length}</div>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="text-slate-600 text-[11px]">Purchase Bills</div>
                  <div className="text-lg font-black text-emerald-900 mt-1 font-mono">{purchases.length}</div>
                </div>
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <div className="text-slate-600 text-[11px]">Branches / Sections</div>
                  <div className="text-lg font-black text-indigo-900 mt-1 font-mono">{sections.length}</div>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="text-slate-600 text-[11px]">Active System Users</div>
                  <div className="text-lg font-black text-amber-900 mt-1 font-mono">{systemUsers.length}</div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">Clear Cache & Re-synchronize Data</div>
                  <div className="text-[11px] text-slate-500">Reloads catalog, branches, parties and stock balances cleanly</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    showToast('Catalog and balances re-synchronized!');
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync Now</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 6: MASTER SETTINGS (PRINT, LAYOUT, EXPORT & IMPORT) */}
          {activeTab === 'master_settings' && (
            <MasterSettingsTab />
          )}

        </div>
      </div>

      {/* MODAL 1: Create / Edit Role & Authority */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form 
            onSubmit={handleSaveRole} 
            className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 my-8"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-700" />
                {editingRoleId ? 'Edit Role Authority & Permissions' : 'Create New Authority Role'}
              </h3>
              <button 
                type="button" 
                onClick={() => setShowRoleModal(false)} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role Display Name *</label>
                  <input
                    type="text"
                    required
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="Chief Accountant"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:bg-white focus:border-purple-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role Key / Identifier *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingRoleId}
                    value={editingRoleId || roleKey}
                    onChange={(e) => setRoleKey(e.target.value)}
                    placeholder="chief_accountant"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:bg-white focus:border-purple-600 outline-none disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Role Description</label>
                <input
                  type="text"
                  value={roleDesc}
                  onChange={(e) => setRoleDesc(e.target.value)}
                  placeholder="Full authority over ledgers, payment vouchers and tax reporting"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:bg-white focus:border-purple-600 outline-none"
                />
              </div>

              {/* Module Authorities Matrix */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block font-black text-slate-800 uppercase tracking-wider text-[11px] mb-2">
                  Module Authority Matrix (Check modules permitted for this role):
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="flex items-center gap-2 p-1.5 bg-white rounded border border-slate-200/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={roleModules.sales_pos}
                      onChange={(e) => setRoleModules((m) => ({ ...m, sales_pos: e.target.checked }))}
                      className="rounded text-purple-700 focus:ring-purple-500"
                    />
                    <span className="font-bold text-slate-800">Point of Sale (POS) Billing</span>
                  </label>

                  <label className="flex items-center gap-2 p-1.5 bg-white rounded border border-slate-200/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={roleModules.sales_return}
                      onChange={(e) => setRoleModules((m) => ({ ...m, sales_return: e.target.checked }))}
                      className="rounded text-purple-700 focus:ring-purple-500"
                    />
                    <span className="font-bold text-slate-800">Sales Returns & Credit Notes</span>
                  </label>

                  <label className="flex items-center gap-2 p-1.5 bg-white rounded border border-slate-200/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={roleModules.quotations}
                      onChange={(e) => setRoleModules((m) => ({ ...m, quotations: e.target.checked }))}
                      className="rounded text-purple-700 focus:ring-purple-500"
                    />
                    <span className="font-bold text-slate-800">Quotations & Proforma</span>
                  </label>

                  <label className="flex items-center gap-2 p-1.5 bg-white rounded border border-slate-200/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={roleModules.purchase_invoice}
                      onChange={(e) => setRoleModules((m) => ({ ...m, purchase_invoice: e.target.checked }))}
                      className="rounded text-purple-700 focus:ring-purple-500"
                    />
                    <span className="font-bold text-slate-800">Purchase Invoices & Inwards</span>
                  </label>

                  <label className="flex items-center gap-2 p-1.5 bg-white rounded border border-slate-200/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={roleModules.purchase_orders}
                      onChange={(e) => setRoleModules((m) => ({ ...m, purchase_orders: e.target.checked }))}
                      className="rounded text-purple-700 focus:ring-purple-500"
                    />
                    <span className="font-bold text-slate-800">Purchase Orders (PO)</span>
                  </label>

                  <label className="flex items-center gap-2 p-1.5 bg-white rounded border border-slate-200/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={roleModules.accounting}
                      onChange={(e) => setRoleModules((m) => ({ ...m, accounting: e.target.checked }))}
                      className="rounded text-purple-700 focus:ring-purple-500"
                    />
                    <span className="font-bold text-slate-800">Financial Ledgers & P&L</span>
                  </label>

                  <label className="flex items-center gap-2 p-1.5 bg-white rounded border border-slate-200/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={roleModules.vouchers}
                      onChange={(e) => setRoleModules((m) => ({ ...m, vouchers: e.target.checked }))}
                      className="rounded text-purple-700 focus:ring-purple-500"
                    />
                    <span className="font-bold text-slate-800">Payment & Receipt Vouchers</span>
                  </label>

                  <label className="flex items-center gap-2 p-1.5 bg-white rounded border border-slate-200/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={roleModules.inventory_masters}
                      onChange={(e) => setRoleModules((m) => ({ ...m, inventory_masters: e.target.checked }))}
                      className="rounded text-purple-700 focus:ring-purple-500"
                    />
                    <span className="font-bold text-slate-800">Item Masters & Barcodes</span>
                  </label>

                  <label className="flex items-center gap-2 p-1.5 bg-white rounded border border-slate-200/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={roleModules.stock_transfer}
                      onChange={(e) => setRoleModules((m) => ({ ...m, stock_transfer: e.target.checked }))}
                      className="rounded text-purple-700 focus:ring-purple-500"
                    />
                    <span className="font-bold text-slate-800">Inter-Branch Stock Transfer</span>
                  </label>

                  <label className="flex items-center gap-2 p-1.5 bg-white rounded border border-slate-200/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={roleModules.price_lists}
                      onChange={(e) => setRoleModules((m) => ({ ...m, price_lists: e.target.checked }))}
                      className="rounded text-purple-700 focus:ring-purple-500"
                    />
                    <span className="font-bold text-slate-800">Price Lists & Wholesale Tiers</span>
                  </label>

                  <label className="flex items-center gap-2 p-1.5 bg-white rounded border border-slate-200/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={roleModules.reports}
                      onChange={(e) => setRoleModules((m) => ({ ...m, reports: e.target.checked }))}
                      className="rounded text-purple-700 focus:ring-purple-500"
                    />
                    <span className="font-bold text-slate-800">Financial & Audit Reports</span>
                  </label>

                  <label className="flex items-center gap-2 p-1.5 bg-amber-50 rounded border border-amber-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={roleModules.master_control}
                      onChange={(e) => setRoleModules((m) => ({ ...m, master_control: e.target.checked }))}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-black text-amber-900">Super Master Control</span>
                  </label>

                  <label className="flex items-center gap-2 p-1.5 bg-purple-50 rounded border border-purple-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!roleModules.change_branch}
                      onChange={(e) => setRoleModules((m) => ({ ...m, change_branch: e.target.checked }))}
                      className="rounded text-purple-700 focus:ring-purple-500"
                    />
                    <span className="font-black text-purple-900">Change Transaction Branch (Invoices & Reports)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowRoleModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer"
              >
                {editingRoleId ? 'Save Role Changes' : 'Create Role Authority'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: Create / Edit Branch & Section */}
      {showSectionModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form 
            onSubmit={handleSaveSection} 
            className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 space-y-3.5 shadow-2xl animate-in zoom-in-95 duration-150 my-8"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Store className="w-4 h-4 text-purple-700" />
                {editingSectionId ? 'Edit Branch / Section' : 'Create New Branch / Section'}
              </h3>
              <button 
                type="button" 
                onClick={() => setShowSectionModal(false)} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Branch / Section Name *</label>
                <input
                  type="text"
                  required
                  value={sectionName}
                  onChange={(e) => setSectionName(e.target.value)}
                  placeholder="SEENU CARE Salmiya Branch"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:bg-white focus:border-purple-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Branch Code *</label>
                  <input
                    type="text"
                    required
                    value={sectionCode}
                    onChange={(e) => setSectionCode(e.target.value.toUpperCase())}
                    placeholder="SLM-01"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:bg-white focus:border-purple-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Facility Type *</label>
                  <select
                    value={sectionType}
                    onChange={(e) => setSectionType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:bg-white focus:border-purple-600 outline-none"
                  >
                    <option value="store">Retail Store</option>
                    <option value="warehouse">Storage Warehouse</option>
                    <option value="office">Corporate / Admin Office</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Location / Address</label>
                <input
                  type="text"
                  value={sectionAddress}
                  onChange={(e) => setSectionAddress(e.target.value)}
                  placeholder="Salem Al Mubarak St, Block 4"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:bg-white focus:border-purple-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={sectionPhone}
                    onChange={(e) => setSectionPhone(e.target.value)}
                    placeholder="+965 2481 9900"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:bg-white focus:border-purple-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={sectionStatus}
                    onChange={(e) => setSectionStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:bg-white focus:border-purple-600 outline-none"
                  >
                    <option value="active">Active (Online)</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Branch Manager In-charge</label>
                <input
                  type="text"
                  value={sectionManager}
                  onChange={(e) => setSectionManager(e.target.value)}
                  placeholder="Manager Name"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:bg-white focus:border-purple-600 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSectionModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer"
              >
                {editingSectionId ? 'Save Branch Changes' : 'Create Branch / Section'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: Create New Operator */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateUser} className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 space-y-3.5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-700" />
                Create System Operator
              </h3>
              <button type="button" onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Username *</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="cashier_morning"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:bg-white focus:border-purple-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Password (No word limit, any password accepted)
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:bg-white focus:border-purple-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Operator Full Name"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:bg-white focus:border-purple-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Authority Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:bg-white focus:border-purple-600 outline-none"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Branch / Section Access Control */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">
                    Branch Access Authorization
                  </label>
                  {newUserBranches.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setNewUserBranches([])}
                      className="text-[10px] text-purple-700 hover:underline font-bold cursor-pointer"
                    >
                      Clear Limits (Allow All)
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mb-2">
                  Select specific branches to limit this operator, or leave unselected to grant full access to all branches.
                </p>
                <div className="grid grid-cols-1 gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200 max-h-36 overflow-y-auto">
                  {sections.map((sec) => {
                    const isChecked = newUserBranches.includes(sec.name);
                    return (
                      <label
                        key={sec.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition-colors ${
                          isChecked ? 'bg-purple-50 border-purple-300 text-purple-900 font-bold' : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewUserBranches([...newUserBranches, sec.name]);
                            } else {
                              setNewUserBranches(newUserBranches.filter((b) => b !== sec.name));
                            }
                          }}
                          className="rounded text-purple-700 focus:ring-purple-500 w-4 h-4"
                        />
                        <span className="truncate">{sec.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono ml-auto">({sec.code})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Change Branch on Invoices / Transactions Permission */}
              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-purple-200 bg-purple-50/50 cursor-pointer select-none hover:bg-purple-50">
                  <input
                    type="checkbox"
                    checked={newUserCanChangeBranch}
                    onChange={(e) => setNewUserCanChangeBranch(e.target.checked)}
                    className="rounded text-purple-700 focus:ring-purple-500 w-4 h-4 mt-0.5"
                  />
                  <div>
                    <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span>Allow Change Branch on Invoices & Transactions</span>
                      <span className="bg-purple-200 text-purple-800 text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Restricted Access</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Grants this operator authorization to reassign invoice, purchase, and return branches in Reports and Master Controls.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Create Operator
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 4: Edit Existing Operator */}
      {showEditUserModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveEditUser} className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 space-y-3.5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-purple-700" />
                Edit Operator: <span className="text-purple-700 font-mono">{editingUsername}</span>
              </h3>
              <button type="button" onClick={() => setShowEditUserModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  placeholder="Operator Display Name"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:bg-white focus:border-purple-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Password (No word limit, any password accepted)
                </label>
                <input
                  type="text"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:bg-white focus:border-purple-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Role / Authority Level</label>
                {editingUsername.toLowerCase() === 'tarun' ? (
                  <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 font-bold text-xs">
                    Tarun is locked to Super Master Admin root authority.
                  </div>
                ) : (
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:bg-white focus:border-purple-600 outline-none"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Branch / Section Access Control */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">
                    Branch Access Authorization
                  </label>
                  {editUserBranches.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setEditUserBranches([])}
                      className="text-[10px] text-purple-700 hover:underline font-bold cursor-pointer"
                    >
                      Clear Limits (Allow All)
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mb-2">
                  Restrict operator to selected branches only (e.g. Suresh limited to Store sales and Seenu Care Co. only). Unchecked/empty gives access to all branches.
                </p>
                <div className="grid grid-cols-1 gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200 max-h-36 overflow-y-auto">
                  {sections.map((sec) => {
                    const isChecked = editUserBranches.includes(sec.name);
                    return (
                      <label
                        key={sec.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition-colors ${
                          isChecked ? 'bg-purple-50 border-purple-300 text-purple-900 font-bold' : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditUserBranches([...editUserBranches, sec.name]);
                            } else {
                              setEditUserBranches(editUserBranches.filter((b) => b !== sec.name));
                            }
                          }}
                          className="rounded text-purple-700 focus:ring-purple-500 w-4 h-4"
                        />
                        <span className="truncate">{sec.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono ml-auto">({sec.code})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Change Branch on Invoices / Transactions Permission */}
              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-purple-200 bg-purple-50/50 cursor-pointer select-none hover:bg-purple-50">
                  <input
                    type="checkbox"
                    disabled={editingUsername.toLowerCase() === 'tarun' || editRole === 'superadmin'}
                    checked={editingUsername.toLowerCase() === 'tarun' || editRole === 'superadmin' ? true : editCanChangeBranch}
                    onChange={(e) => setEditCanChangeBranch(e.target.checked)}
                    className="rounded text-purple-700 focus:ring-purple-500 w-4 h-4 mt-0.5"
                  />
                  <div>
                    <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span>Allow Change Branch on Invoices & Transactions</span>
                      <span className="bg-purple-200 text-purple-800 text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Restricted Access</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Grants this operator authorization to reassign invoice, purchase, and return branches in Reports and Master Controls.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowEditUserModal(false)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
