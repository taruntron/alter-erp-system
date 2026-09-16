export type UserRole = 'superadmin' | 'admin' | 'manager' | 'cashier' | string;

export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
  activeSection?: string;
  isSuperMasterAdmin?: boolean;
  allowedBranches?: string[]; // Branch restrictions; if undefined or empty, unrestricted
  canChangeTransactionBranch?: boolean; // Permission to change branch on invoices/transactions
}

export type ProductUnit = 'UNIT' | 'CTN24' | 'Box' | 'Pkt' | 'Dozen' | 'CTN' | 'Kg' | 'Pcs';

export interface Product {
  id: string;
  sku: string; // Item Code / SKU (e.g. MS609, MS1991, KM2299)
  barcode: string; // Primary Item Barcode (e.g. EAN-13 / EAN-11)
  additionalBarcodes?: string[]; // Up to 5 additional secondary barcodes for a single product
  name: string;
  category: string;
  cost: number;
  price: number;
  stock_quantity: number;
  unit: ProductUnit;
  lowStockThreshold: number;
  description?: string;
  sectionStock?: Record<string, number>;
}

export interface InvoiceItem {
  product_id: string;
  sku: string;
  barcode: string;
  name: string;
  unit: ProductUnit;
  qty: number;
  stock: number;
  price: number;
  total: number;
  cost?: number;
}

export interface PaymentBreakdown {
  cash: number;
  visa: number;
  card: number;
  online: number;
  knet: number;
  upi: number;
  cheque: number;
  credit?: number;
}

export interface Invoice {
  id: string;
  invoice_no: string;
  customer_name: string;
  customer_phone?: string;
  customer_id?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  other_amt: number;
  total: number;
  paid_amount?: number;
  due_amount?: number;
  credit_amount?: number;
  payments: PaymentBreakdown;
  tender_cash: number;
  return_amt: number;
  status: 'paid' | 'credit' | 'voided';
  timestamp: string;
  date: string;
  cashier_uid: string;
  cashier_name: string;
  section: string;
  narration?: string;
  cash_book?: string;
}

export interface StockTransferItem {
  product_id: string;
  sku: string;
  barcode: string;
  name: string;
  unit: ProductUnit;
  qty: number;
}

export interface StockTransfer {
  id: string;
  transfer_no: string;
  from_section: string;
  to_section: string;
  items: StockTransferItem[];
  no_of_items: number;
  timestamp: string;
  date: string;
  user_uid: string;
  user_name: string;
  narration?: string;
  status: 'completed' | 'draft' | 'cancelled';
}

export interface Expense {
  id: string;
  category: 'Rent' | 'Salaries' | 'Utilities' | 'Logistics' | 'Marketing' | 'Office Supplies' | 'Maintenance' | 'Miscellaneous';
  amount: number;
  date: string;
  description: string;
  created_by: string;
  timestamp: string;
  payment_method?: string;
}

export interface Customer {
  id: string;
  name: string; // Party's name
  firm_name?: string; // Party's firm / salon / spa name
  phone: string; // Party's phone / mobile number
  location?: string; // Party's location / area / address
  civil_id_or_license?: string; // Civil ID or Trade License ID Number
  civil_id?: string;
  email?: string;
  category?: string;
  credit_limit?: number;
  notes?: string; // Additional notes / terms
  code: string;
  due_balance: number;
  address?: string; // Backward compatibility with address
  type?: 'regular' | 'spa' | 'salon' | 'corporate';
}

export interface Supplier {
  id: string;
  name: string; // Supplier / Vendor Name
  firm_name?: string; // Company / Trade Name
  phone: string; // Contact phone
  email?: string;
  contact_person?: string;
  category?: string;
  location?: string; // Address / Area
  address?: string;
  civil_id_or_license?: string; // Commercial Registration / License
  code: string;
  due_balance: number; // Current payable balance
  notes?: string;
}

export interface PurchaseItem {
  product_id: string;
  sku: string;
  barcode: string;
  name: string;
  unit: ProductUnit;
  qty: number;
  cost: number; // Unit Purchase Rate
  total: number;
  selling_price?: number;
}

export type PurchaseOrderItem = PurchaseItem;

export interface PurchaseInvoice {
  id: string;
  purchase_no: string; // e.g. PUR-2026-0001
  vendor_bill_no?: string;
  supplier_invoice_no?: string;
  supplier_id?: string;
  supplier_name: string;
  supplier_phone?: string;
  supplier_firm?: string;
  items: PurchaseItem[];
  subtotal: number;
  discount: number;
  other_amt?: number;
  extra_charges?: number;
  total?: number;
  total_amount?: number;
  paid_amount: number;
  due_amount: number;
  credit_amount?: number;
  payment_method: string;
  payments?: PaymentBreakdown;
  status: 'received' | 'completed' | 'draft' | 'cancelled';
  timestamp: string;
  date: string;
  user_uid?: string;
  user_name?: string;
  created_by?: string;
  section: string;
  narration?: string;
  notes?: string;
}

export interface StoreSection {
  id: string;
  name: string;
  code: string;
  type: 'store' | 'warehouse' | 'office';
  address?: string;
  phone?: string;
  manager?: string;
  status?: 'active' | 'inactive';
}

export interface RoleAuthority {
  id: string;
  name: string;
  description: string;
  isSystem?: boolean;
  modules: {
    sales_pos: boolean;
    sales_return: boolean;
    quotations: boolean;
    purchase_invoice: boolean;
    purchase_orders: boolean;
    accounting: boolean;
    vouchers: boolean;
    inventory_masters: boolean;
    stock_transfer: boolean;
    price_lists: boolean;
    reports: boolean;
    master_control: boolean;
    change_branch?: boolean;
  };
}

export interface Quotation {
  id: string;
  quote_no: string;
  customer_name: string;
  customer_phone?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  total: number;
  date: string;
  valid_until: string;
  status: 'draft' | 'sent' | 'converted';
  created_by: string;
  narration?: string;
}

export interface SalesReturnItem {
  product_id: string;
  sku: string;
  barcode: string;
  name: string;
  unit: ProductUnit;
  qty: number;
  price: number;
  total: number;
  return_reason?: string;
}

export interface SalesReturn {
  id: string;
  return_no: string; // e.g. RET-2026-0001
  original_invoice_no?: string;
  customer_id?: string;
  customer_name: string;
  customer_phone?: string;
  items: SalesReturnItem[];
  subtotal: number;
  tax_or_charges?: number;
  refund_amount: number;
  refund_method: 'cash' | 'credit_note' | 'card' | 'knet';
  status: 'completed' | 'draft' | 'rejected';
  date: string;
  timestamp: string;
  cashier_name: string;
  section: string;
  narration?: string;
}

export interface PurchaseReturnItem {
  product_id: string;
  sku: string;
  barcode: string;
  name: string;
  unit: ProductUnit;
  qty: number;
  cost: number;
  total: number;
  return_reason?: string;
}

export interface PurchaseReturn {
  id: string;
  return_no: string; // e.g. PRET-2026-0001
  original_purchase_no?: string;
  supplier_id?: string;
  supplier_name: string;
  supplier_phone?: string;
  items: PurchaseReturnItem[];
  subtotal: number;
  refund_amount: number;
  refund_method: 'supplier_credit' | 'bank' | 'cash';
  status: 'completed' | 'draft' | 'cancelled';
  date: string;
  timestamp: string;
  created_by: string;
  section: string;
  narration?: string;
}

export interface PurchaseOrder {
  id: string;
  po_no: string; // e.g. PO-2026-0001
  supplier_id?: string;
  supplier_name: string;
  supplier_phone?: string;
  items: PurchaseItem[];
  subtotal: number;
  discount: number;
  estimated_total: number;
  expected_delivery_date?: string;
  date: string;
  status: 'pending' | 'partially_received' | 'received' | 'cancelled';
  created_by: string;
  section: string;
  narration?: string;
}

export interface Voucher {
  id: string;
  voucher_no: string; // e.g. PV-2026-0001 or RV-2026-0001
  type: 'payment' | 'receipt';
  party_type: 'customer' | 'supplier' | 'expense' | 'other';
  party_id?: string;
  party_name: string;
  amount: number;
  payment_method?: 'cash' | 'bank_transfer' | 'cheque' | 'visa' | 'knet' | 'online' | 'card';
  payment_mode?: 'cash' | 'bank_transfer' | 'cheque' | 'visa' | 'knet' | 'online' | 'card';
  reference_no?: string;
  cheque_no?: string;
  cheque_date?: string;
  account_head?: string;
  date: string;
  timestamp: string;
  created_by: string;
  narration?: string;
  status: 'posted' | 'draft' | 'cancelled';
}

export interface PriceListTier {
  id: string;
  product_id: string;
  product_name: string;
  sku?: string;
  standard_price?: number;
  retail_price?: number;
  wholesale_price: number;
  spa_salon_price?: number;
  special_spa_price?: number;
  vip_retail_price?: number;
  min_qty?: number;
}

export interface BatchStock {
  id: string;
  product_id?: string;
  product_name: string;
  sku?: string;
  batch_no?: string;
  batch_number?: string;
  expiry_date: string;
  manufacture_date?: string;
  mfg_date?: string;
  qty?: number;
  quantity?: number;
  cost?: number;
  selling_price?: number;
  location?: string;
  rack_location?: string;
}

export interface BrandMaster {
  id: string;
  name: string;
  country_of_origin?: string;
  description?: string;
  total_products?: number;
  is_active?: boolean;
}

export interface CategoryMaster {
  id: string;
  name: string;
  code?: string;
  description?: string;
  parent_category?: string;
  total_products?: number;
  is_active?: boolean;
}

export interface UomMaster {
  id: string;
  code: string;
  name: string;
  factor?: number;
  base_unit?: string;
  decimal_places?: number;
}

export type NavViewKey = 
  | 'dashboard'
  // Sales
  | 'sales_pos'
  | 'sales_return'
  | 'sales_order'
  | 'sales_quotation'
  | 'invoice_list'
  | 'sales_invoices'
  // Purchases
  | 'purchase_invoice'
  | 'purchase_return'
  | 'purchase_list'
  | 'purchase_invoices_list'
  | 'purchase_order'
  // Reports & Analytics
  | 'report_sales'
  | 'report_sales_return'
  | 'report_purchase'
  | 'report_purchase_return'
  | 'report_outstanding'
  | 'report_daily'
  | 'report_balance_sheet'
  | 'report_party_pnl'
  | 'report_item_pnl'
  | 'report_item_status'
  | 'report_user_wise'
  | 'report_stock'
  // Masters
  | 'master_party'
  | 'master_item'
  | 'master_uom'
  | 'master_category'
  | 'master_brand'
  | 'master_users'
  // Inventory & Stock
  | 'inv_price_lists'
  | 'inventory_price_lists'
  | 'inv_batch_number'
  | 'inventory_batch'
  | 'inv_current_stock'
  | 'inv_stock_transfer'
  // Voucher Entry
  | 'voucher_payment'
  | 'voucher_receipt'
  // Accounting
  | 'accounting'
  // Super Master Admin Control & System Adjustments
  | 'master_control';


