import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Supplier, 
  Product, 
  PurchaseItem, 
  PurchaseInvoice, 
  ProductUnit,
  PaymentBreakdown 
} from '../../types';
import { 
  ShoppingBag, 
  Search, 
  Plus, 
  Trash2, 
  History, 
  Banknote, 
  CheckCircle, 
  AlertCircle, 
  Printer, 
  FileText, 
  Building2, 
  Truck, 
  User, 
  ArrowRight,
  Package,
  Calendar,
  Sparkles,
  Layers,
  ChevronDown,
  X
} from 'lucide-react';
import { SupplierItemPriceHistoryModal } from './SupplierItemPriceHistoryModal';

interface PurchaseBillingTab {
  id: string;
  tabNumber: number;
  supplier: Supplier;
  supplierSearchQuery: string;
  supplierInvoiceNo: string;
  purchaseDate: string;
  items: PurchaseItem[];
  discount: number;
  extraCharges: number;
  isCashPurchase: boolean;
  notes: string;
  paymentInputs: {
    cash: string;
    knet: string;
    card: string;
    online: string;
    cheque: string;
    credit: string;
  };
}

export const PurchaseView: React.FC = () => {
  const { 
    products, 
    suppliers, 
    purchases, 
    createPurchaseInvoice, 
    addSupplier, 
    addProduct,
    getLastPurchaseRateForSupplier 
  } = useStore();
  const { user, activeSection } = useAuth();

  // Active Tab: 'entry' (New Purchase Bill) | 'history' (Purchase Invoices List)
  const [activeSubTab, setActiveSubTab] = useState<'entry' | 'history'>('entry');

  // Selected Supplier
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier>(
    suppliers[0] || { id: 'supp-1', name: 'Al-Bayan Cosmetics Trading', phone: '+965 2244 5566', company: 'Al-Bayan Co.', due_balance: 450.000 }
  );
  const [supplierSearchQuery, setSupplierSearchQuery] = useState(selectedSupplier.name);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

  // Supplier Invoice Reference & Date
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);

  // Item Search
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [highlightedProductIndex, setHighlightedProductIndex] = useState<number>(0);
  const [highlightedSupplierIndex, setHighlightedSupplierIndex] = useState<number>(0);

  // Purchase Items
  const [items, setItems] = useState<PurchaseItem[]>([]);

  // Financials & Adjustments
  const [discount, setDiscount] = useState<number>(0);
  const [extraCharges, setExtraCharges] = useState<number>(0);
  const [isCashPurchase, setIsCashPurchase] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');

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

  // Purchase Multi-Bill Queue State
  const [tabs, setTabs] = useState<PurchaseBillingTab[]>(() => {
    try {
      const saved = localStorage.getItem('apex_purchase_billing_tabs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    const defaultSupp = suppliers[0] || { id: 'supp-1', name: 'Al-Bayan Cosmetics Trading', phone: '+965 2244 5566', company: 'Al-Bayan Co.', due_balance: 450.000 };
    return [{
      id: 'purch-tab-1',
      tabNumber: 1,
      supplier: defaultSupp,
      supplierSearchQuery: defaultSupp.name,
      supplierInvoiceNo: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      items: [],
      discount: 0,
      extraCharges: 0,
      isCashPurchase: true,
      notes: '',
      paymentInputs: { cash: '', knet: '', card: '', online: '', cheque: '', credit: '' },
    }];
  });
  const [activeTabId, setActiveTabId] = useState<string>(() => tabs[0]?.id || 'purch-tab-1');

  // Sync active purchase inputs to tabs
  useEffect(() => {
    setTabs((prev) => {
      const updated = prev.map((t) => {
        if (t.id === activeTabId) {
          return {
            ...t,
            supplier: selectedSupplier,
            supplierSearchQuery,
            supplierInvoiceNo,
            purchaseDate,
            items,
            discount,
            extraCharges,
            isCashPurchase,
            notes,
            paymentInputs,
          };
        }
        return t;
      });
      try {
        localStorage.setItem('apex_purchase_billing_tabs', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, [items, selectedSupplier, supplierSearchQuery, supplierInvoiceNo, purchaseDate, discount, extraCharges, isCashPurchase, notes, paymentInputs, activeTabId]);

  const handleSwitchTab = (targetId: string) => {
    if (targetId === activeTabId) return;
    const target = tabs.find((t) => t.id === targetId);
    if (!target) return;

    setSelectedSupplier(target.supplier);
    setSupplierSearchQuery(target.supplierSearchQuery || target.supplier.name);
    setSupplierInvoiceNo(target.supplierInvoiceNo || '');
    setPurchaseDate(target.purchaseDate || new Date().toISOString().split('T')[0]);
    setItems(target.items);
    setDiscount(target.discount);
    setExtraCharges(target.extraCharges);
    setIsCashPurchase(target.isCashPurchase);
    setNotes(target.notes);
    setPaymentInputs(target.paymentInputs);
    setActiveTabId(targetId);
  };

  const handleAddNewTab = () => {
    const nextNum = Math.max(0, ...tabs.map((t) => t.tabNumber)) + 1;
    const defaultSupp = suppliers[0] || { id: 'supp-1', name: 'Al-Bayan Cosmetics Trading', phone: '+965 2244 5566', company: 'Al-Bayan Co.', due_balance: 450.000 };
    const newTab: PurchaseBillingTab = {
      id: `purch-queue-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tabNumber: nextNum,
      supplier: defaultSupp,
      supplierSearchQuery: defaultSupp.name,
      supplierInvoiceNo: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      items: [],
      discount: 0,
      extraCharges: 0,
      isCashPurchase: true,
      notes: '',
      paymentInputs: { cash: '', knet: '', card: '', online: '', cheque: '', credit: '' },
    };

    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setSelectedSupplier(newTab.supplier);
    setSupplierSearchQuery(newTab.supplierSearchQuery);
    setSupplierInvoiceNo('');
    setItems([]);
    setDiscount(0);
    setExtraCharges(0);
    setIsCashPurchase(true);
    setNotes('');
    setPaymentInputs({ cash: '', knet: '', card: '', online: '', cheque: '', credit: '' });
  };

  const handleCloseTab = (idToClose: string) => {
    if (tabs.length <= 1) {
      setItems([]);
      setDiscount(0);
      setExtraCharges(0);
      setNotes('');
      setSupplierInvoiceNo('');
      setPaymentInputs({ cash: '', knet: '', card: '', online: '', cheque: '', credit: '' });
      return;
    }
    const tabToClose = tabs.find((t) => t.id === idToClose);
    if (tabToClose && tabToClose.items.length > 0) {
      if (!window.confirm(`Purchase Bill #${tabToClose.tabNumber} has ${tabToClose.items.length} items. Discard?`)) return;
    }
    const remaining = tabs.filter((t) => t.id !== idToClose);
    setTabs(remaining);
    try {
      localStorage.setItem('apex_purchase_billing_tabs', JSON.stringify(remaining));
    } catch {}

    if (activeTabId === idToClose) {
      const nextTab = remaining[remaining.length - 1];
      setActiveTabId(nextTab.id);
      setSelectedSupplier(nextTab.supplier);
      setSupplierSearchQuery(nextTab.supplierSearchQuery || nextTab.supplier.name);
      setSupplierInvoiceNo(nextTab.supplierInvoiceNo || '');
      setPurchaseDate(nextTab.purchaseDate);
      setItems(nextTab.items);
      setDiscount(nextTab.discount);
      setExtraCharges(nextTab.extraCharges);
      setIsCashPurchase(nextTab.isCashPurchase);
      setNotes(nextTab.notes);
      setPaymentInputs(nextTab.paymentInputs);
    }
  };

  // Hidden feature trigger listener
  useEffect(() => {
    const handleNewQueue = () => {
      setActiveSubTab('entry');
      handleAddNewTab();
    };
    window.addEventListener('apex:purchase:new-queue-bill', handleNewQueue);
    return () => window.removeEventListener('apex:purchase:new-queue-bill', handleNewQueue);
  }, [tabs, activeTabId, items, selectedSupplier]);

  // Modals & Panels
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastCreatedPurchase, setLastCreatedPurchase] = useState<PurchaseInvoice | null>(null);
  const [viewingPurchase, setViewingPurchase] = useState<PurchaseInvoice | null>(null);
  const [priceHistoryTarget, setPriceHistoryTarget] = useState<{ item: PurchaseItem; index: number } | null>(null);
  const [isQuickAddSupplierOpen, setIsQuickAddSupplierOpen] = useState(false);
  const [isQuickAddProductOpen, setIsQuickAddProductOpen] = useState(false);

  // Quick Add Supplier Form State
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierCompany, setNewSupplierCompany] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [newSupplierAddress, setNewSupplierAddress] = useState('');

  // Quick Add Product Form State
  const [newProdName, setNewProdName] = useState('');
  const [newProdBarcode, setNewProdBarcode] = useState('');
  const [newProdCost, setNewProdCost] = useState<number>(0);
  const [newProdPrice, setNewProdPrice] = useState<number>(0);
  const [newProdUnit, setNewProdUnit] = useState<ProductUnit>('UNIT');
  const [newProdCategory, setNewProdCategory] = useState('Cosmetics');

  const supplierSearchContainerRef = useRef<HTMLDivElement>(null);
  const itemSearchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (supplierSearchContainerRef.current && !supplierSearchContainerRef.current.contains(e.target as Node)) {
        setShowSupplierDropdown(false);
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
      const el = document.getElementById(`purchase-item-dropdown-opt-${highlightedProductIndex}`);
      if (el) {
        el.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedProductIndex, showItemDropdown]);

  // Auto-scroll highlighted supplier in dropdown into view
  useEffect(() => {
    if (showSupplierDropdown && highlightedSupplierIndex >= 0) {
      const el = document.getElementById(`purchase-supplier-dropdown-opt-${highlightedSupplierIndex}`);
      if (el) {
        el.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedSupplierIndex, showSupplierDropdown]);

  // Subtotal & Grand Total calculations
  const subtotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const grandTotal = Math.max(0, subtotal - (Number(discount) || 0) + (Number(extraCharges) || 0));

  // Numerical values from payment input buffers
  const cashNum = parseFloat(paymentInputs.cash) || 0;
  const knetNum = parseFloat(paymentInputs.knet) || 0;
  const cardNum = parseFloat(paymentInputs.card) || 0;
  const onlineNum = parseFloat(paymentInputs.online) || 0;
  const chequeNum = parseFloat(paymentInputs.cheque) || 0;
  const creditNum = parseFloat(paymentInputs.credit) || 0;

  // Direct payments across cash, cards, online, knet, upi, cheque
  const totalDirectPaid = cashNum + knetNum + cardNum + onlineNum + chequeNum;

  // Credit / Due amount to vendor
  const creditAmount = !isCashPurchase
    ? (creditNum > 0
        ? creditNum
        : Math.max(0, Number((grandTotal - totalDirectPaid).toFixed(3))))
    : creditNum;

  const totalPaid = totalDirectPaid + creditAmount;
  const dueAmount = creditAmount;

  // Tender Cash and Return Amount
  const [tenderCash, setTenderCash] = useState<number>(0);
  const returnAmt = (tenderCash > 0 && cashNum > 0) 
    ? Math.max(0, Number((tenderCash - cashNum).toFixed(3))) 
    : 0;

  // Auto-sync payment defaults when grandTotal or cash/credit mode changes
  useEffect(() => {
    if (isCashPurchase) {
      const otherPaid = 
        (parseFloat(paymentInputs.knet) || 0) + 
        (parseFloat(paymentInputs.card) || 0) + 
        (parseFloat(paymentInputs.online) || 0) + 
        (parseFloat(paymentInputs.cheque) || 0);
      const autoCash = Math.max(0, Number((grandTotal - otherPaid).toFixed(3)));
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
  }, [grandTotal, isCashPurchase]);

  // Toggle Cash vs Credit mode in Purchase
  const handleTogglePurchaseMode = (mode: 'cash' | 'credit') => {
    if (mode === 'cash') {
      setIsCashPurchase(true);
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
      setIsCashPurchase(false);
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

  // Payment channel change handler with real-time auto-adjustment
  const handlePaymentChange = (method: 'cash' | 'knet' | 'card' | 'online' | 'cheque' | 'credit', rawValue: string) => {
    if (method === 'cash') {
      const val = parseFloat(rawValue) || 0;
      setPaymentInputs((prev) => ({ ...prev, cash: rawValue }));
      setTenderCash(val);
      return;
    }

    if (method === 'credit') {
      setIsCashPurchase(false);
      setPaymentInputs((prev) => ({ ...prev, credit: rawValue }));
      return;
    }

    // Direct non-cash payment (knet, card, online, cheque)
    const numVal = parseFloat(rawValue) || 0;
    setPaymentInputs((prev) => {
      const next = { ...prev, [method]: rawValue };
      if (isCashPurchase) {
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

  // Fast allocation of entire purchase balance to a specific payment method
  const handleQuickPayMethod = (method: 'cash' | 'knet' | 'card' | 'online' | 'cheque' | 'credit') => {
    if (method === 'credit') {
      setIsCashPurchase(false);
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
      setIsCashPurchase(true);
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
      setIsCashPurchase(true);
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

  // Select Supplier and Auto-Recall Last Purchase Rate for all active lines
  const handleSelectSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setSupplierSearchQuery(supplier.name);
    setShowSupplierDropdown(false);

    // Auto-update purchase cost of existing line items based on this supplier's last purchase rate
    setItems((prevItems) => 
      prevItems.map((item) => {
        const recalledCost = getLastPurchaseRateForSupplier(supplier, item);
        if (recalledCost !== null && recalledCost > 0) {
          return {
            ...item,
            cost: recalledCost,
            total: Number((item.qty * recalledCost).toFixed(3)),
          };
        }
        return item;
      })
    );
  };

  // Add Item to Purchase Bill - Auto-Applies Last Purchase Rate
  const handleSelectItem = (prod: Product) => {
    const existingIndex = items.findIndex((it) => it.product_id === prod.id || it.barcode === prod.barcode);

    // Auto-recall last purchase rate from this supplier if any, else product.cost
    const recalledRate = getLastPurchaseRateForSupplier(selectedSupplier, prod);
    const applicableCost = recalledRate !== null ? recalledRate : prod.cost;

    let targetIndex = 0;

    if (existingIndex >= 0) {
      const updated = [...items];
      const newQty = updated[existingIndex].qty + 1;
      const costToUse = updated[existingIndex].cost || applicableCost;
      updated[existingIndex] = {
        ...updated[existingIndex],
        qty: newQty,
        total: Number((newQty * costToUse).toFixed(3)),
      };
      setItems(updated);
      targetIndex = existingIndex;
    } else {
      const newItem: PurchaseItem = {
        product_id: prod.id,
        sku: prod.sku,
        barcode: prod.barcode,
        name: prod.name,
        unit: prod.unit,
        qty: 1,
        cost: applicableCost,
        total: Number(applicableCost.toFixed(3)),
        selling_price: prod.price,
      };
      targetIndex = items.length;
      setItems((prev) => [...prev, newItem]);
    }

    setItemSearchQuery('');
    setShowItemDropdown(false);

    // Auto-focus UNIT select of target item line
    setTimeout(() => {
      const unitEl = document.getElementById(`purchase-unit-select-${targetIndex}`);
      if (unitEl) {
        unitEl.focus();
      }
    }, 60);
  };

  // Update Item Qty
  const handleUpdateQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleDeleteItem(index);
      return;
    }
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      qty: newQty,
      total: Number((newQty * updated[index].cost).toFixed(3)),
    };
    setItems(updated);
  };

  // Update Item Unit Cost
  const handleUpdateCost = (index: number, newCost: number) => {
    const safeCost = Math.max(0, newCost);
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      cost: safeCost,
      total: Number((updated[index].qty * safeCost).toFixed(3)),
    };
    setItems(updated);
  };

  // Update Item Total Cost (recalculates unit cost)
  const handleUpdateTotal = (index: number, newTotal: number) => {
    const safeTotal = Math.max(0, newTotal);
    const updated = [...items];
    const qty = updated[index].qty || 1;
    const recalculatedCost = Number((safeTotal / qty).toFixed(3));
    updated[index] = {
      ...updated[index],
      total: safeTotal,
      cost: recalculatedCost,
    };
    setItems(updated);
  };

  // Update Item Unit
  const handleUpdateUnit = (index: number, unit: ProductUnit) => {
    const updated = [...items];
    updated[index] = { ...updated[index], unit };
    setItems(updated);
  };

  // Delete Item
  const handleDeleteItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Clear Bill
  const handleClear = () => {
    setItems([]);
    setDiscount(0);
    setExtraCharges(0);
    setNotes('');
    setSupplierInvoiceNo('');
    setPaymentInputs({ cash: '', knet: '', card: '', online: '', cheque: '', credit: '' });
  };

  // Quick Add Supplier Submit
  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierName.trim()) return;

    const saved = await addSupplier({
      name: newSupplierName.trim(),
      company: newSupplierCompany.trim() || undefined,
      phone: newSupplierPhone.trim() || undefined,
      address: newSupplierAddress.trim() || undefined,
      due_balance: 0,
    });

    handleSelectSupplier(saved);
    setIsQuickAddSupplierOpen(false);
    setNewSupplierName('');
    setNewSupplierCompany('');
    setNewSupplierPhone('');
    setNewSupplierAddress('');
  };

  // Quick Add Product Submit
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;

    const barcode = newProdBarcode.trim() || `890${Math.floor(100000000 + Math.random() * 900000000)}`;
    const saved = await addProduct({
      name: newProdName.trim(),
      barcode,
      sku: barcode,
      category: newProdCategory,
      unit: newProdUnit,
      cost: Number(newProdCost) || 0,
      price: Number(newProdPrice) || (Number(newProdCost) * 1.3),
      stock_quantity: 0,
      lowStockThreshold: 5,
    });

    handleSelectItem(saved);
    setIsQuickAddProductOpen(false);
    setNewProdName('');
    setNewProdBarcode('');
    setNewProdCost(0);
    setNewProdPrice(0);
  };

  // Submit & Save Purchase Bill
  const handleSavePurchase = async () => {
    if (items.length === 0) return;

    setIsProcessing(true);
    try {
      const finalPaid = totalDirectPaid;
      const finalCredit = creditAmount;

      const created = await createPurchaseInvoice({
        supplier_id: selectedSupplier.id,
        supplier_name: selectedSupplier.name,
        supplier_phone: selectedSupplier.phone,
        supplier_invoice_no: supplierInvoiceNo.trim() || undefined,
        items,
        subtotal,
        discount,
        extra_charges: extraCharges,
        total_amount: grandTotal,
        paid_amount: finalPaid,
        due_amount: finalCredit,
        credit_amount: finalCredit,
        payment_method: isCashPurchase
          ? 'Cash'
          : (finalCredit > 0 ? (finalPaid > 0 ? 'Partial Credit' : 'Credit') : 'Card'),
        payments: {
          cash: cashNum,
          knet: knetNum,
          card: cardNum,
          online: onlineNum,
          cheque: chequeNum,
          credit: finalCredit,
        },
        status: 'completed',
        notes: notes.trim() || undefined,
        section: activeSection || 'Main Warehouse',
        created_by: user ? user.name : 'Procurement Officer',
      });

      setLastCreatedPurchase(created);
      handleClear();
    } catch (err) {
      console.error('Error saving purchase:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Filtered Suppliers for Autocomplete
  const filteredSuppliers = supplierSearchQuery.trim() === ''
    ? suppliers.slice(0, 10)
    : suppliers.filter((s) => {
        const q = supplierSearchQuery.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          (s.company && s.company.toLowerCase().includes(q)) ||
          (s.phone && s.phone.includes(q)) ||
          (s.code && s.code.toLowerCase().includes(q))
        );
      });

  // Filtered Products for Autocomplete
  const filteredProducts = itemSearchQuery.trim() === ''
    ? []
    : products.filter((p) => {
        const q = itemSearchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.barcode.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
        );
      });

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {/* Top Action & Sub-Navigation Bar */}
      <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-900/60 border border-blue-700 flex items-center justify-center text-blue-300">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black text-white uppercase tracking-wider">
                Purchase & Procurement Entry
              </h1>
              <span className="bg-blue-950 text-blue-300 border border-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                Supplier Last-Rate Recall
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Procure goods, auto-apply past purchase rates, update inventory stock and supplier payables
            </p>
          </div>
        </div>

        {/* Sub Tab Switcher (Icon-only Compact Buttons) */}
        <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 gap-1">
          <button
            title="New Purchase Bill"
            onClick={() => setActiveSubTab('entry')}
            className={`p-1.5 rounded-md transition-all flex items-center justify-center ${
              activeSubTab === 'entry'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            title="Purchase History"
            onClick={() => setActiveSubTab('history')}
            className={`p-1.5 rounded-md transition-all flex items-center justify-center relative ${
              activeSubTab === 'history'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            {purchases.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white text-[9px] px-1 py-0.2 rounded-full font-mono font-bold">
                {purchases.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeSubTab === 'entry' ? (
        /* PURCHASE BILL ENTRY VIEW */
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Purchase Multi-Bill Queue Bar */}
          <div 
            id="purchase-billing-queue-bar"
            onContextMenu={(e) => {
              e.preventDefault();
              handleAddNewTab();
            }}
            className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto select-none"
          >
            <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-x-auto">
              <div className="flex items-center gap-1 text-[11px] font-black text-slate-500 uppercase tracking-wider px-1 shrink-0">
                <Layers className="w-3.5 h-3.5 text-blue-700" />
                <span>Purchase Queue:</span>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                {tabs.map((tab) => {
                  const isActive = tab.id === activeTabId;
                  const itemCount = isActive ? items.length : tab.items.length;
                  const tabTotal = isActive 
                    ? grandTotal 
                    : tab.items.reduce((sum, item) => sum + (item.total || item.purchase_price * item.quantity), 0);

                  return (
                    <div
                      key={tab.id}
                      onClick={() => handleSwitchTab(tab.id)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAddNewTab();
                      }}
                      title="Click to switch bill. Right-click to add new purchase bill."
                      className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border shrink-0 ${
                        isActive
                          ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200 shadow-2xs'
                      }`}
                    >
                      <span>Bill #{tab.tabNumber}</span>
                      {itemCount > 0 ? (
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                          isActive ? 'bg-white/25 text-white' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {itemCount} {itemCount === 1 ? 'item' : 'items'} • {tabTotal.toFixed(3)}
                        </span>
                      ) : (
                        <span className={`text-[10px] ${isActive ? 'text-blue-200' : 'text-slate-400'}`}>
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
                          title="Discard this purchase bill"
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
                title="Create new purchase invoice tab (Right-click to queue)"
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 transition-colors shadow-2xs shrink-0 cursor-pointer"
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

          {/* Supplier Search, Invoice Ref & Product Search Bar */}
          <div className="bg-slate-950/70 p-2 sm:p-3 border-b border-slate-800 flex flex-wrap items-center gap-2 select-none shrink-0">
            {/* Supplier Autocomplete */}
            <div ref={supplierSearchContainerRef} className="relative flex-1 min-w-[260px] max-w-md">
              <div className="flex items-center bg-white rounded border border-slate-300 shadow-xs">
                <Truck className="w-4 h-4 ml-2.5 text-blue-700 pointer-events-none shrink-0" />
                <input
                  type="text"
                  value={supplierSearchQuery}
                  onChange={(e) => {
                    setSupplierSearchQuery(e.target.value);
                    setShowSupplierDropdown(true);
                    setHighlightedSupplierIndex(0);
                  }}
                  onFocus={() => {
                    setShowSupplierDropdown(true);
                    setHighlightedSupplierIndex(0);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      if (!showSupplierDropdown) setShowSupplierDropdown(true);
                      if (filteredSuppliers.length > 0) {
                        setHighlightedSupplierIndex((prev) => (prev + 1) % filteredSuppliers.length);
                      }
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      if (!showSupplierDropdown) setShowSupplierDropdown(true);
                      if (filteredSuppliers.length > 0) {
                        setHighlightedSupplierIndex((prev) => (prev - 1 + filteredSuppliers.length) % filteredSuppliers.length);
                      }
                    } else if (e.key === 'Enter' || e.key === 'Tab') {
                      if (showSupplierDropdown && filteredSuppliers.length > 0) {
                        e.preventDefault();
                        const validIdx = highlightedSupplierIndex >= 0 && highlightedSupplierIndex < filteredSuppliers.length 
                          ? highlightedSupplierIndex 
                          : 0;
                        handleSelectSupplier(filteredSuppliers[validIdx]);
                      }
                    } else if (e.key === 'Escape') {
                      setShowSupplierDropdown(false);
                    }
                  }}
                  placeholder="Search Supplier / Vendor (Name, Phone, Code)..."
                  className="w-full bg-transparent text-slate-950 font-bold text-xs px-2.5 py-1.5 outline-none placeholder:text-slate-400"
                />
                {supplierSearchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSupplierSearchQuery('');
                      setShowSupplierDropdown(true);
                      setHighlightedSupplierIndex(0);
                    }}
                    className="text-slate-400 hover:text-slate-600 px-1.5 text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
                <button
                  type="button"
                  title="Quick Add Supplier / Vendor"
                  onClick={() => setIsQuickAddSupplierOpen(true)}
                  className="bg-blue-700 hover:bg-blue-800 text-white p-2 rounded-r transition-colors shrink-0 shadow-xs flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Supplier Dropdown */}
              {showSupplierDropdown && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white text-slate-900 rounded-md shadow-2xl border border-slate-300 z-50 max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {filteredSuppliers.length > 0 ? (
                    filteredSuppliers.map((supp, idx) => {
                      const isSelected = idx === highlightedSupplierIndex;
                      return (
                        <div
                          key={supp.id}
                          id={`purchase-supplier-dropdown-opt-${idx}`}
                          onClick={() => handleSelectSupplier(supp)}
                          onMouseEnter={() => setHighlightedSupplierIndex(idx)}
                          className={`px-3 py-2 text-xs cursor-pointer flex flex-col gap-0.5 transition-colors ${
                            isSelected ? 'bg-blue-100 ring-1 ring-inset ring-blue-500 font-semibold' : 'hover:bg-blue-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className={`font-bold ${isSelected ? 'text-blue-950' : 'text-blue-900'}`}>{supp.name}</span>
                              {isSelected && (
                                <span className="text-[9px] bg-blue-700 text-white font-mono px-1 py-0.2 rounded font-bold">
                                  ⏎ Enter/Tab
                                </span>
                              )}
                            </div>
                            {supp.due_balance > 0 ? (
                              <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold">
                                Payable: {(supp.due_balance || 0).toFixed(3)}
                              </span>
                            ) : (
                              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded font-bold uppercase">
                                Active
                              </span>
                            )}
                          </div>
                          {(supp.company || supp.phone) && (
                            <div className="text-[11px] text-slate-600 flex items-center gap-3">
                              {supp.company && <span>🏢 {supp.company}</span>}
                              {supp.phone && <span className="font-mono">📞 {supp.phone}</span>}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-3 text-center text-slate-500 text-xs">
                      No matching supplier for &quot;{supplierSearchQuery}&quot;
                    </div>
                  )}

                  <div
                    onClick={() => {
                      setShowSupplierDropdown(false);
                      setIsQuickAddSupplierOpen(true);
                    }}
                    className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-900 cursor-pointer text-xs font-bold flex items-center justify-center gap-1.5 border-t border-blue-200 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-700" />
                    <span>Quick Add &quot;{supplierSearchQuery || 'New Supplier'}&quot;</span>
                  </div>
                </div>
              )}
            </div>

            {/* Supplier Invoice Bill Ref & Bill Date */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={supplierInvoiceNo}
                onChange={(e) => setSupplierInvoiceNo(e.target.value)}
                placeholder="Vendor Bill / Ref #"
                className="bg-slate-900 border border-slate-700 text-white font-bold text-xs px-2.5 py-1.5 rounded outline-none w-36 placeholder:text-slate-500"
              />
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white font-bold text-xs px-2 py-1.5 rounded outline-none"
              />
            </div>

            {/* Product / Item Search Bar */}
            <div ref={itemSearchContainerRef} className="relative flex-2 min-w-[280px] max-w-xl">
              <div className="flex items-center bg-white rounded border border-slate-300 shadow-xs">
                <Search className="w-4 h-4 ml-2.5 text-blue-700 pointer-events-none shrink-0" />
                <input
                  ref={searchInputRef}
                  id="input-purchase-item-search"
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
                        const validIdx = highlightedProductIndex >= 0 && highlightedProductIndex < filteredProducts.length
                          ? highlightedProductIndex
                          : 0;
                        handleSelectItem(filteredProducts[validIdx]);
                      }
                    } else if (e.key === 'Escape') {
                      setShowItemDropdown(false);
                    }
                  }}
                  placeholder="Search Product by Code, Name, Barcode, or SKU..."
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
                  >
                    ✕
                  </button>
                )}
                <button
                  type="button"
                  title="Quick Add New Product"
                  onClick={() => setIsQuickAddProductOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-r transition-colors shrink-0 shadow-xs flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Item Autocomplete - Single Line Clean List */}
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
                          id={`purchase-item-dropdown-opt-${idx}`}
                          onClick={() => handleSelectItem(prod)}
                          onMouseEnter={() => setHighlightedProductIndex(idx)}
                          className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                            isSelected ? 'bg-blue-100 ring-1 ring-inset ring-blue-500 font-semibold' : 'hover:bg-blue-50'
                          }`}
                        >
                          {/* Single Line: Item Code | Item Name */}
                          <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                            <span className="font-mono text-[11px] font-bold text-slate-500 shrink-0">
                              {prod.barcode || prod.sku}
                            </span>
                            <span className="text-slate-300 shrink-0">•</span>
                            <span className={`truncate ${isSelected ? 'text-blue-950 font-bold' : 'text-slate-900'}`}>
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
                              <span className="text-[9px] bg-blue-700 text-white font-mono px-1.5 py-0.2 rounded font-bold">
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
                type="button"
                onClick={() => handleTogglePurchaseMode('cash')}
                className={`px-3.5 py-1.5 rounded text-xs font-black uppercase transition-all shadow-xs cursor-pointer ${
                  isCashPurchase
                    ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-300'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                Cash
              </button>
              <button
                type="button"
                onClick={() => handleTogglePurchaseMode('credit')}
                className={`px-3.5 py-1.5 rounded text-xs font-black uppercase transition-all shadow-xs cursor-pointer ${
                  !isCashPurchase
                    ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                Credit
              </button>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="flex-1 overflow-y-auto bg-slate-900">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-950 shadow-xs">
                <tr className="border-b border-slate-800 text-slate-300 uppercase text-[11px] font-black tracking-wider">
                  <th className="py-2.5 px-3 text-center w-12">SrNo</th>
                  <th className="py-2.5 px-3 w-36">Barcode / SKU</th>
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-2 text-center w-24">Unit</th>
                  <th className="py-2.5 px-3 text-center w-24">Current Stock</th>
                  <th className="py-2.5 px-2 text-center w-28">Procure Qty</th>
                  <th className="py-2.5 px-3 text-right w-36">
                    <div className="flex items-center justify-end gap-1">
                      <span>Unit Cost (KWD)</span>
                      <Sparkles className="w-3 h-3 text-blue-400" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-right w-32">Total Cost (KWD)</th>
                  <th className="py-2.5 px-3 text-center w-28">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <ShoppingBag className="w-8 h-8 text-slate-600 stroke-[1.5]" />
                        <p className="text-sm font-semibold text-slate-400">No items added to purchase bill</p>
                        <p className="text-xs text-slate-600">
                          Search product above or scan barcode to add purchase lines. The vendor&apos;s last purchase rate is auto-applied!
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => {
                    const recalledCost = getLastPurchaseRateForSupplier(selectedSupplier, item);
                    const isRecalled = recalledCost !== null && item.cost === recalledCost;

                    return (
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
                            id={`purchase-unit-select-${index}`}
                            value={item.unit}
                            onChange={(e) => handleUpdateUnit(index, e.target.value as ProductUnit)}
                            onKeyDown={(e) => {
                              if ((e.key === 'Tab' && !e.shiftKey) || e.key === 'Enter') {
                                e.preventDefault();
                                const qtyEl = document.getElementById(`purchase-qty-input-${index}`) as HTMLInputElement | null;
                                if (qtyEl) {
                                  qtyEl.focus();
                                  qtyEl.select();
                                }
                              }
                            }}
                            className="bg-slate-800 border border-slate-700 text-blue-300 font-bold text-[11px] rounded px-1.5 py-1 outline-none cursor-pointer focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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

                        {/* Current Stock */}
                        <td className="py-2 px-3 text-center">
                          <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] font-mono font-bold text-slate-300">
                            {products.find((p) => p.id === item.product_id)?.stock_quantity || 0}
                          </span>
                        </td>

                        {/* Qty Input (Clean without + / - buttons) */}
                        <td className="py-2 px-2 text-center">
                          <input
                            id={`purchase-qty-input-${index}`}
                            type="number"
                            min="1"
                            value={item.qty}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => handleUpdateQty(index, parseInt(e.target.value) || 1)}
                            onKeyDown={(e) => {
                              if ((e.key === 'Tab' && !e.shiftKey) || e.key === 'Enter') {
                                e.preventDefault();
                                const costEl = document.getElementById(`purchase-cost-input-${index}`) as HTMLInputElement | null;
                                if (costEl) {
                                  costEl.focus();
                                  costEl.select();
                                }
                              } else if (e.key === 'Tab' && e.shiftKey) {
                                e.preventDefault();
                                const unitEl = document.getElementById(`purchase-unit-select-${index}`) as HTMLElement | null;
                                unitEl?.focus();
                              }
                            }}
                            className="w-16 bg-slate-950 border border-slate-700 text-center font-black text-white text-xs py-1 px-1 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                          />
                        </td>

                        {/* Unit Cost (Auto-recalled rate from vendor) */}
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isRecalled && (
                              <span 
                                title="Auto-applied last purchase rate from this supplier"
                                className="bg-blue-950 text-blue-300 border border-blue-800 text-[9px] px-1 py-0.2 rounded font-bold uppercase"
                              >
                                Auto
                              </span>
                            )}
                            <input
                              id={`purchase-cost-input-${index}`}
                              type="number"
                              step="0.001"
                              value={item.cost}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => handleUpdateCost(index, parseFloat(e.target.value) || 0)}
                              onKeyDown={(e) => {
                                if ((e.key === 'Tab' && !e.shiftKey) || e.key === 'Enter') {
                                  e.preventDefault();
                                  const totalEl = document.getElementById(`purchase-total-input-${index}`) as HTMLInputElement | null;
                                  if (totalEl) {
                                    totalEl.focus();
                                    totalEl.select();
                                  }
                                } else if (e.key === 'Tab' && e.shiftKey) {
                                  e.preventDefault();
                                  const qtyEl = document.getElementById(`purchase-qty-input-${index}`) as HTMLInputElement | null;
                                  if (qtyEl) {
                                    qtyEl.focus();
                                    qtyEl.select();
                                  }
                                }
                              }}
                              className="w-24 bg-slate-950 border border-slate-700 text-right font-black text-blue-300 text-xs py-1 px-1.5 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                            />
                          </div>
                        </td>

                        {/* Total Cost (Editable) */}
                        <td className="py-2 px-3 text-right">
                          <input
                            id={`purchase-total-input-${index}`}
                            type="number"
                            step="0.001"
                            value={item.total}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => handleUpdateTotal(index, parseFloat(e.target.value) || 0)}
                            onKeyDown={(e) => {
                              if ((e.key === 'Tab' && !e.shiftKey) || e.key === 'Enter') {
                                e.preventDefault();
                                const searchEl = document.getElementById('input-purchase-item-search') as HTMLInputElement | null;
                                if (searchEl) {
                                  searchEl.focus();
                                  searchEl.select();
                                }
                              } else if (e.key === 'Tab' && e.shiftKey) {
                                e.preventDefault();
                                const costEl = document.getElementById(`purchase-cost-input-${index}`) as HTMLInputElement | null;
                                if (costEl) {
                                  costEl.focus();
                                  costEl.select();
                                }
                              }
                            }}
                            className="w-24 bg-slate-950 border border-slate-700 text-right font-black text-emerald-400 text-xs py-1 px-1.5 rounded outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
                          />
                        </td>

                        {/* Action Column: Supplier-wise Price History & Delete */}
                        <td className="py-2 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              title="Supplier-wise Item Purchase Rate History (Last 15 Invoices)"
                              onClick={() => setPriceHistoryTarget({ item, index })}
                              className="text-blue-400 hover:text-blue-200 p-1 rounded hover:bg-blue-950/60 transition-colors"
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Financials & Action Panel */}
          <div className="bg-slate-950 border-t border-slate-800 p-3 select-none shrink-0">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Left Column: Supplier Payable Balance Box & Notes */}
              <div className="md:col-span-3 flex flex-col gap-2">
                <div className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 flex items-center justify-between shadow-xs">
                  <span className="text-xs font-bold text-slate-300">Supplier Payable:</span>
                  <span className={`text-xs font-black font-mono ${
                    selectedSupplier.due_balance > 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    KWD {(selectedSupplier.due_balance || 0).toFixed(3)}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-400">
                  <span>Subtotal ({items.length} lines):</span>
                  <span className="font-mono font-bold text-white">KWD {(subtotal || 0).toFixed(3)}</span>
                </div>

                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Purchase Notes / Vendor Remarks..."
                  rows={1}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-slate-200 font-medium resize-none outline-none focus:border-blue-500 placeholder:text-slate-500"
                />
              </div>

              {/* Middle Column: Discount, Freight & Multi-Payment Options */}
              <div className="md:col-span-6 flex flex-col gap-2">
                {/* Discount & Extra Charges */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 flex-1">
                    <span className="text-xs font-bold text-slate-400">Discount:</span>
                    <input
                      id="input-purchase-discount"
                      type="number"
                      step="0.001"
                      min="0"
                      value={discount === 0 ? '' : discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      placeholder="0.000"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-bold text-rose-400 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 flex-1">
                    <span className="text-xs font-bold text-slate-400">Freight/Extra:</span>
                    <input
                      id="input-purchase-extra"
                      type="number"
                      step="0.001"
                      min="0"
                      value={extraCharges === 0 ? '' : extraCharges}
                      onChange={(e) => setExtraCharges(parseFloat(e.target.value) || 0)}
                      placeholder="0.000"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-bold text-blue-400 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Credit / Vendor Payable Indicator Box */}
                {(!isCashPurchase || creditAmount > 0) && (
                  <div className="bg-amber-950/70 border border-amber-500/80 rounded px-2.5 py-1.5 flex items-center justify-between text-xs text-amber-200 shadow-sm animate-in fade-in duration-150">
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-500 text-slate-950 text-[10px] uppercase px-1.5 py-0.5 rounded font-black tracking-wide">
                        Credit Purchase
                      </span>
                      <span className="font-bold text-slate-200">
                        Credit Amount (Payable to Vendor):
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-amber-300 text-sm">
                        KWD {(creditAmount || 0).toFixed(3)}
                      </span>
                      <span className="text-[10px] text-amber-400/80">
                        (New Payable: KWD {((selectedSupplier.due_balance || 0) + (creditAmount || 0)).toFixed(3)})
                      </span>
                    </div>
                  </div>
                )}

                {/* Multi-Payment Methods Grid */}
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

              {/* Right Column: Net Amount, Tender & Actions */}
              <div className="md:col-span-3 flex flex-col gap-2">
                {/* Total Net Amount Banner */}
                <div className="bg-blue-950/80 border border-blue-800 rounded p-2 text-center shadow-xs">
                  <div className="text-[10px] uppercase font-black tracking-widest text-blue-300">Total Net Amount</div>
                  <div className="text-2xl font-black font-mono tracking-tight text-white">
                    {(grandTotal || 0).toFixed(3)}
                  </div>
                </div>

                {/* Tender Cash & Return Calculation */}
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Paid / Tender</span>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={tenderCash === 0 ? '' : tenderCash}
                      onChange={(e) => setTenderCash(parseFloat(e.target.value) || 0)}
                      placeholder="0.000"
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-bold text-emerald-400 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Return Amt</span>
                    <div className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-black text-amber-300 font-mono">
                      {(returnAmt || 0).toFixed(3)}
                    </div>
                  </div>
                </div>

                {/* Save & Clear Actions */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={items.length === 0}
                    className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 font-bold text-xs transition-colors"
                  >
                    Clear
                  </button>

                  <button
                    type="button"
                    onClick={handleSavePurchase}
                    disabled={items.length === 0 || isProcessing}
                    className="flex-1 py-2 px-3 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-blue-900/40 transition-all cursor-pointer"
                  >
                    {isProcessing ? (
                      <span>Recording...</span>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Post & Print Purchase (80mm / A4)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* PURCHASE HISTORY VIEW */
        <div className="flex-1 overflow-y-auto p-4">
          <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-white">Procurement Purchase Invoices</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Complete historic record of inventory purchases and vendor rate tracking
                </p>
              </div>
              <span className="bg-blue-950 text-blue-300 border border-blue-800 text-xs px-3 py-1 rounded-full font-bold">
                {purchases.length} Invoices Recorded
              </span>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/90 text-slate-300 uppercase text-[11px] font-black tracking-wider border-b border-slate-800">
                  <th className="py-3 px-4">Purchase No</th>
                  <th className="py-3 px-4">Supplier / Vendor</th>
                  <th className="py-3 px-4">Vendor Bill #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-center">Items</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-center">Payment</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 font-medium">
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-slate-500">
                      No purchase invoices recorded yet
                    </td>
                  </tr>
                ) : (
                  purchases.map((pur) => (
                    <tr key={pur.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-300">
                        {pur.purchase_no}
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        <div>{pur.supplier_name}</div>
                        {pur.supplier_phone && (
                          <div className="text-[10px] text-slate-400 font-mono">📞 {pur.supplier_phone}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">
                        {pur.supplier_invoice_no || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono">
                        {pur.date}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="bg-slate-800 px-2 py-0.5 rounded font-bold text-slate-300 font-mono">
                          {(pur.items || []).length} items
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-emerald-400 font-mono text-sm">
                        KWD {(pur.total_amount || pur.total || 0).toFixed(3)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          pur.payment_method === 'Cash'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}>
                          {pur.payment_method}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setViewingPurchase(pur)}
                          className="bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white px-2.5 py-1 rounded text-xs font-bold transition-colors"
                        >
                          View Bill
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Supplier Price History Modal */}
      {priceHistoryTarget && (
        <SupplierItemPriceHistoryModal
          isOpen={!!priceHistoryTarget}
          onClose={() => setPriceHistoryTarget(null)}
          product={priceHistoryTarget.item}
          supplier={selectedSupplier}
          purchases={purchases}
          onApplyCost={(cost) => handleUpdateCost(priceHistoryTarget.index, cost)}
        />
      )}

      {/* Quick Add Supplier Modal */}
      {isQuickAddSupplierOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md p-5 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 font-bold text-white">
                <Truck className="w-5 h-5 text-blue-400" />
                <span>Quick Add New Supplier</span>
              </div>
              <button onClick={() => setIsQuickAddSupplierOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Supplier Name *</label>
                <input
                  type="text"
                  required
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  placeholder="e.g. Al-Najat Cosmetics"
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-bold outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Company / Firm Name</label>
                <input
                  type="text"
                  value={newSupplierCompany}
                  onChange={(e) => setNewSupplierCompany(e.target.value)}
                  placeholder="e.g. Al-Najat General Trading Co."
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newSupplierPhone}
                  onChange={(e) => setNewSupplierPhone(e.target.value)}
                  placeholder="e.g. +965 2244 8899"
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Address / Location</label>
                <input
                  type="text"
                  value={newSupplierAddress}
                  onChange={(e) => setNewSupplierAddress(e.target.value)}
                  placeholder="e.g. Shuwaikh Industrial, Kuwait"
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsQuickAddSupplierOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 font-bold rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded shadow-xs"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Product Modal */}
      {isQuickAddProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md p-5 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 font-bold text-white">
                <Package className="w-5 h-5 text-emerald-400" />
                <span>Quick Add Product to Catalog</span>
              </div>
              <button onClick={() => setIsQuickAddProductOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="e.g. Keratin Therapy Shampoo 500ml"
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-bold outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Barcode / SKU</label>
                  <input
                    type="text"
                    value={newProdBarcode}
                    onChange={(e) => setNewProdBarcode(e.target.value)}
                    placeholder="Auto-generated if empty"
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Unit</label>
                  <select
                    value={newProdUnit}
                    onChange={(e) => setNewProdUnit(e.target.value as ProductUnit)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white outline-none focus:border-blue-500"
                  >
                    <option value="UNIT">UNIT</option>
                    <option value="CTN24">CTN24</option>
                    <option value="Box">Box</option>
                    <option value="Pkt">Pkt</option>
                    <option value="Dozen">Dozen</option>
                    <option value="CTN">CTN</option>
                    <option value="Pcs">Pcs</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Purchase Cost (KWD) *</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={newProdCost || ''}
                    onChange={(e) => setNewProdCost(parseFloat(e.target.value) || 0)}
                    placeholder="0.000"
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-blue-300 font-bold font-mono outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Selling Price (KWD)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={newProdPrice || ''}
                    onChange={(e) => setNewProdPrice(parseFloat(e.target.value) || 0)}
                    placeholder="0.000"
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-emerald-300 font-bold font-mono outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsQuickAddProductOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 font-bold rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded shadow-xs"
                >
                  Save & Add to Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Purchase Bill Modal */}
      {(viewingPurchase || lastCreatedPurchase) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs">
          {(() => {
            const bill = viewingPurchase || lastCreatedPurchase;
            if (!bill) return null;
            return (
              <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-slate-100">
                <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-base font-black text-white">Purchase Invoice: {bill.purchase_no}</h3>
                  </div>
                  <button
                    onClick={() => {
                      setViewingPurchase(null);
                      setLastCreatedPurchase(null);
                    }}
                    className="text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-5 overflow-y-auto space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4 bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Supplier / Vendor</div>
                      <div className="text-sm font-bold text-blue-300 mt-0.5">{bill.supplier_name}</div>
                      {bill.supplier_phone && <div className="text-slate-400 font-mono">📞 {bill.supplier_phone}</div>}
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Purchase Date & Bill Ref</div>
                      <div className="text-sm font-bold text-slate-200 mt-0.5">{bill.date}</div>
                      {bill.supplier_invoice_no && (
                        <div className="text-slate-400 font-mono">Ref: {bill.supplier_invoice_no}</div>
                      )}
                    </div>
                  </div>

                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                        <th className="py-2">Item</th>
                        <th className="py-2 text-center">Unit</th>
                        <th className="py-2 text-center">Qty</th>
                        <th className="py-2 text-right">Unit Rate (KWD)</th>
                        <th className="py-2 text-right">Total (KWD)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70 font-medium">
                      {bill.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="py-2 font-bold text-slate-200">{it.name}</td>
                          <td className="py-2 text-center text-slate-400">{it.unit}</td>
                          <td className="py-2 text-center font-bold text-white font-mono">{it.qty}</td>
                          <td className="py-2 text-right font-mono text-blue-300">{(it.cost || 0).toFixed(3)}</td>
                          <td className="py-2 text-right font-mono font-bold text-emerald-400">{(it.total || 0).toFixed(3)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-slate-400">Payment: </span>
                      <strong className="text-white uppercase">{bill.payment_method}</strong>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-400">Total Purchase Amount:</div>
                      <div className="text-base font-black text-emerald-400 font-mono">
                        KWD {(bill.total_amount || bill.total || 0).toFixed(3)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setViewingPurchase(null);
                      setLastCreatedPurchase(null);
                    }}
                    className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
