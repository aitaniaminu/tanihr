import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../lib/supabase';
import { Plus, Search, Calendar, X, Check, Clock, Trash2, Edit, User, Filter } from 'lucide-react';

const LEAVE_TYPES = ['Annual', 'Sick', 'Maternity', 'Paternity', 'Casual', 'Study', 'Unpaid'];
const LEAVE_STATUS = ['Pending', 'Approved', 'Rejected', 'Cancelled'];

const LeaveBalanceCard = ({ employee, balances }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold">
        {employee.name?.charAt(0)}
      </div>
      <div>
        <h3 className="font-semibold text-gray-900">{employee.name}</h3>
        <p className="text-xs text-gray-500">{employee.department}</p>
      </div>
    </div>
    <div className="grid grid-cols-3 gap-2 text-center">
      {balances.map(b => (
        <div key={b.type} className="bg-gray-50 rounded p-2">
          <p className="text-lg font-bold text-gray-900">{b.days}</p>
          <p className="text-xs text-gray-500">{b.type}</p>
        </div>
      ))}
    </div>
  </div>
);

const LeaveRequestCard = ({ request, onApprove, onReject }) => {
  const statusColors = {
    Pending: 'bg-yellow-100 text-yellow-700',
    Approved: 'bg-green-100 text-green-700',
    Rejected: 'bg-red-100 text-red-700',
    Cancelled: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm">
            {request.employee_name?.split(' ').map(n => n.charAt(0)).join('')}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{request.employee_name}</h3>
            <p className="text-sm text-gray-500">{request.leave_type} Leave</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[request.status]}`}>
          {request.status}
        </span>
      </div>
      
      <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <Calendar size={14} />
          {request.start_date} - {request.end_date}
        </span>
        <span>({request.days} days)</span>
      </div>

      {request.reason && (
        <p className="mt-2 text-sm text-gray-600">{request.reason}</p>
      )}

      {request.status === 'Pending' && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end gap-2">
          <button
            onClick={() => onReject(request.id)}
            className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm"
          >
            Reject
          </button>
          <button
            onClick={() => onApprove(request.id)}
            className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
          >
            Approve
          </button>
        </div>
      )}
    </div>
  );
};

export default function LeaveManagement() {
  const [employees, setEmployees] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('requests');
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    employee_id: '',
    leave_type: 'Annual',
    start_date: '',
    end_date: '',
    reason: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [empRes, leaveRes] = await Promise.all([
        supabase.from('employees').select('id, surname, first_name, department_name'),
        supabase.from('leave_requests').select('*').order('created_at', { ascending: false }),
      ]);

      const emps = empRes.data || [];
      setEmployees(emps.map(e => ({
        ...e,
        name: `${e.surname}, ${e.first_name}`,
        department: e.department_name,
      })));

      const requests = (leaveRes.data || []).map(r => ({
        ...r,
        employee_name: emps.find(e => e.id === r.employee_id)?.name || 'Unknown',
      }));
      setLeaveRequests(requests);
    } catch (err) {
      console.error('Error loading leave data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

      await supabase.from('leave_requests').insert({
        employee_id: formData.employee_id,
        leave_type: formData.leave_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        days,
        reason: formData.reason,
        status: 'Pending',
      });

      setShowForm(false);
      setFormData({
        employee_id: '',
        leave_type: 'Annual',
        start_date: '',
        end_date: '',
        reason: '',
      });
      loadData();
    } catch (err) {
      console.error('Error submitting leave:', err);
      alert('Failed to submit leave request');
    }
  };

  const handleApprove = async (id) => {
    await supabase.from('leave_requests').update({ status: 'Approved' }).eq('id', id);
    loadData();
  };

  const handleReject = async (id) => {
    await supabase.from('leave_requests').update({ status: 'Rejected' }).eq('id', id);
    loadData();
  };

  const filteredRequests = leaveRequests.filter(r => 
    r.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.leave_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingCount = leaveRequests.filter(r => r.status === 'Pending').length;

  if (loading) {
    return <div className="flex items-center justify-center min-h-64">
      <div className="text-gray-600 text-lg">Loading...</div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Leave Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition flex items-center gap-2"
        >
          <Plus size={20} /> Request Leave
        </button>
      </div>

      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 px-4 font-medium transition border-b-2 ${
            activeTab === 'requests'
              ? 'border-green-600 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Calendar className="inline mr-2" size={18} />
          Requests ({leaveRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('balances')}
          className={`pb-3 px-4 font-medium transition border-b-2 ${
            activeTab === 'balances'
              ? 'border-green-600 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <User className="inline mr-2" size={18} />
          Balances
        </button>
      </div>

      {activeTab === 'requests' && (
        <>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRequests.map(request => (
              <LeaveRequestCard
                key={request.id}
                request={request}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </div>

          {filteredRequests.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No leave requests found.
            </div>
          )}
        </>
      )}

      {activeTab === 'balances' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {employees.slice(0, 20).map(emp => (
            <LeaveBalanceCard
              key={emp.id}
              employee={emp}
              balances={[
                { type: 'Annual', days: 21 },
                { type: 'Sick', days: 14 },
                { type: 'Casual', days: 7 },
              ]}
            />
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Request Leave</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
                <select
                  value={formData.employee_id}
                  onChange={(e) => setFormData(f => ({ ...f, employee_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type *</label>
                <select
                  value={formData.leave_type}
                  onChange={(e) => setFormData(f => ({ ...f, leave_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {LEAVE_TYPES.map(type => (
                    <option key={type} value={type}>{type} Leave</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(f => ({ ...f, start_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(f => ({ ...f, end_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData(f => ({ ...f, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Reason for leave..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Check size={18} /> Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}