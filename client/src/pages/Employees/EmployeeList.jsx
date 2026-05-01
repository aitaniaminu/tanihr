import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../../db/indexedDB';
import { ChevronUp, ChevronDown, Pencil, Trash2, Eye } from 'lucide-react';

const PAGE_SIZE = 20;

export default function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortField, setSortField] = useState('surname');
  const [sortDir, setSortDir] = useState('asc');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const filter = searchParams.get('filter');
    if (filter === 'retiring-soon') {
      setFilterStatus('retiring-soon');
    }
  }, [searchParams]);

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const all = await db.employees.toArray();
        setEmployees(all);
      } catch (err) {
        console.error('Error loading employees:', err);
        setError('Failed to load employee data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };
    loadEmployees();
  }, []);

  const departments = useMemo(() => {
    const depts = new Set(employees.map((e) => e.department).filter(Boolean));
    return [...depts].sort();
  }, [employees]);

  const filteredAndSorted = useMemo(() => {
    let result = [...employees];

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (emp) =>
          emp.surname?.toLowerCase().includes(term) ||
          emp.firstName?.toLowerCase().includes(term) ||
          emp.fileNumber?.toLowerCase().includes(term) ||
          emp.department?.toLowerCase().includes(term)
      );
    }

    // Department filter
    if (filterDept) {
      result = result.filter((emp) => emp.department === filterDept);
    }

    // Status filter
    if (filterStatus === 'retiring-soon') {
      const now = new Date();
      result = result.filter((emp) => {
        if (!emp.retirementDate) return false;
        const ret = new Date(emp.retirementDate);
        if (ret <= now) return false;
        const months = (ret.getFullYear() - now.getFullYear()) * 12 + (ret.getMonth() - now.getMonth());
        return months > 0 && months <= 12;
      });
    } else if (filterStatus === 'active') {
      const now = new Date();
      result = result.filter((emp) => !emp.retirementDate || new Date(emp.retirementDate) > now);
    } else if (filterStatus === 'retired') {
      const now = new Date();
      result = result.filter((emp) => emp.retirementDate && new Date(emp.retirementDate) <= now);
    }

    // Sort
    result.sort((a, b) => {
      const aVal = (a[sortField] || '').toString().toLowerCase();
      const bVal = (b[sortField] || '').toString().toLowerCase();
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [employees, searchTerm, filterDept, filterStatus, sortField, sortDir]);

  const totalPages = Math.ceil(filteredAndSorted.length / PAGE_SIZE);
  const paginated = filteredAndSorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterDept, filterStatus]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const getRetirementStatus = (emp) => {
    if (!emp.retirementDate) return { label: 'Active', color: 'bg-green-100 text-green-800' };
    const months = Math.ceil((new Date(emp.retirementDate) - new Date()) / (1000 * 60 * 60 * 24 * 30));
    if (months <= 0) return { label: 'Retired', color: 'bg-red-100 text-red-800' };
    if (months <= 12) return { label: `Approaching (${months}m)`, color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Active', color: 'bg-green-100 text-green-800' };
  };

  const handleDelete = async (id) => {
    try {
      await db.employees.delete(id);
      setEmployees((prev) => prev.filter((e) => e.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting employee:', err);
      alert('Failed to delete employee. Please try again.');
    }
  };

  const SortHeader = ({ field, children }) => (
    <th
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          <span className="ml-1">{sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
        )}
      </div>
    </th>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-gray-600 text-lg">Loading employees...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 p-4">
        <p className="text-red-700">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-2 text-red-600 underline">
          Refresh page
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Employees</h1>
        <button
          onClick={() => navigate('/employees/new')}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition"
        >
          + Add Employee
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              placeholder="Search by name, file number, department..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search employees"
            />
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              aria-label="Filter by department"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="retiring-soon">Retiring Soon</option>
              <option value="retired">Retired</option>
            </select>
          </div>
          {(searchTerm || filterDept || filterStatus) && (
            <p className="text-sm text-gray-500 mt-2">
              Showing {filteredAndSorted.length} of {employees.length} employees
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterDept('');
                  setFilterStatus('');
                }}
                className="ml-2 text-blue-600 hover:underline"
              >
                Clear filters
              </button>
            </p>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <SortHeader field="fileNumber">File No</SortHeader>
                <SortHeader field="surname">Name</SortHeader>
                <SortHeader field="department">Department</SortHeader>
                <SortHeader field="rank">Rank</SortHeader>
                <SortHeader field="retirementDate">Status</SortHeader>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginated.map((emp) => {
                const status = getRetirementStatus(emp);
                return (
                  <tr key={emp.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{emp.fileNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-3">
                        {emp.avatar ? (
                          <img src={emp.avatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {emp.surname?.charAt(0)}
                            {emp.firstName?.charAt(0)}
                          </div>
                        )}
                        <span>
                          {emp.surname}, {emp.firstName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.rank}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button
                        onClick={() => navigate(`/employees/${emp.id}`)}
                        className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                        title="View details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => navigate(`/employees/edit/${emp.id}`)}
                        className="text-green-600 hover:text-green-900 inline-flex items-center gap-1"
                        title="Edit employee"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(emp)}
                        className="text-red-600 hover:text-red-900 inline-flex items-center gap-1"
                        title="Delete employee"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredAndSorted.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              {searchTerm || filterDept || filterStatus
                ? 'No employees match your filters.'
                : 'No employees found. Import CSV or add manually.'}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Page {page} of {totalPages} ({filteredAndSorted.length} records)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-gray-100"
              >
                First
              </button>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-gray-100"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-gray-100"
              >
                Next
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-gray-100"
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete Employee</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete{' '}
              <span className="font-medium">
                {deleteConfirm.surname}, {deleteConfirm.firstName}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
