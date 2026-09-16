import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { NavViewKey } from '../../types';
import { getViewUrl } from '../../utils/navigation';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  ShoppingBag, 
  BarChart4, 
  Database, 
  Boxes, 
  Receipt, 
  Landmark, 
  ChevronDown, 
  ChevronRight, 
  Search, 
  FileText, 
  RotateCcw, 
  FileCheck, 
  ListOrdered, 
  PackageSearch, 
  UserCheck, 
  Tags, 
  Layers, 
  Bookmark, 
  Scale, 
  Banknote, 
  TrendingUp, 
  ShieldAlert, 
  Users, 
  ArrowLeftRight, 
  Calendar,
  X,
  CreditCard,
  Building,
  Sparkles,
  Crown
} from 'lucide-react';

export type { NavViewKey };

interface SidebarProps {
  currentView: NavViewKey;
  onSelectView: (view: NavViewKey) => void;
  isOpen: boolean;
  onClose: () => void;
  isCollapsedDesktop: boolean;
  onToggleDesktopCollapse: () => void;
  onNavContextMenu?: (x: number, y: number, key: NavViewKey, label: string) => void;
}

interface NavSection {
  id: string;
  title: string;
  icon: React.ElementType;
  roles?: ('admin' | 'manager' | 'cashier')[];
  items: {
    key: NavViewKey;
    label: string;
    icon: React.ElementType;
    badge?: string | number;
    badgeColor?: string;
  }[];
  subSections?: {
    id: string;
    title: string;
    items: {
      key: NavViewKey;
      label: string;
      icon: React.ElementType;
    }[];
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  isOpen,
  onClose,
  isCollapsedDesktop,
  onToggleDesktopCollapse,
  onNavContextMenu,
}) => {
  const { user, isSuperAdmin, isAdmin, isManager } = useAuth();
  const { products, invoices, purchases, purchaseOrders } = useStore();
  const [searchQuery, setSearchQuery] = useState('');

  const handleContextMenu = (e: React.MouseEvent, tab: NavViewKey, label: string) => {
    e.preventDefault();
    if (onNavContextMenu) {
      onNavContextMenu(e.clientX, e.clientY, tab, label);
    }
  };

  // Expanded accordion sections state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    superadmin_control: true,
    dashboard: true,
    sales: true,
    purchases: true,
    reports: false,
    masters: false,
    inventory: false,
    vouchers: false,
    accounting: false,
  });

  const [openSubSections, setOpenSubSections] = useState<Record<string, boolean>>({
    inventory_master: true,
  });

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSubSection = (id: string) => {
    setOpenSubSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const lowStockCount = products.filter(
    (p) => p.stock_quantity <= p.lowStockThreshold
  ).length;

  const pendingPOCount = purchaseOrders.filter((po) => po.status === 'pending').length;

  const navSections: NavSection[] = [
    ...(isSuperAdmin ? [{
      id: 'superadmin_control',
      title: 'Super Master Admin',
      icon: Crown,
      items: [
        { 
          key: 'master_control' as NavViewKey, 
          label: '👑 Master Control & Adjustments', 
          icon: Crown, 
          badge: 'Total Control', 
          badgeColor: 'bg-amber-400 text-slate-950 font-black' 
        },
      ],
    }] : []),
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: LayoutDashboard,
      items: [
        { key: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      id: 'sales',
      title: 'Sales',
      icon: ShoppingCart,
      items: [
        { key: 'sales_pos', label: '1. Sales Invoice (POS)', icon: ShoppingCart },
        { key: 'sales_return', label: '2. Sales Return', icon: RotateCcw },
        { key: 'sales_order', label: '3. Sales Order / Quotation', icon: FileCheck },
        { key: 'invoice_list', label: '4. Invoice List', icon: ListOrdered, badge: invoices.length, badgeColor: 'bg-emerald-500/20 text-emerald-300' },
      ],
    },
    {
      id: 'purchases',
      title: 'Purchases',
      icon: ShoppingBag,
      items: [
        { key: 'purchase_invoice', label: '1. Purchase Invoice', icon: ShoppingBag },
        { key: 'purchase_return', label: '2. Purchase Return', icon: RotateCcw },
        { key: 'purchase_list', label: '3. Purchase Invoice List', icon: ListOrdered, badge: purchases.length, badgeColor: 'bg-blue-500/20 text-blue-300' },
        { key: 'purchase_order', label: '4. Purchase Order', icon: PackageSearch, badge: pendingPOCount > 0 ? `${pendingPOCount} New` : undefined, badgeColor: 'bg-amber-500/20 text-amber-300' },
      ],
    },
    {
      id: 'reports',
      title: 'Reports & Analytics',
      icon: BarChart4,
      items: [
        { key: 'report_sales', label: '1. Sales Reports', icon: BarChart4 },
        { key: 'report_sales_return', label: '2. Sales Return Reports', icon: RotateCcw },
        { key: 'report_purchase', label: '3. Purchase Reports', icon: ShoppingBag },
        { key: 'report_purchase_return', label: '4. Purchase Return Reports', icon: RotateCcw },
        { key: 'report_outstanding', label: '5. Outstanding Reports (Cust/Supp)', icon: Banknote },
        { key: 'report_daily', label: '6. Daily Reports', icon: Calendar },
        { key: 'report_balance_sheet', label: '7. Balance Sheet Reports', icon: Landmark },
        { key: 'report_party_pnl', label: '8. Party-Wise P&L Reports', icon: TrendingUp },
        { key: 'report_item_pnl', label: '9. Item-Wise P&L Reports', icon: Scale },
        { key: 'report_item_status', label: '10. Item Status Analytics', icon: ShieldAlert },
        { key: 'report_user_wise', label: '11. User Wise Reports', icon: Users },
        { key: 'report_stock', label: '12. Stock Reports', icon: Boxes },
      ],
    },
    {
      id: 'masters',
      title: 'Masters',
      icon: Database,
      items: [
        { key: 'master_party', label: '1. Party (Customer/Supplier) Master', icon: Users },
        { key: 'master_item', label: '2.1 Item Master', icon: PackageSearch, badge: lowStockCount > 0 ? `${lowStockCount} Low` : undefined, badgeColor: 'bg-rose-500/20 text-rose-300' },
        { key: 'master_uom', label: '2.2 UOM Master', icon: Scale },
        { key: 'master_category', label: '2.3 Category Master', icon: Layers },
        { key: 'master_brand', label: '2.4 Brand Master', icon: Bookmark },
        { key: 'master_users', label: '3. Users Master', icon: UserCheck },
      ],
    },
    {
      id: 'inventory',
      title: 'Inventory & Stock',
      icon: Boxes,
      items: [
        { key: 'inv_price_lists', label: '1. Price Lists', icon: Tags },
        { key: 'inv_batch_number', label: '2. Batch Number & Expiry', icon: Boxes },
        { key: 'inv_current_stock', label: 'Current Stock Registry', icon: Boxes },
        { key: 'inv_stock_transfer', label: 'Stock Transfer', icon: ArrowLeftRight },
      ],
    },
    {
      id: 'vouchers',
      title: 'Voucher Entry',
      icon: Receipt,
      items: [
        { key: 'voucher_payment', label: '1. Payment Voucher (Pay)', icon: CreditCard },
        { key: 'voucher_receipt', label: '2. Receipt Voucher (Receive)', icon: Banknote },
      ],
    },
    {
      id: 'accounting',
      title: 'Accounting',
      icon: Landmark,
      items: [
        { key: 'accounting', label: 'Financial Ledger & Dashboard', icon: Landmark },
      ],
    },
  ];

  // Filtering for quick search
  const filteredSections = navSections.map((section) => {
    if (!searchQuery.trim()) return section;
    const q = searchQuery.toLowerCase();
    const matchesSection = section.title.toLowerCase().includes(q);
    const matchedItems = section.items.filter(
      (item) => item.label.toLowerCase().includes(q) || section.title.toLowerCase().includes(q)
    );
    return {
      ...section,
      matchesSection,
      items: matchedItems,
    };
  }).filter((sec) => sec.items.length > 0 || (sec as any).matchesSection);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 left-0 h-full z-50 flex flex-col bg-slate-950 border-r border-slate-800/80 text-slate-200 transition-all duration-200 select-none ${
          isOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        } ${
          isCollapsedDesktop ? 'lg:w-16' : 'lg:w-72'
        }`}
      >
        {/* Sidebar Header Brand / Title */}
        <div className="h-12 border-b border-slate-800/80 px-3 flex items-center justify-between bg-slate-900/60">
          {!isCollapsedDesktop ? (
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded bg-purple-600 flex items-center justify-center text-white font-black text-xs shadow-xs shrink-0">
                SC
              </div>
              <div className="truncate">
                <h1 className="text-xs font-black text-white tracking-wide uppercase">SEENU CARE ERP</h1>
                <p className="text-[10px] text-purple-400 font-medium truncate">Cosmetics & Salon System</p>
              </div>
            </div>
          ) : (
            <div className="mx-auto w-7 h-7 rounded bg-purple-600 flex items-center justify-center text-white font-black text-xs">
              SC
            </div>
          )}

          {/* Close for mobile */}
          <button 
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar (When Expanded) */}
        {!isCollapsedDesktop && (
          <div className="p-2 border-b border-slate-800/60">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Jump to module or report..."
                className="w-full bg-slate-900 border border-slate-800 rounded-md pl-8 pr-2.5 py-1.5 text-xs text-white placeholder:text-slate-400 outline-none focus:border-purple-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-white text-xs"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        )}

        {/* Navigation List (Scrollable) */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1.5 custom-scrollbar">
          {filteredSections.map((section) => {
            const isSectionOpen = !!searchQuery || openSections[section.id];
            const hasActiveItem = section.items.some((item) => item.key === currentView);
            const SectionIcon = section.icon;

            if (isCollapsedDesktop) {
              const firstItemKey = section.items.length > 0 ? section.items[0].key : ('dashboard' as NavViewKey);
              return (
                <div key={section.id} className="relative group flex flex-col items-center">
                  <a
                    href={getViewUrl(firstItemKey)}
                    onClick={(e) => {
                      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                        e.preventDefault();
                        if (section.items.length > 0) {
                          onSelectView(section.items[0].key);
                        }
                      }
                    }}
                    onContextMenu={(e) => {
                      if (section.items.length > 0) {
                        handleContextMenu(e, section.items[0].key, section.items[0].label);
                      }
                    }}
                    title={section.title}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                      hasActiveItem
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                    }`}
                  >
                    <SectionIcon className="w-5 h-5" />
                  </a>
                </div>
              );
            }

            return (
              <div key={section.id} className="rounded-lg bg-slate-900/40 border border-slate-800/40 overflow-hidden">
                {/* Section Header Button */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className={`w-full px-2.5 py-2 flex items-center justify-between text-left transition-colors cursor-pointer ${
                    hasActiveItem ? 'bg-purple-950/40 text-purple-200 font-bold' : 'hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <SectionIcon className={`w-4 h-4 shrink-0 ${hasActiveItem ? 'text-purple-400' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold uppercase tracking-wider truncate">{section.title}</span>
                  </div>
                  <div className="shrink-0 text-slate-400">
                    {isSectionOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </div>
                </button>

                {/* Sub-items list */}
                {isSectionOpen && (
                  <div className="px-1 py-1 space-y-0.5 border-t border-slate-800/40 bg-slate-950/30">
                    {section.items.map((item) => {
                      const isActive = currentView === item.key;
                      const ItemIcon = item.icon;

                      return (
                        <a
                          key={item.key}
                          href={getViewUrl(item.key)}
                          onClick={(e) => {
                            if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                              e.preventDefault();
                              onSelectView(item.key);
                              onClose();
                            }
                          }}
                          onContextMenu={(e) => handleContextMenu(e, item.key, item.label)}
                          className={`w-full px-2.5 py-1.5 rounded flex items-center justify-between text-left text-xs transition-all cursor-pointer ${
                            isActive
                              ? 'bg-purple-600 text-white font-bold shadow-xs'
                              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <ItemIcon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.badge && (
                            <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full shrink-0 ${
                              isActive ? 'bg-white text-purple-900' : (item.badgeColor || 'bg-slate-800 text-slate-300')
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="p-2 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-400">
          {!isCollapsedDesktop ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Active Branch: <strong className="text-white">Main</strong></span>
              </div>
              <button
                onClick={onToggleDesktopCollapse}
                title="Collapse to Icon Rail"
                className="hidden lg:flex p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                ◀
              </button>
            </>
          ) : (
            <button
              onClick={onToggleDesktopCollapse}
              title="Expand Sidebar"
              className="mx-auto p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              ▶
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
