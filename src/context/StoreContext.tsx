import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Product, 
  Invoice, 
  StockTransfer, 
  Expense, 
  Customer, 
  StoreSection, 
  Quotation,
  PaymentBreakdown,
  Supplier,
  PurchaseInvoice,
  InvoiceItem,
  SalesReturn,
  PurchaseReturn,
  PurchaseOrder,
  Voucher,
  PriceListTier,
  BatchStock,
  BrandMaster,
  CategoryMaster,
  UomMaster
} from '../types';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  writeBatch,
  getDocs,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  generateUniqueId, 
  getNextSequenceNumber, 
  broadcastRecordChange, 
  subscribeToCrossTabSync 
} from '../utils/concurrency';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_INVOICES, 
  INITIAL_STOCK_TRANSFERS, 
  INITIAL_EXPENSES, 
  INITIAL_CUSTOMERS, 
  INITIAL_SECTIONS,
  INITIAL_SUPPLIERS,
  INITIAL_PURCHASES,
  INITIAL_SALES_RETURNS,
  INITIAL_PURCHASE_RETURNS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_VOUCHERS,
  INITIAL_PRICE_LISTS,
  INITIAL_BATCHES,
  INITIAL_BRANDS,
  INITIAL_CATEGORIES,
  INITIAL_UOMS
} from '../data/seedData';

interface StoreContextType {
  products: Product[];
  invoices: Invoice[];
  stockTransfers: StockTransfer[];
  expenses: Expense[];
  customers: Customer[];
  suppliers: Supplier[];
  purchases: PurchaseInvoice[];
  sections: StoreSection[];
  quotations: Quotation[];
  salesReturns: SalesReturn[];
  purchaseReturns: PurchaseReturn[];
  purchaseOrders: PurchaseOrder[];
  vouchers: Voucher[];
  priceLists: PriceListTier[];
  batches: BatchStock[];
  brands: BrandMaster[];
  categories: CategoryMaster[];
  uoms: UomMaster[];
  loading: boolean;
  
  // Invoice actions
  createInvoice: (
    invoiceData: Omit<Invoice, 'id' | 'invoice_no' | 'timestamp' | 'date'>
  ) => Promise<Invoice>;
  voidInvoice: (invoiceId: string) => Promise<void>;
  
  // Purchase actions
  createPurchaseInvoice: (
    purchaseData: Omit<PurchaseInvoice, 'id' | 'purchase_no' | 'timestamp' | 'date'>
  ) => Promise<PurchaseInvoice>;

  // Sales & Purchase Return actions
  createSalesReturn: (returnData: Omit<SalesReturn, 'id' | 'return_no' | 'timestamp' | 'date'>) => Promise<SalesReturn>;
  createPurchaseReturn: (returnData: Omit<PurchaseReturn, 'id' | 'return_no' | 'timestamp' | 'date'>) => Promise<PurchaseReturn>;
  
  // Purchase Order actions
  createPurchaseOrder: (poData: Omit<PurchaseOrder, 'id' | 'po_no' | 'date'>) => Promise<PurchaseOrder>;
  
  // Voucher actions
  createVoucher: (voucherData: Omit<Voucher, 'id' | 'voucher_no' | 'timestamp' | 'date'>) => Promise<Voucher>;

  // Master Actions
  addBrand: (brand: Omit<BrandMaster, 'id'>) => Promise<BrandMaster>;
  updateBrand: (id: string, updates: Partial<BrandMaster>) => Promise<void>;
  deleteBrand: (id: string) => Promise<void>;
  addCategory: (cat: Omit<CategoryMaster, 'id'>) => Promise<CategoryMaster>;
  updateCategory: (id: string, updates: Partial<CategoryMaster>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addUom: (uom: Omit<UomMaster, 'id'>) => Promise<UomMaster>;
  updateUom: (id: string, updates: Partial<UomMaster>) => Promise<void>;
  deleteUom: (id: string) => Promise<void>;
  updatePriceList: (items: PriceListTier[]) => void;
  
  // Branch & Section actions
  addSection: (sectionData: Omit<StoreSection, 'id'>) => Promise<StoreSection>;
  updateSection: (id: string, updates: Partial<StoreSection>) => Promise<void>;
  deleteSection: (id: string) => Promise<void>;
  
  // Stock Transfer actions
  createStockTransfer: (
    transferData: Omit<StockTransfer, 'id' | 'transfer_no' | 'timestamp' | 'date' | 'status'>
  ) => Promise<StockTransfer>;
  
  // Product actions
  addProduct: (product: Omit<Product, 'id'>) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  adjustProductStock: (id: string, newStock: number) => Promise<void>;
  
  // Expense actions
  addExpense: (expense: Omit<Expense, 'id' | 'timestamp'>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  
  // Customer & Supplier actions
  addCustomer: (customer: Omit<Customer, 'id'>) => Promise<Customer>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  updateCustomerBalance: (customerId: string, newBalance: number) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<Supplier>;
  updateSupplier: (id: string, updates: Partial<Supplier>) => Promise<void>;
  updateSupplierBalance: (supplierId: string, newBalance: number) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  
  // Pricing helpers for Auto-Recall
  getLastBilledPriceForCustomer: (
    customer: Customer,
    product: Product | { id?: string; product_id?: string; barcode?: string; sku?: string; name?: string }
  ) => number | null;
  getLastPurchaseRateForSupplier: (
    supplier: Supplier,
    product: Product | { id?: string; product_id?: string; barcode?: string; sku?: string; name?: string }
  ) => number | null;

  // Quotations
  createQuotation: (quote: Omit<Quotation, 'id' | 'quote_no' | 'date'>) => Promise<Quotation>;
  
  // Change Branch on existing transaction (restricted permission)
  updateTransactionBranch: (
    type: 'invoice' | 'purchase' | 'sales_return' | 'purchase_return',
    id: string,
    newBranch: string
  ) => Promise<void>;

  // Anti-Collision Sequential Sequence Generators
  generateNextInvoiceNo: () => string;
  generateNextPurchaseNo: () => string;
  generateNextTransferNo: () => string;
  generateNextQuotationNo: () => string;
  generateNextSalesReturnNo: () => string;
  generateNextPurchaseReturnNo: () => string;
  generateNextPurchaseOrderNo: () => string;
  generateNextVoucherNo: (type: 'payment' | 'receipt') => string;

  // Utility
  resetToDefaultSeedData: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Local state with localStorage hydration for instant loading
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('apex_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('apex_invoices');
    return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });

  const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>(() => {
    const saved = localStorage.getItem('apex_transfers');
    return saved ? JSON.parse(saved) : INITIAL_STOCK_TRANSFERS;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('apex_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('apex_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('apex_suppliers');
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
  });

  const [purchases, setPurchases] = useState<PurchaseInvoice[]>(() => {
    const saved = localStorage.getItem('apex_purchases');
    return saved ? JSON.parse(saved) : INITIAL_PURCHASES;
  });

  const [sections, setSections] = useState<StoreSection[]>(() => {
    const saved = localStorage.getItem('apex_sections');
    return saved ? JSON.parse(saved) : INITIAL_SECTIONS;
  });

  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    const saved = localStorage.getItem('apex_quotations');
    return saved ? JSON.parse(saved) : [];
  });

  const [salesReturns, setSalesReturns] = useState<SalesReturn[]>(() => {
    const saved = localStorage.getItem('apex_sales_returns');
    return saved ? JSON.parse(saved) : INITIAL_SALES_RETURNS;
  });

  const [purchaseReturns, setPurchaseReturns] = useState<PurchaseReturn[]>(() => {
    const saved = localStorage.getItem('apex_purchase_returns');
    return saved ? JSON.parse(saved) : INITIAL_PURCHASE_RETURNS;
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem('apex_purchase_orders');
    return saved ? JSON.parse(saved) : INITIAL_PURCHASE_ORDERS;
  });

  const [vouchers, setVouchers] = useState<Voucher[]>(() => {
    const saved = localStorage.getItem('apex_vouchers');
    return saved ? JSON.parse(saved) : INITIAL_VOUCHERS;
  });

  const [priceLists, setPriceLists] = useState<PriceListTier[]>(() => {
    const saved = localStorage.getItem('apex_pricelists');
    return saved ? JSON.parse(saved) : INITIAL_PRICE_LISTS;
  });

  const [batches, setBatches] = useState<BatchStock[]>(() => {
    const saved = localStorage.getItem('apex_batches');
    return saved ? JSON.parse(saved) : INITIAL_BATCHES;
  });

  const [brands, setBrands] = useState<BrandMaster[]>(() => {
    const saved = localStorage.getItem('apex_brands');
    return saved ? JSON.parse(saved) : INITIAL_BRANDS;
  });

  const [categories, setCategories] = useState<CategoryMaster[]>(() => {
    const saved = localStorage.getItem('apex_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [uoms, setUoms] = useState<UomMaster[]>(() => {
    const saved = localStorage.getItem('apex_uoms');
    return saved ? JSON.parse(saved) : INITIAL_UOMS;
  });

  const [loading, setLoading] = useState<boolean>(true);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('apex_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('apex_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('apex_transfers', JSON.stringify(stockTransfers));
  }, [stockTransfers]);

  useEffect(() => {
    localStorage.setItem('apex_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('apex_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('apex_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('apex_purchases', JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem('apex_sections', JSON.stringify(sections));
  }, [sections]);

  useEffect(() => {
    localStorage.setItem('apex_quotations', JSON.stringify(quotations));
  }, [quotations]);

  useEffect(() => {
    localStorage.setItem('apex_sales_returns', JSON.stringify(salesReturns));
  }, [salesReturns]);

  useEffect(() => {
    localStorage.setItem('apex_purchase_returns', JSON.stringify(purchaseReturns));
  }, [purchaseReturns]);

  useEffect(() => {
    localStorage.setItem('apex_purchase_orders', JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  useEffect(() => {
    localStorage.setItem('apex_vouchers', JSON.stringify(vouchers));
  }, [vouchers]);

  useEffect(() => {
    localStorage.setItem('apex_pricelists', JSON.stringify(priceLists));
  }, [priceLists]);

  useEffect(() => {
    localStorage.setItem('apex_brands', JSON.stringify(brands));
  }, [brands]);

  useEffect(() => {
    localStorage.setItem('apex_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('apex_uoms', JSON.stringify(uoms));
  }, [uoms]);

  // Firestore real-time listeners with seeding on first launch
  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const initializeFirestoreSync = async () => {
      try {
        // Products listener
        const productsCol = collection(db, 'products');
        const unsubProd = onSnapshot(productsCol, async (snapshot) => {
          if (!snapshot.empty) {
            const list: Product[] = [];
            snapshot.forEach((doc) => {
              const d = doc.data();
              list.push({
                ...d,
                id: doc.id,
                cost: typeof d.cost === 'number' ? d.cost : (parseFloat(d.cost) || 0),
                price: typeof d.price === 'number' ? d.price : (parseFloat(d.price) || 0),
                stock_quantity: typeof d.stock_quantity === 'number' ? d.stock_quantity : (parseFloat(d.stock_quantity) || 0),
                lowStockThreshold: typeof d.lowStockThreshold === 'number' ? d.lowStockThreshold : (parseFloat(d.lowStockThreshold) || 5),
              } as Product);
            });
            setProducts(list);
          } else {
            // Seed initial products to Firestore
            try {
              const batch = writeBatch(db);
              INITIAL_PRODUCTS.forEach((p) => {
                batch.set(doc(db, 'products', p.id), p);
              });
              await batch.commit();
            } catch (err) {
              console.warn('Initial products seed notice:', err);
            }
          }
        }, (err) => console.warn('Products sync error:', err));
        unsubs.push(unsubProd);

        // Invoices listener
        const invoicesCol = collection(db, 'invoices');
        const unsubInv = onSnapshot(invoicesCol, async (snapshot) => {
          if (!snapshot.empty) {
            const list: Invoice[] = [];
            snapshot.forEach((doc) => {
              const d = doc.data();
              const p = d.payments || {};
              list.push({
                ...d,
                id: doc.id,
                subtotal: typeof d.subtotal === 'number' ? d.subtotal : (parseFloat(d.subtotal) || 0),
                discount: typeof d.discount === 'number' ? d.discount : (parseFloat(d.discount) || 0),
                other_amt: typeof d.other_amt === 'number' ? d.other_amt : (parseFloat(d.other_amt) || 0),
                total: typeof d.total === 'number' ? d.total : (parseFloat(d.total) || 0),
                return_amt: typeof d.return_amt === 'number' ? d.return_amt : (parseFloat(d.return_amt) || 0),
                payments: {
                  cash: Number(p.cash) || 0,
                  knet: Number(p.knet) || 0,
                  card: Number(p.card) || 0,
                  visa: Number(p.visa) || 0,
                  online: Number(p.online) || 0,
                  cheque: Number(p.cheque) || 0,
                  credit: Number(p.credit) || 0,
                },
                paid_amount: typeof d.paid_amount === 'number' ? d.paid_amount : (parseFloat(d.paid_amount) || 0),
                due_amount: typeof d.due_amount === 'number' ? d.due_amount : (parseFloat(d.due_amount) || 0),
                credit_amount: typeof d.credit_amount === 'number' ? d.credit_amount : (parseFloat(d.credit_amount) || 0),
                items: Array.isArray(d.items) ? d.items.map((it: any) => ({
                  ...it,
                  price: typeof it.price === 'number' ? it.price : (parseFloat(it.price) || 0),
                  cost: typeof it.cost === 'number' ? it.cost : (parseFloat(it.cost) || 0),
                  qty: typeof it.qty === 'number' ? it.qty : (parseFloat(it.qty) || 1),
                  total: typeof it.total === 'number' ? it.total : (parseFloat(it.total) || 0),
                })) : []
              } as Invoice);
            });
            // Sort by timestamp desc
            list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setInvoices(list);
          } else {
            // Seed initial invoices
            try {
              const batch = writeBatch(db);
              INITIAL_INVOICES.forEach((inv) => {
                batch.set(doc(db, 'invoices', inv.id), inv);
              });
              await batch.commit();
            } catch (err) {
              console.warn('Invoices seed notice:', err);
            }
          }
        }, (err) => console.warn('Invoices sync error:', err));
        unsubs.push(unsubInv);

        // Stock Transfers listener
        const transfersCol = collection(db, 'stock_transfers');
        const unsubTrans = onSnapshot(transfersCol, async (snapshot) => {
          if (!snapshot.empty) {
            const list: StockTransfer[] = [];
            snapshot.forEach((doc) => {
              list.push({ ...doc.data(), id: doc.id } as StockTransfer);
            });
            list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setStockTransfers(list);
          } else {
            try {
              const batch = writeBatch(db);
              INITIAL_STOCK_TRANSFERS.forEach((st) => {
                batch.set(doc(db, 'stock_transfers', st.id), st);
              });
              await batch.commit();
            } catch (err) {
              console.warn('Transfers seed notice:', err);
            }
          }
        }, (err) => console.warn('Transfers sync error:', err));
        unsubs.push(unsubTrans);

        // Expenses listener
        const expensesCol = collection(db, 'expenses');
        const unsubExp = onSnapshot(expensesCol, async (snapshot) => {
          if (!snapshot.empty) {
            const list: Expense[] = [];
            snapshot.forEach((doc) => {
              list.push({ ...doc.data(), id: doc.id } as Expense);
            });
            list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setExpenses(list);
          } else {
            try {
              const batch = writeBatch(db);
              INITIAL_EXPENSES.forEach((e) => {
                batch.set(doc(db, 'expenses', e.id), e);
              });
              await batch.commit();
            } catch (err) {
              console.warn('Expenses seed notice:', err);
            }
          }
        }, (err) => console.warn('Expenses sync error:', err));
        unsubs.push(unsubExp);

        // Customers listener
        const customersCol = collection(db, 'customers');
        const unsubCust = onSnapshot(customersCol, async (snapshot) => {
          if (!snapshot.empty) {
            const list: Customer[] = [];
            snapshot.forEach((doc) => {
              const d = doc.data();
              list.push({
                ...d,
                id: doc.id,
                due_balance: typeof d.due_balance === 'number' ? d.due_balance : (parseFloat(d.due_balance) || 0),
                credit_limit: typeof d.credit_limit === 'number' ? d.credit_limit : (parseFloat(d.credit_limit) || 0),
              } as Customer);
            });
            setCustomers(list);
          } else {
            try {
              const batch = writeBatch(db);
              INITIAL_CUSTOMERS.forEach((c) => {
                batch.set(doc(db, 'customers', c.id), c);
              });
              await batch.commit();
            } catch (err) {
              console.warn('Customers seed notice:', err);
            }
          }
        }, (err) => console.warn('Customers sync error:', err));
        unsubs.push(unsubCust);

        // Sections listener
        const sectionsCol = collection(db, 'sections');
        const unsubSec = onSnapshot(sectionsCol, async (snapshot) => {
          if (!snapshot.empty) {
            const list: StoreSection[] = [];
            snapshot.forEach((doc) => {
              list.push({ ...doc.data(), id: doc.id } as StoreSection);
            });
            setSections(list);
          } else {
            try {
              const batch = writeBatch(db);
              INITIAL_SECTIONS.forEach((s) => {
                batch.set(doc(db, 'sections', s.id), s);
              });
              await batch.commit();
            } catch (err) {
              console.warn('Sections seed notice:', err);
            }
          }
        }, (err) => console.warn('Sections sync error:', err));
        unsubs.push(unsubSec);

        // Suppliers listener
        const suppliersCol = collection(db, 'suppliers');
        const unsubSupp = onSnapshot(suppliersCol, async (snapshot) => {
          if (!snapshot.empty) {
            const list: Supplier[] = [];
            snapshot.forEach((doc) => {
              const d = doc.data();
              list.push({
                ...d,
                id: doc.id,
                due_balance: typeof d.due_balance === 'number' ? d.due_balance : (parseFloat(d.due_balance) || 0),
              } as Supplier);
            });
            setSuppliers(list);
          } else {
            try {
              const batch = writeBatch(db);
              INITIAL_SUPPLIERS.forEach((s) => {
                batch.set(doc(db, 'suppliers', s.id), s);
              });
              await batch.commit();
            } catch (err) {
              console.warn('Suppliers seed notice:', err);
            }
          }
        }, (err) => console.warn('Suppliers sync error:', err));
        unsubs.push(unsubSupp);

        // Purchases listener
        const purchasesCol = collection(db, 'purchases');
        const unsubPur = onSnapshot(purchasesCol, async (snapshot) => {
          if (!snapshot.empty) {
            const list: PurchaseInvoice[] = [];
            snapshot.forEach((doc) => {
              const d = doc.data();
              list.push({
                ...d,
                id: doc.id,
                total_amount: typeof d.total_amount === 'number' ? d.total_amount : (typeof d.total === 'number' ? d.total : (parseFloat(d.total_amount || d.total) || 0)),
                paid_amount: typeof d.paid_amount === 'number' ? d.paid_amount : (parseFloat(d.paid_amount) || 0),
                due_amount: typeof d.due_amount === 'number' ? d.due_amount : (parseFloat(d.due_amount) || 0),
              } as PurchaseInvoice);
            });
            list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setPurchases(list);
          } else {
            try {
              const batch = writeBatch(db);
              INITIAL_PURCHASES.forEach((p) => {
                batch.set(doc(db, 'purchases', p.id), p);
              });
              await batch.commit();
            } catch (err) {
              console.warn('Purchases seed notice:', err);
            }
          }
        }, (err) => console.warn('Purchases sync error:', err));
        unsubs.push(unsubPur);

        // UOMs listener
        const uomsCol = collection(db, 'uoms');
        const unsubUoms = onSnapshot(uomsCol, async (snapshot) => {
          if (!snapshot.empty) {
            const list: UomMaster[] = [];
            snapshot.forEach((doc) => {
              list.push({ ...doc.data(), id: doc.id } as UomMaster);
            });
            setUoms(list);
          } else {
            try {
              const batch = writeBatch(db);
              INITIAL_UOMS.forEach((u) => {
                batch.set(doc(db, 'uoms', u.id), u);
              });
              await batch.commit();
            } catch (err) {
              console.warn('UOMs seed notice:', err);
            }
          }
        }, (err) => console.warn('UOMs sync error:', err));
        unsubs.push(unsubUoms);

        // Categories listener
        const catCol = collection(db, 'categories');
        const unsubCat = onSnapshot(catCol, async (snapshot) => {
          if (!snapshot.empty) {
            const list: CategoryMaster[] = [];
            snapshot.forEach((doc) => {
              list.push({ ...doc.data(), id: doc.id } as CategoryMaster);
            });
            setCategories(list);
          } else {
            try {
              const batch = writeBatch(db);
              INITIAL_CATEGORIES.forEach((c) => {
                batch.set(doc(db, 'categories', c.id), c);
              });
              await batch.commit();
            } catch (err) {
              console.warn('Categories seed notice:', err);
            }
          }
        }, (err) => console.warn('Categories sync error:', err));
        unsubs.push(unsubCat);

        // Brands listener
        const brandsCol = collection(db, 'brands');
        const unsubBrands = onSnapshot(brandsCol, async (snapshot) => {
          if (!snapshot.empty) {
            const list: BrandMaster[] = [];
            snapshot.forEach((doc) => {
              list.push({ ...doc.data(), id: doc.id } as BrandMaster);
            });
            setBrands(list);
          } else {
            try {
              const batch = writeBatch(db);
              INITIAL_BRANDS.forEach((b) => {
                batch.set(doc(db, 'brands', b.id), b);
              });
              await batch.commit();
            } catch (err) {
              console.warn('Brands seed notice:', err);
            }
          }
        }, (err) => console.warn('Brands sync error:', err));
        unsubs.push(unsubBrands);

      } catch (err) {
        console.warn('Firestore initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeFirestoreSync();

    // Inter-tab synchronization listener for multi-tab workflow
    const unsubCrossTab = subscribeToCrossTabSync((message) => {
      if (message.type === 'RECORD_CREATED' && message.data) {
        if (message.collection === 'invoices') {
          setInvoices((prev) => {
            if (prev.some((inv) => inv.id === message.data.id || inv.invoice_no === message.data.invoice_no)) return prev;
            return [message.data, ...prev];
          });
        } else if (message.collection === 'purchases') {
          setPurchases((prev) => {
            if (prev.some((p) => p.id === message.data.id || p.purchase_no === message.data.purchase_no)) return prev;
            return [message.data, ...prev];
          });
        } else if (message.collection === 'vouchers') {
          setVouchers((prev) => {
            if (prev.some((v) => v.id === message.data.id || v.voucher_no === message.data.voucher_no)) return prev;
            return [message.data, ...prev];
          });
        } else if (message.collection === 'stock_transfers') {
          setStockTransfers((prev) => {
            if (prev.some((t) => t.id === message.data.id || t.transfer_no === message.data.transfer_no)) return prev;
            return [message.data, ...prev];
          });
        } else if (message.collection === 'sales_returns') {
          setSalesReturns((prev) => {
            if (prev.some((r) => r.id === message.data.id || r.return_no === message.data.return_no)) return prev;
            return [message.data, ...prev];
          });
        } else if (message.collection === 'purchase_returns') {
          setPurchaseReturns((prev) => {
            if (prev.some((r) => r.id === message.data.id || r.return_no === message.data.return_no)) return prev;
            return [message.data, ...prev];
          });
        } else if (message.collection === 'purchase_orders') {
          setPurchaseOrders((prev) => {
            if (prev.some((po) => po.id === message.data.id || po.po_no === message.data.po_no)) return prev;
            return [message.data, ...prev];
          });
        } else if (message.collection === 'quotations') {
          setQuotations((prev) => {
            if (prev.some((q) => q.id === message.data.id || q.quote_no === message.data.quote_no)) return prev;
            return [message.data, ...prev];
          });
        } else if (message.collection === 'customers') {
          setCustomers((prev) => {
            if (prev.some((c) => c.id === message.data.id)) return prev;
            return [message.data, ...prev];
          });
        } else if (message.collection === 'suppliers') {
          setSuppliers((prev) => {
            if (prev.some((s) => s.id === message.data.id)) return prev;
            return [message.data, ...prev];
          });
        } else if (message.collection === 'products') {
          setProducts((prev) => {
            if (prev.some((p) => p.id === message.data.id)) return prev;
            return [message.data, ...prev];
          });
        }
      } else if (message.type === 'RECORD_UPDATED' && message.data) {
        if (message.collection === 'invoices') {
          setInvoices((prev) => prev.map((inv) => inv.id === message.data.id ? { ...inv, ...message.data } : inv));
        } else if (message.collection === 'purchases') {
          setPurchases((prev) => prev.map((p) => p.id === message.data.id ? { ...p, ...message.data } : p));
        } else if (message.collection === 'sales_returns') {
          setSalesReturns((prev) => prev.map((r) => r.id === message.data.id ? { ...r, ...message.data } : r));
        } else if (message.collection === 'purchase_returns') {
          setPurchaseReturns((prev) => prev.map((r) => r.id === message.data.id ? { ...r, ...message.data } : r));
        }
      }
    });

    return () => {
      unsubs.forEach((unsub) => unsub());
      unsubCrossTab();
    };
  }, []);

  // Anti-Collision Sequential Invoice Number Generator (INV-YYYY-XXXX)
  const generateNextInvoiceNo = () => {
    return getNextSequenceNumber(
      { prefix: 'INV', includeYear: true, padLength: 4 },
      invoices.map((inv) => inv.invoice_no)
    );
  };

  // Anti-Collision Sequential Transfer Number Generator (TRXXXXX)
  const generateNextTransferNo = () => {
    return getNextSequenceNumber(
      { prefix: 'TR', startNumber: 36731 },
      stockTransfers.map((t) => t.transfer_no)
    );
  };

  // Anti-Collision Sequential Purchase Bill Number Generator (PUR-YYYY-XXXX)
  const generateNextPurchaseNo = () => {
    return getNextSequenceNumber(
      { prefix: 'PUR', includeYear: true, padLength: 4 },
      purchases.map((p) => p.purchase_no)
    );
  };

  // Anti-Collision Sequential Quotation Number Generator (QT-YYYY-XXXX)
  const generateNextQuotationNo = () => {
    return getNextSequenceNumber(
      { prefix: 'QT', includeYear: true, padLength: 4 },
      quotations.map((q) => q.quote_no)
    );
  };

  // Anti-Collision Sequential Sales Return Number Generator (RET-YYYY-XXXX)
  const generateNextSalesReturnNo = () => {
    return getNextSequenceNumber(
      { prefix: 'RET', includeYear: true, padLength: 4 },
      salesReturns.map((r) => r.return_no)
    );
  };

  // Anti-Collision Sequential Purchase Return Number Generator (PRET-YYYY-XXXX)
  const generateNextPurchaseReturnNo = () => {
    return getNextSequenceNumber(
      { prefix: 'PRET', includeYear: true, padLength: 4 },
      purchaseReturns.map((r) => r.return_no)
    );
  };

  // Anti-Collision Sequential Purchase Order Number Generator (PO-YYYY-XXXX)
  const generateNextPurchaseOrderNo = () => {
    return getNextSequenceNumber(
      { prefix: 'PO', includeYear: true, padLength: 4 },
      purchaseOrders.map((p) => p.po_no)
    );
  };

  // Anti-Collision Sequential Voucher Number Generator (PV-YYYY-XXXX or RV-YYYY-XXXX)
  const generateNextVoucherNo = (type: 'payment' | 'receipt') => {
    const prefix = type === 'payment' ? 'PV' : 'RV';
    return getNextSequenceNumber(
      { prefix, includeYear: true, padLength: 4 },
      vouchers.filter((v) => v.type === type).map((v) => v.voucher_no)
    );
  };

  // Create Invoice and deduct stock in real-time
  const createInvoice = async (
    invoiceData: Omit<Invoice, 'id' | 'invoice_no' | 'timestamp' | 'date'>
  ): Promise<Invoice> => {
    const id = generateUniqueId('inv');
    const invoice_no = generateNextInvoiceNo();
    const now = new Date();
    const timestamp = now.toISOString();
    const date = now.toISOString().split('T')[0];

    const payments = invoiceData.payments || ({} as PaymentBreakdown);
    const totalPaid = (Number(payments.cash) || 0) +
      (Number(payments.knet) || 0) +
      (Number(payments.card) || 0) +
      (Number(payments.visa) || 0) +
      (Number(payments.online) || 0) +
      (Number(payments.upi) || 0) +
      (Number(payments.cheque) || 0);

    const creditAmount = invoiceData.credit_amount !== undefined 
      ? Number(invoiceData.credit_amount) || 0
      : (payments.credit !== undefined && payments.credit > 0
          ? Number(payments.credit) || 0
          : (invoiceData.status === 'credit' ? Math.max(0, invoiceData.total - totalPaid) : 0));

    const finalPaid = invoiceData.paid_amount !== undefined ? Number(invoiceData.paid_amount) || 0 : totalPaid;
    const finalDue = invoiceData.due_amount !== undefined ? Number(invoiceData.due_amount) || 0 : creditAmount;

    const fullInvoice: Invoice = {
      ...invoiceData,
      id,
      invoice_no,
      paid_amount: finalPaid,
      due_amount: finalDue,
      credit_amount: finalDue,
      status: finalDue > 0 ? 'credit' : (invoiceData.status || 'paid'),
      timestamp,
      date,
    };

    // Update local state immediately for instant feedback
    setInvoices((prev) => [fullInvoice, ...prev]);
    broadcastRecordChange('CREATED', 'invoices', fullInvoice);

    // Update customer due balance if credit
    if (finalDue > 0 && invoiceData.customer_id) {
      const cust = customers.find((c) => c.id === invoiceData.customer_id);
      if (cust) {
        updateCustomerBalance(cust.id, (cust.due_balance || 0) + finalDue);
      }
    }

    // Deduct stock for all items
    const updatedProducts = products.map((prod) => {
      const match = invoiceData.items.find((item) => item.product_id === prod.id);
      if (match) {
        return {
          ...prod,
          stock_quantity: Math.max(0, prod.stock_quantity - match.qty),
        };
      }
      return prod;
    });
    setProducts(updatedProducts);

    // Persist to Firestore with Batch
    try {
      const batch = writeBatch(db);
      // Write invoice
      const invoiceRef = doc(db, 'invoices', id);
      batch.set(invoiceRef, fullInvoice);

      // Update product stocks
      invoiceData.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.product_id);
        if (prod) {
          const newQty = Math.max(0, prod.stock_quantity - item.qty);
          const prodRef = doc(db, 'products', item.product_id);
          batch.update(prodRef, { stock_quantity: newQty });
        }
      });

      await batch.commit();
    } catch (err) {
      console.warn('Firestore invoice batch write error (stored locally):', err);
    }

    return fullInvoice;
  };

  // Void Invoice & Restore Stock
  const voidInvoice = async (invoiceId: string) => {
    const target = invoices.find((inv) => inv.id === invoiceId);
    if (!target || target.status === 'voided') return;

    // Reverse customer balance if invoice was on credit
    const dueAmtToReverse = target.due_amount || target.credit_amount || 0;
    if (dueAmtToReverse > 0 && target.customer_id) {
      const cust = customers.find((c) => c.id === target.customer_id);
      if (cust) {
        updateCustomerBalance(cust.id, Math.max(0, (cust.due_balance || 0) - dueAmtToReverse));
      }
    }

    // Restore stock
    const updatedProducts = products.map((prod) => {
      const match = target.items.find((item) => item.product_id === prod.id);
      if (match) {
        return {
          ...prod,
          stock_quantity: prod.stock_quantity + match.qty,
        };
      }
      return prod;
    });
    setProducts(updatedProducts);

    const updatedInvoices = invoices.map((inv) =>
      inv.id === invoiceId ? { ...inv, status: 'voided' as const } : inv
    );
    setInvoices(updatedInvoices);

    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'invoices', invoiceId), { status: 'voided' });
      target.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.product_id);
        if (prod) {
          batch.update(doc(db, 'products', item.product_id), {
            stock_quantity: prod.stock_quantity + item.qty,
          });
        }
      });
      await batch.commit();
    } catch (err) {
      console.warn('Void invoice batch write fallback:', err);
    }
  };

  // Create Stock Transfer
  const createStockTransfer = async (
    transferData: Omit<StockTransfer, 'id' | 'transfer_no' | 'timestamp' | 'date' | 'status'>
  ): Promise<StockTransfer> => {
    const id = generateUniqueId('tr');
    const transfer_no = generateNextTransferNo();
    const now = new Date();
    const timestamp = now.toISOString();
    const date = now.toISOString().split('T')[0];

    const fullTransfer: StockTransfer = {
      ...transferData,
      id,
      transfer_no,
      timestamp,
      date,
      status: 'completed',
    };

    setStockTransfers((prev) => [fullTransfer, ...prev]);
    broadcastRecordChange('CREATED', 'stock_transfers', fullTransfer);

    try {
      await setDoc(doc(db, 'stock_transfers', id), fullTransfer);
    } catch (err) {
      console.warn('Firestore stock transfer write notice:', err);
    }

    return fullTransfer;
  };

  // Add Product
  const addProduct = async (productData: Omit<Product, 'id'>): Promise<Product> => {
    const id = generateUniqueId('prod');
    const newProduct: Product = { ...productData, id };

    setProducts((prev) => [newProduct, ...prev]);
    broadcastRecordChange('CREATED', 'products', newProduct);

    try {
      await setDoc(doc(db, 'products', id), newProduct);
    } catch (err) {
      console.warn('Firestore product add notice:', err);
    }

    return newProduct;
  };

  // Update Product
  const updateProduct = async (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );

    try {
      await updateDoc(doc(db, 'products', id), updates);
    } catch (err) {
      console.warn('Firestore product update notice:', err);
    }
  };

  // Delete Product
  const deleteProduct = async (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));

    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (err) {
      console.warn('Firestore product delete notice:', err);
    }
  };

  // Adjust Product Stock
  const adjustProductStock = async (id: string, newStock: number) => {
    await updateProduct(id, { stock_quantity: Math.max(0, newStock) });
  };

  // Add Expense
  const addExpense = async (expenseData: Omit<Expense, 'id' | 'timestamp'>) => {
    const id = generateUniqueId('exp');
    const timestamp = new Date().toISOString();
    const newExpense: Expense = { ...expenseData, id, timestamp };

    setExpenses((prev) => [newExpense, ...prev]);
    broadcastRecordChange('CREATED', 'expenses', newExpense);

    try {
      await setDoc(doc(db, 'expenses', id), newExpense);
    } catch (err) {
      console.warn('Firestore expense add notice:', err);
    }
  };

  // Delete Expense
  const deleteExpense = async (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));

    try {
      await deleteDoc(doc(db, 'expenses', id));
    } catch (err) {
      console.warn('Firestore expense delete notice:', err);
    }
  };

  // Add Customer
  const addCustomer = async (customerData: Omit<Customer, 'id'>): Promise<Customer> => {
    const id = generateUniqueId('cust');
    const newCustomer: Customer = {
      due_balance: 0,
      credit_limit: 0,
      ...customerData,
      id,
    };

    setCustomers((prev) => [newCustomer, ...prev]);
    broadcastRecordChange('CREATED', 'customers', newCustomer);

    try {
      await setDoc(doc(db, 'customers', id), newCustomer);
    } catch (err) {
      console.warn('Firestore customer add notice:', err);
    }

    return newCustomer;
  };

  // Update Customer
  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );

    try {
      await updateDoc(doc(db, 'customers', id), updates);
    } catch (err) {
      console.warn('Firestore customer update notice:', err);
    }
  };

  const updateCustomerBalance = async (customerId: string, newBalance: number) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, due_balance: newBalance } : c))
    );

    try {
      await updateDoc(doc(db, 'customers', customerId), { due_balance: newBalance });
    } catch (err) {
      console.warn('Firestore customer update balance notice:', err);
    }
  };

  // Delete Customer
  const deleteCustomer = async (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    try {
      await deleteDoc(doc(db, 'customers', id));
    } catch (err) {
      console.warn('Firestore customer delete notice:', err);
    }
  };

  // Add Supplier
  const addSupplier = async (supplierData: Omit<Supplier, 'id'>): Promise<Supplier> => {
    const id = generateUniqueId('supp');
    const newSupplier: Supplier = {
      due_balance: 0,
      ...supplierData,
      id,
    };

    setSuppliers((prev) => [newSupplier, ...prev]);
    broadcastRecordChange('CREATED', 'suppliers', newSupplier);

    try {
      await setDoc(doc(db, 'suppliers', id), newSupplier);
    } catch (err) {
      console.warn('Firestore supplier add notice:', err);
    }

    return newSupplier;
  };

  // Update Supplier
  const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
    setSuppliers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );

    try {
      await updateDoc(doc(db, 'suppliers', id), updates);
    } catch (err) {
      console.warn('Firestore supplier update notice:', err);
    }
  };

  // Update Supplier Balance
  const updateSupplierBalance = async (supplierId: string, newBalance: number) => {
    setSuppliers((prev) =>
      prev.map((s) => (s.id === supplierId ? { ...s, due_balance: newBalance } : s))
    );

    try {
      await updateDoc(doc(db, 'suppliers', supplierId), { due_balance: newBalance });
    } catch (err) {
      console.warn('Firestore supplier update balance notice:', err);
    }
  };

  // Delete Supplier
  const deleteSupplier = async (id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    try {
      await deleteDoc(doc(db, 'suppliers', id));
    } catch (err) {
      console.warn('Firestore supplier delete notice:', err);
    }
  };

  // Branch & Section Management
  const addSection = async (sectionData: Omit<StoreSection, 'id'>): Promise<StoreSection> => {
    const id = generateUniqueId('sec');
    const newSection: StoreSection = {
      ...sectionData,
      id,
      status: sectionData.status || 'active',
    };
    setSections((prev) => [...prev, newSection]);
    broadcastRecordChange('CREATED', 'sections', newSection);

    try {
      await setDoc(doc(db, 'sections', id), newSection);
    } catch (err) {
      console.warn('Firestore section add notice:', err);
    }

    return newSection;
  };

  const updateSection = async (id: string, updates: Partial<StoreSection>) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    broadcastRecordChange('UPDATED', 'sections', { id, ...updates });

    try {
      await updateDoc(doc(db, 'sections', id), updates);
    } catch (err) {
      console.warn('Firestore section update notice:', err);
    }
  };

  const deleteSection = async (id: string) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
    broadcastRecordChange('DELETED', 'sections', { id });

    try {
      await deleteDoc(doc(db, 'sections', id));
    } catch (err) {
      console.warn('Firestore section delete notice:', err);
    }
  };

  // Create Purchase Invoice (Increments stock & updates product cost & supplier balance)
  const createPurchaseInvoice = async (
    purchaseData: Omit<PurchaseInvoice, 'id' | 'purchase_no' | 'timestamp' | 'date'>
  ): Promise<PurchaseInvoice> => {
    const id = generateUniqueId('pur');
    const purchase_no = generateNextPurchaseNo();
    const now = new Date();
    const timestamp = now.toISOString();
    const date = now.toISOString().split('T')[0];

    const fullPurchase: PurchaseInvoice = {
      ...purchaseData,
      id,
      purchase_no,
      timestamp,
      date,
    };

    setPurchases((prev) => [fullPurchase, ...prev]);
    broadcastRecordChange('CREATED', 'purchases', fullPurchase);

    // Increase product stock & update product cost to current purchase cost
    const updatedProducts = products.map((prod) => {
      const match = purchaseData.items.find((item) => item.product_id === prod.id || item.barcode === prod.barcode);
      if (match) {
        return {
          ...prod,
          stock_quantity: prod.stock_quantity + match.qty,
          cost: match.cost > 0 ? match.cost : prod.cost,
        };
      }
      return prod;
    });
    setProducts(updatedProducts);

    // Update supplier due balance if credit
    if (purchaseData.due_amount > 0 && purchaseData.supplier_id) {
      const supp = suppliers.find((s) => s.id === purchaseData.supplier_id);
      if (supp) {
        updateSupplierBalance(supp.id, supp.due_balance + purchaseData.due_amount);
      }
    }

    // Persist to Firestore
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'purchases', id), fullPurchase);

      purchaseData.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.product_id || p.barcode === item.barcode);
        if (prod) {
          const newQty = prod.stock_quantity + item.qty;
          const newCost = item.cost > 0 ? item.cost : prod.cost;
          batch.update(doc(db, 'products', prod.id), {
            stock_quantity: newQty,
            cost: newCost,
          });
        }
      });

      await batch.commit();
    } catch (err) {
      console.warn('Firestore purchase invoice batch write error:', err);
    }

    return fullPurchase;
  };

  // Helper: Auto-recall last billed price to a customer for a product
  const getLastBilledPriceForCustomer = (
    customer: Customer,
    product: Product | { id?: string; product_id?: string; barcode?: string; sku?: string; name?: string }
  ): number | null => {
    if (!customer || !product) return null;
    const prodId = ('id' in product && product.id) ? product.id : ('product_id' in product ? product.product_id : '');
    const prodBarcode = product.barcode || product.sku;

    for (const inv of invoices) {
      if (inv.status === 'voided') continue;

      const isMatchCust =
        (inv.customer_id && inv.customer_id === customer.id) ||
        (inv.customer_name && inv.customer_name.trim().toLowerCase() === customer.name.trim().toLowerCase()) ||
        (customer.phone && customer.phone !== '00000000' && inv.customer_phone === customer.phone);

      if (isMatchCust) {
        const matchingItem = inv.items.find(
          (it) =>
            (prodId && it.product_id === prodId) ||
            (prodBarcode && it.barcode === prodBarcode) ||
            (product.sku && it.sku === product.sku) ||
            (product.name && it.name.toLowerCase() === product.name.toLowerCase())
        );

        if (matchingItem && typeof matchingItem.price === 'number' && matchingItem.price >= 0) {
          return matchingItem.price;
        }
      }
    }
    return null;
  };

  // Helper: Auto-recall last purchase rate from a supplier for a product
  const getLastPurchaseRateForSupplier = (
    supplier: Supplier,
    product: Product | { id?: string; product_id?: string; barcode?: string; sku?: string; name?: string }
  ): number | null => {
    if (!supplier || !product) return null;
    const prodId = ('id' in product && product.id) ? product.id : ('product_id' in product ? product.product_id : '');
    const prodBarcode = product.barcode || product.sku;

    for (const pur of purchases) {
      if (pur.status === 'cancelled') continue;

      const isMatchSupp =
        (pur.supplier_id && pur.supplier_id === supplier.id) ||
        (pur.supplier_name && pur.supplier_name.trim().toLowerCase() === supplier.name.trim().toLowerCase()) ||
        (supplier.phone && pur.supplier_phone === supplier.phone);

      if (isMatchSupp) {
        const matchingItem = pur.items.find(
          (it) =>
            (prodId && it.product_id === prodId) ||
            (prodBarcode && it.barcode === prodBarcode) ||
            (product.sku && it.sku === product.sku) ||
            (product.name && it.name.toLowerCase() === product.name.toLowerCase())
        );

        if (matchingItem && typeof matchingItem.cost === 'number' && matchingItem.cost >= 0) {
          return matchingItem.cost;
        }
      }
    }
    return null;
  };

  // Create Quotation
  const createQuotation = async (
    quoteData: Omit<Quotation, 'id' | 'quote_no' | 'date'>
  ): Promise<Quotation> => {
    const id = generateUniqueId('quote');
    const quote_no = generateNextQuotationNo();
    const date = new Date().toISOString().split('T')[0];

    const newQuote: Quotation = {
      ...quoteData,
      id,
      quote_no,
      date,
    };

    setQuotations((prev) => [newQuote, ...prev]);
    broadcastRecordChange('CREATED', 'quotations', newQuote);

    try {
      await setDoc(doc(db, 'quotations', id), newQuote);
    } catch (err) {
      console.warn('Firestore quotation add notice:', err);
    }

    return newQuote;
  };

  // Create Sales Return
  const createSalesReturn = async (
    returnData: Omit<SalesReturn, 'id' | 'return_no' | 'timestamp' | 'date'>
  ): Promise<SalesReturn> => {
    const id = generateUniqueId('sret');
    const return_no = generateNextSalesReturnNo();
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const timestamp = now.toISOString();

    const newReturn: SalesReturn = {
      ...returnData,
      id,
      return_no,
      date,
      timestamp,
    };

    // Restock products and update customer balance if credit note
    setProducts((prev) =>
      prev.map((p) => {
        const retItem = newReturn.items.find((item) => item.product_id === p.id);
        if (retItem) {
          return { ...p, stock_quantity: p.stock_quantity + retItem.qty };
        }
        return p;
      })
    );

    if (newReturn.customer_id && newReturn.refund_method === 'credit_note') {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === newReturn.customer_id
            ? { ...c, due_balance: Math.max(0, c.due_balance - newReturn.refund_amount) }
            : c
        )
      );
    }

    setSalesReturns((prev) => [newReturn, ...prev]);
    broadcastRecordChange('CREATED', 'sales_returns', newReturn);

    try {
      await setDoc(doc(db, 'sales_returns', id), newReturn);
    } catch (err) {
      console.warn('Firestore sales return notice:', err);
    }

    return newReturn;
  };

  // Create Purchase Return
  const createPurchaseReturn = async (
    returnData: Omit<PurchaseReturn, 'id' | 'return_no' | 'timestamp' | 'date'>
  ): Promise<PurchaseReturn> => {
    const id = generateUniqueId('pret');
    const return_no = generateNextPurchaseReturnNo();
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const timestamp = now.toISOString();

    const newReturn: PurchaseReturn = {
      ...returnData,
      id,
      return_no,
      date,
      timestamp,
    };

    // Deduct products from inventory & reduce supplier due balance
    setProducts((prev) =>
      prev.map((p) => {
        const retItem = newReturn.items.find((item) => item.product_id === p.id);
        if (retItem) {
          return { ...p, stock_quantity: Math.max(0, p.stock_quantity - retItem.qty) };
        }
        return p;
      })
    );

    if (newReturn.supplier_id && newReturn.refund_method === 'supplier_credit') {
      setSuppliers((prev) =>
        prev.map((s) =>
          s.id === newReturn.supplier_id
            ? { ...s, due_balance: Math.max(0, s.due_balance - newReturn.refund_amount) }
            : s
        )
      );
    }

    setPurchaseReturns((prev) => [newReturn, ...prev]);
    broadcastRecordChange('CREATED', 'purchase_returns', newReturn);

    try {
      await setDoc(doc(db, 'purchase_returns', id), newReturn);
    } catch (err) {
      console.warn('Firestore purchase return notice:', err);
    }

    return newReturn;
  };

  // Change Branch on existing transaction (restricted permission)
  const updateTransactionBranch = async (
    type: 'invoice' | 'purchase' | 'sales_return' | 'purchase_return',
    id: string,
    newBranch: string
  ) => {
    if (type === 'invoice') {
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === id ? { ...inv, section: newBranch } : inv))
      );
      try {
        await updateDoc(doc(db, 'invoices', id), { section: newBranch });
      } catch (err) {
        console.warn('Firestore invoice branch update fallback:', err);
      }
      broadcastRecordChange('UPDATED', 'invoices', { id, section: newBranch });
    } else if (type === 'purchase') {
      setPurchases((prev) =>
        prev.map((p) => (p.id === id ? { ...p, section: newBranch } : p))
      );
      try {
        await updateDoc(doc(db, 'purchases', id), { section: newBranch });
      } catch (err) {
        console.warn('Firestore purchase branch update fallback:', err);
      }
      broadcastRecordChange('UPDATED', 'purchases', { id, section: newBranch });
    } else if (type === 'sales_return') {
      setSalesReturns((prev) =>
        prev.map((r) => (r.id === id ? { ...r, section: newBranch } : r))
      );
      try {
        await updateDoc(doc(db, 'sales_returns', id), { section: newBranch });
      } catch (err) {
        console.warn('Firestore sales return branch update fallback:', err);
      }
      broadcastRecordChange('UPDATED', 'sales_returns', { id, section: newBranch });
    } else if (type === 'purchase_return') {
      setPurchaseReturns((prev) =>
        prev.map((r) => (r.id === id ? { ...r, section: newBranch } : r))
      );
      try {
        await updateDoc(doc(db, 'purchase_returns', id), { section: newBranch });
      } catch (err) {
        console.warn('Firestore purchase return branch update fallback:', err);
      }
      broadcastRecordChange('UPDATED', 'purchase_returns', { id, section: newBranch });
    }
  };

  // Create Purchase Order
  const createPurchaseOrder = async (
    poData: Omit<PurchaseOrder, 'id' | 'po_no' | 'date'>
  ): Promise<PurchaseOrder> => {
    const id = generateUniqueId('po');
    const po_no = generateNextPurchaseOrderNo();
    const date = new Date().toISOString().split('T')[0];

    const newPO: PurchaseOrder = {
      ...poData,
      id,
      po_no,
      date,
    };

    setPurchaseOrders((prev) => [newPO, ...prev]);
    broadcastRecordChange('CREATED', 'purchase_orders', newPO);

    try {
      await setDoc(doc(db, 'purchase_orders', id), newPO);
    } catch (err) {
      console.warn('Firestore purchase order notice:', err);
    }

    return newPO;
  };

  // Create Voucher
  const createVoucher = async (
    voucherData: Omit<Voucher, 'id' | 'voucher_no' | 'timestamp' | 'date'>
  ): Promise<Voucher> => {
    const id = generateUniqueId('vouch');
    const voucher_no = generateNextVoucherNo(voucherData.type);
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const timestamp = now.toISOString();

    const newVoucher: Voucher = {
      ...voucherData,
      id,
      voucher_no,
      date,
      timestamp,
    };

    // Update balances
    if (newVoucher.party_type === 'customer' && newVoucher.party_id && newVoucher.type === 'receipt') {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === newVoucher.party_id
            ? { ...c, due_balance: Math.max(0, c.due_balance - newVoucher.amount) }
            : c
        )
      );
    } else if (newVoucher.party_type === 'supplier' && newVoucher.party_id && newVoucher.type === 'payment') {
      setSuppliers((prev) =>
        prev.map((s) =>
          s.id === newVoucher.party_id
            ? { ...s, due_balance: Math.max(0, s.due_balance - newVoucher.amount) }
            : s
        )
      );
    }

    setVouchers((prev) => [newVoucher, ...prev]);
    broadcastRecordChange('CREATED', 'vouchers', newVoucher);

    try {
      await setDoc(doc(db, 'vouchers', id), newVoucher);
    } catch (err) {
      console.warn('Firestore voucher notice:', err);
    }

    return newVoucher;
  };

  // Brand actions
  const addBrand = async (brand: Omit<BrandMaster, 'id'>): Promise<BrandMaster> => {
    const id = generateUniqueId('br');
    const newBrand: BrandMaster = { ...brand, id };
    setBrands((prev) => [...prev, newBrand]);
    try {
      await setDoc(doc(db, 'brands', id), newBrand);
    } catch (err) {
      console.warn('Firestore brand add notice:', err);
    }
    return newBrand;
  };

  const updateBrand = async (id: string, updates: Partial<BrandMaster>) => {
    setBrands((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
    );
    try {
      await updateDoc(doc(db, 'brands', id), updates);
    } catch (err) {
      console.warn('Firestore brand update notice:', err);
    }
  };

  const deleteBrand = async (id: string) => {
    setBrands((prev) => prev.filter((b) => b.id !== id));
    try {
      await deleteDoc(doc(db, 'brands', id));
    } catch (err) {
      console.warn('Firestore brand delete notice:', err);
    }
  };

  // Category actions
  const addCategory = async (cat: Omit<CategoryMaster, 'id'>): Promise<CategoryMaster> => {
    const id = generateUniqueId('cat');
    const newCat: CategoryMaster = { ...cat, id };
    setCategories((prev) => [...prev, newCat]);
    try {
      await setDoc(doc(db, 'categories', id), newCat);
    } catch (err) {
      console.warn('Firestore category add notice:', err);
    }
    return newCat;
  };

  const updateCategory = async (id: string, updates: Partial<CategoryMaster>) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    try {
      await updateDoc(doc(db, 'categories', id), updates);
    } catch (err) {
      console.warn('Firestore category update notice:', err);
    }
  };

  const deleteCategory = async (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (err) {
      console.warn('Firestore category delete notice:', err);
    }
  };

  // UOM actions
  const addUom = async (uom: Omit<UomMaster, 'id'>): Promise<UomMaster> => {
    const id = generateUniqueId('uom');
    const newUom: UomMaster = { ...uom, id };
    setUoms((prev) => [...prev, newUom]);
    try {
      await setDoc(doc(db, 'uoms', id), newUom);
    } catch (err) {
      console.warn('Firestore uom add notice:', err);
    }
    return newUom;
  };

  const updateUom = async (id: string, updates: Partial<UomMaster>) => {
    setUoms((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...updates } : u))
    );
    try {
      await updateDoc(doc(db, 'uoms', id), updates);
    } catch (err) {
      console.warn('Firestore uom update notice:', err);
    }
  };

  const deleteUom = async (id: string) => {
    setUoms((prev) => prev.filter((u) => u.id !== id));
    try {
      await deleteDoc(doc(db, 'uoms', id));
    } catch (err) {
      console.warn('Firestore uom delete notice:', err);
    }
  };

  // Update Price List
  const updatePriceList = (items: PriceListTier[]) => {
    setPriceLists(items);
  };

  // Reset to seed data
  const resetToDefaultSeedData = async () => {
    setProducts(INITIAL_PRODUCTS);
    setInvoices(INITIAL_INVOICES);
    setStockTransfers(INITIAL_STOCK_TRANSFERS);
    setExpenses(INITIAL_EXPENSES);
    setCustomers(INITIAL_CUSTOMERS);
    setSuppliers(INITIAL_SUPPLIERS);
    setPurchases(INITIAL_PURCHASES);
    setSections(INITIAL_SECTIONS);
    setQuotations([]);
    setSalesReturns(INITIAL_SALES_RETURNS);
    setPurchaseReturns(INITIAL_PURCHASE_RETURNS);
    setPurchaseOrders(INITIAL_PURCHASE_ORDERS);
    setVouchers(INITIAL_VOUCHERS);
    setPriceLists(INITIAL_PRICE_LISTS);
    setBatches(INITIAL_BATCHES);
    setBrands(INITIAL_BRANDS);
    setCategories(INITIAL_CATEGORIES);
    setUoms(INITIAL_UOMS);

    try {
      const batch = writeBatch(db);
      INITIAL_PRODUCTS.forEach((p) => batch.set(doc(db, 'products', p.id), p));
      INITIAL_INVOICES.forEach((inv) => batch.set(doc(db, 'invoices', inv.id), inv));
      INITIAL_STOCK_TRANSFERS.forEach((st) => batch.set(doc(db, 'stock_transfers', st.id), st));
      INITIAL_EXPENSES.forEach((e) => batch.set(doc(db, 'expenses', e.id), e));
      INITIAL_CUSTOMERS.forEach((c) => batch.set(doc(db, 'customers', c.id), c));
      INITIAL_SUPPLIERS.forEach((s) => batch.set(doc(db, 'suppliers', s.id), s));
      INITIAL_PURCHASES.forEach((pu) => batch.set(doc(db, 'purchases', pu.id), pu));
      INITIAL_SECTIONS.forEach((s) => batch.set(doc(db, 'sections', s.id), s));
      await batch.commit();
    } catch (err) {
      console.warn('Reset seed data batch error:', err);
    }
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        invoices,
        stockTransfers,
        expenses,
        customers,
        suppliers,
        purchases,
        sections,
        quotations,
        salesReturns,
        purchaseReturns,
        purchaseOrders,
        vouchers,
        priceLists,
        batches,
        brands,
        categories,
        uoms,
        loading,
        createInvoice,
        voidInvoice,
        createPurchaseInvoice,
        createSalesReturn,
        createPurchaseReturn,
        createPurchaseOrder,
        createVoucher,
        addBrand,
        updateBrand,
        deleteBrand,
        addCategory,
        updateCategory,
        deleteCategory,
        addUom,
        updateUom,
        deleteUom,
        updatePriceList,
        addSection,
        updateSection,
        deleteSection,
        createStockTransfer,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustProductStock,
        addExpense,
        deleteExpense,
        addCustomer,
        updateCustomer,
        updateCustomerBalance,
        deleteCustomer,
        addSupplier,
        updateSupplier,
        updateSupplierBalance,
        deleteSupplier,
        getLastBilledPriceForCustomer,
        getLastPurchaseRateForSupplier,
        createQuotation,
        updateTransactionBranch,
        generateNextInvoiceNo,
        generateNextPurchaseNo,
        generateNextTransferNo,
        generateNextQuotationNo,
        generateNextSalesReturnNo,
        generateNextPurchaseReturnNo,
        generateNextPurchaseOrderNo,
        generateNextVoucherNo,
        resetToDefaultSeedData,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
