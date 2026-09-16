import { NavViewKey } from '../types';

export const VALID_VIEWS: Record<string, NavViewKey> = {
  dashboard: 'dashboard',
  sales_pos: 'sales_pos',
  sales: 'sales_pos',
  pos: 'sales_pos',
  sales_return: 'sales_return',
  sales_order: 'sales_order',
  sales_quotation: 'sales_order',
  quotation: 'sales_order',
  invoice_list: 'invoice_list',
  sales_invoices: 'invoice_list',
  invoices: 'invoice_list',
  purchase_invoice: 'purchase_invoice',
  purchase: 'purchase_invoice',
  purchases: 'purchase_invoice',
  purchase_return: 'purchase_return',
  purchase_list: 'purchase_list',
  purchase_invoices_list: 'purchase_list',
  purchase_order: 'purchase_order',
  inv_price_lists: 'inv_price_lists',
  price_list: 'inv_price_lists',
  price_lists: 'inv_price_lists',
  inventory_price_lists: 'inv_price_lists',
  inv_batch_number: 'inv_batch_number',
  inventory_batch: 'inv_batch_number',
  batch: 'inv_batch_number',
  inv_current_stock: 'inv_current_stock',
  current_stock: 'inv_current_stock',
  stock: 'inv_current_stock',
  inv_stock_transfer: 'inv_stock_transfer',
  stock_transfer: 'inv_stock_transfer',
  transfer: 'inv_stock_transfer',
  report_sales: 'report_sales',
  report_sales_return: 'report_sales_return',
  report_purchase: 'report_purchase',
  report_purchase_return: 'report_purchase_return',
  report_outstanding: 'report_outstanding',
  report_daily: 'report_daily',
  day_end_report: 'report_daily',
  daily_report: 'report_daily',
  report_balance_sheet: 'report_balance_sheet',
  report_party_pnl: 'report_party_pnl',
  report_item_pnl: 'report_item_pnl',
  report_item_status: 'report_item_status',
  report_user_wise: 'report_user_wise',
  report_stock: 'report_stock',
  master_party: 'master_party',
  master_item: 'master_item',
  master_uom: 'master_uom',
  master_category: 'master_category',
  master_brand: 'master_brand',
  master_users: 'master_users',
  voucher_payment: 'voucher_payment',
  voucher_receipt: 'voucher_receipt',
  accounting: 'accounting',
  master_control: 'master_control',
  admin_control: 'master_control',
};

/**
 * Returns canonical href URL for any view key so browser right-click "Open Link in New Tab" works seamlessly
 */
export function getViewUrl(view: NavViewKey): string {
  const currentPath = window.location.pathname || '/';
  return `${currentPath}?view=${view}`;
}

/**
 * Resolves the initial view from window.location search parameter (?view=...) or hash (#...)
 */
export function getInitialView(): NavViewKey {
  if (typeof window === 'undefined') return 'sales_pos';
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const viewParam = searchParams.get('view') || searchParams.get('page') || searchParams.get('tab');
    let resolvedView: NavViewKey | null = null;

    if (viewParam && VALID_VIEWS[viewParam.toLowerCase()]) {
      resolvedView = VALID_VIEWS[viewParam.toLowerCase()];
    } else {
      const hash = window.location.hash.replace('#', '').trim();
      if (hash && VALID_VIEWS[hash.toLowerCase()]) {
        resolvedView = VALID_VIEWS[hash.toLowerCase()];
      }
    }

    if (resolvedView) {
      if (resolvedView === 'master_control') {
        try {
          const raw = sessionStorage.getItem('apex_logged_in_user') || localStorage.getItem('apex_logged_in_user');
          if (raw) {
            const u = JSON.parse(raw);
            if (u.role === 'superadmin' || u.isSuperMasterAdmin || u.username?.toLowerCase() === 'tarun') {
              return 'master_control';
            }
          }
        } catch {}
        // Non-superadmin cannot initialize into master_control
        return 'sales_pos';
      }
      return resolvedView;
    }
  } catch (err) {
    console.error('Error parsing navigation URL params:', err);
  }
  return 'sales_pos';
}

/**
 * Navigates to a view, updating browser history pushState
 */
export function syncViewToUrl(view: NavViewKey, replace: boolean = false) {
  if (typeof window === 'undefined') return;
  try {
    const currentParams = new URLSearchParams(window.location.search);
    if (currentParams.get('view') !== view) {
      currentParams.set('view', view);
      const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
      if (replace) {
        window.history.replaceState({ view }, '', newUrl);
      } else {
        window.history.pushState({ view }, '', newUrl);
      }
    }
  } catch (err) {
    console.error('Error syncing view to URL:', err);
  }
}
