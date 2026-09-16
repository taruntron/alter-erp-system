/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Navigation/Sidebar';
import { NavContextMenu } from './components/Navigation/NavContextMenu';
import { NavViewKey } from './types';
import { getInitialView, syncViewToUrl, VALID_VIEWS } from './utils/navigation';
import { DashboardView } from './components/Dashboard/DashboardView';
import { PosView } from './components/POS/PosView';
import { SalesReturnView } from './components/Sales/SalesReturnView';
import { QuotationView } from './components/Quotations/QuotationView';
import { InvoiceListView } from './components/Invoices/InvoiceListView';
import { PurchaseView } from './components/Purchase/PurchaseView';
import { PurchaseReturnView } from './components/Purchase/PurchaseReturnView';
import { PurchaseListView } from './components/Purchase/PurchaseListView';
import { PurchaseOrderView } from './components/Purchase/PurchaseOrderView';
import { ReportsAnalyticsView } from './components/Reports/ReportsAnalyticsView';
import { PartyMasterView } from './components/Masters/PartyMasterView';
import { ItemMasterView } from './components/Inventory/ItemMasterView';
import { InventoryMastersView } from './components/Masters/InventoryMastersView';
import { PriceListsView } from './components/Inventory/PriceListsView';
import { BatchNumberView } from './components/Inventory/BatchNumberView';
import { CurrentStockView } from './components/Inventory/CurrentStockView';
import { StockTransferView } from './components/StockTransfer/StockTransferView';
import { VoucherView } from './components/Vouchers/VoucherView';
import { AccountingDashboard } from './components/Accounting/AccountingDashboard';
import { LoginModal } from './components/Auth/LoginModal';
import { LoginPanel } from './components/Auth/LoginPanel';
import { MasterControlView } from './components/Admin/MasterControlView';

const AppContent: React.FC = () => {
  const [activeView, setActiveView] = useState<NavViewKey>(() => getInitialView());
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; navKey: NavViewKey; label: string } | null>(null);
  const { user, isSuperAdmin, isAdmin, isManager } = useAuth();

  // Track previous authenticated user ID / username to handle login and logout transitions
  const prevUserRef = React.useRef<string | null>(user ? (user.username || user.uid) : null);

  useEffect(() => {
    const currentUserId = user ? (user.username || user.uid) : null;

    if (currentUserId && currentUserId !== prevUserRef.current) {
      // A new user logged in or switched role: ALWAYS direct to the sales page ('sales_pos')
      setActiveView('sales_pos');
      syncViewToUrl('sales_pos', true);
    } else if (!currentUserId && prevUserRef.current) {
      // User logged out: reset view to sales_pos and clear URL params
      setActiveView('sales_pos');
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', window.location.pathname);
      }
    }

    prevUserRef.current = currentUserId;
  }, [user]);

  // Listen to browser navigation (back/forward, URL changes)
  useEffect(() => {
    const handleUrlChange = () => {
      const current = getInitialView();
      setActiveView(current);
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // When opening this site/webapp, show Login Panel if not authenticated
  if (!user) {
    return (
      <LoginPanel
        onSuccess={() => {
          setActiveView('sales_pos');
          syncViewToUrl('sales_pos', true);
        }}
      />
    );
  }

  const handleSelectView = (view: NavViewKey) => {
    const canonical = VALID_VIEWS[view] || view;
    setActiveView(canonical);
    syncViewToUrl(canonical);
  };

  const renderActiveView = () => {
    // 1. Dashboard
    if (activeView === 'dashboard') {
      return <DashboardView onNavigate={(view) => setActiveView(view)} />;
    }

    // 2. Sales
    if (activeView === 'sales_pos') {
      return <PosView />;
    }
    if (activeView === 'sales_return') {
      return <SalesReturnView onReturnProcessed={() => setActiveView('sales_pos')} />;
    }
    if (activeView === 'sales_order') {
      return <QuotationView onConvertToSale={() => setActiveView('sales_pos')} />;
    }
    if (activeView === 'invoice_list') {
      return <InvoiceListView />;
    }

    // 3. Purchases
    if (activeView === 'purchase_invoice') {
      return <PurchaseView />;
    }
    if (activeView === 'purchase_return') {
      return <PurchaseReturnView onReturnProcessed={() => setActiveView('purchase_invoice')} />;
    }
    if (activeView === 'purchase_list') {
      return <PurchaseListView />;
    }
    if (activeView === 'purchase_order') {
      return <PurchaseOrderView />;
    }

    // 4. Reports & Analytics (12 reports)
    if (activeView.startsWith('report_')) {
      return <ReportsAnalyticsView initialReport={activeView} />;
    }

    // 5. Masters
    if (activeView === 'master_party') {
      return <PartyMasterView />;
    }
    if (activeView === 'master_item') {
      return <ItemMasterView />;
    }
    if (activeView === 'master_uom') {
      return <InventoryMastersView defaultTab="uom" />;
    }
    if (activeView === 'master_category') {
      return <InventoryMastersView defaultTab="category" />;
    }
    if (activeView === 'master_brand') {
      return <InventoryMastersView defaultTab="brand" />;
    }
    if (activeView === 'master_users') {
      return <InventoryMastersView defaultTab="users" />;
    }

    // 6. Inventory & Stock
    if (activeView === 'inv_price_lists') {
      return <PriceListsView />;
    }
    if (activeView === 'inv_batch_number') {
      return <BatchNumberView />;
    }
    if (activeView === 'inv_current_stock') {
      return <CurrentStockView />;
    }
    if (activeView === 'inv_stock_transfer') {
      return <StockTransferView />;
    }

    // 7. Voucher Entry
    if (activeView === 'voucher_payment') {
      return <VoucherView defaultType="payment" />;
    }
    if (activeView === 'voucher_receipt') {
      return <VoucherView defaultType="receipt" />;
    }

    // 8. Accounting (RBAC Protected)
    if (activeView === 'accounting') {
      if (isAdmin) {
        return <AccountingDashboard />;
      }
      return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-42px)] p-6 text-center bg-slate-100">
          <div className="bg-white p-8 rounded-xl border border-slate-200 max-w-md shadow-xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto mb-4 font-black text-xl">
              🔒
            </div>
            <h2 className="text-lg font-black text-slate-900 mb-2">Restricted Access (Admin Only)</h2>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              The Financial & Accounting module is secured by Role-Based Access Control (RBAC). 
              Switch to the <strong className="text-purple-700">Admin</strong> role to view financial journals, general ledgers, and cash flow.
            </p>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-xs transition-colors"
            >
              Switch User Role
            </button>
          </div>
        </div>
      );
    }

    // 9. Super Master Admin Control & Adjustments (Strict Super Admin RBAC Guard)
    if (activeView === 'master_control') {
      if (!isSuperAdmin) {
        // Non-superadmin cannot access Super Master Admin Control Center
        // Redirect immediately to sales page
        setTimeout(() => {
          setActiveView('sales_pos');
          syncViewToUrl('sales_pos', true);
        }, 0);
        return <PosView />;
      }
      return <MasterControlView />;
    }

    // Fallback default to Dashboard
    return <DashboardView onNavigate={(view) => setActiveView(view)} />;
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans overflow-hidden">
      {/* Top Header Bar with Quick Call Buttons & Role Badge */}
      <Header
        activeTab={activeView}
        setActiveTab={handleSelectView}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onToggleSidebar={() => {
          setIsDesktopCollapsed(!isDesktopCollapsed);
          setIsSidebarOpen(!isSidebarOpen);
        }}
        isSidebarCollapsed={isDesktopCollapsed}
        onNavContextMenu={(x, y, navKey, label) => setContextMenu({ x, y, navKey, label })}
      />

      {/* App Workspace with Collapsible Sidebar & Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Collapsible ERP Sidebar */}
        <Sidebar
          currentView={activeView}
          onSelectView={handleSelectView}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isCollapsedDesktop={isDesktopCollapsed}
          onToggleDesktopCollapse={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
          onNavContextMenu={(x, y, navKey, label) => setContextMenu({ x, y, navKey, label })}
        />

        {/* Dynamic Viewport Container */}
        <main className="flex-1 overflow-hidden relative bg-slate-100">
          {renderActiveView()}
        </main>
      </div>

      {/* Context Menu for right click navigation & queuing */}
      {contextMenu && (
        <NavContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          navKey={contextMenu.navKey}
          label={contextMenu.label}
          onClose={() => setContextMenu(null)}
          onSelectView={handleSelectView}
        />
      )}

      {/* Authentication & RBAC Switcher Modal */}
      <LoginModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <AppContent />
      </StoreProvider>
    </AuthProvider>
  );
}
