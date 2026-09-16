import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { Product, InvoiceItem, PaymentBreakdown, Invoice, Customer, ProductUnit } from '../../types';
import { InvoicePrintModal } from './InvoicePrintModal';
import { QuickAddPartyModal } from './QuickAddPartyModal';
import { QuickAddProductModal } from './QuickAddProductModal';
import { PartyItemPriceHistoryModal } from './PartyItemPriceHistoryModal';
import { CustomerHistoryPanel } from './CustomerHistoryPanel';
import confetti from 'canvas-confetti';
import { 
  Search, 
  Plus, 
  Trash2, 
  Printer, 
  AlertCircle, 
  User, 
  RotateCcw, 
  Check, 
  ChevronDown, 
  Sparkles, 
  CreditCard, 
  Banknote, 
  UserPlus, 
  PackagePlus, 
  Building2, 
  MapPin, 
  Phone,
  History,
  Clock,
  RefreshCw,
  Layers,
  X,
  Copy
} from 'lucide-react';

interface PosBillingTab {
  id: string;
  tabNumber: number;
  customer: Customer;
  customerSearchQuery: string;
  items: InvoiceItem[];
  discount: number;
  otherAmt: number;
  isCashSale: boolean;
  narration: string;
  paymentInputs: {
    cash: string;
    knet: string;
    card: string;
    online: string;
    cheque: string;
    credit: string;
  };
  tenderCash: number;
}

export const PosView: React.FC = () => {
  const { 
    products, 
    customers, 
    invoices, 
    createInvoice, 
    addCustomer, 
    addProduct, 
    getLastBilledPriceForCustomer 
  } = useStore();
  const { user, activeSection } = useAuth();

  // Current Bill State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>(
    customers[0] || { id: 'cust-1', name: 'CASH CUSTOMER 123', phone: '00000000', code: '123', due_balance: 0 }
  );
  const [customerSearchQuery, setCustomerSearchQuery] = useState(selectedCustomer.name);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Item Search
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [highlightedProductIndex, setHighlightedProductIndex] = useState<number>(0);
  const [highlightedCustomerIndex, setHighlightedCustomerIndex] = useState<number>(0);

  // Invoice Items
  const [items, setItems] = useState<InvoiceItem[]>([]);
  
  // Financials & Adjustments
  const [discount, setDiscount] = useState<number>(0);
  const [otherAmt, setOtherAmt] = useState<number>(0);
  const [isCashSale, setIsCashSale] = useState<boolean>(true); // Cash vs Credit toggle
  const [narration, setNarration] = useState<string>('');

  // Payment Breakdown Inputs (raw strings for fluid decimal typing and instant auto-balancing)
  const [paymentInputs, setPaymentInputs] = useState<{
    cash: string;
    knet: string;
    card: string;
    online: string;
    cheque: string;
    credit: string;
  }>({
    cash: '',
    knet: '',
    card: '',
    online: '',
    cheque: '',
    credit: '',
  });

  const [tenderCash, setTenderCash] = useState<number>(0);

  // Billing Queue Tabs State (Supports Concurrent Billing Queue / Multiple Invoices)
  const [tabs, setTabs] = useState<PosBillingTab[]>(() => {
    try {
      const saved = localStorage.getItem('apex_pos_billing_tabs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    const defaultCust = customers[0] || { id: 'cust-1', name: 'CASH CUSTOMER 123', phone: '00000000', code: '123', due_balance: 0 };
    return [{
      id: 'tab-init-1',
      tabNumber: 1,
      customer: defaultCust,
      customerSearchQuery: defaultCust.name,
      items: [],
      discount: 0,
      otherAmt: 0,
      isCashSale: true,
      narration: '',
      paymentInputs: { cash: '', knet: '', card: '', online: '', cheque: '', credit: '' },
      tenderCash: 0,
    }];
  });
  const [activeTabId, setActiveTabId] = useState<string>(() => tabs[0]?.id || 'tab-init-1');

  // Sync active inputs to current tab in tabs state and localStorage
  useEffect(() => {
    setTabs((prev) => {
      const updated = prev.map((t) => {
        if (t.id === activeTabId) {
          return {
            ...t,
            customer: selectedCustomer,
            customerSearchQuery,
            items,
            discount,
            otherAmt,
            isCashSale,
            narration,
            paymentInputs,
            tenderCash,
          };
        }
        return t;
      });
      try {
        localStorage.setItem('apex_pos_billing_tabs', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, [items, selectedCustomer, customerSearchQuery, discount, otherAmt, isCashSale, narration, paymentInputs, tenderCash, activeTabId]);

  // Switch between queued bill tabs
  const handleSwitchTab = (targetId: string) => {
    if (targetId === activeTabId) return;
    const target = tabs.find((t) => t.id === targetId);
    if (!target) return;

    setSelectedCustomer(target.customer);
    setCustomerSearchQuery(target.customerSearchQuery || target.customer.name);
    setItems(target.items);
    setDiscount(target.discount);
    setOtherAmt(target.otherAmt);
    setIsCashSale(target.isCashSale);
    setNarration(target.narration);
    setPaymentInputs(target.paymentInputs);
    setTenderCash(target.tenderCash);
    setActiveTabId(targetId);
  };

  // Create brand-new queued bill
  const handleAddNewTab = () => {
    const nextNum = Math.max(0, ...tabs.map((t) => t.tabNumber)) + 1;
    const defaultCust = customers[0] || { id: 'cust-1', name: 'CASH CUSTOMER 123', phone: '00000000', code: '123', due_balance: 0 };
    const newTab: PosBillingTab = {
      id: `tab-queue-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tabNumber: nextNum,
      customer: defaultCust,
      customerSearchQuery: defaultCust.name,
      items: [],
      discount: 0,
      otherAmt: 0,
      isCashSale: true,
      narration: '',
      paymentInputs: { cash: '', knet: '', card: '', online: '', cheque: '', credit: '' },
      tenderCash: 0,
    };

    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setSelectedCustomer(newTab.customer);
    setCustomerSearchQuery(newTab.customerSearchQuery);
    setItems([]);
    setDiscount(0);
    setOtherAmt(0);
    setIsCashSale(true);
    setNarration('');
    setPaymentInputs({ cash: '', knet: '', card: '', online: '', cheque: '', credit: '' });
    setTenderCash(0);

    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
  };

  // Duplicate current active bill to a new queue tab
  const handleDuplicateTab = () => {
    const nextNum = Math.max(0, ...tabs.map((t) => t.tabNumber)) + 1;
    const newTab: PosBillingTab = {
      id: `tab-queue-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tabNumber: nextNum,
      customer: { ...selectedCustomer },
      customerSearchQuery,
      items: items.map((i) => ({ ...i })),
      discount,
      otherAmt,
      isCashSale,
      narration,
      paymentInputs: { ...paymentInputs },
      tenderCash,
    };

    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  // Discard / Close a specific tab in the queue
  const handleCloseTab = (idToClose: string) => {
    if (tabs.length <= 1) {
      handleClearAll();
      return;
    }
    const tabToClose = tabs.find((t) => t.id === idToClose);
    if (tabToClose && tabToClose.items.length > 0) {
      if (!window.confirm(`Bill #${tabToClose.tabNumber} has ${tabToClose.items.length} items in cart. Discard this queued bill?`)) {
        return;
      }
    }
    const remaining = tabs.filter((t) => t.id !== idToClose);
    setTabs(remaining);
    try {
      localStorage.setItem('apex_pos_billing_tabs', JSON.stringify(remaining));
    } catch {}

    if (activeTabId === idToClose) {
      const nextTab = remaining[remaining.length - 1];
      setActiveTabId(nextTab.id);
      setSelectedCustomer(nextTab.customer);
      setCustomerSearchQuery(nextTab.customerSearchQuery || nextTab.customer.name);
      setItems(nextTab.items);
      setDiscount(nextTab.discount);
      setOtherAmt(nextTab.otherAmt);
      setIsCashSale(nextTab.isCashSale);
      setNarration(nextTab.narration);
      setPaymentInputs(nextTab.paymentInputs);
      setTenderCash(nextTab.tenderCash);
    }
  };

  // Listen for hidden feature trigger events from navigation right-click
  useEffect(() => {
    const handleNewQueueBill = () => {
      handleAddNewTab();
    };
    const handleDuplicateQueueBill = () => {
      handleDuplicateTab();
    };
    window.addEventListener('apex:pos:new-queue-bill', handleNewQueueBill);
    window.addEventListener('apex:pos:duplicate-queue-bill', handleDuplicateQueueBill);
    return () => {
      window.removeEventListener('apex:pos:new-queue-bill', handleNewQueueBill);
      window.removeEventListener('apex:pos:duplicate-queue-bill', handleDuplicateQueueBill);
    };
  }, [tabs, activeTabId, items, selectedCustomer, customerSearchQuery, discount, otherAmt, isCashSale, narration, paymentInputs, tenderCash]);

  // UI Modals & Panels
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [lastCreatedInvoice, setLastCreatedInvoice] = useState<Invoice | null>(null);
  const [viewingHistoricalInvoice, setViewingHistoricalInvoice] = useState<Invoice | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [printFormatTarget, setPrintFormatTarget] = useState<'thermal' | 'a4'>('a4');

  // Customer History & Party Price History State
  const [isCustomerHistoryOpen, setIsCustomerHistoryOpen] = useState<boolean>(false);
  const [priceHistoryTarget, setPriceHistoryTarget] = useState<{ item: InvoiceItem; index: number } | null>(null);

  // Quick Add Modals
  const [isQuickAddPartyOpen, setIsQuickAddPartyOpen] = useState<boolean>(false);
  const [isQuickAddProductOpen, setIsQuickAddProductOpen] = useState<boolean>(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const customerInputRef = useRef<HTMLInputElement>(null);
  const customerContainerRef = useRef<HTMLDivElement>(null);
  const itemSearchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (customerContainerRef.current && !customerContainerRef.current.contains(e.target as Node)) {
        setShowCustomerDropdown(false);
      }
      if (itemSearchContainerRef.current && !itemSearchContainerRef.current.contains(e.target as Node)) {
        setShowItemDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-scroll highlighted item in dropdown into view
  useEffect(() => {
    if (showItemDropdown && highlightedProductIndex >= 0) {
      const el = document.getElementById(`pos-item-dropdown-opt-${highlightedProductIndex}`);
      if (el) {
        el.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedProductIndex, showItemDropdown]);

  // Auto-scroll highlighted customer in dropdown into view
  useEffect(() => {
    if (showCustomerDropdown && highlightedCustomerIndex >= 0) {
      const el = document.getElementById(`pos-customer-dropdown-opt-${highlightedCustomerIndex}`);
      if (el) {
        el.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedCustomerIndex, showCustomerDropdown]);

  // Subtotal and Total calculations
  const subtotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const grandTotal = Math.max(0, subtotal - (Number(discount) || 0) + (Number(otherAmt) || 0));

  // Numerical values from payment input buffers
  const cashNum = parseFloat(paymentInputs.cash) || 0;
  const knetNum = parseFloat(paymentInputs.knet) || 0;
  const cardNum = parseFloat(paymentInputs.card) || 0;
  const onlineNum = parseFloat(paymentInputs.online) || 0;
  const chequeNum = parseFloat(paymentInputs.cheque) || 0;
  const creditNum = parseFloat(paymentInputs.credit) || 0;

  // Total paid across direct methods (Cash, K-Net, Card, Online, Cheque)
  const totalDirectPaid = cashNum + knetNum + cardNum + onlineNum + chequeNum;

  // Credit / Due amount calculation
  const creditAmount = !isCashSale
    ? (creditNum > 0 
        ? creditNum 
        : Math.max(0, Number((grandTotal - totalDirectPaid).toFixed(3))))
    : creditNum;

  // Total paid across all channels including credit
  const totalPaid = totalDirectPaid + creditAmount;

  // Tender Cash and Return Amount
  const returnAmt = (tenderCash > 0 && cashNum > 0) 
    ? Math.max(0, Number((tenderCash - cashNum).toFixed(3))) 
    : 0;

  // Auto-sync payment defaults when grandTotal or cash/credit mode changes
  useEffect(() => {
    if (isCashSale) {
      const nonCashSum = 
        (parseFloat(paymentInputs.knet) || 0) +
        (parseFloat(paymentInputs.card) || 0) +
        (parseFloat(paymentInputs.online) || 0) +
        (parseFloat(paymentInputs.cheque) || 0);
      const autoCash = Math.max(0, Number((grandTotal - nonCashSum).toFixed(3)));
      setPaymentInputs((prev) => ({
        ...prev,
        cash: autoCash > 0 ? autoCash.toString() : (grandTotal === 0 ? '' : '0'),
        credit: '',
      }));
      setTenderCash(autoCash);
    } else {
      const directSum = 
        (parseFloat(paymentInputs.cash) || 0) +
        (parseFloat(paymentInputs.knet) || 0) +
        (parseFloat(paymentInputs.card) || 0) +
        (parseFloat(paymentInputs.online) || 0) +
        (parseFloat(paymentInputs.cheque) || 0);
      const autoCredit = Math.max(0, Number((grandTotal - directSum).toFixed(3)));
      setPaymentInputs((prev) => ({
        ...prev,
        credit: autoCredit > 0 ? autoCredit.toString() : (grandTotal === 0 ? '' : '0'),
      }));
    }
  }, [grandTotal, isCashSale]);

  // Count past transactions for selected party
  const selectedPartyInvoicesCount = invoices.filter((inv) => {
    if (inv.status === 'voided') return false;
    const idMatch = inv.customer_id && inv.customer_id === selectedCustomer.id;
    const nameMatch = inv.customer_name && inv.customer_name.trim().toLowerCase() === selectedCustomer.name.trim().toLowerCase();
    const phoneMatch = selectedCustomer.phone && selectedCustomer.phone !== '00000000' && inv.customer_phone === selectedCustomer.phone;
    return idMatch || nameMatch || phoneMatch;
  }).length;

  // Select Customer and Auto-Recall Last Billed Rates for any active item lines
  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearchQuery(customer.name);
    setShowCustomerDropdown(false);

    // Auto-update unit price of existing line items based on this customer's last billed rate
    setItems((prevItems) => 
      prevItems.map((item) => {
        const recalledPrice = getLastBilledPriceForCustomer(customer, item);
        if (recalledPrice !== null && recalledPrice > 0) {
          return {
            ...item,
            price: recalledPrice,
            total: Number((item.qty * recalledPrice).toFixed(3)),
          };
        }
        return item;
      })
    );
  };

  // Handle adding product or invoice item from customer history
  const handleAddProductOrItemToBill = (prodOrItem: Product | InvoiceItem) => {
    const recalledRate = getLastBilledPriceForCustomer(selectedCustomer, prodOrItem);
    const applicablePrice = recalledRate !== null 
      ? recalledRate 
      : ('price' in prodOrItem ? prodOrItem.price : 0);

    if ('product_id' in prodOrItem) {
      const existingIndex = items.findIndex(
        (it) => (it.product_id && it.product_id === prodOrItem.product_id) || (it.barcode && it.barcode === prodOrItem.barcode)
      );
      if (existingIndex >= 0) {
        handleUpdateQty(existingIndex, items[existingIndex].qty + 1);
      } else {
        setItems((prev) => [
          ...prev, 
          { 
            ...prodOrItem, 
            price: applicablePrice, 
            qty: 1, 
            total: Number(applicablePrice.toFixed(3)) 
          }
        ]);
      }
    } else {
      handleSelectItem(prodOrItem);
    }
  };

  // Handle re-ordering all items from a past invoice
  const handleReorderInvoice = (pastInv: Invoice) => {
    const newItems: InvoiceItem[] = pastInv.items.map((it) => {
      const recalledRate = getLastBilledPriceForCustomer(selectedCustomer, it);
      const applicablePrice = recalledRate !== null ? recalledRate : it.price;
      return {
        product_id: it.product_id,
        sku: it.sku,
        barcode: it.barcode,
        name: it.name,
        unit: it.unit,
        qty: it.qty,
        stock: it.stock || 50,
        price: applicablePrice,
        total: Number((it.qty * applicablePrice).toFixed(3)),
        cost: it.cost,
      };
    });
    setItems(newItems);
    setIsCustomerHistoryOpen(false);
  };

  // Filtered Products for Autocomplete
  const filteredProducts = itemSearchQuery.trim() === ''
    ? []
    : products.filter((p) => {
        const q = itemSearchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.barcode.toLowerCase().includes(q) ||
          (p.additionalBarcodes && p.additionalBarcodes.some((b) => b.toLowerCase().includes(q))) ||
          p.category.toLowerCase().includes(q)
        );
      });

  // Filtered Customers for Autocomplete
  const filteredCustomers = customerSearchQuery.trim() === ''
    ? customers
    : customers.filter((c) => {
        const q = customerSearchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          (c.firm_name && c.firm_name.toLowerCase().includes(q)) ||
          c.phone.includes(q) ||
          c.code.toLowerCase().includes(q) ||
          (c.location && c.location.toLowerCase().includes(q)) ||
          (c.civil_id_or_license && c.civil_id_or_license.toLowerCase().includes(q))
        );
      });


  // Handle Quick Add Party Saved
  const handleCustomerAdded = async (newCustData: Customer) => {
    const saved = await addCustomer(newCustData);
    handleSelectCustomer(saved);
  };

  // Handle Quick Add Product Saved
  const handleProductAdded = async (newProdData: Product, addToBillImmediately: boolean) => {
    const saved = await addProduct(newProdData);
    if (addToBillImmediately) {
      handleSelectItem(saved);
    }
    setItemSearchQuery('');
    setShowItemDropdown(false);
  };

  // Handle selecting an item from search dropdown - AUTO-APPLIES LAST BILLED RATE
  const handleSelectItem = (prod: Product) => {
    const existingIndex = items.findIndex((it) => it.product_id === prod.id || it.barcode === prod.barcode);

    // Auto-recall last rate billed to this customer/party if any
    const recalledRate = getLastBilledPriceForCustomer(selectedCustomer, prod);
    const applicablePrice = recalledRate !== null ? recalledRate : prod.price;

    let targetIndex = 0;

    if (existingIndex >= 0) {
      // Increment quantity
      const updated = [...items];
      const newQty = updated[existingIndex].qty + 1;
      const priceToUse = updated[existingIndex].price || applicablePrice;
      updated[existingIndex] = {
        ...updated[existingIndex],
        qty: newQty,
        total: Number((newQty * priceToUse).toFixed(3)),
      };
      setItems(updated);
      targetIndex = existingIndex;
    } else {
      // Add new item row with auto-applied last rate
      const newItem: InvoiceItem = {
        product_id: prod.id,
        sku: prod.sku,
        barcode: prod.barcode,
        name: prod.name,
        unit: prod.unit,
        qty: 1,
        stock: prod.stock_quantity,
        price: applicablePrice,
        total: Number(applicablePrice.toFixed(3)),
        cost: prod.cost,
      };
      targetIndex = items.length;
      setItems((prev) => [...prev, newItem]);
    }

    setItemSearchQuery('');
    setShowItemDropdown(false);

    // Auto-focus UNIT dropdown of the newly added/updated item line
    setTimeout(() => {
      const unitEl = document.getElementById(`pos-unit-select-${targetIndex}`);
      if (unitEl) {
        unitEl.focus();
      }
    }, 60);
  };

  // Update item quantity
  const handleUpdateQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleDeleteItem(index);
      return;
    }
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      qty: newQty,
      total: Number((newQty * updated[index].price).toFixed(3)),
    };
    setItems(updated);
  };

  // Update item unit
  const handleUpdateUnit = (index: number, newUnit: ProductUnit) => {
    const updated = [...items];
    updated[index] = { ...updated[index], unit: newUnit };
    setItems(updated);
  };

  // Update item price (recalculates total price)
  const handleUpdatePrice = (index: number, newPrice: number) => {
    const safePrice = Math.max(0, newPrice);
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      price: safePrice,
      total: Number((updated[index].qty * safePrice).toFixed(3)),
    };
    setItems(updated);
  };

  // Update item total price (recalculates unit price)
  const handleUpdateTotal = (index: number, newTotal: number) => {
    const safeTotal = Math.max(0, newTotal);
    const updated = [...items];
    const qty = updated[index].qty || 1;
    const recalculatedPrice = Number((safeTotal / qty).toFixed(3));
    updated[index] = {
      ...updated[index],
      total: safeTotal,
      price: recalculatedPrice,
    };
    setItems(updated);
  };

  // Delete item from bill
  const handleDeleteItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Clear all items and reset state
  const handleClearAll = () => {
    setItems([]);
    setDiscount(0);
    setOtherAmt(0);
    setPaymentInputs({ cash: '', knet: '', card: '', online: '', cheque: '', credit: '' });
    setTenderCash(0);
    setNarration('');
    setShowClearConfirm(false);
    setSelectedCustomer(customers[0] || { id: 'cust-1', name: 'CASH CUSTOMER 123', phone: '00000000', code: '123', due_balance: 0 });
    setCustomerSearchQuery('CASH CUSTOMER 123');
    setIsCashSale(true);
  };

  // Toggle Cash vs Credit mode
  const handleToggleMode = (mode: 'cash' | 'credit') => {
    if (mode === 'cash') {
      setIsCashSale(true);
      const otherPaid = 
        (parseFloat(paymentInputs.knet) || 0) + 
        (parseFloat(paymentInputs.card) || 0) + 
        (parseFloat(paymentInputs.online) || 0) + 
        (parseFloat(paymentInputs.cheque) || 0);
      const cashAlloc = Math.max(0, Number((grandTotal - otherPaid).toFixed(3)));
      setPaymentInputs((prev) => ({
        ...prev,
        cash: cashAlloc > 0 ? cashAlloc.toString() : (grandTotal === 0 ? '' : '0'),
        credit: '',
      }));
      setTenderCash(cashAlloc);
    } else {
      setIsCashSale(false);
      const directPaid = 
        (parseFloat(paymentInputs.cash) || 0) +
        (parseFloat(paymentInputs.knet) || 0) + 
        (parseFloat(paymentInputs.card) || 0) + 
        (parseFloat(paymentInputs.online) || 0) + 
        (parseFloat(paymentInputs.cheque) || 0);
      const creditAlloc = Math.max(0, Number((grandTotal - directPaid).toFixed(3)));
      setPaymentInputs((prev) => ({
        ...prev,
        credit: creditAlloc > 0 ? creditAlloc.toString() : (grandTotal === 0 ? '' : '0'),
      }));
    }
  };

  // Update specific payment channel amount with real-time auto-adjustment
  const handlePaymentChange = (method: 'cash' | 'knet' | 'card' | 'online' | 'cheque' | 'credit', rawValue: string) => {
    if (method === 'cash') {
      const val = parseFloat(rawValue) || 0;
      setPaymentInputs((prev) => ({ ...prev, cash: rawValue }));
      setTenderCash(val);
      return;
    }

    if (method === 'credit') {
      setIsCashSale(false);
      setPaymentInputs((prev) => ({ ...prev, credit: rawValue }));
      return;
    }

    // Direct non-cash payment (knet, card, online, cheque)
    const numVal = parseFloat(rawValue) || 0;
    setPaymentInputs((prev) => {
      const next = { ...prev, [method]: rawValue };
      if (isCashSale) {
        // Remaining balance automatically adjusts in Cash
        const nonCashOther = 
          (method === 'knet' ? numVal : (parseFloat(next.knet) || 0)) +
          (method === 'card' ? numVal : (parseFloat(next.card) || 0)) +
          (method === 'online' ? numVal : (parseFloat(next.online) || 0)) +
          (method === 'cheque' ? numVal : (parseFloat(next.cheque) || 0));
        const autoCash = Math.max(0, Number((grandTotal - nonCashOther).toFixed(3)));
        next.cash = autoCash > 0 ? autoCash.toString() : (grandTotal === 0 ? '' : '0');
        setTenderCash(autoCash);
      } else {
        // Remaining balance automatically adjusts in Credit
        const directSum = 
          (parseFloat(next.cash) || 0) +
          (method === 'knet' ? numVal : (parseFloat(next.knet) || 0)) +
          (method === 'card' ? numVal : (parseFloat(next.card) || 0)) +
          (method === 'online' ? numVal : (parseFloat(next.online) || 0)) +
          (method === 'cheque' ? numVal : (parseFloat(next.cheque) || 0));
        const autoCredit = Math.max(0, Number((grandTotal - directSum).toFixed(3)));
        next.credit = autoCredit > 0 ? autoCredit.toString() : (grandTotal === 0 ? '' : '0');
      }
      return next;
    });
  };

  // Fast allocation of entire balance to a specific payment method
  const handleQuickPayMethod = (method: 'cash' | 'knet' | 'card' | 'online' | 'cheque' | 'credit') => {
    if (method === 'credit') {
      setIsCashSale(false);
      setPaymentInputs({
        cash: '',
        knet: '',
        card: '',
        online: '',
        cheque: '',
        credit: grandTotal > 0 ? grandTotal.toString() : '',
      });
      setTenderCash(0);
    } else if (method === 'cash') {
      setIsCashSale(true);
      setPaymentInputs({
        cash: grandTotal > 0 ? grandTotal.toString() : '',
        knet: '',
        card: '',
        online: '',
        cheque: '',
        credit: '',
      });
      setTenderCash(grandTotal);
    } else {
      setIsCashSale(true);
      setPaymentInputs({
        cash: '0',
        knet: method === 'knet' ? (grandTotal > 0 ? grandTotal.toString() : '') : '',
        card: method === 'card' ? (grandTotal > 0 ? grandTotal.toString() : '') : '',
        online: method === 'online' ? (grandTotal > 0 ? grandTotal.toString() : '') : '',
        cheque: method === 'cheque' ? (grandTotal > 0 ? grandTotal.toString() : '') : '',
        credit: '',
      });
      setTenderCash(0);
    }
  };

  // Finalize invoice & deduct stock
  const handlePayAndPrint = async (format: 'thermal' | 'a4' = 'a4') => {
    if (items.length === 0) {
      alert('Please add at least one item to generate an invoice.');
      return;
    }

    setPrintFormatTarget(format);
    setIsProcessing(true);
    try {
      const finalPayments: PaymentBreakdown = {
        cash: cashNum,
        knet: knetNum,
        card: cardNum,
        online: onlineNum,
        cheque: chequeNum,
        credit: creditAmount,
        visa: 0,
        upi: 0,
      };

      const finalStatus: 'paid' | 'credit' = (!isCashSale && creditAmount > 0) ? 'credit' : 'paid';

      const newInvoice = await createInvoice({
        customer_name: selectedCustomer.name,
        customer_phone: selectedCustomer.phone,
        customer_id: selectedCustomer.id,
        items,
        subtotal,
        discount,
        other_amt: otherAmt,
        total: grandTotal,
        paid_amount: totalDirectPaid,
        due_amount: creditAmount,
        credit_amount: creditAmount,
        payments: finalPayments,
        tender_cash: tenderCash || cashNum,
        return_amt: returnAmt,
        status: finalStatus,
        cashier_uid: user?.uid || 'usr-1',
        cashier_name: user?.displayName || 'Cashier',
        section: activeSection || 'SEENU CARE Co.',
        narration,
      });

      // Launch joyful celebration
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.8 },
      });

      setLastCreatedInvoice(newInvoice);
      if (tabs.length > 1) {
        const remaining = tabs.filter((t) => t.id !== activeTabId);
        setTabs(remaining);
        const nextTab = remaining[remaining.length - 1];
        setActiveTabId(nextTab.id);
        setSelectedCustomer(nextTab.customer);
        setCustomerSearchQuery(nextTab.customerSearchQuery || nextTab.customer.name);
        setItems(nextTab.items);
        setDiscount(nextTab.discount);
        setOtherAmt(nextTab.otherAmt);
        setIsCashSale(nextTab.isCashSale);
        setNarration(nextTab.narration);
        setPaymentInputs(nextTab.paymentInputs);
        setTenderCash(nextTab.tenderCash);
        try {
          localStorage.setItem('apex_pos_billing_tabs', JSON.stringify(remaining));
        } catch {}
      } else {
        handleClearAll();
      }
    } catch (err) {
      console.error('Invoice creation error:', err);
      alert('Error creating invoice. Saved locally.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Keyboard shortcut Ctrl+P / Cmd+P exclusively for 80mm thermal receipt
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        e.stopPropagation();
        if (items.length > 0 && !isProcessing) {
          handlePayAndPrint('thermal');
        } else if (items.length === 0) {
          searchInputRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [items, grandTotal, paymentInputs, tenderCash, returnAmt, selectedCustomer, isCashSale, narration, user, activeSection, isProcessing]);

  return (
    <div className="flex flex-col h-[calc(100vh-42px)] bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {/* Hidden Multi-Invoice Billing Queue Bar (Right click on Sales button or on this bar creates multiple bills) */}
      <div 
        id="pos-billing-queue-bar"
        onContextMenu={(e) => {
          e.preventDefault();
          handleAddNewTab();
        }}
        className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto select-none"
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-x-auto">
          <div className="flex items-center gap-1 text-[11px] font-black text-slate-500 uppercase tracking-wider px-1 shrink-0">
            <Layers className="w-3.5 h-3.5 text-purple-700" />
            <span>Billing Queue:</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              const itemCount = isActive ? items.length : tab.items.length;
              const tabTotal = isActive 
                ? grandTotal 
                : tab.items.reduce((sum, item) => sum + (item.total || item.selling_price * item.quantity), 0);

              return (
                <div
                  key={tab.id}
                  onClick={() => handleSwitchTab(tab.id)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAddNewTab();
                  }}
                  title="Click to switch bill. Right-click to add new queued bill."
                  className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border shrink-0 ${
                    isActive
                      ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200 shadow-2xs'
                  }`}
                >
                  <span>Bill #{tab.tabNumber}</span>
                  {itemCount > 0 ? (
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-white/25 text-white' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {itemCount} {itemCount === 1 ? 'item' : 'items'} • {tabTotal.toFixed(3)}
                    </span>
                  ) : (
                    <span className={`text-[10px] ${isActive ? 'text-purple-200' : 'text-slate-400'}`}>
                      (Empty)
                    </span>
                  )}

                  {tabs.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCloseTab(tab.id);
                      }}
                      className={`ml-0.5 p-0.5 rounded hover:bg-black/15 transition-colors ${
                        isActive ? 'text-white/80 hover:text-white' : 'text-slate-400 hover:text-rose-600'
                      }`}
                      title="Discard this queued bill"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleAddNewTab}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleAddNewTab();
            }}
            title="Create new invoice tab (Right-click to queue)"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 transition-colors shadow-2xs shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Bill</span>
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-500 shrink-0 font-medium">
          <span className="bg-slate-200/80 text-slate-600 px-2 py-0.5 rounded text-[10px] font-mono">
            Right-Click = New Queue Bill
          </span>
        </div>
      </div>

      {/* Top Action Bar (Matching Video 1) */}
      <div className="bg-slate-950 p-2 border-b border-slate-800 flex items-center justify-between gap-2 flex-wrap">
        {/* Customer Search & Select with Quick Add Plus Button & History */}
        <div className="flex items-center gap-1.5 flex-1 min-w-[320px] max-w-lg">
          <div ref={customerContainerRef} className="relative flex-1">
            <div className="flex items-center bg-white rounded border border-slate-300 shadow-xs">
              <User className="w-4 h-4 ml-2 text-purple-700 pointer-events-none shrink-0" />
              <input
                ref={customerInputRef}
                id="input-customer-search"
                type="text"
                value={customerSearchQuery}
                onChange={(e) => {
                  setCustomerSearchQuery(e.target.value);
                  setShowCustomerDropdown(true);
                  setHighlightedCustomerIndex(0);
                }}
                onFocus={() => {
                  setShowCustomerDropdown(true);
                  setHighlightedCustomerIndex(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (!showCustomerDropdown) setShowCustomerDropdown(true);
                    if (filteredCustomers.length > 0) {
                      setHighlightedCustomerIndex((prev) => (prev + 1) % filteredCustomers.length);
                    }
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (!showCustomerDropdown) setShowCustomerDropdown(true);
                    if (filteredCustomers.length > 0) {
                      setHighlightedCustomerIndex((prev) => (prev - 1 + filteredCustomers.length) % filteredCustomers.length);
                    }
                  } else if (e.key === 'Enter' || e.key === 'Tab') {
                    if (showCustomerDropdown && filteredCustomers.length > 0) {
                      e.preventDefault();
                      const validIndex = highlightedCustomerIndex >= 0 && highlightedCustomerIndex < filteredCustomers.length 
                        ? highlightedCustomerIndex 
                        : 0;
                      handleSelectCustomer(filteredCustomers[validIndex]);
                    }
                  } else if (e.key === 'Escape') {
                    setShowCustomerDropdown(false);
                  }
                }}
                placeholder="Search or Select Party / Customer..."
                className="w-full bg-transparent text-slate-950 font-bold text-xs px-2.5 py-1.5 outline-none placeholder:text-slate-400"
              />
              {customerSearchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomerSearchQuery('');
                    setShowCustomerDropdown(true);
                    setHighlightedCustomerIndex(0);
                  }}
                  className="text-slate-400 hover:text-slate-600 px-1.5 text-xs font-bold"
                  title="Clear party search"
                >
                  ✕
                </button>
              )}
              <button
                type="button"
                id="btn-quick-add-party"
                title="Quick Add Party (Salon, Spa, Client, License)"
                onClick={() => {
                  setShowCustomerDropdown(false);
                  setIsQuickAddPartyOpen(true);
                }}
                className="bg-purple-700 hover:bg-purple-800 text-white p-2 rounded-r transition-colors shrink-0 shadow-xs flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Customer Autocomplete Dropdown */}
            {showCustomerDropdown && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white text-slate-900 rounded-md shadow-2xl border border-slate-300 z-50 max-h-72 overflow-y-auto divide-y divide-slate-100">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((cust, idx) => {
                    const isSelected = idx === highlightedCustomerIndex;
                    return (
                      <div
                        key={cust.id}
                        id={`pos-customer-dropdown-opt-${idx}`}
                        onClick={() => handleSelectCustomer(cust)}
                        onMouseEnter={() => setHighlightedCustomerIndex(idx)}
                        className={`px-3 py-2 text-xs cursor-pointer flex flex-col gap-0.5 transition-colors ${
                          isSelected ? 'bg-purple-100 ring-1 ring-inset ring-purple-500 font-semibold' : 'hover:bg-purple-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className={`font-bold ${isSelected ? 'text-purple-950' : 'text-purple-900'}`}>{cust.name}</span>
                            {isSelected && (
                              <span className="text-[9px] bg-purple-700 text-white font-mono px-1 py-0.2 rounded font-bold">
                                ⏎ Enter/Tab
                              </span>
                            )}
                          </div>
                          {(cust.due_balance || 0) > 0 ? (
                            <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold">
                              Due: {(cust.due_balance || 0).toFixed(3)}
                            </span>
                          ) : (
                            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded font-bold uppercase">
                              {cust.type || 'Party'}
                            </span>
                          )}
                        </div>
                        
                        {(cust.firm_name || cust.phone || cust.location || cust.civil_id_or_license) && (
                          <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            {cust.firm_name && (
                              <span className="font-semibold text-slate-800 flex items-center gap-0.5">
                                🏢 {cust.firm_name}
                              </span>
                            )}
                            {cust.phone && cust.phone !== '00000000' && (
                              <span className="text-slate-600 font-mono">
                                📞 {cust.phone}
                              </span>
                            )}
                            {cust.location && (
                              <span className="text-slate-500">
                                📍 {cust.location}
                              </span>
                            )}
                            {cust.civil_id_or_license && (
                              <span className="text-slate-500 font-mono text-[10px]">
                                ID: {cust.civil_id_or_license}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-3 text-center text-slate-500 text-xs">
                    No matching party found for &quot;{customerSearchQuery}&quot;
                  </div>
                )}

                {/* Quick Add Party Option in Dropdown */}
                <div
                  onClick={() => {
                    setShowCustomerDropdown(false);
                    setIsQuickAddPartyOpen(true);
                  }}
                  className="p-2.5 bg-purple-50 hover:bg-purple-100 text-purple-900 cursor-pointer text-xs font-bold flex items-center justify-center gap-1.5 border-t border-purple-200 transition-colors"
                >
                  <Plus className="w-4 h-4 text-purple-700" />
                  <span>+ Quick Add &quot;{customerSearchQuery || 'New Party'}&quot;</span>
                </div>
              </div>
            )}
          </div>

          {/* Customer History Button (Timer / History Icon Button) */}
          <button
            type="button"
            id="btn-customer-history-top"
            title="Customer Transaction History & Preferences"
            onClick={() => setIsCustomerHistoryOpen(true)}
            className="bg-slate-800 hover:bg-purple-900/80 text-purple-300 hover:text-white border border-purple-800/80 p-2 rounded transition-colors shrink-0 shadow-xs flex items-center justify-center relative"
          >
            <History className="w-4 h-4 text-purple-400" />
            {selectedPartyInvoicesCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-purple-600 text-white text-[9px] px-1 py-0.2 rounded-full font-mono font-bold">
                {selectedPartyInvoicesCount}
              </span>
            )}
          </button>
        </div>

        {/* Item Search Bar & Quick Add */}
        <div ref={itemSearchContainerRef} className="relative flex-2 min-w-[280px] max-w-xl">
          <div className="flex items-center bg-white rounded border border-slate-300 shadow-xs">
            <Search className="w-4 h-4 ml-2.5 text-purple-700 pointer-events-none shrink-0" />
            <input
              ref={searchInputRef}
              id="input-item-search"
              type="text"
              value={itemSearchQuery}
              onChange={(e) => {
                setItemSearchQuery(e.target.value);
                setShowItemDropdown(true);
                setHighlightedProductIndex(0);
              }}
              onFocus={() => {
                setShowItemDropdown(true);
                setHighlightedProductIndex(0);
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  if (!showItemDropdown) setShowItemDropdown(true);
                  if (filteredProducts.length > 0) {
                    setHighlightedProductIndex((prev) => (prev + 1) % filteredProducts.length);
                  }
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  if (!showItemDropdown) setShowItemDropdown(true);
                  if (filteredProducts.length > 0) {
                    setHighlightedProductIndex((prev) => (prev - 1 + filteredProducts.length) % filteredProducts.length);
                  }
                } else if (e.key === 'Enter' || e.key === 'Tab') {
                  if (showItemDropdown && filteredProducts.length > 0) {
                    e.preventDefault();
                    const validIndex = highlightedProductIndex >= 0 && highlightedProductIndex < filteredProducts.length 
                      ? highlightedProductIndex 
                      : 0;
                    handleSelectItem(filteredProducts[validIndex]);
                  }
                } else if (e.key === 'Escape') {
                  setShowItemDropdown(false);
                }
              }}
              placeholder="Search Item by Code, Name, Barcode, or SKU..."
              className="w-full bg-transparent text-slate-950 font-bold text-xs px-2.5 py-1.5 outline-none placeholder:text-slate-400"
            />
            {itemSearchQuery && (
              <button
                type="button"
                onClick={() => {
                  setItemSearchQuery('');
                  setHighlightedProductIndex(0);
                }}
                className="text-slate-400 hover:text-slate-600 px-2 text-xs font-bold"
                title="Clear item search"
              >
                ✕
              </button>
            )}
            <button
              type="button"
              id="btn-quick-add-product"
              title="Quick Add New Product"
              onClick={() => {
                setShowItemDropdown(false);
                setIsQuickAddProductOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-r transition-colors shrink-0 shadow-xs flex items-center justify-center"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Item Live Popup Autocomplete Dropdown - Single Line Clean List */}
          {showItemDropdown && (
            <div className="absolute top-full left-0 mt-1 w-full bg-white text-slate-900 rounded-md shadow-2xl border border-slate-300 z-50 max-h-72 overflow-y-auto divide-y divide-slate-100">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((prod, idx) => {
                  const isSelected = idx === highlightedProductIndex;
                  const availableStock = (activeSection && prod.sectionStock && prod.sectionStock[activeSection] !== undefined)
                    ? prod.sectionStock[activeSection]
                    : prod.stock_quantity;
                  return (
                    <div
                      key={prod.id}
                      id={`pos-item-dropdown-opt-${idx}`}
                      onClick={() => handleSelectItem(prod)}
                      onMouseEnter={() => setHighlightedProductIndex(idx)}
                      className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                        isSelected ? 'bg-purple-100 ring-1 ring-inset ring-purple-500 font-semibold' : 'hover:bg-purple-50'
                      }`}
                    >
                      {/* Single Line: Item Code | Item Name */}
                      <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                        <span className="font-mono text-[11px] font-bold text-slate-500 shrink-0">
                          {prod.barcode || prod.sku}
                        </span>
                        <span className="text-slate-300 shrink-0">•</span>
                        <span className={`truncate ${isSelected ? 'text-purple-950 font-bold' : 'text-slate-900'}`}>
                          {prod.name}
                        </span>
                      </div>

                      {/* Total Stock in selected branch */}
                      <div className="shrink-0 flex items-center gap-2 font-mono text-[11px]">
                        <span className={`font-bold ${
                          availableStock <= prod.lowStockThreshold 
                            ? 'text-rose-600' 
                            : 'text-slate-600'
                        }`}>
                          Stock: {availableStock}
                        </span>
                        {isSelected && (
                          <span className="text-[9px] bg-purple-700 text-white font-mono px-1.5 py-0.2 rounded font-bold">
                            ⏎
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : itemSearchQuery.trim() !== '' ? (
                <div className="p-4 text-center text-slate-500 text-xs">
                  No item found matching &quot;{itemSearchQuery}&quot;
                </div>
              ) : null}

              {/* Quick Add Product Dropdown Action */}
              <div
                onClick={() => {
                  setShowItemDropdown(false);
                  setIsQuickAddProductOpen(true);
                }}
                className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 cursor-pointer text-xs font-bold flex items-center justify-center gap-1.5 border-t border-emerald-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-700" />
                <span>Quick Add &quot;{itemSearchQuery || 'New Product'}&quot;</span>
              </div>
            </div>
          )}
        </div>

        {/* Cash / Credit Mode Toggle */}
        <div className="flex items-center gap-1">
          <button
            id="btn-pos-toggle-cash"
            type="button"
            onClick={() => handleToggleMode('cash')}
            className={`px-4 py-1.5 rounded text-xs font-black uppercase transition-all shadow-xs cursor-pointer ${
              isCashSale
                ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-300 font-black'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            Cash
          </button>
          <button
            id="btn-pos-toggle-credit"
            type="button"
            onClick={() => handleToggleMode('credit')}
            className={`px-4 py-1.5 rounded text-xs font-black uppercase transition-all shadow-xs cursor-pointer ${
              !isCashSale
                ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300 font-black'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            Credit
          </button>
        </div>

        {/* Clear All Red Button (Top Right as in Video 1) */}
        <button
          id="btn-pos-clear-all"
          onClick={() => setShowClearConfirm(true)}
          className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xs px-4 py-1.5 rounded shadow-xs uppercase tracking-wider transition-colors ml-auto"
        >
          Clear All
        </button>
      </div>

      {/* Main Table Grid Area */}
      <div className="flex-1 overflow-auto bg-slate-950 p-2 sm:p-3">
        <div className="bg-slate-900 rounded border border-slate-800 overflow-hidden shadow-md">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-300 uppercase text-[11px] font-black tracking-wider border-b border-slate-800">
                <th className="py-2.5 px-3 w-12 text-center">SrNo</th>
                <th className="py-2.5 px-3 w-36">Barcode</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3 w-28 text-center">Unit</th>
                <th className="py-2.5 px-3 w-20 text-center">Stock</th>
                <th className="py-2.5 px-3 w-24 text-center">Qty</th>
                <th className="py-2.5 px-3 w-28 text-right">Unit Price</th>
                <th className="py-2.5 px-3 w-28 text-right">Total Price</th>
                <th className="py-2.5 px-3 w-16 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="w-8 h-8 text-slate-600 stroke-[1.5]" />
                      <p className="text-sm font-semibold text-slate-400">No items punched in active bill</p>
                      <p className="text-xs text-slate-600">
                        Type in the item search bar above (e.g. &quot;milano&quot;, &quot;comb&quot;, &quot;scrub&quot;) or scan barcode
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item, index) => (
                  <tr 
                    key={`${item.product_id}-${index}`}
                    className="hover:bg-slate-850 transition-colors bg-slate-900/90 text-slate-200"
                  >
                    {/* SrNo */}
                    <td className="py-2 px-3 text-center font-bold text-slate-400">
                      {index + 1}
                    </td>

                    {/* Barcode */}
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-400">
                      {item.barcode || item.sku}
                    </td>

                    {/* Description */}
                    <td className="py-2 px-3 font-bold text-white text-xs">
                      {item.name}
                    </td>

                    {/* Unit Dropdown */}
                    <td className="py-2 px-2 text-center">
                      <select
                        id={`pos-unit-select-${index}`}
                        value={item.unit}
                        onChange={(e) => handleUpdateUnit(index, e.target.value as ProductUnit)}
                        onKeyDown={(e) => {
                          if ((e.key === 'Tab' && !e.shiftKey) || e.key === 'Enter') {
                            e.preventDefault();
                            const qtyEl = document.getElementById(`pos-qty-input-${index}`) as HTMLInputElement | null;
                            if (qtyEl) {
                              qtyEl.focus();
                              qtyEl.select();
                            }
                          }
                        }}
                        className="bg-slate-800 border border-slate-700 text-purple-300 font-bold text-[11px] rounded px-1.5 py-1 outline-none cursor-pointer focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="UNIT">UNIT</option>
                        <option value="CTN24">CTN24</option>
                        <option value="Box">Box</option>
                        <option value="Pkt">Pkt</option>
                        <option value="Dozen">Dozen</option>
                        <option value="CTN">CTN</option>
                        <option value="Pcs">Pcs</option>
                      </select>
                    </td>

                    {/* Stock Badge */}
                    <td className="py-2 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        item.stock <= 0 
                          ? 'bg-rose-950/80 text-rose-400 border border-rose-800' 
                          : item.stock <= 10
                          ? 'bg-amber-950/80 text-amber-400 border border-amber-800'
                          : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                      }`}>
                        {item.stock}
                      </span>
                    </td>

                    {/* Qty Input (Clean without + / - buttons) */}
                    <td className="py-2 px-2 text-center">
                      <input
                        id={`pos-qty-input-${index}`}
                        type="number"
                        min="1"
                        value={item.qty}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => handleUpdateQty(index, parseInt(e.target.value) || 1)}
                        onKeyDown={(e) => {
                          if ((e.key === 'Tab' && !e.shiftKey) || e.key === 'Enter') {
                            e.preventDefault();
                            const priceEl = document.getElementById(`pos-price-input-${index}`) as HTMLInputElement | null;
                            if (priceEl) {
                              priceEl.focus();
                              priceEl.select();
                            }
                          } else if (e.key === 'Tab' && e.shiftKey) {
                            e.preventDefault();
                            const unitEl = document.getElementById(`pos-unit-select-${index}`) as HTMLElement | null;
                            unitEl?.focus();
                          }
                        }}
                        className="w-16 bg-slate-950 border border-slate-700 text-center font-black text-white text-xs py-1 px-1 rounded outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-mono"
                      />
                    </td>

                    {/* Unit Price */}
                    <td className="py-2 px-3 text-right">
                      <input
                        id={`pos-price-input-${index}`}
                        type="number"
                        step="0.001"
                        value={item.price}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => handleUpdatePrice(index, parseFloat(e.target.value) || 0)}
                        onKeyDown={(e) => {
                          if ((e.key === 'Tab' && !e.shiftKey) || e.key === 'Enter') {
                            e.preventDefault();
                            const totalEl = document.getElementById(`pos-total-input-${index}`) as HTMLInputElement | null;
                            if (totalEl) {
                              totalEl.focus();
                              totalEl.select();
                            }
                          } else if (e.key === 'Tab' && e.shiftKey) {
                            e.preventDefault();
                            const qtyEl = document.getElementById(`pos-qty-input-${index}`) as HTMLInputElement | null;
                            if (qtyEl) {
                              qtyEl.focus();
                              qtyEl.select();
                            }
                          }
                        }}
                        className="w-24 bg-slate-950 border border-slate-700 text-right font-bold text-slate-200 text-xs py-1 px-1.5 rounded outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-mono"
                      />
                    </td>

                    {/* Total Price (Editable) */}
                    <td className="py-2 px-3 text-right">
                      <input
                        id={`pos-total-input-${index}`}
                        type="number"
                        step="0.001"
                        value={item.total}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => handleUpdateTotal(index, parseFloat(e.target.value) || 0)}
                        onKeyDown={(e) => {
                          if ((e.key === 'Tab' && !e.shiftKey) || e.key === 'Enter') {
                            e.preventDefault();
                            const searchEl = document.getElementById('input-item-search') as HTMLInputElement | null;
                            if (searchEl) {
                              searchEl.focus();
                              searchEl.select();
                            }
                          } else if (e.key === 'Tab' && e.shiftKey) {
                            e.preventDefault();
                            const priceEl = document.getElementById(`pos-price-input-${index}`) as HTMLInputElement | null;
                            if (priceEl) {
                              priceEl.focus();
                              priceEl.select();
                            }
                          }
                        }}
                        className="w-24 bg-slate-950 border border-slate-700 text-right font-black text-emerald-400 text-xs py-1 px-1.5 rounded outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
                      />
                    </td>

                    {/* Action Column: Party-wise Price History & Delete */}
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          title="Party-wise Item Price History (Last 15 Transactions)"
                          onClick={() => setPriceHistoryTarget({ item, index })}
                          className="text-purple-400 hover:text-purple-200 p-1 rounded hover:bg-purple-950/60 transition-colors"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          title="Remove Item"
                          onClick={() => handleDeleteItem(index)}
                          className="text-rose-500 hover:text-rose-400 p-1 rounded hover:bg-rose-950/40 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Bottom Payment & Checkout Panel (Matching Video 1) */}
      <div className="bg-slate-950 border-t border-slate-800 p-2 sm:p-3 select-none">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Left Column: Due Balance Box & Narration */}
          <div className="md:col-span-3 flex flex-col gap-2">
            {/* Due Balance Box */}
            <div className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 flex items-center justify-between shadow-xs">
              <span className="text-xs font-bold text-slate-300">Customer Due Balance:</span>
              <span className={`text-xs font-black font-mono ${
                (selectedCustomer.due_balance || 0) > 0 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                KWD {(selectedCustomer.due_balance || 0).toFixed(3)}
              </span>
            </div>

            {/* Narration textarea */}
            <div className="flex gap-1.5">
              <textarea
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                placeholder="Invoice Narration / Notes..."
                rows={2}
                className="flex-1 bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-slate-200 outline-none placeholder:text-slate-500 resize-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Middle Column: Discount, Other Amt, Credit Indicator & Multi-Tender Payment Tiles */}
          <div className="md:col-span-6 flex flex-col gap-2">
            {/* Top row: Discount & Other Amt */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 flex-1">
                <span className="text-xs font-bold text-slate-400">Discount:</span>
                <input
                  id="input-pos-discount"
                  type="number"
                  step="0.001"
                  min="0"
                  value={discount === 0 ? '' : discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  placeholder="0.000"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-bold text-rose-400 outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center gap-1.5 flex-1">
                <span className="text-xs font-bold text-slate-400">Other Amt:</span>
                <input
                  id="input-pos-other-amt"
                  type="number"
                  step="0.001"
                  min="0"
                  value={otherAmt === 0 ? '' : otherAmt}
                  onChange={(e) => setOtherAmt(parseFloat(e.target.value) || 0)}
                  placeholder="0.000"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-bold text-white outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Credit / Due Banner Indicator (When Credit mode or Credit allocated) */}
            {(!isCashSale || creditAmount > 0) && (
              <div className="bg-amber-950/70 border border-amber-500/80 rounded px-2.5 py-1.5 flex items-center justify-between text-xs text-amber-200 shadow-sm animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-500 text-slate-950 text-[10px] uppercase px-1.5 py-0.5 rounded font-black tracking-wide">
                    Credit Sale
                  </span>
                  <span className="font-bold text-slate-200">
                    Credit Amount (Party Due):
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-amber-300 text-sm">
                    KWD {(creditAmount || 0).toFixed(3)}
                  </span>
                  <span className="text-[10px] text-amber-400/80">
                    (New Due: KWD {((selectedCustomer.due_balance || 0) + (creditAmount || 0)).toFixed(3)})
                  </span>
                </div>
              </div>
            )}

            {/* Multi-Payment Methods Grid - 6 Channels including Credit */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {/* Cash */}
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => handleQuickPayMethod('cash')}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-black py-0.5 rounded-t text-center uppercase cursor-pointer"
                >
                  Cash
                </button>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={paymentInputs.cash}
                  onChange={(e) => handlePaymentChange('cash', e.target.value)}
                  placeholder="0.000"
                  className="bg-slate-900 border border-cyan-700 text-center font-bold text-xs text-cyan-300 py-1 rounded-b outline-none focus:border-cyan-400"
                />
              </div>

              {/* K-Net */}
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => handleQuickPayMethod('knet')}
                  className="bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-black py-0.5 rounded-t text-center uppercase cursor-pointer"
                >
                  K-Net
                </button>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={paymentInputs.knet}
                  onChange={(e) => handlePaymentChange('knet', e.target.value)}
                  placeholder="0.000"
                  className="bg-slate-900 border border-purple-700 text-center font-bold text-xs text-purple-300 py-1 rounded-b outline-none focus:border-purple-400"
                />
              </div>

              {/* Card */}
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => handleQuickPayMethod('card')}
                  className="bg-orange-600 hover:bg-orange-500 text-white text-[10px] font-black py-0.5 rounded-t text-center uppercase cursor-pointer"
                >
                  Card
                </button>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={paymentInputs.card}
                  onChange={(e) => handlePaymentChange('card', e.target.value)}
                  placeholder="0.000"
                  className="bg-slate-900 border border-orange-700 text-center font-bold text-xs text-orange-300 py-1 rounded-b outline-none focus:border-orange-400"
                />
              </div>

              {/* Online */}
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => handleQuickPayMethod('online')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black py-0.5 rounded-t text-center uppercase cursor-pointer"
                >
                  Online
                </button>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={paymentInputs.online}
                  onChange={(e) => handlePaymentChange('online', e.target.value)}
                  placeholder="0.000"
                  className="bg-slate-900 border border-emerald-700 text-center font-bold text-xs text-emerald-300 py-1 rounded-b outline-none focus:border-emerald-400"
                />
              </div>

              {/* Cheque */}
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => handleQuickPayMethod('cheque')}
                  className="bg-amber-800/90 hover:bg-amber-800 text-white text-[10px] font-black py-0.5 rounded-t text-center uppercase cursor-pointer"
                >
                  Cheque
                </button>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={paymentInputs.cheque}
                  onChange={(e) => handlePaymentChange('cheque', e.target.value)}
                  placeholder="0.000"
                  className="bg-slate-900 border border-slate-700 text-center font-bold text-xs text-amber-300 py-1 rounded-b outline-none focus:border-amber-400"
                />
              </div>

              {/* Credit */}
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => handleQuickPayMethod('credit')}
                  className="bg-amber-600 hover:bg-amber-500 text-slate-950 text-[10px] font-black py-0.5 rounded-t text-center uppercase cursor-pointer"
                >
                  Credit
                </button>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={paymentInputs.credit}
                  onChange={(e) => handlePaymentChange('credit', e.target.value)}
                  placeholder="0.000"
                  className="bg-slate-900 border border-amber-600 text-center font-bold text-xs text-amber-400 py-1 rounded-b outline-none focus:border-amber-300"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Grand Total Banner & Pay & Print Button */}
          <div className="md:col-span-3 flex flex-col gap-2">
            {/* Grand Total Pink Banner (Matching Video 1) */}
            <div className="bg-rose-200 text-rose-950 border border-rose-300 rounded p-2 text-center shadow-xs">
              <div className="text-[10px] uppercase font-black tracking-widest text-rose-900">Total Net Amount</div>
              <div className="text-2xl font-black font-mono tracking-tight text-rose-950">
                {(grandTotal || 0).toFixed(3)}
              </div>
            </div>

            {/* Tender Cash & Return Calculation */}
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Tender Cash</span>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={tenderCash === 0 ? '' : tenderCash}
                  onChange={(e) => setTenderCash(parseFloat(e.target.value) || 0)}
                  placeholder="0.000"
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-bold text-emerald-400 outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Return Amt</span>
                <div className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-black text-amber-300 font-mono">
                  {(returnAmt || 0).toFixed(3)}
                </div>
              </div>
            </div>

            {/* Pay & Print Dual Action / Buttons (A4 on click, 80mm on Ctrl+P) */}
            <div className="flex flex-col gap-1.5">
              <button
                id="btn-pos-pay-and-print"
                disabled={isProcessing || items.length === 0}
                onClick={() => handlePayAndPrint('a4')}
                title="Click for Standard A4 Tax-Free Invoice"
                className={`w-full py-2 rounded text-xs sm:text-sm font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 ${
                  items.length === 0
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-rose-600 hover:bg-rose-500 active:scale-98 text-white shadow-rose-950/50'
                }`}
              >
                <Printer className="w-4 h-4" />
                <span>{isProcessing ? 'Processing...' : 'PAY & PRINT (A4)'}</span>
              </button>

              <button
                id="btn-pos-pay-and-print-thermal"
                type="button"
                disabled={isProcessing || items.length === 0}
                onClick={() => handlePayAndPrint('thermal')}
                title="Keyboard Shortcut: Ctrl+P or Cmd+P"
                className={`w-full py-1.5 rounded text-[11px] font-bold tracking-wide transition-all border flex items-center justify-center gap-1.5 ${
                  items.length === 0
                    ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-purple-950/70 hover:bg-purple-900/90 text-purple-200 border-purple-700/80 active:scale-98 shadow-xs'
                }`}
              >
                <span>⚡ 80mm Thermal Receipt</span>
                <kbd className="bg-purple-900 border border-purple-600 text-purple-200 text-[9px] font-mono px-1.5 py-0.5 rounded font-black">
                  Ctrl+P
                </kbd>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Clear All (Matching Video 1) */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white text-slate-900 rounded-lg shadow-2xl p-5 max-w-sm w-full animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-base font-black">Clear All Data</h3>
            </div>
            <p className="text-sm text-slate-600 mb-5">
              Are you sure you want to Clear all punched items from the active bill?
            </p>
            <div className="flex justify-end gap-2">
              <button
                id="btn-confirm-clear-cancel"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-clear-ok"
                onClick={handleClearAll}
                className="px-4 py-2 rounded text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-xs"
              >
                OK, Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Print Modal (New Invoice) */}
      {lastCreatedInvoice && (
        <InvoicePrintModal
          invoice={lastCreatedInvoice}
          initialFormat={printFormatTarget}
          onClose={() => setLastCreatedInvoice(null)}
        />
      )}

      {/* Historical Invoice Print / View Modal */}
      {viewingHistoricalInvoice && (
        <InvoicePrintModal
          invoice={viewingHistoricalInvoice}
          initialFormat="a4"
          onClose={() => setViewingHistoricalInvoice(null)}
        />
      )}

      {/* Party-Wise Item Price History Modal (Last 15 Transactions) */}
      {priceHistoryTarget && (
        <PartyItemPriceHistoryModal
          isOpen={Boolean(priceHistoryTarget)}
          onClose={() => setPriceHistoryTarget(null)}
          product={priceHistoryTarget.item}
          customer={selectedCustomer}
          invoices={invoices}
          onApplyPrice={(newPrice) => {
            handleUpdatePrice(priceHistoryTarget.index, newPrice);
            setPriceHistoryTarget(null);
          }}
        />
      )}

      {/* Customer History Panel */}
      <CustomerHistoryPanel
        isOpen={isCustomerHistoryOpen}
        onClose={() => setIsCustomerHistoryOpen(false)}
        customer={selectedCustomer}
        invoices={invoices}
        products={products}
        onAddProductToBill={handleAddProductOrItemToBill}
        onViewInvoice={(inv) => setViewingHistoricalInvoice(inv)}
        onReorderInvoice={handleReorderInvoice}
      />

      {/* Quick Add Party Modal */}
      <QuickAddPartyModal
        isOpen={isQuickAddPartyOpen}
        onClose={() => setIsQuickAddPartyOpen(false)}
        onCustomerAdded={handleCustomerAdded}
        initialQuery={customerSearchQuery}
      />

      {/* Quick Add Product Modal */}
      <QuickAddProductModal
        isOpen={isQuickAddProductOpen}
        onClose={() => setIsQuickAddProductOpen(false)}
        onProductAdded={handleProductAdded}
        initialName={itemSearchQuery}
        existingCategories={Array.from(new Set(products.map((p) => p.category)))}
      />
    </div>
  );
};
