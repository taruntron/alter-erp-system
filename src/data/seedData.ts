import { Product, StoreSection, Customer, Expense, Invoice, StockTransfer, Supplier, PurchaseInvoice } from '../types';

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'supp-1',
    name: 'AL-HIKMA PHARMA & COSMETICS',
    firm_name: 'Al-Hikma International Trading Co.',
    phone: '24831122',
    location: 'Shuwaikh Industrial Area, Block 1',
    civil_id_or_license: 'CR-88921',
    code: 'SUPP-101',
    due_balance: 0,
    notes: 'Main distributor for Milano Plus and Oxygen cream developer'
  },
  {
    id: 'supp-2',
    name: 'GULF BEAUTY CARE DISTRIBUTORS',
    firm_name: 'Gulf Beauty Care W.L.L',
    phone: '22419088',
    location: 'Ardiya Industrial Complex',
    civil_id_or_license: 'CR-77341',
    code: 'SUPP-102',
    due_balance: 120.00,
    notes: 'Salon tools, combs, and professional henna supplies'
  },
  {
    id: 'supp-3',
    name: 'EMIRATES PERFUMES & ESSENCES',
    firm_name: 'Emirates Fragrance Trading LLC',
    phone: '98877112',
    location: 'Kuwait Free Trade Zone',
    civil_id_or_license: 'CR-45120',
    code: 'SUPP-103',
    due_balance: 0,
    notes: 'Luxury Arabian Oud & Musk EDP manufacturing'
  }
];

export const INITIAL_PURCHASES: PurchaseInvoice[] = [
  {
    id: 'pur-1001',
    purchase_no: 'PUR-2026-0001',
    vendor_bill_no: 'INV-HIKMA-4491',
    supplier_id: 'supp-1',
    supplier_name: 'AL-HIKMA PHARMA & COSMETICS',
    supplier_firm: 'Al-Hikma International Trading Co.',
    supplier_phone: '24831122',
    items: [
      {
        product_id: 'prod-1',
        sku: '619364570311',
        barcode: '619364570311',
        name: 'MILANO PLUS 5 IN 1 BRIGHTENING CREAM AKEA FASSI 500ML CTN24',
        unit: 'UNIT',
        qty: 120,
        cost: 1.75,
        total: 210.00
      },
      {
        product_id: 'prod-3',
        sku: '8033488809102',
        barcode: '8033488809102',
        name: 'OXYGEN MILANO PLUS 1000ml VOL-20 in ctn12 pcs',
        unit: 'UNIT',
        qty: 60,
        cost: 1.15,
        total: 69.00
      }
    ],
    subtotal: 279.00,
    discount: 9.00,
    other_amt: 0,
    total: 270.00,
    paid_amount: 270.00,
    due_amount: 0,
    payment_method: 'Bank Transfer',
    status: 'received',
    timestamp: '2026-08-15T10:00:00Z',
    date: '2026-08-15',
    user_uid: 'usr-admin-1',
    user_name: 'Prajith',
    section: 'SEENU INTL CO.',
    narration: 'Bulk direct container shipment'
  },
  {
    id: 'pur-1002',
    purchase_no: 'PUR-2026-0002',
    vendor_bill_no: 'GBC-8812',
    supplier_id: 'supp-2',
    supplier_name: 'GULF BEAUTY CARE DISTRIBUTORS',
    supplier_firm: 'Gulf Beauty Care W.L.L',
    supplier_phone: '22419088',
    items: [
      {
        product_id: 'prod-2',
        sku: '6903716742875',
        barcode: '6903716742875',
        name: 'COMB BIG TEETH 5033',
        unit: 'UNIT',
        qty: 200,
        cost: 0.22,
        total: 44.00
      },
      {
        product_id: 'prod-4',
        sku: '8906008400014',
        barcode: '8906008400014',
        name: 'HENNA BLACK GOLD الحناء الأسود CTN100pkt',
        unit: 'Dozen',
        qty: 50,
        cost: 0.38,
        total: 19.00
      }
    ],
    subtotal: 63.00,
    discount: 0,
    other_amt: 0,
    total: 63.00,
    paid_amount: 0,
    due_amount: 63.00,
    payment_method: 'Credit / Due',
    status: 'received',
    timestamp: '2026-08-18T14:30:00Z',
    date: '2026-08-18',
    user_uid: 'usr-admin-1',
    user_name: 'Prajith',
    section: 'Store Sales',
    narration: 'Combs & Henna stock inward'
  }
];

export const INITIAL_SECTIONS: StoreSection[] = [
  { id: 'sec-1', name: 'Store Sales', code: 'SS-01', type: 'store' },
  { id: 'sec-2', name: 'SEENU CARE Co.', code: 'SCC-01', type: 'store' },
  { id: 'sec-3', name: 'MS BEAUTY CO PERFUMES', code: 'MSBP-01', type: 'store' },
  { id: 'sec-4', name: 'MS BEAUTY CO.', code: 'MSB-01', type: 'store' },
  { id: 'sec-5', name: 'SEENU INTL CO.', code: 'SIC-01', type: 'warehouse' },
  { id: 'sec-6', name: 'SEENU CARE CO. OFFICE', code: 'SCCO-01', type: 'office' },
  { id: 'sec-7', name: 'SEENU CARE CO.2', code: 'SCC-02', type: 'store' },
  { id: 'sec-8', name: 'SEENU PERFUMES', code: 'SP-01', type: 'store' },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'cust-1', name: 'CASH CUSTOMER 123', phone: '00000000', code: 'CUST-001', due_balance: 0, type: 'regular' },
  { id: 'cust-2', name: 'TARUN DINESH 99792824', phone: '99792824', code: '3716', due_balance: 0, address: 'Kuwait City, Block 4', type: 'corporate' },
  { id: 'cust-3', name: 'RED ROSE SPA MANGAF-55978538', phone: '55978538', code: '4630', due_balance: 45.5, address: 'Mangaf Coastal Rd', type: 'spa' },
  { id: 'cust-4', name: 'AL-NOOR BEAUTY SALON-94451234', phone: '94451234', code: '5120', due_balance: 12.0, address: 'Salmiya, Salem Al Mubarak St', type: 'salon' },
  { id: 'cust-5', name: 'ROYAL ELEGANCE SPA-66778899', phone: '66778899', code: '6089', due_balance: 0, address: 'Hawally Commercial Complex', type: 'spa' },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    sku: 'MS609',
    barcode: '619364570311',
    additionalBarcodes: ['619364570312', '619364570313', '061936457031'],
    name: 'MILANO PLUS 5 IN 1 BRIGHTENING CREAM AKEA FASSI 500ML CTN24',
    category: 'Skin Care',
    cost: 1.85,
    price: 3.00,
    stock_quantity: 48,
    unit: 'UNIT',
    lowStockThreshold: 10,
    description: 'Brightening cream enriched with natural extracts',
  },
  {
    id: 'prod-2',
    sku: 'KM2299',
    barcode: '6903716742875',
    additionalBarcodes: ['6903716742876', '6903716742877'],
    name: 'COMB BIG TEETH 5033',
    category: 'Hair Care & Tools',
    cost: 0.25,
    price: 0.50,
    stock_quantity: 120,
    unit: 'UNIT',
    lowStockThreshold: 20,
    description: 'High durability wide tooth salon styling comb',
  },
  {
    id: 'prod-3',
    sku: 'OX1020',
    barcode: '8033488809102',
    additionalBarcodes: ['8033488809103', '8033488809104'],
    name: 'OXYGEN MILANO PLUS 1000ml VOL-20 in ctn12 pcs',
    category: 'Hair Color & Oxidant',
    cost: 1.20,
    price: 2.25,
    stock_quantity: 65,
    unit: 'UNIT',
    lowStockThreshold: 15,
    description: 'Cream developer oxidant 20 volume 1000ml',
  },
  {
    id: 'prod-4',
    sku: 'HN101',
    barcode: '8906008400014',
    additionalBarcodes: ['8906008400015'],
    name: 'HENNA BLACK GOLD الحناء الأسود CTN100pkt',
    category: 'Henna & Herbal',
    cost: 0.40,
    price: 0.85,
    stock_quantity: 240,
    unit: 'Dozen',
    lowStockThreshold: 30,
    description: 'Premium natural black herbal henna powder',
  },
  {
    id: 'prod-5',
    sku: 'SC505',
    barcode: '6291045700513',
    additionalBarcodes: ['700513', '6291045700514'],
    name: 'SCRUB 500ML',
    category: 'Body & Spa',
    cost: 1.10,
    price: 2.50,
    stock_quantity: 84,
    unit: 'UNIT',
    lowStockThreshold: 12,
    description: 'Exfoliating salon scrub jar 500ml',
  },
  {
    id: 'prod-6',
    sku: 'MP770',
    barcode: '619364570399',
    additionalBarcodes: ['619364570398', '619364570397'],
    name: 'SCRUB FACE & BODY MILANO PLUS POMEGRANATE 500ml in ctn12 pcs',
    category: 'Body & Spa',
    cost: 1.30,
    price: 2.75,
    stock_quantity: 36,
    unit: 'UNIT',
    lowStockThreshold: 8,
    description: 'Pomegranate exfoliating face and body scrub',
  },
  {
    id: 'prod-7',
    sku: 'MP771',
    barcode: '619364570412',
    additionalBarcodes: ['619364570413'],
    name: 'SCRUB FACE & BODY MILANO PLUS MANGO 500ML in ctn12 pcs',
    category: 'Body & Spa',
    cost: 1.30,
    price: 2.75,
    stock_quantity: 42,
    unit: 'UNIT',
    lowStockThreshold: 8,
    description: 'Tropical mango nourishing scrub 500ml',
  },
  {
    id: 'prod-8',
    sku: 'OX1030',
    barcode: '8033488809201',
    additionalBarcodes: ['8033488809202'],
    name: 'OXYGEN MILANO PLUS 1000ml VOL-30 in ctn12 pcs',
    category: 'Hair Color & Oxidant',
    cost: 1.20,
    price: 2.25,
    stock_quantity: 50,
    unit: 'UNIT',
    lowStockThreshold: 15,
    description: 'Cream developer oxidant 30 volume 1000ml',
  },
  {
    id: 'prod-9',
    sku: 'OX1040',
    barcode: '8033488809300',
    additionalBarcodes: ['8033488809301'],
    name: 'OXYGEN MILANO PLUS 1000ml VOL-40 in ctn12 pcs',
    category: 'Hair Color & Oxidant',
    cost: 1.25,
    price: 2.50,
    stock_quantity: 38,
    unit: 'UNIT',
    lowStockThreshold: 10,
    description: 'Cream developer oxidant 40 volume 1000ml',
  },
  {
    id: 'prod-10',
    sku: 'HN102',
    barcode: '8901234500112',
    additionalBarcodes: ['8901234500113'],
    name: 'HENNA AMIR BROWN 6X10G',
    category: 'Henna & Herbal',
    cost: 0.35,
    price: 0.75,
    stock_quantity: 150,
    unit: 'Box',
    lowStockThreshold: 25,
    description: 'Amir brown henna hair color sachets',
  },
  {
    id: 'prod-11',
    sku: 'HG802',
    barcode: '8901234500229',
    additionalBarcodes: ['8901234500230'],
    name: 'HENNA CONE ASSORTED (RED/CHESTNUT/BLACK)',
    category: 'Henna & Herbal',
    cost: 0.20,
    price: 0.50,
    stock_quantity: 180,
    unit: 'Dozen',
    lowStockThreshold: 30,
    description: 'Ready to use organic tattoo henna cone',
  },
  {
    id: 'prod-12',
    sku: 'CB2014',
    barcode: '6903716742998',
    additionalBarcodes: ['6903716742999'],
    name: 'COMB BLADE SILVER 2014',
    category: 'Hair Care & Tools',
    cost: 0.45,
    price: 1.00,
    stock_quantity: 75,
    unit: 'Pcs',
    lowStockThreshold: 15,
    description: 'Barber sectioning comb with metal pin',
  },
  {
    id: 'prod-13',
    sku: 'CB702',
    barcode: '6903716743110',
    additionalBarcodes: ['6903716743111'],
    name: 'COMB CARBON PRO ANTI STATIC 702',
    category: 'Hair Care & Tools',
    cost: 0.60,
    price: 1.50,
    stock_quantity: 60,
    unit: 'Pcs',
    lowStockThreshold: 10,
    description: 'Heat resistant carbon fiber styling comb',
  },
  {
    id: 'prod-14',
    sku: 'MS1991',
    barcode: '6291100223344',
    additionalBarcodes: ['6291100223345', '6291100223346', '6291100223347'],
    name: 'MS BEAUTY CO ARABIAN OUD PERFUME 100ML EDP',
    category: 'Fragrances',
    cost: 8.50,
    price: 18.00,
    stock_quantity: 32,
    unit: 'UNIT',
    lowStockThreshold: 5,
    description: 'Luxury Arabian Oud Eau de Parfum spray',
  },
  {
    id: 'prod-15',
    sku: 'SC301',
    barcode: '6291100223388',
    additionalBarcodes: ['6291100223389'],
    name: 'SEENU ROYAL MUSK EDP 100ML',
    category: 'Fragrances',
    cost: 6.00,
    price: 14.50,
    stock_quantity: 28,
    unit: 'UNIT',
    lowStockThreshold: 5,
    description: 'Velvety White Musk luxury EDP',
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    category: 'Rent',
    amount: 650.00,
    date: '2026-08-01',
    description: 'Monthly commercial showroom & storage lease',
    created_by: 'Admin (Prajith)',
    timestamp: '2026-08-01T09:00:00Z',
    payment_method: 'Bank Transfer'
  },
  {
    id: 'exp-2',
    category: 'Salaries',
    amount: 1450.00,
    date: '2026-08-05',
    description: 'Staff payroll (Cashiers, warehouse manager)',
    created_by: 'Admin (Prajith)',
    timestamp: '2026-08-05T10:30:00Z',
    payment_method: 'Direct Deposit'
  },
  {
    id: 'exp-3',
    category: 'Utilities',
    amount: 125.50,
    date: '2026-08-12',
    description: 'Electricity and high-speed fiber internet',
    created_by: 'Admin (Prajith)',
    timestamp: '2026-08-12T14:15:00Z',
    payment_method: 'Online Card'
  },
  {
    id: 'exp-4',
    category: 'Logistics',
    amount: 85.00,
    date: '2026-08-18',
    description: 'Wholesale port freight customs clearance and delivery vans',
    created_by: 'Admin (Prajith)',
    timestamp: '2026-08-18T11:00:00Z',
    payment_method: 'Cash'
  },
  {
    id: 'exp-5',
    category: 'Office Supplies',
    amount: 45.00,
    date: '2026-08-22',
    description: 'Thermal receipt rolls (80mm) and barcode sticker labels',
    created_by: 'Admin (Prajith)',
    timestamp: '2026-08-22T16:00:00Z',
    payment_method: 'K-Net'
  }
];

export const INITIAL_STOCK_TRANSFERS: StockTransfer[] = [
  {
    id: 'tr-1',
    transfer_no: 'TR36729',
    from_section: 'Store Sales',
    to_section: 'SEENU CARE Co.',
    items: [
      {
        product_id: 'prod-3',
        sku: '8033488809102',
        barcode: '8033488809102',
        name: 'OXYGEN MILANO PLUS 1000ml VOL-20 in ctn12 pcs',
        unit: 'UNIT',
        qty: 24
      },
      {
        product_id: 'prod-4',
        sku: '8906008400014',
        barcode: '8906008400014',
        name: 'HENNA BLACK GOLD الحناء الأسود CTN100pkt',
        unit: 'Dozen',
        qty: 3
      },
      {
        product_id: 'prod-5',
        sku: '700513',
        barcode: '700513',
        name: 'SCRUB 500ML',
        unit: 'UNIT',
        qty: 6
      }
    ],
    no_of_items: 3,
    timestamp: '2026-08-25T11:45:00Z',
    date: '2026-08-25',
    user_uid: 'usr-admin-1',
    user_name: 'Prajith',
    narration: 'Urgent stock replenishment for branch showroom',
    status: 'completed'
  },
  {
    id: 'tr-2',
    transfer_no: 'TR36730',
    from_section: 'SEENU INTL CO.',
    to_section: 'Store Sales',
    items: [
      {
        product_id: 'prod-1',
        sku: '619364570311',
        barcode: '619364570311',
        name: 'MILANO PLUS 5 IN 1 BRIGHTENING CREAM AKEA FASSI 500ML CTN24',
        unit: 'UNIT',
        qty: 12
      },
      {
        product_id: 'prod-2',
        sku: '6903716742875',
        barcode: '6903716742875',
        name: 'COMB BIG TEETH 5033',
        unit: 'UNIT',
        qty: 20
      }
    ],
    no_of_items: 2,
    timestamp: '2026-08-26T15:20:00Z',
    date: '2026-08-26',
    user_uid: 'usr-admin-1',
    user_name: 'Prajith',
    narration: 'Warehouse regular intake distribution',
    status: 'completed'
  }
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-1001',
    invoice_no: 'INV-2026-0001',
    customer_name: 'TARUN DINESH 99792824',
    customer_phone: '99792824',
    customer_id: 'cust-2',
    items: [
      {
        product_id: 'prod-1',
        sku: '619364570311',
        barcode: '619364570311',
        name: 'MILANO PLUS 5 IN 1 BRIGHTENING CREAM AKEA FASSI 500ML CTN24',
        unit: 'UNIT',
        qty: 12,
        stock: 48,
        price: 3.00,
        total: 36.00,
        cost: 1.85
      },
      {
        product_id: 'prod-2',
        sku: '6903716742875',
        barcode: '6903716742875',
        name: 'COMB BIG TEETH 5033',
        unit: 'UNIT',
        qty: 10,
        stock: 120,
        price: 0.50,
        total: 5.00,
        cost: 0.25
      }
    ],
    subtotal: 41.00,
    discount: 0,
    other_amt: 0,
    total: 41.00,
    payments: {
      cash: 21.00,
      visa: 0,
      card: 0,
      online: 0,
      knet: 20.00,
      upi: 0,
      cheque: 0
    },
    tender_cash: 21.00,
    return_amt: 0,
    status: 'paid',
    timestamp: '2026-08-27T16:30:00Z',
    date: '2026-08-27',
    cashier_uid: 'usr-admin-1',
    cashier_name: 'Prajith',
    section: 'SEENU CARE Co.',
    narration: 'Salon wholesale purchase'
  },
  {
    id: 'inv-1002',
    invoice_no: 'INV-2026-0002',
    customer_name: 'TARUN DINESH 99792824',
    customer_phone: '99792824',
    customer_id: 'cust-2',
    items: [
      {
        product_id: 'prod-1',
        sku: '619364570311',
        barcode: '619364570311',
        name: 'MILANO PLUS 5 IN 1 BRIGHTENING CREAM AKEA FASSI 500ML CTN24',
        unit: 'UNIT',
        qty: 24,
        stock: 48,
        price: 2.85,
        total: 68.40,
        cost: 1.85
      },
      {
        product_id: 'prod-3',
        sku: '8033488809102',
        barcode: '8033488809102',
        name: 'OXYGEN MILANO PLUS 1000ml VOL-20 in ctn12 pcs',
        unit: 'UNIT',
        qty: 6,
        stock: 65,
        price: 2.20,
        total: 13.20,
        cost: 1.20
      }
    ],
    subtotal: 81.60,
    discount: 1.60,
    other_amt: 0,
    total: 80.00,
    payments: {
      cash: 80.00,
      visa: 0,
      card: 0,
      online: 0,
      knet: 0,
      upi: 0,
      cheque: 0
    },
    tender_cash: 100.00,
    return_amt: 20.00,
    status: 'paid',
    timestamp: '2026-08-20T11:15:00Z',
    date: '2026-08-20',
    cashier_uid: 'usr-admin-1',
    cashier_name: 'Prajith',
    section: 'Store Sales',
    narration: 'Special bulk salon volume discount'
  },
  {
    id: 'inv-1003',
    invoice_no: 'INV-2026-0003',
    customer_name: 'TARUN DINESH 99792824',
    customer_phone: '99792824',
    customer_id: 'cust-2',
    items: [
      {
        product_id: 'prod-1',
        sku: '619364570311',
        barcode: '619364570311',
        name: 'MILANO PLUS 5 IN 1 BRIGHTENING CREAM AKEA FASSI 500ML CTN24',
        unit: 'UNIT',
        qty: 6,
        stock: 48,
        price: 3.00,
        total: 18.00,
        cost: 1.85
      },
      {
        product_id: 'prod-5',
        sku: '700513',
        barcode: '700513',
        name: 'SCRUB 500ML',
        unit: 'UNIT',
        qty: 12,
        stock: 84,
        price: 2.40,
        total: 28.80,
        cost: 1.10
      }
    ],
    subtotal: 46.80,
    discount: 0,
    other_amt: 0,
    total: 46.80,
    payments: {
      cash: 0,
      visa: 0,
      card: 46.80,
      online: 0,
      knet: 0,
      upi: 0,
      cheque: 0
    },
    tender_cash: 0,
    return_amt: 0,
    status: 'paid',
    timestamp: '2026-08-10T14:40:00Z',
    date: '2026-08-10',
    cashier_uid: 'usr-admin-1',
    cashier_name: 'Prajith',
    section: 'MS BEAUTY CO.',
    narration: 'Branch transfer supply re-stock'
  },
  {
    id: 'inv-1004',
    invoice_no: 'INV-2026-0004',
    customer_name: 'RED ROSE SPA MANGAF-55978538',
    customer_phone: '55978538',
    customer_id: 'cust-3',
    items: [
      {
        product_id: 'prod-1',
        sku: '619364570311',
        barcode: '619364570311',
        name: 'MILANO PLUS 5 IN 1 BRIGHTENING CREAM AKEA FASSI 500ML CTN24',
        unit: 'UNIT',
        qty: 18,
        stock: 48,
        price: 2.90,
        total: 52.20,
        cost: 1.85
      },
      {
        product_id: 'prod-4',
        sku: '8906008400014',
        barcode: '8906008400014',
        name: 'HENNA BLACK GOLD الحناء الأسود CTN100pkt',
        unit: 'Dozen',
        qty: 10,
        stock: 240,
        price: 0.80,
        total: 8.00,
        cost: 0.40
      }
    ],
    subtotal: 60.20,
    discount: 0,
    other_amt: 0,
    total: 60.20,
    payments: {
      cash: 14.70,
      visa: 0,
      card: 0,
      online: 0,
      knet: 0,
      upi: 0,
      cheque: 0
    },
    tender_cash: 14.70,
    return_amt: 0,
    status: 'credit',
    timestamp: '2026-08-25T18:20:00Z',
    date: '2026-08-25',
    cashier_uid: 'usr-admin-1',
    cashier_name: 'Prajith',
    section: 'SEENU CARE Co.',
    narration: 'Partially paid credit sale for Mangaf Branch'
  },
  {
    id: 'inv-1005',
    invoice_no: 'INV-2026-0005',
    customer_name: 'AL-NOOR BEAUTY SALON-94451234',
    customer_phone: '94451234',
    customer_id: 'cust-4',
    items: [
      {
        product_id: 'prod-2',
        sku: '6903716742875',
        barcode: '6903716742875',
        name: 'COMB BIG TEETH 5033',
        unit: 'UNIT',
        qty: 30,
        stock: 120,
        price: 0.45,
        total: 13.50,
        cost: 0.25
      },
      {
        product_id: 'prod-6',
        sku: '619364570399',
        barcode: '619364570399',
        name: 'SCRUB FACE & BODY MILANO PLUS POMEGRANATE 500ml in ctn12 pcs',
        unit: 'UNIT',
        qty: 12,
        stock: 36,
        price: 2.70,
        total: 32.40,
        cost: 1.30
      }
    ],
    subtotal: 45.90,
    discount: 0,
    other_amt: 0,
    total: 45.90,
    payments: {
      cash: 0,
      visa: 0,
      card: 0,
      online: 45.90,
      knet: 0,
      upi: 0,
      cheque: 0
    },
    tender_cash: 0,
    return_amt: 0,
    status: 'paid',
    timestamp: '2026-08-22T09:45:00Z',
    date: '2026-08-22',
    cashier_uid: 'usr-admin-1',
    cashier_name: 'Prajith',
    section: 'SEENU CARE Co.2',
    narration: 'Online direct transfer order'
  }
];

export const INITIAL_SALES_RETURNS: any[] = [
  {
    id: 'sret-1',
    return_no: 'RET-2026-0001',
    original_invoice_no: 'INV-2026-0002',
    customer_id: 'cust-2',
    customer_name: 'AL JABRIYA SALON CO',
    customer_phone: '99887766',
    items: [
      {
        product_id: 'prod-2',
        sku: '6903716742875',
        barcode: '6903716742875',
        name: 'COMB BIG TEETH 5033',
        unit: 'UNIT',
        qty: 5,
        price: 0.50,
        total: 2.50,
        return_reason: 'Excess order returned by salon'
      }
    ],
    subtotal: 2.50,
    tax_or_charges: 0,
    refund_amount: 2.50,
    refund_method: 'credit_note',
    status: 'completed',
    date: '2026-08-25',
    timestamp: '2026-08-25T14:30:00Z',
    cashier_name: 'Seenu',
    section: 'SEENU CARE Co.',
    narration: 'Adjusted against next salon invoice'
  }
];

export const INITIAL_PURCHASE_RETURNS: any[] = [
  {
    id: 'pret-1',
    return_no: 'PRET-2026-0001',
    original_purchase_no: 'PUR-2026-0001',
    supplier_id: 'supp-1',
    supplier_name: 'AL-HILAL COSMETICS TRADING W.L.L',
    supplier_phone: '99112233',
    items: [
      {
        product_id: 'prod-1',
        sku: '6903716742868',
        barcode: '6903716742868',
        name: 'COMB SMALL TEETH 5032',
        unit: 'UNIT',
        qty: 10,
        cost: 0.22,
        total: 2.20,
        return_reason: 'Damaged packing received'
      }
    ],
    subtotal: 2.20,
    refund_amount: 2.20,
    refund_method: 'supplier_credit',
    status: 'completed',
    date: '2026-08-24',
    timestamp: '2026-08-24T16:00:00Z',
    created_by: 'Prajith (Admin)',
    section: 'Main Warehouse',
    narration: 'Debit Note DN-0089 issued to supplier'
  }
];

export const INITIAL_PURCHASE_ORDERS: any[] = [
  {
    id: 'po-1',
    po_no: 'PO-2026-0001',
    supplier_id: 'supp-2',
    supplier_name: 'GULF BEAUTY DISTRIBUTORS CO.',
    supplier_phone: '99445566',
    items: [
      {
        product_id: 'prod-5',
        sku: '888646700012',
        barcode: '888646700012',
        name: 'ARGAN OIL HAIR SERUM 100ml',
        unit: 'UNIT',
        qty: 60,
        cost: 1.80,
        total: 108.00,
        selling_price: 3.50
      },
      {
        product_id: 'prod-6',
        sku: '619364570399',
        barcode: '619364570399',
        name: 'SCRUB FACE & BODY MILANO PLUS POMEGRANATE 500ml in ctn12 pcs',
        unit: 'UNIT',
        qty: 36,
        cost: 1.30,
        total: 46.80,
        selling_price: 2.70
      }
    ],
    subtotal: 154.80,
    discount: 4.80,
    estimated_total: 150.00,
    expected_delivery_date: '2026-09-02',
    date: '2026-08-27',
    status: 'pending',
    created_by: 'Prajith (Admin)',
    section: 'Main Warehouse',
    narration: 'Monthly regular replenishment order'
  }
];

export const INITIAL_VOUCHERS: any[] = [
  {
    id: 'vouch-1',
    voucher_no: 'PV-2026-0001',
    type: 'payment',
    party_type: 'supplier',
    party_id: 'supp-1',
    party_name: 'AL-HILAL COSMETICS TRADING W.L.L',
    amount: 150.00,
    payment_method: 'bank_transfer',
    reference_no: 'NBK-TX-990812',
    account_head: 'Accounts Payable',
    date: '2026-08-26',
    timestamp: '2026-08-26T11:00:00Z',
    created_by: 'Prajith (Admin)',
    narration: 'Partial payment towards invoice INV-HILAL-9081',
    status: 'posted'
  },
  {
    id: 'vouch-2',
    voucher_no: 'RV-2026-0001',
    type: 'receipt',
    party_type: 'customer',
    party_id: 'cust-1',
    party_name: 'AL SHAYA SPA & SALON CENTER',
    amount: 75.00,
    payment_method: 'cheque',
    cheque_no: 'CHQ-554412',
    cheque_date: '2026-08-30',
    reference_no: 'CHQ-554412',
    account_head: 'Accounts Receivable',
    date: '2026-08-27',
    timestamp: '2026-08-27T15:20:00Z',
    created_by: 'Seenu',
    narration: 'Received part payment towards outstanding due balance',
    status: 'posted'
  }
];

export const INITIAL_PRICE_LISTS: any[] = [
  {
    id: 'pl-1',
    product_id: 'prod-1',
    product_name: 'COMB SMALL TEETH 5032',
    standard_price: 0.50,
    wholesale_price: 0.40,
    spa_salon_price: 0.35,
    vip_retail_price: 0.45,
    min_qty: 12
  },
  {
    id: 'pl-2',
    product_id: 'prod-2',
    product_name: 'COMB BIG TEETH 5033',
    standard_price: 0.55,
    wholesale_price: 0.45,
    spa_salon_price: 0.40,
    vip_retail_price: 0.50,
    min_qty: 12
  },
  {
    id: 'pl-3',
    product_id: 'prod-5',
    product_name: 'ARGAN OIL HAIR SERUM 100ml',
    standard_price: 3.50,
    wholesale_price: 2.80,
    spa_salon_price: 2.50,
    vip_retail_price: 3.20,
    min_qty: 6
  },
  {
    id: 'pl-4',
    product_id: 'prod-6',
    product_name: 'SCRUB FACE & BODY MILANO PLUS POMEGRANATE 500ml',
    standard_price: 2.70,
    wholesale_price: 2.20,
    spa_salon_price: 1.95,
    vip_retail_price: 2.50,
    min_qty: 12
  }
];

export const INITIAL_BATCHES: any[] = [
  {
    id: 'batch-1',
    product_id: 'prod-5',
    product_name: 'ARGAN OIL HAIR SERUM 100ml',
    sku: '888646700012',
    batch_no: 'B2026-A109',
    expiry_date: '2028-06-30',
    manufacture_date: '2026-01-15',
    qty: 48,
    cost: 1.80,
    selling_price: 3.50,
    location: 'Aisle 3 - Shelf B'
  },
  {
    id: 'batch-2',
    product_id: 'prod-6',
    product_name: 'SCRUB FACE & BODY MILANO PLUS POMEGRANATE 500ml',
    sku: '619364570399',
    batch_no: 'MIL-2026-08',
    expiry_date: '2027-12-31',
    manufacture_date: '2026-03-10',
    qty: 36,
    cost: 1.30,
    selling_price: 2.70,
    location: 'Aisle 2 - Shelf D'
  }
];

export const INITIAL_BRANDS: any[] = [
  { id: 'br-1', name: 'Milano Plus', country_of_origin: 'Italy', description: 'Professional salon hair and skincare cosmetics', total_products: 14 },
  { id: 'br-2', name: 'Al-Hilal Professional', country_of_origin: 'Kuwait', description: 'Salon accessories, combs, and barber tools', total_products: 22 },
  { id: 'br-3', name: 'Moroccan Argan Care', country_of_origin: 'Morocco', description: 'Pure argan treatment oils and shampoos', total_products: 8 },
  { id: 'br-4', name: 'Olaplex Professional', country_of_origin: 'USA', description: 'Bond-building hair treatment systems', total_products: 6 },
  { id: 'br-5', name: 'L\'Oréal Professionnel', country_of_origin: 'France', description: 'Hair color, oxidants, and styling products', total_products: 18 }
];

export const INITIAL_CATEGORIES: any[] = [
  { id: 'cat-1', name: 'Hair Care & Styling', code: 'HAIR-01', description: 'Serums, sprays, waxes, shampoos and conditioners', total_products: 28 },
  { id: 'cat-2', name: 'Skin & Body Care', code: 'SKIN-02', description: 'Face scrubs, lotions, body butters and masks', total_products: 19 },
  { id: 'cat-3', name: 'Combs & Brushes', code: 'TOOL-03', description: 'Cutting combs, round brushes, detanglers', total_products: 15 },
  { id: 'cat-4', name: 'Salon Equipment & Furniture', code: 'EQP-04', description: 'Sterilizers, trolleys, hair steamers, dryers', total_products: 12 },
  { id: 'cat-5', name: 'Disposables & Towels', code: 'DISP-05', description: 'Gloves, neck strips, disposable gowns, cotton rolls', total_products: 24 }
];

export const INITIAL_UOMS: any[] = [
  { id: 'uom-1', code: 'UNIT', name: 'Unit / Piece', factor: 1, base_unit: 'UNIT' },
  { id: 'uom-2', code: 'CTN24', name: 'Carton of 24 Units', factor: 24, base_unit: 'UNIT' },
  { id: 'uom-3', code: 'CTN', name: 'Standard Carton (12 Pcs)', factor: 12, base_unit: 'UNIT' },
  { id: 'uom-4', code: 'Box', name: 'Box Pack (6 Pcs)', factor: 6, base_unit: 'UNIT' },
  { id: 'uom-5', code: 'Pkt', name: 'Packet (10 Pcs)', factor: 10, base_unit: 'UNIT' },
  { id: 'uom-6', code: 'Dozen', name: 'Dozen (12 Pcs)', factor: 12, base_unit: 'UNIT' },
  { id: 'uom-7', code: 'Kg', name: 'Kilogram', factor: 1, base_unit: 'Kg' },
  { id: 'uom-8', code: 'Pcs', name: 'Pieces', factor: 1, base_unit: 'UNIT' }
];

