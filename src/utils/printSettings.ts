export type PaperPrintFormat = 'thermal_80mm' | 'a4' | 'a5';

export interface InvoicePrintSettings {
  businessName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  taxNumber: string;
  defaultFormat: PaperPrintFormat;
  salesPrintFormat: PaperPrintFormat;
  purchasePrintFormat: 'a4' | 'a5' | 'thermal_80mm';
  orderPrintFormat: 'a4' | 'a5' | 'thermal_80mm';
  voucherPrintFormat: 'a4' | 'a5' | 'thermal_80mm';
  showLogo: boolean;
  storeLogo?: string; // Global base64 data URL or URL
  branchLogos?: Record<string, string>; // Per-branch logo mapping (branch name/id -> base64 data URL)
  showBranchHeader: boolean;
  showSku: boolean;
  showUom: boolean;
  showItemDiscount: boolean;
  showTaxColumn: boolean;
  showQrCode: boolean;
  qrCodeType: 'auto' | 'custom_image';
  qrCodeImage?: string; // Uploaded custom QR code image data URL
  showCashierName: boolean;
  showCustomerDetails: boolean;
  showPaymentBreakdown: boolean;
  termsAndConditions: string;
  footerNote: string;
  fontScale: 'compact' | 'normal' | 'large';
  paperWidth: string; // e.g. "80mm", "A4", "A5"
}

export const DEFAULT_PRINT_SETTINGS: InvoicePrintSettings = {
  businessName: 'SEENU CARE CO.',
  tagline: 'Gift-Novelties-Beauty-Salon Wholesale & Retail',
  address: 'Salem Al Mubarak St, Block 4, Salmiya, Kuwait',
  phone: '+965 99792824 / +965 55978538',
  email: 'info@seenucare.com',
  taxNumber: 'TRN-1004928190003',
  defaultFormat: 'thermal_80mm',
  salesPrintFormat: 'thermal_80mm',
  purchasePrintFormat: 'a4',
  orderPrintFormat: 'a4',
  voucherPrintFormat: 'a4',
  showLogo: true,
  storeLogo: '',
  branchLogos: {},
  showBranchHeader: true,
  showSku: true,
  showUom: true,
  showItemDiscount: true,
  showTaxColumn: false,
  showQrCode: true,
  qrCodeType: 'auto',
  qrCodeImage: '',
  showCashierName: true,
  showCustomerDetails: true,
  showPaymentBreakdown: true,
  termsAndConditions: 'Goods once sold can be returned or exchanged within 14 days with original receipt in salable condition.',
  footerNote: 'Thank you for your valued business! Please visit again.',
  fontScale: 'normal',
  paperWidth: '80mm',
};

const STORAGE_KEY = 'apex_invoice_print_settings';

export function getInvoicePrintSettings(): InvoicePrintSettings {
  if (typeof window === 'undefined') return DEFAULT_PRINT_SETTINGS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate old format values like 'thermal' -> 'thermal_80mm', 58mm -> 80mm, a3 -> a5
      let defaultFormat = parsed.defaultFormat || DEFAULT_PRINT_SETTINGS.defaultFormat;
      if (defaultFormat === 'thermal' || defaultFormat === '58mm' || defaultFormat === 'thermal_58mm') defaultFormat = 'thermal_80mm';
      if (defaultFormat === 'a3') defaultFormat = 'a5';

      let salesPrintFormat = parsed.salesPrintFormat || defaultFormat;
      if (salesPrintFormat === 'thermal' || salesPrintFormat === '58mm' || salesPrintFormat === 'thermal_58mm') salesPrintFormat = 'thermal_80mm';
      if (salesPrintFormat === 'a3') salesPrintFormat = 'a5';

      let purchasePrintFormat = parsed.purchasePrintFormat || 'a4';
      if (purchasePrintFormat === 'a3') purchasePrintFormat = 'a5';

      let orderPrintFormat = parsed.orderPrintFormat || 'a4';
      if (orderPrintFormat === 'a3') orderPrintFormat = 'a5';

      let voucherPrintFormat = parsed.voucherPrintFormat || 'a4';
      if (voucherPrintFormat === 'a3') voucherPrintFormat = 'a5';

      return {
        ...DEFAULT_PRINT_SETTINGS,
        ...parsed,
        defaultFormat,
        salesPrintFormat,
        purchasePrintFormat,
        orderPrintFormat,
        voucherPrintFormat,
        branchLogos: parsed.branchLogos || {},
      };
    }
  } catch (err) {
    console.warn('Error loading invoice print settings:', err);
  }
  return DEFAULT_PRINT_SETTINGS;
}

export function saveInvoicePrintSettings(settings: InvoicePrintSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving invoice print settings:', err);
  }
}

/**
 * Returns the effective logo for a branch:
 * Checks branch-specific logo first, falls back to storeLogo.
 */
export function getEffectiveLogo(settings: InvoicePrintSettings, branchName?: string): string | undefined {
  if (!settings.showLogo) return undefined;
  if (branchName && settings.branchLogos && settings.branchLogos[branchName]) {
    return settings.branchLogos[branchName];
  }
  return settings.storeLogo || undefined;
}

/**
 * Formats dynamic print time when print is taken (distinct from invoice/voucher creation date)
 */
export function getCurrentPrintTimestamp(): string {
  const now = new Date();
  return `${now.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })} ${now.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })}`;
}
