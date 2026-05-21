import { useEffect, useState, useCallback } from 'react';
import { db } from '../db/indexedDB';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, DollarSign, X, Trash2, Edit, User, Calendar, Check, ThumbsDown, FileText, Receipt } from 'lucide-react';

const EXPENSE_CATEGORIES = ['Travel', 'Accommodation', 'Meals', 'Office Supplies', 'Training', 'Equipment', 'Communication', 'Medical', 'Other'];
const EXPENSE_STATUSES = ['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Reimbursed'];

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const [formData, setFormData] = useState({
    employeeId: '',
    category: 'Travel',
    amount: '',
    description: '',
    status: 'Draft',
    date: '',
    receiptUrl: '',
    remarks: '',
  });

  const { user } = useAuth();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [expensesData, emps] = await Promise.all([
        db.expenses.toArray(),
        db.employees.toArray(),
      ]);
      setExpenses(expensesData);
      setEmployees(emps);
    } catch (err) {
      console.error('Error loading expenses:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingExpense) {
        await db.expenses.update(editingExpense.id, formData);
      } else {
        await db.expenses.add({
          ...formData,
          submittedDate: new Date().toISOString(),
          submittedBy: user?.username || 'Unknown',
        });
      }
      setShowForm(false);
      setEditingExpense(null);
      resetForm();
      loadData();
    } catch (err) {
      console.error('Error saving expense:', err);
    }
  };

  const resetForm = () => {
    setFormData({ employeeId: '', category: 'Travel', amount: '', description: '', status: 'Draft', date: '', receiptUrl: '', remarks: '' });
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData(expense);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return;
    await db.expenses.delete(id);
    loadData();
  };

  const handleStatusChange = async (id, newStatus) => {
    const updates = { status: newStatus };
    if (newStatus === 'Approved' || newStatus === 'Rejected') {
      updates.approvedBy = user?.username || 'Unknown';
      updates.approvedDate = new Date().toISOString();
    }
    await db.expenses.update(id, updates);
    loadData();
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    await db.expenses.update(rejectModal, {
      status: 'Rejected',
      approvedBy: user?.username || 'Unknown',
      approvedDate: new Date().toISOString(),
      remarks: rejectReason || 'No reason provided',
    });
    setRejectModal(null);
    setRejectReason('');
    loadData();
  };

  const getEmployeeName = (employeeId) => {
    const emp = employees.find(e => e.id === employeeId);
    return emp ? `${emp.surname}, ${emp.firstName}` : 'Unknown';
  };

  const filteredExpenses = expenses
    .filter(e => statusFilter === 'all' || e.status === statusFilter)
    .filter(e => {
      const empName = getEmployeeName(e.employeeId).toLowerCase();
      return empName.includes(searchTerm.toLowerCase()) ||
        e.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.description?.toLowerCase().includes(searchTerm.toLowerCase());
    });

  const totalAmount = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const approvedAmount = expenses.filter(e => e.status === 'Approved' || e.status === 'Reimbursed').reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const pendingAmount = expenses.filter(e => e.status === 'Submitted' || e.status === 'Under Review').reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const pendingCount = expenses.filter(e => e.status === 'Submitted' || e.status === 'Under Review').length;

  if (loading) {
    return <div className="flex items-center justify-center min-h-64"><div className="text-gray-600 text-lg">Loading...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Expense Management</h1>
        <button
          onClick={() => { setEditingExpense(null); resetForm(); setShowForm(true); }}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition flex items-center gap-2"
        >
          <Plus size={20} />
          New Expense
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">Total Expenses</p><p className="text-2xl font-bold text-gray-600">₦{totalAmount.toLocaleString()}</p></div>
            <DollarSign className="text-gray-600" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">Approved</p><p className="text-2xl font-bold text-green-600">₦{approvedAmount.toLocaleString()}</p></div>
            <Check className="text-green-600" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">Pending</p><p className="text-2xl font-bold text-yellow-600">₦{pendingAmount.toLocaleString()}</p></div>
            <Calendar className="text-yellow-600" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">Pending Count</p><p className="text-2xl font-bold text-orange-600">{pendingCount}</p></div>
            <FileText className="text-orange-600" size={24} />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Search expenses..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg">
          <option value="all">All Status</option>
          {EXPENSE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="space-y-4">
        {filteredExpenses.map(expense => (
          <div key={expense.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold">
                  {getEmployeeName(expense.employeeId).charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{getEmployeeName(expense.employeeId)}</h3>
                  <p className="text-sm text-gray-500">{expense.category} &middot; {expense.description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">₦{parseFloat(expense.amount || 0).toLocaleString()}</p>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${expense.status === 'Approved' || expense.status === 'Reimbursed' ? 'bg-green-100 text-green-700' : expense.status === 'Rejected' ? 'bg-red-100 text-red-700' : expense.status === 'Submitted' || expense.status === 'Under Review' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                  {expense.status}
                </span>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                {expense.date && <span className="flex items-center gap-1"><Calendar size={14} /> {expense.date}</span>}
                {expense.receiptUrl && <span className="flex items-center gap-1"><Receipt size={14} /> Receipt attached</span>}
                {expense.approvedBy && <span>By: {expense.approvedBy}</span>}
              </div>
              <div className="flex gap-2">
                {(expense.status === 'Submitted' || expense.status === 'Under Review') && (
                  <>
                    <button onClick={() => handleStatusChange(expense.id, 'Approved')} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-1"><Check size={14} /> Approve</button>
                    <button onClick={() => setRejectModal(expense.id)} className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm flex items-center gap-1"><ThumbsDown size={14} /> Reject</button>
                  </>
                )}
                <button onClick={() => setSelectedExpense(expense)} className="p-1 text-gray-400 hover:text-blue-600"><FileText size={16} /></button>
                <button onClick={() => handleEdit(expense)} className="p-1 text-gray-400 hover:text-yellow-600"><Edit size={16} /></button>
                <button onClick={() => handleDelete(expense.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
        {filteredExpenses.length === 0 && <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-100">No expenses found.</div>}
      </div>

      {selectedExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Expense Details</h2>
              <button onClick={() => setSelectedExpense(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-gray-500">Employee</p><p className="font-medium">{getEmployeeName(selectedExpense.employeeId)}</p></div>
                <div><p className="text-sm text-gray-500">Amount</p><p className="font-bold text-lg">₦{parseFloat(selectedExpense.amount || 0).toLocaleString()}</p></div>
              </div>
              <div><p className="text-sm text-gray-500">Category</p><p>{selectedExpense.category}</p></div>
              <div><p className="text-sm text-gray-500">Description</p><p>{selectedExpense.description}</p></div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-gray-500">Date</p><p>{selectedExpense.date || '-'}</p></div>
                <div><p className="text-sm text-gray-500">Status</p><p className="font-medium">{selectedExpense.status}</p></div>
              </div>
              {selectedExpense.receiptUrl && <div><p className="text-sm text-gray-500">Receipt</p><p className="text-blue-600 underline">{selectedExpense.receiptUrl}</p></div>}
              {selectedExpense.remarks && <div><p className="text-sm text-gray-500">Remarks</p><p>{selectedExpense.remarks}</p></div>}
              {selectedExpense.approvedBy && <div><p className="text-sm text-gray-500">Approved By</p><p>{selectedExpense.approvedBy} on {selectedExpense.approvedDate?.split('T')[0]}</p></div>}
            </div>
          </div>
        </div>
      )}

      {rejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-red-700">Reject Expense</h2>
              <button onClick={() => setRejectModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason for rejection *</label>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={3} placeholder="Provide a reason..." required />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button onClick={() => setRejectModal(null)} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleReject} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"><ThumbsDown size={16} /> Reject</button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{editingExpense ? 'Edit Expense' : 'New Expense'}</h2>
              <button onClick={() => { setShowForm(false); setEditingExpense(null); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
                <select value={formData.employeeId} onChange={(e) => setFormData(f => ({ ...f, employeeId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                  <option value="">Select Employee</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.surname}, {emp.firstName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select value={formData.category} onChange={(e) => setFormData(f => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                    {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₦) *</label>
                  <input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData(f => ({ ...f, amount: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <input type="text" value={formData.description} onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required placeholder="e.g., Flight to Lagos for client meeting" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" value={formData.date} onChange={(e) => setFormData(f => ({ ...f, date: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    {EXPENSE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Receipt URL</label>
                <input type="text" value={formData.receiptUrl} onChange={(e) => setFormData(f => ({ ...f, receiptUrl: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea value={formData.remarks} onChange={(e) => setFormData(f => ({ ...f, remarks: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={2} />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => { setShowForm(false); setEditingExpense(null); }} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">{editingExpense ? 'Update' : 'Submit'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
