import { useEffect, useState, useCallback } from 'react';
import { db } from '../db/indexedDB';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Calendar, X, Check, Clock, User, AlertTriangle, ThumbsDown } from 'lucide-react';
import { NIGERIAN_HOLIDAYS, getNextWorkingDay } from '../data/nigerianHolidays';

const LEAVE_TYPE_CONFIG = {
  Annual: { daysAllowed: 30, isPaid: true },
  Sick: { daysAllowed: 10, isPaid: true },
  Maternity: { daysAllowed: 84, isPaid: true },
  Paternity: { daysAllowed: 10, isPaid: true },
  Study: { daysAllowed: 5, isPaid: true },
  Compassionate: { daysAllowed: 5, isPaid: true },
  AWOL: { daysAllowed: 0, isPaid: false },
};

const LeaveBalanceCard = ({ employee, balances, leaveTypes }) => (
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
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center">
      {leaveTypes.map(lt => (
        <div key={lt.name} className="bg-gray-50 rounded p-2">
          <p className="text-lg font-bold text-gray-900">{balances[lt.name]?.remaining ?? lt.daysAllowed}</p>
          <p className="text-xs text-gray-500">{lt.name}</p>
        </div>
      ))}
    </div>
  </div>
);

const LeaveRequestCard = ({ request, employeeName, onApprove, onReject, onCancel }) => {
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
            {employeeName?.split(' ').map(n => n.charAt(0)).join('')}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{employeeName}</h3>
            <p className="text-sm text-gray-500">{request.leaveType} Leave</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[request.status]}`}>
          {request.status}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <Calendar size={14} />
          {request.startDate} - {request.endDate}
        </span>
        <span>({request.days} days)</span>
      </div>

      {request.reason && (
        <p className="mt-2 text-sm text-gray-600">{request.reason}</p>
      )}

      {request.rejectionReason && request.status === 'Rejected' && (
        <div className="mt-2 bg-red-50 border border-red-200 rounded p-2 text-sm text-red-700">
          <span className="font-medium">Rejection reason:</span> {request.rejectionReason}
        </div>
      )}

      {request.approvedBy && request.status === 'Approved' && (
        <p className="mt-1 text-xs text-gray-400">Approved by {request.approvedBy}</p>
      )}

      {request.status === 'Pending' && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end gap-2">
          <button
            onClick={() => onCancel(request.id)}
            className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 rounded-lg text-sm"
          >
            Cancel
          </button>
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
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('requests');
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [holidays, setHolidays] = useState([]);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [formData, setFormData] = useState({
    employeeId: '',
    leaveType: 'Annual',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [formError, setFormError] = useState('');

  const { user, hasPermission } = useAuth();
  const _isHrOrAdmin = hasPermission('canManageLeave') || user?.roles?.includes('super_admin') || user?.roles?.includes('hr_manager');

  const selectedEmployee = employees.find(e => e.id === formData.employeeId);
  const availableLeaveTypes = leaveTypes.filter(lt => {
    if (!selectedEmployee) return true;
    const sex = selectedEmployee.sex;
    if (lt.name === 'Maternity') return sex === 'Female';
    if (lt.name === 'Paternity') return sex === 'Male';
    return true;
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [emps, requests, types, holidaysData] = await Promise.all([
        db.employees.toArray(),
        db.leaveRequests.toArray(),
        db.leaveTypes.toArray(),
        db.publicHolidays.toArray(),
      ]);

      const empsMapped = emps.map(e => ({
        ...e,
        name: `${e.surname}, ${e.firstName}`,
        department: e.department,
      }));

      const requestsMapped = requests.map(r => ({
        ...r,
        employeeName: empsMapped.find(e => e.id === r.employeeId)?.name || 'Unknown',
      }));

      setEmployees(empsMapped);
      setLeaveRequests(requestsMapped);
      setLeaveTypes(types.length > 0 ? types : Object.keys(LEAVE_TYPE_CONFIG).map(name => ({
        name,
        ...LEAVE_TYPE_CONFIG[name],
      })));
      setHolidays(holidaysData);
    } catch (err) {
      console.error('Error loading leave data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const seedLeaveTypes = async () => {
    const existing = await db.leaveTypes.count();
    if (existing === 0) {
      await db.leaveTypes.bulkAdd(
        Object.entries(LEAVE_TYPE_CONFIG).map(([name, config]) => ({
          name,
          daysAllowed: config.daysAllowed,
          accrualType: 'flat',
          isPaid: config.isPaid,
          carryOverLimit: name === 'Annual' ? 10 : 0,
        }))
      );
    }
  };

  const seedHolidays = async () => {
    const existing = await db.publicHolidays.count();
    if (existing === 0) {
      await db.publicHolidays.bulkAdd(
        NIGERIAN_HOLIDAYS.map(h => ({
          date: h.date,
          name: h.name,
          scope: h.scope,
        }))
      );
      const updated = await db.publicHolidays.toArray();
      setHolidays(updated);
    }
  };

  useEffect(() => {
    seedLeaveTypes();
    seedHolidays();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

      if (days <= 0) {
        alert('End date must be after start date');
        return;
      }

      const employee = employees.find(e => e.id === formData.employeeId);
      if (employee) {
        if (formData.leaveType === 'Maternity' && employee.sex !== 'Female') {
          setFormError('Maternity leave is only available to female employees.');
          return;
        }
        if (formData.leaveType === 'Paternity' && employee.sex !== 'Male') {
          setFormError('Paternity leave is only available to male employees.');
          return;
        }
      }

      await db.leaveRequests.add({
        employeeId: formData.employeeId,
        leaveType: formData.leaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        days,
        reason: formData.reason,
        status: 'Pending',
        appliedDate: new Date().toISOString(),
      });

      setShowForm(false);
      setFormData({
        employeeId: '',
        leaveType: 'Annual',
        startDate: '',
        endDate: '',
        reason: '',
      });
      loadData();
    } catch (err) {
      console.error('Error submitting leave:', err);
      alert('Failed to submit leave request');
    }
  };

  const handleApprove = async (id) => {
    await db.leaveRequests.update(id, {
      status: 'Approved',
      approvedBy: user?.username || 'Unknown',
      approvedAt: new Date().toISOString(),
    });
    loadData();
  };

  const openRejectModal = (id) => {
    setRejectModal(id);
    setRejectReason('');
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    await db.leaveRequests.update(rejectModal, {
      status: 'Rejected',
      rejectionReason: rejectReason || 'No reason provided',
      rejectedBy: user?.username || 'Unknown',
      rejectedAt: new Date().toISOString(),
    });
    setRejectModal(null);
    setRejectReason('');
    loadData();
  };

  const handleCancel = async (id) => {
    await db.leaveRequests.update(id, { status: 'Cancelled' });
    loadData();
  };

  const filteredRequests = leaveRequests
    .filter(r => {
      if (roleFilter === 'all') return true;
      return r.status.toLowerCase() === roleFilter;
    })
    .filter(r =>
      r.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.leaveType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.status?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const pendingCount = leaveRequests.filter(r => r.status === 'Pending').length;
  const approvedCount = leaveRequests.filter(r => r.status === 'Approved').length;
  const rejectedCount = leaveRequests.filter(r => r.status === 'Rejected').length;

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
          data-testid="request-leave-btn"
        >
          <Plus size={20} />
          Request Leave
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">{leaveRequests.length}</p>
            </div>
            <Calendar className="text-green-600" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            </div>
            <Clock className="text-yellow-600" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Approved</p>
              <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
            </div>
            <Check className="text-green-600" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
            </div>
            <AlertTriangle className="text-red-600" size={24} />
          </div>
        </div>
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
        <button
          onClick={() => setActiveTab('holidays')}
          className={`pb-3 px-4 font-medium transition border-b-2 ${
            activeTab === 'holidays'
              ? 'border-green-600 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Calendar className="inline mr-2" size={18} />
          Public Holidays ({holidays.length})
        </button>
      </div>

      {activeTab === 'requests' && (
        <>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by employee, leave type, or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              aria-label="Filter by status"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRequests.map(request => (
              <LeaveRequestCard
                key={request.id}
                request={request}
                employeeName={request.employeeName}
                onApprove={handleApprove}
                onReject={openRejectModal}
                onCancel={handleCancel}
                currentUser={user}
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
          {employees.slice(0, 20).map(emp => {
            const balances = {};
            leaveTypes.forEach(lt => {
              const allocated = lt.daysAllowed || 30;
              const used = leaveRequests
                .filter(r => r.employeeId === emp.id && r.status === 'Approved' && r.leaveType === lt.name)
                .reduce((sum, r) => sum + r.days, 0);
              balances[lt.name] = { allocated, used, remaining: allocated - used };
            });
            return (
              <LeaveBalanceCard
                key={emp.id}
                employee={emp}
                balances={leaveTypes.map(lt => ({ type: lt.name, days: balances[lt.name]?.remaining ?? lt.daysAllowed }))}
                leaveTypes={leaveTypes}
              />
            );
          })}
        </div>
      )}

      {activeTab === 'holidays' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Federal Public Holidays 2026</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {holidays.map(h => (
              <div key={h.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar size={18} className="text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">{h.name}</p>
                  <p className="text-sm text-gray-500">{h.date} ({h.scope})</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {rejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-red-700">Reject Leave Request</h2>
              <button onClick={() => setRejectModal(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div>
              <label htmlFor="reject-reason" className="block text-sm font-medium text-gray-700 mb-2">Reason for rejection *</label>
              <textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                rows={3}
                placeholder="Provide a reason for rejecting this leave request..."
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setRejectModal(null)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
              >
                <ThumbsDown size={16} />
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold" data-testid="form-heading">Request Leave</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
                  <AlertTriangle size={16} />
                  {formError}
                </div>
              )}
              <div>
                <label htmlFor="employee-select" className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
                <select
                  id="employee-select"
                  value={formData.employeeId}
                  onChange={(e) => {
                    const empId = e.target.value;
                    const emp = employees.find(em => em.id === empId);
                    setFormData(f => {
                      const newLeaveType = emp && !['Annual', 'Sick', 'Study', 'Compassionate', 'AWOL'].includes(f.leaveType)
                        ? (emp.sex === 'Female' ? 'Maternity' : emp.sex === 'Male' ? 'Paternity' : 'Annual')
                        : f.leaveType;
                      return { ...f, employeeId: empId, leaveType: newLeaveType };
                    });
                    setFormError('');
                  }}
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
                <label htmlFor="leave-type-select" className="block text-sm font-medium text-gray-700 mb-1">Leave Type *</label>
                <select
                  id="leave-type-select"
                  value={availableLeaveTypes.some(lt => lt.name === formData.leaveType) ? formData.leaveType : (availableLeaveTypes[0]?.name || '')}
                  onChange={(e) => setFormData(f => ({ ...f, leaveType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {availableLeaveTypes.map(lt => (
                    <option key={lt.name} value={lt.name}>{lt.name} Leave ({lt.daysAllowed} days)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input
                    id="start-date"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                  <input
                    id="end-date"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(f => ({ ...f, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reason-textarea" className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea
                  id="reason-textarea"
                  value={formData.reason}
                  onChange={(e) => setFormData(f => ({ ...f, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Reason for leave..."
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                <p className="font-medium mb-1">Next working day after end date:</p>
                <p>{formData.endDate ? getNextWorkingDay(new Date(formData.endDate + 'T12:00:00'), holidays) : 'Set an end date to calculate'}</p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({
                      employeeId: '',
                      leaveType: 'Annual',
                      startDate: '',
                      endDate: '',
                      reason: '',
                    });
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  data-testid="cancel-form"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  data-testid="submit-request"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
