import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  FileText, 
  Settings, 
  QrCode, 
  Building2, 
  ShieldCheck, 
  AlertCircle,
  Eye,
  Sliders,
  Image as ImageIcon,
  Trash2,
  FileCheck,
  Receipt,
  ShoppingCart
} from 'lucide-react';
import { 
  InvoicePrintSettings, 
  PaperPrintFormat,
  getInvoicePrintSettings, 
  saveInvoicePrintSettings, 
  DEFAULT_PRINT_SETTINGS,
  getEffectiveLogo,
  getCurrentPrintTimestamp
} from '../../utils/printSettings';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';

export interface DataExchangeSettings {
  csvDelimiter: ',' | ';' | '\t';
  dateFormat: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';
  decimalSeparator: '.' | ',';
  includeHeaders: boolean;
  encoding: 'UTF-8' | 'ISO-8859-1';
  duplicateAction: 'skip' | 'overwrite' | 'error';
  autoGenerateSku: boolean;
  defaultValuation: 'FIFO' | 'Weighted Average';
  strictValidation: boolean;
  batchSizeLimit: number;
}

const DEFAULT_EXCHANGE_SETTINGS: DataExchangeSettings = {
  csvDelimiter: ',',
  dateFormat: 'YYYY-MM-DD',
  decimalSeparator: '.',
  includeHeaders: true,
  encoding: 'UTF-8',
  duplicateAction: 'overwrite',
  autoGenerateSku: true,
  defaultValuation: 'FIFO',
  strictValidation: true,
  batchSizeLimit: 5000,
};

const EXCHANGE_STORAGE_KEY = 'apex_data_exchange_settings';

export const MasterSettingsTab: React.FC = () => {
  const { products, invoices, purchases, parties, sections } = useStore();
  const { systemUsers, activeSection } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'invoice_print' | 'export_import' | 'backup_restore'>('invoice_print');
  const [printSettings, setPrintSettings] = useState<InvoicePrintSettings>(getInvoicePrintSettings);
  const [exchangeSettings, setExchangeSettings] = useState<DataExchangeSettings>(() => {
    try {
      const saved = localStorage.getItem(EXCHANGE_STORAGE_KEY);
      if (saved) return { ...DEFAULT_EXCHANGE_SETTINGS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_EXCHANGE_SETTINGS;
  });

  // Selected branch for branch-specific logo customization
  const availableBranches = sections.length > 0 
    ? sections.map(s => s.name) 
    : ['Store Sales', 'SEENU CARE CO.', 'Main Warehouse', 'Salmiya Showroom'];
  const [selectedBranchForLogo, setSelectedBranchForLogo] = useState<string>(availableBranches[0] || 'Store Sales');

  // Preview interactive state
  const [previewDocType, setPreviewDocType] = useState<'sales' | 'purchase' | 'voucher'>('sales');
  const [previewBranch, setPreviewBranch] = useState<string>(availableBranches[0] || 'Store Sales');
  const [previewFormat, setPreviewFormat] = useState<PaperPrintFormat>('thermal_80mm');
  const [previewTime, setPreviewTime] = useState<string>(getCurrentPrintTimestamp());

  // Update preview timestamp live every 5 seconds so user sees it dynamically
  useEffect(() => {
    const timer = setInterval(() => {
      setPreviewTime(getCurrentPrintTimestamp());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSavePrintSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveInvoicePrintSettings(printSettings);
    showToast('Invoice print and layout settings saved successfully!');
  };

  const handleResetPrintSettings = () => {
    if (window.confirm('Reset all invoice print & layout settings to default template?')) {
      setPrintSettings(DEFAULT_PRINT_SETTINGS);
      saveInvoicePrintSettings(DEFAULT_PRINT_SETTINGS);
      showToast('Invoice print settings restored to default.');
    }
  };

  // Image Upload Handlers
  const handleStoreLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo image size must be under 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      setPrintSettings(prev => ({ ...prev, storeLogo: dataUrl }));
      showToast('Store main logo uploaded successfully!');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveStoreLogo = () => {
    setPrintSettings(prev => ({ ...prev, storeLogo: '' }));
    showToast('Store main logo removed.');
  };

  const handleBranchLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, branchName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo image size must be under 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      setPrintSettings(prev => ({
        ...prev,
        branchLogos: {
          ...(prev.branchLogos || {}),
          [branchName]: dataUrl,
        }
      }));
      showToast(`Custom logo uploaded for branch: ${branchName}`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveBranchLogo = (branchName: string) => {
    setPrintSettings(prev => {
      const nextLogos = { ...(prev.branchLogos || {}) };
      delete nextLogos[branchName];
      return { ...prev, branchLogos: nextLogos };
    });
    showToast(`Removed custom logo for branch: ${branchName} (reverted to default logo)`);
  };

  const handleQrImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('QR Code image size must be under 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      setPrintSettings(prev => ({ 
        ...prev, 
        qrCodeImage: dataUrl,
        qrCodeType: 'custom_image',
        showQrCode: true
      }));
      showToast('Custom QR Code image uploaded successfully!');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveQrImage = () => {
    setPrintSettings(prev => ({ 
      ...prev, 
      qrCodeImage: '',
      qrCodeType: 'auto'
    }));
    showToast('Custom QR Code image removed. Switched to Auto QR.');
  };

  const handleSaveExchangeSettings = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(EXCHANGE_STORAGE_KEY, JSON.stringify(exchangeSettings));
      showToast('Data Import & Export settings saved successfully!');
    } catch {
      showToast('Failed to save settings.');
    }
  };

  // One-click data export functions with dynamic Time of Print / Export
  const downloadFile = (content: string, fileName: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Exported "${fileName}" successfully!`);
  };

  const exportProductsCsv = () => {
    const delimiter = exchangeSettings.csvDelimiter;
    const headers = ['ID', 'Name', 'SKU', 'Barcode', 'Category', 'Cost Price', 'Selling Price', 'Current Stock', 'Min Stock'];
    const rows = products.map((p) => [
      p.id,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      p.sku || '',
      p.barcode || '',
      p.category || '',
      p.cost_price || 0,
      p.selling_price || 0,
      p.stock_quantity || 0,
      p.lowStockThreshold || 0,
    ]);
    const exportTime = `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
    const csvLines = [
      headers.join(delimiter),
      ...rows.map((r) => r.join(delimiter)),
      '',
      `"Time of Print / Export: ${exportTime}"`
    ];
    downloadFile(csvLines.join('\n'), `Products_Export_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
  };

  const exportInvoicesCsv = () => {
    const delimiter = exchangeSettings.csvDelimiter;
    const headers = ['Invoice No', 'Date', 'Customer', 'Section / Branch', 'Subtotal', 'Discount', 'Tax', 'Grand Total', 'Payment Mode', 'Status'];
    const rows = invoices.map((inv) => [
      inv.invoice_number,
      inv.date || '',
      `"${(inv.customer_name || 'Walk-in Customer').replace(/"/g, '""')}"`,
      inv.section_name || 'Store Sales',
      inv.subtotal || 0,
      inv.discount_total || 0,
      inv.tax_total || 0,
      inv.grand_total || 0,
      inv.payment_method || 'Cash',
      inv.status || 'paid',
    ]);
    const exportTime = `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
    const csvLines = [
      headers.join(delimiter),
      ...rows.map((r) => r.join(delimiter)),
      '',
      `"Time of Print / Export: ${exportTime}"`
    ];
    downloadFile(csvLines.join('\n'), `Invoices_Export_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
  };

  const exportFullSystemBackup = () => {
    const backup = {
      system: 'ApexSaaS ERP & POS',
      version: '2.5.0',
      exportedAt: new Date().toISOString(),
      timeOfExport: `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
      branch: activeSection,
      data: {
        products,
        invoices,
        purchases,
        parties,
        sections,
        printSettings,
        exchangeSettings,
      },
    };
    const jsonStr = JSON.stringify(backup, null, 2);
    downloadFile(jsonStr, `ApexSaaS_Full_Backup_${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed.data) {
          alert('Invalid backup file format: Missing data block.');
          return;
        }
        if (window.confirm(`Restore data from backup created at ${parsed.exportedAt || 'Unknown'}? Existing records will be updated.`)) {
          if (parsed.data.printSettings) {
            saveInvoicePrintSettings(parsed.data.printSettings);
            setPrintSettings(parsed.data.printSettings);
          }
          if (parsed.data.exchangeSettings) {
            localStorage.setItem(EXCHANGE_STORAGE_KEY, JSON.stringify(parsed.data.exchangeSettings));
            setExchangeSettings(parsed.data.exchangeSettings);
          }
          showToast('Backup configuration verified and restored successfully!');
        }
      } catch (err: any) {
        alert('Failed to parse backup file: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Preview effective logo
  const previewLogoUrl = getEffectiveLogo(printSettings, previewBranch);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-purple-500/50 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveSubTab('invoice_print')}
          className={`px-4 py-2 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'invoice_print'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Invoice Print & Layout Settings</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('export_import')}
          className={`px-4 py-2 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'export_import'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Export & Import Configurations</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('backup_restore')}
          className={`px-4 py-2 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'backup_restore'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Data Backup & Restoration</span>
        </button>
      </div>

      {/* 1. INVOICE PRINT & LAYOUT SETTINGS */}
      {activeSubTab === 'invoice_print' && (
        <form onSubmit={handleSavePrintSettings} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form Column (7 cols on large screens) */}
          <div className="lg:col-span-7 space-y-6">

            {/* SECTION 1: STORE & BRANCH-SPECIFIC LOGOS (LOCAL UPLOAD) */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                  <ImageIcon className="w-4 h-4 text-purple-700" />
                  <span>Store Logo & Branch-Specific Logos</span>
                </div>
                <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                  Local Image Upload
                </span>
              </div>

              <div className="space-y-4 text-xs">
                {/* Global / Main Store Logo */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-black text-slate-800 text-xs block">Main Shop Logo (Default for all branches)</span>
                      <span className="text-[11px] text-slate-500">Upload a PNG, JPG or WebP image from your local computer</span>
                    </div>
                    {printSettings.storeLogo && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                        Logo Active
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    {printSettings.storeLogo ? (
                      <div className="w-16 h-16 rounded-lg bg-white border border-slate-300 p-1 flex items-center justify-center shrink-0 shadow-2xs">
                        <img 
                          src={printSettings.storeLogo} 
                          alt="Store Logo" 
                          className="max-h-full max-w-full object-contain" 
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-slate-200 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 shrink-0">
                        <ImageIcon className="w-5 h-5 mb-0.5" />
                        <span className="text-[8px] font-bold">No Logo</span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      <label className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors shadow-2xs flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Shop Logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleStoreLogoUpload}
                          className="hidden"
                        />
                      </label>
                      {printSettings.storeLogo && (
                        <button
                          type="button"
                          onClick={handleRemoveStoreLogo}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Branch-Specific Logos */}
                <div className="p-3.5 bg-purple-50/50 rounded-xl border border-purple-100 space-y-3">
                  <div>
                    <span className="font-black text-slate-900 text-xs block">Branch-Specific Logo Override</span>
                    <span className="text-[11px] text-slate-600">
                      Configure a separate logo for each branch (e.g. <strong>Store sales</strong> or <strong>SEENU CARE CO.</strong>). Branches without a custom logo will use the main shop logo.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Select Branch To Customize Logo:</label>
                      <select
                        value={selectedBranchForLogo}
                        onChange={(e) => setSelectedBranchForLogo(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:border-purple-600 outline-none cursor-pointer"
                      >
                        {availableBranches.map(branch => (
                          <option key={branch} value={branch}>
                            {branch} {printSettings.branchLogos?.[branch] ? '• (Custom Logo)' : '• (Default Logo)'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-3">
                      {printSettings.branchLogos?.[selectedBranchForLogo] ? (
                        <div className="w-14 h-14 rounded-lg bg-white border border-purple-300 p-1 flex items-center justify-center shrink-0 shadow-2xs">
                          <img 
                            src={printSettings.branchLogos[selectedBranchForLogo]} 
                            alt={`${selectedBranchForLogo} Logo`} 
                            className="max-h-full max-w-full object-contain" 
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 shrink-0">
                          <span className="text-[8px] font-bold text-center px-1">Main Logo Inherited</span>
                        </div>
                      )}

                      <div className="flex flex-col gap-1.5">
                        <label className="px-2.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors shadow-2xs flex items-center gap-1">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Branch Logo</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleBranchLogoUpload(e, selectedBranchForLogo)}
                            className="hidden"
                          />
                        </label>
                        {printSettings.branchLogos?.[selectedBranchForLogo] && (
                          <button
                            type="button"
                            onClick={() => handleRemoveBranchLogo(selectedBranchForLogo)}
                            className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-[10px] rounded cursor-pointer transition-colors"
                          >
                            Revert to Default
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: PRINT TYPE & PAPER FORMATS */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                  <Printer className="w-4 h-4 text-purple-700" />
                  <span>Print Type & Paper Formats (Sales, Purchases, Vouchers)</span>
                </div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                  A4 • A5 • 80mm
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Sales & POS Invoices Default Format:
                  </label>
                  <select
                    value={printSettings.salesPrintFormat || printSettings.defaultFormat}
                    onChange={(e) => {
                      const fmt = e.target.value as PaperPrintFormat;
                      setPrintSettings({ ...printSettings, salesPrintFormat: fmt, defaultFormat: fmt });
                      setPreviewFormat(fmt);
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:bg-white focus:border-purple-600 outline-none cursor-pointer"
                  >
                    <option value="thermal_80mm">Thermal Print 80mm (Standard POS Slip)</option>
                    <option value="a4">Full Sheet Standard A4 (Formal Invoice)</option>
                    <option value="a5">Half Sheet A5 (Compact Statement)</option>
                  </select>
                  <span className="text-[10px] text-slate-500 mt-1 block">Used when printing customer sales & POS orders</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Purchases & Purchase Orders Default Format:
                  </label>
                  <select
                    value={printSettings.purchasePrintFormat || 'a4'}
                    onChange={(e) => setPrintSettings({ ...printSettings, purchasePrintFormat: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:bg-white focus:border-purple-600 outline-none cursor-pointer"
                  >
                    <option value="a4">Standard A4 Sheet (Recommended for Purchases)</option>
                    <option value="a5">Half Sheet A5 Format</option>
                    <option value="thermal_80mm">Thermal Print 80mm</option>
                  </select>
                  <span className="text-[10px] text-slate-500 mt-1 block">Used for Purchase Invoices & Vendor Purchase Orders</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Receipts & Payment Vouchers Default Format:
                  </label>
                  <select
                    value={printSettings.voucherPrintFormat || 'a4'}
                    onChange={(e) => setPrintSettings({ ...printSettings, voucherPrintFormat: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:bg-white focus:border-purple-600 outline-none cursor-pointer"
                  >
                    <option value="a4">Standard A4 Format</option>
                    <option value="a5">Half Sheet A5 Format (Formal Slip)</option>
                    <option value="thermal_80mm">Thermal Print 80mm Slip</option>
                  </select>
                  <span className="text-[10px] text-slate-500 mt-1 block">Used for official cash/bank payment & receipt slips</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Sales Orders & Quotations Default Format:
                  </label>
                  <select
                    value={printSettings.orderPrintFormat || 'a4'}
                    onChange={(e) => setPrintSettings({ ...printSettings, orderPrintFormat: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:bg-white focus:border-purple-600 outline-none cursor-pointer"
                  >
                    <option value="a4">Standard A4 Sheet</option>
                    <option value="a5">Half Sheet A5 Format</option>
                    <option value="thermal_80mm">Thermal Print 80mm Slip</option>
                  </select>
                  <span className="text-[10px] text-slate-500 mt-1 block">Used for commercial price quotations & sales orders</span>
                </div>
              </div>
            </div>

            {/* SECTION 3: INVOICE ELEMENTS & ITEM LINE LAYOUT */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                  <Sliders className="w-4 h-4 text-purple-700" />
                  <span>Invoice Elements & Item Line Columns</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Barcode Removed
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                <span className="font-black text-slate-900 block mb-1">Standard Item Line Layout (Sales, Purchases, Orders):</span>
                <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] font-bold text-purple-900 bg-white p-2 rounded-lg border border-slate-200">
                  <span className="bg-purple-100 px-2 py-0.5 rounded">1. Item Name</span>
                  <span>→</span>
                  <span className="bg-purple-100 px-2 py-0.5 rounded">2. Quantity</span>
                  <span>→</span>
                  <span className="bg-purple-100 px-2 py-0.5 rounded">3. UOM (Pcs, Dzn, Ctn, etc.)</span>
                  <span>→</span>
                  <span className="bg-purple-100 px-2 py-0.5 rounded">4. Unit Price</span>
                  <span>→</span>
                  <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded">5. Total Price Amount</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                {[
                  { key: 'showLogo', label: 'Store / Branch Logo' },
                  { key: 'showBranchHeader', label: 'Branch / Terminal Header' },
                  { key: 'showUom', label: 'Unit of Measure (UOM)' },
                  { key: 'showSku', label: 'Product SKU Code' },
                  { key: 'showItemDiscount', label: 'Line Item Discounts' },
                  { key: 'showTaxColumn', label: 'Tax & VAT Column' },
                  { key: 'showCashierName', label: 'Cashier / Operator Name' },
                  { key: 'showCustomerDetails', label: 'Customer Name & Phone' },
                  { key: 'showPaymentBreakdown', label: 'Payment Method Breakdown' },
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={(printSettings as any)[item.key]}
                      onChange={(e) => setPrintSettings({ ...printSettings, [item.key]: e.target.checked })}
                      className="rounded text-purple-700 focus:ring-purple-500 border-slate-300 w-4 h-4 cursor-pointer"
                    />
                    <span className="font-bold text-slate-800 text-[11px]">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* SECTION 4: DIGITAL QR CODE SETTINGS & IMAGE UPLOAD */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                  <QrCode className="w-4 h-4 text-purple-700" />
                  <span>Digital QR Code & Custom Image Upload</span>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 select-none">
                    <input
                      type="checkbox"
                      checked={printSettings.showQrCode}
                      onChange={(e) => setPrintSettings({ ...printSettings, showQrCode: e.target.checked })}
                      className="rounded text-purple-700 focus:ring-purple-500 border-slate-300 w-4 h-4"
                    />
                    <span>Print QR Code on Invoices & Receipts</span>
                  </label>
                </div>

                {printSettings.showQrCode && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                        <input
                          type="radio"
                          name="qrCodeType"
                          value="auto"
                          checked={printSettings.qrCodeType !== 'custom_image'}
                          onChange={() => setPrintSettings({ ...printSettings, qrCodeType: 'auto' })}
                          className="text-purple-700"
                        />
                        <span>Auto-Generated E-Invoice QR Code</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                        <input
                          type="radio"
                          name="qrCodeType"
                          value="custom_image"
                          checked={printSettings.qrCodeType === 'custom_image'}
                          onChange={() => setPrintSettings({ ...printSettings, qrCodeType: 'custom_image' })}
                          className="text-purple-700"
                        />
                        <span>Custom Uploaded QR Code Image</span>
                      </label>
                    </div>

                    {printSettings.qrCodeType === 'custom_image' && (
                      <div className="pt-2 border-t border-slate-200 flex items-center gap-4">
                        {printSettings.qrCodeImage ? (
                          <div className="w-16 h-16 rounded-lg bg-white border border-slate-300 p-1 flex items-center justify-center shrink-0 shadow-2xs">
                            <img 
                              src={printSettings.qrCodeImage} 
                              alt="Custom QR" 
                              className="max-h-full max-w-full object-contain" 
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-slate-200 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 shrink-0">
                            <QrCode className="w-5 h-5 mb-0.5" />
                            <span className="text-[8px] font-bold">No Image</span>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2">
                          <label className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors shadow-2xs flex items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload QR Code Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleQrImageUpload}
                              className="hidden"
                            />
                          </label>
                          {printSettings.qrCodeImage && (
                            <button
                              type="button"
                              onClick={handleRemoveQrImage}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 5: BUSINESS HEADER & FOOTER NOTES */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                  <Building2 className="w-4 h-4 text-purple-700" />
                  <span>Business Header Information & Return Policy</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Business / Company Name</label>
                  <input
                    type="text"
                    value={printSettings.businessName}
                    onChange={(e) => setPrintSettings({ ...printSettings, businessName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:bg-white focus:border-purple-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tagline / Slogan</label>
                  <input
                    type="text"
                    value={printSettings.tagline}
                    onChange={(e) => setPrintSettings({ ...printSettings, tagline: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:bg-white focus:border-purple-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Address / Location</label>
                  <input
                    type="text"
                    value={printSettings.address}
                    onChange={(e) => setPrintSettings({ ...printSettings, address: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:bg-white focus:border-purple-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone / Support Hotlines</label>
                  <input
                    type="text"
                    value={printSettings.phone}
                    onChange={(e) => setPrintSettings({ ...printSettings, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:bg-white focus:border-purple-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="text"
                    value={printSettings.email}
                    onChange={(e) => setPrintSettings({ ...printSettings, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:bg-white focus:border-purple-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tax Registration / VAT / TRN</label>
                  <input
                    type="text"
                    value={printSettings.taxNumber}
                    onChange={(e) => setPrintSettings({ ...printSettings, taxNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:bg-white focus:border-purple-600 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Terms & Return Policy</label>
                  <textarea
                    rows={2}
                    value={printSettings.termsAndConditions}
                    onChange={(e) => setPrintSettings({ ...printSettings, termsAndConditions: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:bg-white focus:border-purple-600 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Greeting / Footer Note</label>
                  <input
                    type="text"
                    value={printSettings.footerNote}
                    onChange={(e) => setPrintSettings({ ...printSettings, footerNote: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:bg-white focus:border-purple-600 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Submit & Reset actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleResetPrintSettings}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Default Template</span>
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Invoice Print & Layout Settings</span>
              </button>
            </div>
          </div>

          {/* Right Column: Real-Time Multi-Format Document Preview (5 cols on large screens) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="sticky top-4 space-y-3">
              {/* Preview Header Controls */}
              <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-black text-xs">
                    <Eye className="w-4 h-4 text-amber-400" />
                    <span>Real-Time Layout & Paper Preview</span>
                  </div>
                  <span className="text-[10px] bg-purple-600 font-mono font-bold px-2 py-0.5 rounded uppercase">
                    {previewFormat.replace('_', ' ')}
                  </span>
                </div>

                {/* Document Type Switcher */}
                <div className="flex gap-1.5 p-1 bg-slate-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPreviewDocType('sales')}
                    className={`flex-1 py-1.5 text-[11px] font-black rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                      previewDocType === 'sales' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <ShoppingCart className="w-3 h-3" /> Sales
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDocType('purchase')}
                    className={`flex-1 py-1.5 text-[11px] font-black rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                      previewDocType === 'purchase' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileCheck className="w-3 h-3" /> Purchase
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDocType('voucher')}
                    className={`flex-1 py-1.5 text-[11px] font-black rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                      previewDocType === 'voucher' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Receipt className="w-3 h-3" /> Voucher
                  </button>
                </div>

                {/* Paper Format Switcher */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">Simulate Paper Format:</span>
                  <div className="grid grid-cols-3 gap-1">
                    {(['thermal_80mm', 'a4', 'a5'] as PaperPrintFormat[]).map(fmt => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => setPreviewFormat(fmt)}
                        className={`py-1 text-[10px] font-bold rounded cursor-pointer transition-colors ${
                          previewFormat === fmt ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {fmt === 'thermal_80mm' ? '80mm POS' : fmt === 'a5' ? 'A5 Half' : 'A4 Sheet'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Branch Preview Selector */}
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-slate-400 font-bold shrink-0">Branch Preview:</span>
                  <select
                    value={previewBranch}
                    onChange={(e) => setPreviewBranch(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white font-bold text-xs focus:border-purple-400 outline-none cursor-pointer"
                  >
                    {availableBranches.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Document Simulator Body */}
              <div className={`mx-auto bg-white border border-slate-300 rounded-2xl shadow-xl p-5 text-slate-900 font-mono text-[11px] leading-relaxed max-h-[580px] overflow-y-auto transition-all ${
                previewFormat === 'thermal_80mm' 
                  ? 'max-w-[340px]' 
                  : previewFormat === 'a5'
                    ? 'max-w-[480px]'
                    : 'w-full'
              }`}>
                {/* Header Branding */}
                <div className="text-center pb-3 border-b border-dashed border-slate-300 space-y-1.5">
                  {/* Store / Branch Logo */}
                  {printSettings.showLogo && previewLogoUrl && (
                    <div className="flex justify-center mb-2">
                      <img 
                        src={previewLogoUrl} 
                        alt="Store Logo" 
                        className="max-h-12 max-w-[140px] object-contain" 
                      />
                    </div>
                  )}

                  {printSettings.showBranchHeader && (
                    <div className="text-[9px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded inline-block font-sans font-black uppercase">
                      Branch: {previewBranch}
                    </div>
                  )}
                  
                  <div className="font-black text-xs text-slate-950 uppercase">{printSettings.businessName}</div>
                  {printSettings.tagline && <div className="text-[10px] text-slate-500">{printSettings.tagline}</div>}
                  {printSettings.address && <div className="text-[10px] text-slate-600">{printSettings.address}</div>}
                  {printSettings.phone && <div className="text-[10px] text-slate-600">Tel: {printSettings.phone}</div>}
                  {printSettings.taxNumber && <div className="text-[10px] font-bold text-slate-800">TRN/VAT: {printSettings.taxNumber}</div>}
                  
                  <div className="text-[10px] font-bold uppercase tracking-wider text-purple-900 bg-purple-50 py-0.5 rounded mt-1">
                    {previewDocType === 'sales' ? 'TAX INVOICE' : previewDocType === 'purchase' ? 'PURCHASE ORDER' : 'OFFICIAL PAYMENT VOUCHER'}
                  </div>
                </div>

                {/* Metadata */}
                <div className="py-2 border-b border-dashed border-slate-300 text-[10px] space-y-0.5">
                  <div className="flex justify-between">
                    <span>Doc #: <strong className="text-slate-950 font-bold">{previewDocType === 'sales' ? 'INV-2026-0892' : previewDocType === 'purchase' ? 'PO-2026-0041' : 'VCH-2026-0120'}</strong></span>
                    <span>Date: 2026-09-11</span>
                  </div>
                  {printSettings.showCashierName && (
                    <div className="flex justify-between text-slate-600">
                      <span>Operator: Suresh</span>
                      <span>Time: 14:32:10</span>
                    </div>
                  )}
                  {printSettings.showCustomerDetails && (
                    <div className="text-slate-700">
                      {previewDocType === 'purchase' ? 'Supplier: Kuwait Beauty Supplies Co.' : 'Party: Al-Rayan Salon Co. (99792824)'}
                    </div>
                  )}
                </div>

                {/* Items Table with requested layout: Item name, quantity, UOM, Unit Price, Total */}
                <div className="py-2 border-b border-dashed border-slate-300 space-y-1 text-[10px]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-300 font-bold text-slate-900">
                        <th className="py-1">Item</th>
                        <th className="py-1 text-center">Qty</th>
                        {printSettings.showUom && <th className="py-1 text-center">UOM</th>}
                        <th className="py-1 text-right">Price</th>
                        <th className="py-1 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-1">
                          <div className="font-semibold text-slate-900">Argan Hair Serum 100ml</div>
                          {printSettings.showSku && <div className="text-[8px] text-slate-400">SKU: ARG-SRM-100</div>}
                        </td>
                        <td className="py-1 text-center font-bold">5</td>
                        {printSettings.showUom && <td className="py-1 text-center text-purple-800 font-bold">Pcs</td>}
                        <td className="py-1 text-right font-mono">3.500</td>
                        <td className="py-1 text-right font-bold font-mono">17.500</td>
                      </tr>
                      <tr>
                        <td className="py-1">
                          <div className="font-semibold text-slate-900">Pro Barber Shears 7"</div>
                          {printSettings.showSku && <div className="text-[8px] text-slate-400">SKU: SH-PRO-07</div>}
                          {printSettings.showItemDiscount && <div className="text-[8px] text-emerald-600">Disc: -1.000</div>}
                        </td>
                        <td className="py-1 text-center font-bold">2</td>
                        {printSettings.showUom && <td className="py-1 text-center text-purple-800 font-bold">Dzn</td>}
                        <td className="py-1 text-right font-mono">12.000</td>
                        <td className="py-1 text-right font-bold font-mono">23.000</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="py-2 border-b border-dashed border-slate-300 space-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-mono">41.500</span>
                  </div>
                  {printSettings.showTaxColumn && (
                    <div className="flex justify-between text-slate-500">
                      <span>Tax / VAT (0%):</span>
                      <span className="font-mono">0.000</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-xs pt-1 border-t border-slate-300 text-slate-950">
                    <span>Grand Total:</span>
                    <span className="font-mono text-purple-900">40.500 KWD</span>
                  </div>
                  {printSettings.showPaymentBreakdown && (
                    <div className="text-[9px] text-slate-500 pt-1">
                      Paid via K-NET / Card: 40.500 KWD
                    </div>
                  )}
                </div>

                {/* QR Code (NO BARCODE as requested) */}
                {printSettings.showQrCode && (
                  <div className="py-3 text-center space-y-1">
                    {printSettings.qrCodeType === 'custom_image' && printSettings.qrCodeImage ? (
                      <div className="flex flex-col items-center justify-center">
                        <img 
                          src={printSettings.qrCodeImage} 
                          alt="Custom QR" 
                          className="w-16 h-16 object-contain mx-auto" 
                        />
                        <span className="text-[8px] text-slate-400 mt-0.5">Custom Scan Code</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <QrCode className="w-14 h-14 text-slate-900" />
                        <span className="text-[8px] text-slate-500 mt-0.5">Official E-Invoice Verification</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer Notes */}
                <div className="text-center pt-2 text-[9px] text-slate-500 space-y-1 border-t border-dashed border-slate-300">
                  <div>{printSettings.termsAndConditions}</div>
                  <div className="font-bold text-slate-700">{printSettings.footerNote}</div>
                </div>

                {/* Dynamic Mandatory Time of Print at the bottom */}
                <div className="mt-3 pt-2 border-t border-slate-200 text-center text-[9px] text-slate-600 bg-slate-50 rounded p-1.5 font-sans">
                  Time of Print: <strong className="text-slate-950 font-bold">{previewTime}</strong>
                  <div className="text-[8px] text-slate-400">Time of Voucher / Invoice: 14:32:10 (Distinct)</div>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* 2. EXPORT & IMPORT CONFIGURATIONS */}
      {activeSubTab === 'export_import' && (
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-5 rounded-2xl shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-base">One-Click Data Exporters</h3>
                <p className="text-xs text-purple-200 mt-0.5">
                  Export live datasets adhering to configured CSV delimiters, formats, and headers with mandatory print timestamps
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={exportProductsCsv}
                  className="px-4 py-2 bg-white text-purple-900 hover:bg-purple-50 font-black text-xs rounded-xl shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Products CSV ({products.length})</span>
                </button>

                <button
                  type="button"
                  onClick={exportInvoicesCsv}
                  className="px-4 py-2 bg-white text-purple-900 hover:bg-purple-50 font-black text-xs rounded-xl shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Invoices CSV ({invoices.length})</span>
                </button>
              </div>
            </div>
          </div>

          {/* Configuration Form */}
          <form onSubmit={handleSaveExchangeSettings} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-6">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h4 className="font-black text-sm text-slate-900">Exchange Format & Delimiter Settings</h4>
                <p className="text-xs text-slate-500">Controls data structuring for spreadsheets, third-party software, and batch uploads</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">CSV Delimiter</label>
                <select
                  value={exchangeSettings.csvDelimiter}
                  onChange={(e) => setExchangeSettings({ ...exchangeSettings, csvDelimiter: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:bg-white focus:border-purple-600 outline-none cursor-pointer"
                >
                  <option value=",">Comma ( , ) - Standard English & Excel</option>
                  <option value=";">Semicolon ( ; ) - European Regional Standard</option>
                  <option value="&#9;">Tab ( \t ) - Tab Delimited TSV</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Date Format In Files</label>
                <select
                  value={exchangeSettings.dateFormat}
                  onChange={(e) => setExchangeSettings({ ...exchangeSettings, dateFormat: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:bg-white focus:border-purple-600 outline-none cursor-pointer"
                >
                  <option value="YYYY-MM-DD">ISO Standard (YYYY-MM-DD)</option>
                  <option value="DD/MM/YYYY">International (DD/MM/YYYY)</option>
                  <option value="MM/DD/YYYY">US Format (MM/DD/YYYY)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Character Encoding</label>
                <select
                  value={exchangeSettings.encoding}
                  onChange={(e) => setExchangeSettings({ ...exchangeSettings, encoding: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:bg-white focus:border-purple-600 outline-none cursor-pointer"
                >
                  <option value="UTF-8">UTF-8 (Multi-Language & Arabic Support)</option>
                  <option value="ISO-8859-1">ISO-8859-1 (Legacy Latin)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Duplicate Record Policy (Import)</label>
                <select
                  value={exchangeSettings.duplicateAction}
                  onChange={(e) => setExchangeSettings({ ...exchangeSettings, duplicateAction: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:bg-white focus:border-purple-600 outline-none cursor-pointer"
                >
                  <option value="overwrite">Overwrite & Update Existing Record</option>
                  <option value="skip">Skip Record (Keep Existing)</option>
                  <option value="error">Halt Batch & Show Error</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Default Inventory Valuation</label>
                <select
                  value={exchangeSettings.defaultValuation}
                  onChange={(e) => setExchangeSettings({ ...exchangeSettings, defaultValuation: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:bg-white focus:border-purple-600 outline-none cursor-pointer"
                >
                  <option value="FIFO">First-In First-Out (FIFO)</option>
                  <option value="Weighted Average">Weighted Average Cost</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Max Bulk Rows Per Import</label>
                <input
                  type="number"
                  value={exchangeSettings.batchSizeLimit}
                  onChange={(e) => setExchangeSettings({ ...exchangeSettings, batchSizeLimit: Number(e.target.value) || 1000 })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:bg-white focus:border-purple-600 outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 select-none">
                <input
                  type="checkbox"
                  checked={exchangeSettings.includeHeaders}
                  onChange={(e) => setExchangeSettings({ ...exchangeSettings, includeHeaders: e.target.checked })}
                  className="rounded text-purple-700 focus:ring-purple-500 border-slate-300 w-4 h-4 cursor-pointer"
                />
                <span>Include Column Headers in CSV Exports</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 select-none">
                <input
                  type="checkbox"
                  checked={exchangeSettings.autoGenerateSku}
                  onChange={(e) => setExchangeSettings({ ...exchangeSettings, autoGenerateSku: e.target.checked })}
                  className="rounded text-purple-700 focus:ring-purple-500 border-slate-300 w-4 h-4 cursor-pointer"
                />
                <span>Auto-Generate Missing Barcodes / SKUs During Import</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 select-none">
                <input
                  type="checkbox"
                  checked={exchangeSettings.strictValidation}
                  onChange={(e) => setExchangeSettings({ ...exchangeSettings, strictValidation: e.target.checked })}
                  className="rounded text-purple-700 focus:ring-purple-500 border-slate-300 w-4 h-4 cursor-pointer"
                />
                <span>Strict Validation Mode (Verify Types Before Saving)</span>
              </label>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Export & Import Settings</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. DATA BACKUP & RESTORATION */}
      {activeSubTab === 'backup_restore' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Backup Generator */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-sm text-slate-900">Create Full System Database Backup</h4>
                <p className="text-xs text-slate-500">Download a complete structured JSON archive of all tables and settings</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-2 text-slate-700">
              <div className="flex justify-between">
                <span>Products & Inventory:</span>
                <strong className="text-slate-900">{products.length} records</strong>
              </div>
              <div className="flex justify-between">
                <span>Sales Invoices:</span>
                <strong className="text-slate-900">{invoices.length} invoices</strong>
              </div>
              <div className="flex justify-between">
                <span>Purchases & Vendors:</span>
                <strong className="text-slate-900">{purchases.length} records</strong>
              </div>
              <div className="flex justify-between">
                <span>Branches & Locations:</span>
                <strong className="text-slate-900">{sections.length} branches</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={exportFullSystemBackup}
              className="w-full py-3 bg-purple-700 hover:bg-purple-800 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Generate & Download Backup File</span>
            </button>
          </div>

          {/* Restore / Import Archive */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-sm text-slate-900">Restore Data from Archive</h4>
                <p className="text-xs text-slate-500">Select a previously exported ApexSaaS backup file (.json)</p>
              </div>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Attention:</strong> Restoring updates settings, print templates, and imported master data. Please confirm the backup source is trusted before continuing.
              </div>
            </div>

            <div className="pt-2">
              <label className="block w-full border-2 border-dashed border-slate-300 hover:border-purple-600 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50 hover:bg-purple-50/50">
                <Upload className="w-6 h-6 text-purple-700 mx-auto mb-2" />
                <span className="font-black text-xs text-slate-800 block">Click to Browse Backup File</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">Supports .json system backup archives</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
