import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { NavViewKey } from '../types';
import { getViewUrl } from '../utils/navigation';
import { 
  Menu, 
  User, 
  Store,
  LayoutDashboard,
  ShoppingCart,
  ShoppingBag,
  RotateCcw,
  ListOrdered,
  Boxes,
  FileText,
  Banknote,
  Receipt,
  Sparkles,
  BarChart4,
  Users,
  PanelLeftClose,
  PanelLeft,
  Tags,
  ArrowLeftRight,
  Calendar,
  FileCheck,
  Crown,
  LogOut,
  Sliders,
  KeyRound,
  Shield
} from 'lucide-react';
import { ChangePasswordModal } from './Auth/ChangePasswordModal';

interface HeaderProps {
  activeTab: NavViewKey;
  setActiveTab: (tab: NavViewKey) => void;
  onOpenAuthModal: () => void;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  onNavContextMenu?: (x: number, y: number, key: NavViewKey, label: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenAuthModal,
  onToggleSidebar,
  isSidebarCollapsed,
  onNavContextMenu,
}) => {
  const { user, activeSection, setActiveSection, switchDemoRole, isSuperAdmin, isAdmin, isManager, signOut } = useAuth();
  const { sections, products } = useStore();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Filter sections for users with branch restrictions
  const availableSections = (isSuperAdmin || !user?.allowedBranches || user.allowedBranches.length === 0)
    ? sections
    : sections.filter((sec) => user.allowedBranches!.includes(sec.name));

  const lowStockCount = products.filter(
    (p) => p.stock_quantity <= p.lowStockThreshold
  ).length;

  const handleTabClick = (e: React.MouseEvent<HTMLAnchorElement>, tab: NavViewKey) => {
    // If not middle click, ctrl click, cmd click, or shift click, prevent full page reload
    if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
      e.preventDefault();
      setActiveTab(tab);
      setMobileMenuOpen(false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, tab: NavViewKey, label: string) => {
    e.preventDefault();
    if (onNavContextMenu) {
      onNavContextMenu(e.clientX, e.clientY, tab, label);
    }
  };

  return (
    <header className="bg-purple-900 border-b border-purple-800/80 text-white shadow-md select-none sticky top-0 z-40">
      {/* Main Navigation Row */}
      <div className="px-2 sm:px-3 py-1 flex items-center justify-between gap-2">
        {/* Left: Brand / MENU Button & Quick Call Top Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* MENU / Sidebar Toggle Button */}
          <button
            id="btn-header-menu"
            onClick={onToggleSidebar ? onToggleSidebar : () => setMobileMenuOpen(!mobileMenuOpen)}
            title="Toggle ERP Sidebar Menu"
            className="flex items-center gap-1.5 bg-black/40 hover:bg-black/60 active:bg-black/80 px-2.5 py-1 rounded text-xs font-black tracking-wider uppercase transition-colors text-white cursor-pointer"
          >
            {isSidebarCollapsed ? (
              <PanelLeft className="w-4 h-4 text-emerald-400" />
            ) : (
              <Menu className="w-4 h-4 text-emerald-400" />
            )}
            <span>MENU</span>
          </button>

          {/* Top Quick Call Navigation Links (Real <a> tags supporting Right-Click -> Open Link in New Tab) */}
          <nav className="hidden lg:flex items-center gap-1 flex-wrap">
            {/* Sales (POS) - Bright Green Highlight */}
            <a
              id="nav-quick-sales"
              href={getViewUrl('sales_pos')}
              onClick={(e) => handleTabClick(e, 'sales_pos')}
              onContextMenu={(e) => handleContextMenu(e, 'sales_pos', 'Sales POS')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition-all shadow-xs cursor-pointer ${
                activeTab === 'sales_pos'
                  ? 'bg-emerald-500 text-slate-950 font-black ring-2 ring-white/90 shadow-md'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:text-slate-950'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Sales</span>
            </a>

            {/* Purchases */}
            <a
              id="nav-quick-purchase"
              href={getViewUrl('purchase_invoice')}
              onClick={(e) => handleTabClick(e, 'purchase_invoice')}
              onContextMenu={(e) => handleContextMenu(e, 'purchase_invoice', 'Purchase Invoice')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition-all shadow-xs cursor-pointer ${
                activeTab === 'purchase_invoice'
                  ? 'bg-blue-500 text-white font-black ring-2 ring-white/90'
                  : 'bg-blue-600/90 hover:bg-blue-500 text-white'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Purchase</span>
            </a>

            {/* Price List */}
            <a
              id="nav-quick-pricelist"
              href={getViewUrl('inv_price_lists')}
              onClick={(e) => handleTabClick(e, 'inv_price_lists')}
              onContextMenu={(e) => handleContextMenu(e, 'inv_price_lists', 'Price List')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition-all shadow-xs cursor-pointer ${
                activeTab === 'inv_price_lists'
                  ? 'bg-emerald-700 text-white ring-2 ring-white/90'
                  : 'bg-emerald-800/80 hover:bg-emerald-700 text-white'
              }`}
            >
              <Tags className="w-3.5 h-3.5" />
              <span>Price List</span>
            </a>

            {/* Current Stock */}
            <a
              id="nav-quick-stock"
              href={getViewUrl('inv_current_stock')}
              onClick={(e) => handleTabClick(e, 'inv_current_stock')}
              onContextMenu={(e) => handleContextMenu(e, 'inv_current_stock', 'Current Stock')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition-all shadow-xs cursor-pointer ${
                activeTab === 'inv_current_stock'
                  ? 'bg-emerald-700 text-white ring-2 ring-white/90'
                  : 'bg-emerald-800/80 hover:bg-emerald-700 text-white'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Current Stock</span>
            </a>

            {/* Stock Transfer */}
            <a
              id="nav-quick-transfer"
              href={getViewUrl('inv_stock_transfer')}
              onClick={(e) => handleTabClick(e, 'inv_stock_transfer')}
              onContextMenu={(e) => handleContextMenu(e, 'inv_stock_transfer', 'Stock Transfer')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition-all shadow-xs cursor-pointer ${
                activeTab === 'inv_stock_transfer'
                  ? 'bg-emerald-700 text-white ring-2 ring-white/90'
                  : 'bg-emerald-800/80 hover:bg-emerald-700 text-white'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Stock Transfer</span>
            </a>

            {/* Day End Report */}
            <a
              id="nav-quick-day-end"
              href={getViewUrl('report_daily')}
              onClick={(e) => handleTabClick(e, 'report_daily')}
              onContextMenu={(e) => handleContextMenu(e, 'report_daily', 'Day End Report')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition-all shadow-xs cursor-pointer ${
                activeTab === 'report_daily'
                  ? 'bg-emerald-700 text-white ring-2 ring-white/90'
                  : 'bg-emerald-800/80 hover:bg-emerald-700 text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Day End Report</span>
            </a>

            {/* Quotation */}
            <a
              id="nav-quick-quotation"
              href={getViewUrl('sales_order')}
              onClick={(e) => handleTabClick(e, 'sales_order')}
              onContextMenu={(e) => handleContextMenu(e, 'sales_order', 'Quotation')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition-all shadow-xs cursor-pointer ${
                activeTab === 'sales_order'
                  ? 'bg-emerald-700 text-white ring-2 ring-white/90'
                  : 'bg-emerald-800/80 hover:bg-emerald-700 text-white'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Quotation</span>
            </a>

            {/* Invoices List */}
            <a
              id="nav-quick-invoice-list"
              href={getViewUrl('invoice_list')}
              onClick={(e) => handleTabClick(e, 'invoice_list')}
              onContextMenu={(e) => handleContextMenu(e, 'invoice_list', 'Invoices List')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-all shadow-xs cursor-pointer ${
                activeTab === 'invoice_list'
                  ? 'bg-purple-600 text-white ring-1 ring-white/50'
                  : 'bg-purple-800/70 hover:bg-purple-700 text-white'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Invoices</span>
            </a>

            {/* Vouchers */}
            <a
              id="nav-quick-vouchers"
              href={getViewUrl('voucher_payment')}
              onClick={(e) => handleTabClick(e, 'voucher_payment')}
              onContextMenu={(e) => handleContextMenu(e, 'voucher_payment', 'Vouchers')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-all shadow-xs cursor-pointer ${
                activeTab === 'voucher_payment' || activeTab === 'voucher_receipt'
                  ? 'bg-amber-600 text-white ring-1 ring-white/50'
                  : 'bg-purple-800/70 hover:bg-purple-700 text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Vouchers</span>
            </a>

            {/* Dashboard */}
            <a
              id="nav-quick-dashboard"
              href={getViewUrl('dashboard')}
              onClick={(e) => handleTabClick(e, 'dashboard')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-all shadow-xs cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-purple-600 text-white ring-1 ring-white/50'
                  : 'bg-purple-800/70 hover:bg-purple-700 text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </a>

            {/* Accounting (Admin Only) */}
            {isAdmin && (
              <a
                id="nav-quick-accounting"
                href={getViewUrl('accounting')}
                onClick={(e) => handleTabClick(e, 'accounting')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-all shadow-xs cursor-pointer ${
                  activeTab === 'accounting'
                    ? 'bg-amber-600 text-white ring-1 ring-white/50'
                    : 'bg-amber-700/80 hover:bg-amber-600/90 text-white'
                }`}
              >
                <Banknote className="w-3.5 h-3.5" />
                <span>Accounting</span>
              </a>
            )}

            {/* Super Master Admin Exclusive Quick Link */}
            {isSuperAdmin && (
              <a
                id="nav-quick-master-control"
                href={getViewUrl('master_control')}
                onClick={(e) => handleTabClick(e, 'master_control')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-black transition-all shadow-xs cursor-pointer ${
                  activeTab === 'master_control'
                    ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                    : 'bg-amber-500/90 hover:bg-amber-400 text-slate-950'
                }`}
              >
                <Crown className="w-3.5 h-3.5 text-slate-950 fill-amber-300" />
                <span>Master Control</span>
              </a>
            )}
          </nav>
        </div>

        {/* Right Controls: Store Section Selector & Profile / Role Badge */}
        <div className="flex items-center gap-2">
          {/* Section Dropdown (e.g. SEENU CARE Co. / Store Sales) */}
          <div className="flex items-center bg-white rounded text-slate-800 shadow-xs">
            <Store className="w-3.5 h-3.5 ml-2 text-purple-700 pointer-events-none" />
            <select
              id="select-active-section"
              value={activeSection}
              onChange={(e) => {
                const newSection = e.target.value;
                if (newSection !== activeSection) {
                  setActiveSection(newSection);
                  // For change of branches: redirect to dashboard and refresh page
                  if (typeof window !== 'undefined') {
                    const url = new URL(window.location.href);
                    url.searchParams.set('tab', 'dashboard');
                    window.location.href = url.toString();
                  }
                }
              }}
              className="bg-transparent text-slate-900 font-bold text-xs px-2 py-1 outline-none cursor-pointer pr-3 max-w-[110px] sm:max-w-[180px] truncate"
            >
              {availableSections.map((sec) => (
                <option key={sec.id} value={sec.name} className="text-slate-900 font-medium">
                  {sec.name}
                </option>
              ))}
            </select>
          </div>

          {/* User Profile & Account Menu */}
          <div className="relative">
            <button
              id="btn-user-role-dropdown"
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                isSuperAdmin 
                  ? 'bg-amber-500/20 border border-amber-400/50 hover:bg-amber-500/30 text-amber-200' 
                  : 'bg-black/40 hover:bg-black/60 text-white'
              }`}
            >
              {isSuperAdmin ? (
                <Crown className="w-3.5 h-3.5 text-amber-300 fill-amber-400" />
              ) : (
                <User className="w-3.5 h-3.5 text-purple-300" />
              )}
              <span className="max-w-[110px] truncate text-white font-bold">{user?.displayName || 'Tarun'}</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-black uppercase ${
                isSuperAdmin
                  ? 'bg-amber-400 text-slate-950 font-black shadow-2xs'
                  : user?.role === 'admin' 
                  ? 'bg-amber-500 text-slate-950' 
                  : user?.role === 'manager' 
                  ? 'bg-blue-400 text-slate-950' 
                  : 'bg-emerald-400 text-slate-950'
              }`}>
                {isSuperAdmin ? 'SUPER ADMIN' : user?.role}
              </span>
            </button>

            {/* Account Options Menu */}
            {showRoleDropdown && (
              <div 
                id="menu-role-dropdown"
                className="absolute right-0 mt-1.5 w-64 bg-slate-900 text-slate-100 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              >
                {/* Account Details Header */}
                <div className="p-2.5 bg-slate-800/80 rounded-lg mb-2 border border-slate-700/60">
                  <div className="flex items-center gap-2 mb-1.5">
                    {isSuperAdmin ? (
                      <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <User className="w-4 h-4 text-purple-400 shrink-0" />
                    )}
                    <div className="overflow-hidden">
                      <div className="font-bold text-xs text-white truncate">{user?.displayName || user?.username}</div>
                      <div className="text-[10px] text-slate-400 font-mono">@{user?.username}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-700/60">
                    <span className="text-slate-400 font-medium">Branch:</span>
                    <span className="text-purple-300 font-bold truncate max-w-[140px]">{activeSection}</span>
                  </div>
                  {user?.allowedBranches && user.allowedBranches.length > 0 && !isSuperAdmin && (
                    <div className="text-[10px] text-amber-300/90 pt-1 font-medium">
                      Allowed Branches: <span className="font-bold">{user.allowedBranches.join(', ')}</span>
                    </div>
                  )}
                </div>

                {/* Super Master Admin Privileged Options */}
                {isSuperAdmin && (
                  <div className="space-y-1 mb-2 pb-2 border-b border-slate-800">
                    <button
                      id="btn-nav-master-control"
                      onClick={() => {
                        setShowRoleDropdown(false);
                        setActiveTab('master_control');
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-purple-900/50 text-xs flex items-center gap-2 text-amber-300 font-bold transition-colors cursor-pointer"
                    >
                      <Sliders className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Master Control & Adjustments</span>
                    </button>

                    <button
                      id="btn-open-firebase-portal"
                      onClick={() => {
                        setShowRoleDropdown(false);
                        onOpenAuthModal();
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 text-xs flex items-center gap-2 text-purple-300 font-semibold transition-colors cursor-pointer"
                    >
                      <Shield className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>Firebase Portal</span>
                    </button>
                  </div>
                )}

                {/* Account Actions: Change Password & Log Out */}
                <div className="space-y-1">
                  <button
                    id="btn-header-change-password"
                    onClick={() => {
                      setShowRoleDropdown(false);
                      setShowChangePasswordModal(true);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 text-xs flex items-center gap-2 text-slate-200 hover:text-white font-semibold transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Change Password</span>
                  </button>

                  <button
                    id="btn-header-logout"
                    onClick={async () => {
                      setShowRoleDropdown(false);
                      await signOut();
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-rose-950/60 text-xs flex items-center gap-2 text-rose-400 hover:text-rose-300 font-bold transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Sign Out Icon Button */}
          <button
            onClick={async () => {
              await signOut();
            }}
            title="Log Out & Switch User"
            className="p-1.5 bg-black/30 hover:bg-rose-900/60 text-purple-200 hover:text-rose-200 rounded transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
    </header>
  );
};
