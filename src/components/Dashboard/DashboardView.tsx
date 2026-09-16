import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  TrendingUp, 
  Banknote, 
  ShoppingBag, 
  ShoppingCart, 
  Users, 
  Package, 
  AlertTriangle, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  Clock, 
  ShieldCheck,
  CreditCard,
  Building,
  RotateCcw
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { NavViewKey } from '../Navigation/Sidebar';
import { getViewUrl } from '../../utils/navigation';

interface DashboardViewProps {
  onNavigate: (view: NavViewKey) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { products, invoices, purchases, salesReturns, purchaseReturns, customers, suppliers, expenses } = useStore();
  const [timeRange, setTimeRange] = useState<'today' | '7days' | '30days' | 'all'>('30days');

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, view: NavViewKey) => {
    if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
      e.preventDefault();
      onNavigate(view);
    }
  };

  // Compute key stats
  const totalSalesRevenue = invoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + (inv.total || 0), 0);

  const totalCostOfGoodsSold = invoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => {
      const invCost = (inv.items || []).reduce((iSum, item) => iSum + (item.cost || 0) * (item.qty || 1), 0);
      return sum + invCost;
    }, 0);

  const totalGrossProfit = totalSalesRevenue - totalCostOfGoodsSold;
  const grossProfitMargin = totalSalesRevenue > 0 ? ((totalGrossProfit / totalSalesRevenue) * 100).toFixed(1) : '0.0';

  const totalPurchasesAmount = purchases
    .filter((p) => p.status !== 'cancelled')
    .reduce((sum, p) => sum + (p.total_amount || p.total || 0), 0);

  const totalCustomerReceivables = customers.reduce((sum, c) => sum + (c.due_balance || 0), 0);
  const totalSupplierPayables = suppliers.reduce((sum, s) => sum + (s.due_balance || 0), 0);

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const lowStockItems = products.filter((p) => (p.stock_quantity || 0) <= (p.lowStockThreshold || 5));

  // Payments Distribution
  const paymentBreakdownTotals = invoices
    .filter((inv) => inv.status === 'paid')
    .reduce(
      (acc, inv) => {
        const p = inv.payments || {};
        acc.cash += Number(p.cash) || 0;
        acc.visa += Number(p.visa) || 0;
        acc.knet += Number(p.knet) || 0;
        acc.card += Number(p.card) || 0;
        acc.online += Number(p.online) || 0;
        acc.cheque += Number(p.cheque) || 0;
        return acc;
      },
      { cash: 0, visa: 0, knet: 0, card: 0, online: 0, cheque: 0 }
    );

  const pieData = [
    { name: 'Cash', value: Number((paymentBreakdownTotals.cash || 0).toFixed(3)), color: '#10b981' },
    { name: 'K-Net / Debit', value: Number((paymentBreakdownTotals.knet || 0).toFixed(3)), color: '#3b82f6' },
    { name: 'Visa / Mastercard', value: Number(((paymentBreakdownTotals.visa || 0) + (paymentBreakdownTotals.card || 0)).toFixed(3)), color: '#8b5cf6' },
    { name: 'Online / Transfer', value: Number((paymentBreakdownTotals.online || 0).toFixed(3)), color: '#f59e0b' },
    { name: 'Cheque', value: Number((paymentBreakdownTotals.cheque || 0).toFixed(3)), color: '#ec4899' },
  ].filter((d) => d.value > 0);

  // Monthly / Daily trend data
  const monthlyTrends = [
    { month: 'Apr', sales: 1840, purchase: 1200, profit: 640 },
    { month: 'May', sales: 2450, purchase: 1600, profit: 850 },
    { month: 'Jun', sales: 3100, purchase: 2100, profit: 1000 },
    { month: 'Jul', sales: 2890, purchase: 1950, profit: 940 },
    { month: 'Aug (Current)', sales: Number((totalSalesRevenue || 0).toFixed(2)), purchase: Number((totalPurchasesAmount || 0).toFixed(2)), profit: Number((totalGrossProfit || 0).toFixed(2)) },
  ];

  // Top Selling Products
  const productSalesMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  invoices.forEach((inv) => {
    if (inv.status === 'paid' && Array.isArray(inv.items)) {
      inv.items.forEach((it) => {
        if (!productSalesMap[it.product_id]) {
          productSalesMap[it.product_id] = { name: it.name, qty: 0, revenue: 0 };
        }
        productSalesMap[it.product_id].qty += (it.qty || 1);
        productSalesMap[it.product_id].revenue += (it.total || 0);
      });
    }
  });

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return (
    <div className="h-[calc(100vh-42px)] overflow-y-auto bg-slate-950 text-slate-100 p-4 space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            Executive Enterprise Dashboard & Analytics
          </h2>
          <p className="text-xs text-slate-400">
            Real-time synchronization across Point-of-Sale, Procurement, Inventory & General Ledger
          </p>
        </div>

        {/* Quick Jump Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={getViewUrl('sales_pos')}
            onClick={(e) => handleLinkClick(e, 'sales_pos')}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            New POS Sale
          </a>
          <a
            href={getViewUrl('purchase_invoice')}
            onClick={(e) => handleLinkClick(e, 'purchase_invoice')}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            New Purchase
          </a>
          <a
            href={getViewUrl('voucher_receipt')}
            onClick={(e) => handleLinkClick(e, 'voucher_receipt')}
            className="bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Banknote className="w-3.5 h-3.5" />
            Receipt Voucher
          </a>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Sales */}
        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Sales</span>
            <span className="p-1 rounded bg-emerald-500/10 text-emerald-400">
              <ShoppingCart className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-lg font-black text-white font-mono">
              KWD {(totalSalesRevenue || 0).toFixed(3)}
            </div>
            <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight className="w-3 h-3" /> {invoices.length} Invoices
            </div>
          </div>
        </div>

        {/* Total Purchases */}
        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Purchases</span>
            <span className="p-1 rounded bg-blue-500/10 text-blue-400">
              <ShoppingBag className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-lg font-black text-white font-mono">
              KWD {(totalPurchasesAmount || 0).toFixed(3)}
            </div>
            <div className="text-[10px] text-blue-400 font-bold flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight className="w-3 h-3" /> {purchases.length} Invoices
            </div>
          </div>
        </div>

        {/* Gross Profit */}
        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Gross Profit</span>
            <span className="p-1 rounded bg-purple-500/10 text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-lg font-black text-emerald-400 font-mono">
              KWD {(totalGrossProfit || 0).toFixed(3)}
            </div>
            <div className="text-[10px] text-purple-400 font-bold mt-0.5">
              Margin: {grossProfitMargin}%
            </div>
          </div>
        </div>

        {/* Customer Receivables */}
        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Receivables</span>
            <span className="p-1 rounded bg-amber-500/10 text-amber-400">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-lg font-black text-amber-300 font-mono">
              KWD {(totalCustomerReceivables || 0).toFixed(3)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Due from Parties
            </div>
          </div>
        </div>

        {/* Supplier Payables */}
        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Payables</span>
            <span className="p-1 rounded bg-rose-500/10 text-rose-400">
              <Building className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-lg font-black text-rose-300 font-mono">
              KWD {(totalSupplierPayables || 0).toFixed(3)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Due to Suppliers
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Low Stock</span>
            <span className={`p-1 rounded ${lowStockItems.length > 0 ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className={`text-lg font-black font-mono ${lowStockItems.length > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
              {lowStockItems.length} Items
            </div>
            <a 
              href={getViewUrl('master_item')}
              onClick={(e) => handleLinkClick(e, 'master_item')}
              className="text-[10px] text-purple-400 hover:text-purple-300 font-bold mt-0.5 text-left block cursor-pointer"
            >
              Inspect items →
            </a>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sales vs Purchases Trend (Area Chart) */}
        <div className="lg:col-span-2 bg-slate-900 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Revenue vs Procurement vs Profit Growth</h3>
              <p className="text-xs text-slate-400">Monthly fiscal tracking</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Sales
              </span>
              <span className="flex items-center gap-1 text-blue-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span> Purchases
              </span>
              <span className="flex items-center gap-1 text-purple-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-purple-400"></span> Gross Profit
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrends}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="purchaseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#salesGrad)" />
                <Area type="monotone" dataKey="purchase" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#purchaseGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Distribution (Donut Chart) */}
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="mb-2">
            <h3 className="text-sm font-bold text-white">Payment Method Share</h3>
            <p className="text-xs text-slate-400">POS Settlement Breakdown</p>
          </div>

          <div className="h-44 w-full flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    formatter={(val) => `KWD ${(Number(val) || 0).toFixed(3)}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-500 italic">No settlement data yet</div>
            )}
          </div>

          <div className="space-y-1.5 text-xs pt-2 border-t border-slate-800">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                  {item.name}
                </span>
                <span className="font-mono font-bold text-white">KWD {(item.value || 0).toFixed(3)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tables Row: Top Selling Products & Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Selling Products */}
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-400" />
              Top Selling Products
            </h3>
            <a 
              href={getViewUrl('report_stock')}
              onClick={(e) => handleLinkClick(e, 'report_stock')}
              className="text-xs text-purple-400 hover:text-purple-300 font-bold cursor-pointer"
            >
              Full stock report →
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold">
                  <th className="pb-2">Product Name</th>
                  <th className="pb-2 text-center">Units Sold</th>
                  <th className="pb-2 text-right">Revenue (KWD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {topProducts.length > 0 ? (
                  topProducts.map((prod, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="py-2.5 font-medium text-slate-200 truncate max-w-[220px]">
                        {prod.name}
                      </td>
                      <td className="py-2.5 text-center font-mono font-bold text-blue-300">
                        {prod.qty}
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-emerald-400">
                        {(prod.revenue || 0).toFixed(3)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-slate-500 italic">
                      No sales recorded yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              Recent POS Invoices
            </h3>
            <a 
              href={getViewUrl('invoice_list')}
              onClick={(e) => handleLinkClick(e, 'invoice_list')}
              className="text-xs text-purple-400 hover:text-purple-300 font-bold cursor-pointer"
            >
              View all invoices →
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold">
                  <th className="pb-2">Invoice #</th>
                  <th className="pb-2">Customer / Party</th>
                  <th className="pb-2 text-center">Items</th>
                  <th className="pb-2 text-right">Total (KWD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {invoices.slice(0, 5).map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 font-mono font-bold text-purple-300">
                      {inv.invoice_no}
                    </td>
                    <td className="py-2.5 text-slate-200 font-medium truncate max-w-[150px]">
                      {inv.customer_name}
                    </td>
                    <td className="py-2.5 text-center font-mono text-slate-400">
                      {(inv.items || []).length}
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-emerald-400">
                      {(inv.total || 0).toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
