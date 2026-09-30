import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { Expense } from '../../types';
import { 
  Banknote, 
  TrendingUp, 
  TrendingDown, 
  Receipt, 
  CreditCard, 
  Plus, 
  Trash2, 
  Calendar, 
  PieChart as PieIcon, 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles,
  Layers,
  X
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';

export const AccountingDashboard: React.FC = () => {
  const { invoices, expenses, products, addExpense, deleteExpense } = useStore();
  const { user } = useAuth();

  // Expense Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState<Expense['category']>('Rent');
  const [expenseAmount, setExpenseAmount] = useState<number>(100);
  const [expenseDate, setExpenseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expenseDescription, setExpenseDescription] = useState<string>('');
  const [expensePaymentMethod, setExpensePaymentMethod] = useState<string>('Bank Transfer');

  // Filter out voided invoices
  const validInvoices = invoices.filter((inv) => inv.status !== 'voided');

  // Financial Calculations
  const totalRevenue = validInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

  // Total COGS
  const totalCOGS = validInvoices.reduce((sum, inv) => {
    return (
      sum +
      (inv.items || []).reduce((itemSum, item) => {
        const prod = products.find((p) => p.id === item.product_id);
        const itemCost = item.cost || prod?.cost || 0;
        return itemSum + itemCost * (item.qty || 1);
      }, 0)
    );
  }, 0);

  const grossProfit = totalRevenue - totalCOGS;
  const grossMarginPct = totalRevenue > 0 ? (((grossProfit || 0) / totalRevenue) * 100).toFixed(1) : '0';

  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const netProfit = grossProfit - totalExpenses;
  const netMarginPct = totalRevenue > 0 ? (((netProfit || 0) / totalRevenue) * 100).toFixed(1) : '0';

  // Payment Breakdown totals
  const paymentTotals = validInvoices.reduce(
    (acc, inv) => {
      const p = inv.payments || {};
      acc.cash += p.cash || 0;
      acc.knet += p.knet || 0;
      acc.card += (p.card || 0) + (p.visa || 0);
      acc.online += p.online || 0;
      acc.cheque += p.cheque || 0;
      return acc;
    },
    { cash: 0, knet: 0, card: 0, online: 0, cheque: 0 }
  );

  // Pie chart data for payment modes
  const paymentPieData = [
    { name: 'Cash', value: Number((paymentTotals.cash || 0).toFixed(2)), color: '#06b6d4' },
    { name: 'K-Net', value: Number((paymentTotals.knet || 0).toFixed(2)), color: '#a855f7' },
    { name: 'Card', value: Number((paymentTotals.card || 0).toFixed(2)), color: '#f97316' },
    { name: 'Online', value: Number((paymentTotals.online || 0).toFixed(2)), color: '#eab308' },
    { name: 'Cheque', value: Number((paymentTotals.cheque || 0).toFixed(2)), color: '#92400e' },
  ].filter((d) => d.value > 0);

  // Category expense breakdown
  const expensesByCategory = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + (exp.amount || 0);
    return acc;
  }, {} as Record<string, number>);

  const categoryColors = ['#8b5cf6', '#ec4899', '#f97316', '#10b981', '#06b6d4', '#6366f1', '#eab308', '#64748b'];

  const expensePieData = Object.keys(expensesByCategory).map((cat, idx) => ({
    name: cat,
    value: Number((expensesByCategory[cat] || 0).toFixed(2)),
    color: categoryColors[idx % categoryColors.length],
  }));

  // Bar chart trend (Mock / Invoices aggregated by day)
  const chartData = [
    { name: 'Aug 24', revenue: 320, cogs: 140, expense: 85, profit: 95 },
    { name: 'Aug 25', revenue: 450, cogs: 190, expense: 120, profit: 140 },
    { name: 'Aug 26', revenue: 580, cogs: 240, expense: 90, profit: 250 },
    { name: 'Aug 27', revenue: Number((totalRevenue || 0).toFixed(0)), cogs: Number((totalCOGS || 0).toFixed(0)), expense: Number(((totalExpenses || 0) / 5).toFixed(0)), profit: Number((netProfit || 0).toFixed(0)) },
  ];

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseAmount || expenseAmount <= 0) {
      alert('Please enter a valid expense amount');
      return;
    }

    await addExpense({
      category: expenseCategory,
      amount: Number(expenseAmount),
      date: expenseDate,
      description: expenseDescription.trim() || `${expenseCategory} expenditure`,
      created_by: user?.displayName || 'Admin',
      payment_method: expensePaymentMethod,
    });

    setExpenseDescription('');
    setIsExpenseModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 overflow-y-auto font-sans p-3 sm:p-4 space-y-4 custom-scrollbar">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-md border border-amber-500/30">
              <Banknote className="w-4 h-4" />
            </span>
            <h2 className="text-base font-black text-white">Accounting & Financial Dashboard</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time Profit & Loss arithmetic, Revenue, Cost of Goods Sold, and Expense tracking
          </p>
        </div>

        <button
          id="btn-add-expense-modal"
          onClick={() => setIsExpenseModalOpen(true)}
          className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 py-2 rounded shadow-xs flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Expense</span>
        </button>
      </div>

      {/* Primary Financial Metric Cards (5 Metric Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Total Revenue */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 shadow-xs">
          <div className="flex justify-between items-center text-slate-400 text-xs font-bold">
            <span>Total Sales Revenue</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-400 font-mono mt-1">
            KWD {(totalRevenue || 0).toFixed(3)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {validInvoices.length} invoices issued
          </div>
        </div>

        {/* Cost of Goods Sold (COGS) */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 shadow-xs">
          <div className="flex justify-between items-center text-slate-400 text-xs font-bold">
            <span>Cost of Goods (COGS)</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-black text-purple-400 font-mono mt-1">
            KWD {(totalCOGS || 0).toFixed(3)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Direct inventory item costs</div>
        </div>

        {/* Gross Profit */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 shadow-xs">
          <div className="flex justify-between items-center text-slate-400 text-xs font-bold">
            <span>Gross Profit</span>
            <span className="text-[10px] bg-emerald-950 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-800">
              {grossMarginPct}%
            </span>
          </div>
          <div className="text-xl font-black text-cyan-400 font-mono mt-1">
            KWD {(grossProfit || 0).toFixed(3)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Revenue - Cost of Goods</div>
        </div>

        {/* Operating Expenses */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 shadow-xs">
          <div className="flex justify-between items-center text-slate-400 text-xs font-bold">
            <span>Operating Expenses</span>
            <ArrowDownRight className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-black text-rose-400 font-mono mt-1">
            KWD {(totalExpenses || 0).toFixed(3)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Rent, salaries & logistics</div>
        </div>

        {/* Net Profit */}
        <div className="bg-slate-950 border border-amber-600/50 rounded-lg p-3 shadow-md bg-gradient-to-br from-slate-950 to-amber-950/20">
          <div className="flex justify-between items-center text-amber-300 text-xs font-bold">
            <span>Net Profit</span>
            <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded">
              {netMarginPct}% Net
            </span>
          </div>
          <div className={`text-xl font-black font-mono mt-1 ${netProfit >= 0 ? 'text-amber-400' : 'text-rose-500'}`}>
            KWD {(netProfit || 0).toFixed(3)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Gross Profit - Total Expenses</div>
        </div>
      </div>

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Revenue vs Expenses Trend Bar Chart */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-lg p-3 shadow-xs">
          <h3 className="font-bold text-xs text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-purple-400" />
            Revenue vs COGS vs Expenses Performance
          </h3>
          <div className="h-56 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }}
                />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cogs" name="COGS" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses Category Breakdown */}
        <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-lg p-3 shadow-xs">
          <h3 className="font-bold text-xs text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <PieIcon className="w-4 h-4 text-rose-400" />
            Expense Breakdown by Category
          </h3>
          <div className="h-56 w-full text-xs flex items-center justify-center">
            {expensePieData.length === 0 ? (
              <div className="text-slate-500">No expenses recorded</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {expensePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Expenses Ledger & Management Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden shadow-xs">
        <div className="p-3 border-b border-slate-800 flex justify-between items-center">
          <h3 className="font-black text-xs uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-amber-400" />
            Operating Expenses Ledger
          </h3>
          <span className="text-xs text-slate-400">Total: {expenses.length} Records</span>
        </div>

        <div className="overflow-x-auto max-h-60">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-400 uppercase text-[10px] font-black border-b border-slate-800">
                <th className="py-2 px-3 w-12">#</th>
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Category</th>
                <th className="py-2 px-3">Description</th>
                <th className="py-2 px-3">Payment Method</th>
                <th className="py-2 px-3 text-right">Amount (KWD)</th>
                <th className="py-2 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium">
              {expenses.map((exp, idx) => (
                <tr key={exp.id} className="hover:bg-slate-900/60 text-slate-200">
                  <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                  <td className="py-2 px-3 font-mono">{exp.date}</td>
                  <td className="py-2 px-3 font-bold text-purple-300">{exp.category}</td>
                  <td className="py-2 px-3">{exp.description}</td>
                  <td className="py-2 px-3 text-slate-400">{exp.payment_method || 'Cash'}</td>
                  <td className="py-2 px-3 text-right font-black text-rose-400 font-mono">
                    {(exp.amount || 0).toFixed(3)}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button
                      title="Delete expense entry"
                      onClick={() => deleteExpense(exp.id)}
                      className="text-rose-500 hover:text-rose-400 p-1 rounded hover:bg-rose-950/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-4 max-w-md w-full animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800 mb-3">
              <h3 className="font-black text-sm text-white">Record Operating Expense</h3>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Expense Category *</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as Expense['category'])}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-bold outline-none"
                >
                  <option value="Rent">Rent (Showroom & Warehouse)</option>
                  <option value="Salaries">Salaries (Staff Payroll)</option>
                  <option value="Utilities">Utilities (Electricity, Internet)</option>
                  <option value="Logistics">Logistics & Freight Shipping</option>
                  <option value="Marketing">Marketing & Promotions</option>
                  <option value="Office Supplies">Office Supplies & Stationery</option>
                  <option value="Maintenance">Maintenance & Repairs</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Amount (KWD) *</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-rose-400 font-mono font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Payment Method</label>
                <select
                  value={expensePaymentMethod}
                  onChange={(e) => setExpensePaymentMethod(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white outline-none"
                >
                  <option value="Bank Transfer">Bank Transfer / Cheque</option>
                  <option value="Cash">Cash from Till</option>
                  <option value="K-Net">K-Net Debit</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Direct Deposit">Direct Deposit</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  placeholder="e.g. Monthly rent check for showroom..."
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-1.5 rounded font-bold text-slate-400 bg-slate-800 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 rounded font-black text-white bg-rose-600 hover:bg-rose-500 shadow-xs"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
