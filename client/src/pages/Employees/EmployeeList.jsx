import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../db/indexedDB';
import supabase from '../../lib/supabase';
import { 
  ChevronUp, ChevronDown, Pencil, Trash2, Eye, 
  LayoutGrid, List, Users, Filter, Star, Phone, Mail,
  Briefcase, Building2, MapPin, Calendar
} from 'lucide-react';

const PAGE_SIZE = 20;
const VIEWS = { KANBAN: 'kanban', LIST: 'list', GRID: 'grid' };

const EmployeeCard = ({ employee, onView, onEdit, onDelete }) => {
  const initials = `${employee.surname?.charAt(0) || ''}${employee.first_name?.charAt(0) || ''}`;
  const statusColors = {
    Active: 'bg-green-100 text-green-700',
    Suspended: 'bg-yellow-100 text-yellow-700',
    Retired: 'bg-gray-100 text-gray-700',
    Resigned: 'bg-red-100 text-red-700',
  };

  return (
    <div 
      className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onView(employee.id)}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {employee.avatar_url ? (
            <img 
              src={employee.avatar_url} 
              alt={initials}
              className="w-14 h-14 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-100 to-green-200 text-green-700 flex items-center justify-center text-lg font-bold flex-shrink-0">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {employee.surname}, {employee.first_name}
            </h3>
            <p className="text-sm text-gray-500 truncate">{employee.rank_name}</p>
            <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[employee.status] || statusColors.Active}`}>
              {employee.status || 'Active'}
            </span>
          </div>
        </div>
        
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Building2 size={14} className="flex-shrink-0" />
            <span className="truncate">{employee.department_name || '-'}</span>
          </div>
          {employee.work_email && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Mail size={14} className="flex-shrink-0" />
              <span className="truncate">{employee.work_email}</span>
            </div>
          )}
          {employee.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Phone size={14} className="flex-shrink-0" />
              <span className="truncate">{employee.phone}</span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onView(employee.id)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
            title="View"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => onEdit(employee.id)}
            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
            title="Edit"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => onDelete(employee)}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

const EmployeeGridCard = ({ employee, onView, onEdit, onDelete }) => {
  const initials = `${employee.surname?.charAt(0) || ''}${employee.first_name?.charAt(0) || ''}`;
  
  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow p-4 cursor-pointer"
      onClick={() => onView(employee.id)}
    >
      <div className="text-center">
        {employee.avatar_url ? (
          <img 
            src={employee.avatar_url} 
            alt={initials}
            className="w-16 h-16 rounded-full object-cover mx-auto mb-3"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-100 to-green-200 text-green-700 flex items-center justify-center text-xl font-bold mx-auto mb-3">
            {initials}
          </div>
        )}
        <h3 className="font-semibold text-gray-900 text-sm truncate">
          {employee.surname}, {employee.first_name}
        </h3>
        <p className="text-xs text-gray-500 truncate">{employee.rank_name}</p>
        <p className="text-xs text-gray-400 truncate mt-1">{employee.department_name}</p>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-center gap-3" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => onEdit(employee.id)} className="text-green-600 hover:bg-green-50 p-1.5 rounded-lg" title="Edit">
          <Pencil size={14} />
        </button>
        <button onClick={() => onDelete(employee)} className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg" title="Delete">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

export default function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortField, setSortField] = useState('surname');
  const [sortDir, setSortDir] = useState('asc');
  const [filters, setFilters] = useState({
    department: '',
    status: '',
    location: '',
  });
  const [page, setPage] = useState(1);
  const [view, setView] = useState(VIEWS.KANBAN);
  const [groupBy, setGroupBy] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const navigate = useNavigate();

  const loadPage = async (pageNum = 1) => {
    try {
      setLoading(true);
      const from = (pageNum - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      
      let query = supabase
        .from('employees')
        .select('*', { count: 'exact' })
        .order(sortField, { ascending: sortDir === 'asc' });

      if (filters.department) {
        query = query.eq('department_name', filters.department);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.location) {
        query = query.eq('location', filters.location);
      }
      if (searchTerm) {
        const term = `%${searchTerm}%`;
        query = query.or(`surname.ilike.${term},first_name.ilike.${term},file_number.ilike.${term},department_name.ilike.${term}`);
      }

      const { data, count } = await query.range(from, to);
      
      if (data) {
        setEmployees(data || []);
        setTotalCount(count || 0);
      }
    } catch (err) {
      console.error('Error loading employees:', err);
      setError('Failed to load employee data.');
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    const { data } = await supabase.from('departments').select('name');
    setDepartments(data?.map(d => d.name) || []);
  };

  useEffect(() => {
    loadDepartments();
    loadPage(page);
  }, []);

  useEffect(() => {
    loadPage(1);
    setPage(1);
  }, [filters, sortField, sortDir]);

  const handleSearch = async () => {
    await loadPage(1);
    setPage(1);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const handleDelete = async (emp) => {
    try {
      await db.employees.delete(emp.id);
      setEmployees((prev) => prev.filter((e) => e.id !== emp.id));
      setDeleteConfirm(null);
      setTotalCount((c) => c - 1);
    } catch (err) {
      console.error('Error deleting employee:', err);
      alert('Failed to delete employee.');
    }
  };

  const groupedEmployees = useMemo(() => {
    if (!groupBy || !employees.length) return null;
    
    const groups = {};
    employees.forEach(emp => {
      const key = emp[groupBy] || 'Unassigned';
      if (!groups[key]) groups[key] = [];
      groups[key].push(emp);
    });
    return groups;
  }, [employees, groupBy]);

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

  if (loading && employees.length === 0) {
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
        <button onClick={() => loadPage()} className="mt-2 text-red-600 underline">
          Refresh page
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Employees</h1>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView(VIEWS.KANBAN)}
              className={`p-2 rounded-md transition ${view === VIEWS.KANBAN ? 'bg-white shadow text-green-600' : 'text-gray-500'}`}
              title="Kanban View"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setView(VIEWS.GRID)}
              className={`p-2 rounded-md transition ${view === VIEWS.GRID ? 'bg-white shadow text-green-600' : 'text-gray-500'}`}
              title="Grid View"
            >
              <Users size={18} />
            </button>
            <button
              onClick={() => setView(VIEWS.LIST)}
              className={`p-2 rounded-md transition ${view === VIEWS.LIST ? 'bg-white shadow text-green-600' : 'text-gray-500'}`}
              title="List View"
            >
              <List size={18} />
            </button>
          </div>
          <button
            onClick={() => navigate('/employees/new')}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition"
          >
            + Add Employee
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              placeholder="Search by name, file number, department..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Search
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${showFilters ? 'bg-green-100 text-green-700' : 'border border-gray-300 text-gray-600 hover:bg-gray-100'}`}
            >
              <Filter size={16} />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Department</label>
                <select
                  value={filters.department}
                  onChange={(e) => setFilters(f => ({ ...f, department: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">All Departments</option>
                  {departments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Retired">Retired</option>
                  <option value="Resigned">Resigned</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Location</label>
                <select
                  value={filters.location}
                  onChange={(e) => setFilters(f => ({ ...f, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">All Locations</option>
                  <option value="Headquarters (Kano)">Headquarters (Kano)</option>
                  <option value="Abuja Office">Abuja Office</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Group By</label>
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">No Grouping</option>
                  <option value="department_name">Department</option>
                  <option value="status">Status</option>
                  <option value="location">Location</option>
                  <option value="rank_name">Rank</option>
                </select>
              </div>
            </div>
          )}
          
          {(searchTerm || filters.department || filters.status || filters.location) && (
            <p className="text-sm text-gray-500 mt-2">
              Showing {totalCount} employees
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilters({ department: '', status: '', location: '' });
                  loadPage(1);
                }}
                className="ml-2 text-blue-600 hover:underline"
              >
                Clear filters
              </button>
            </p>
          )}
        </div>

        {view === VIEWS.KANBAN && !groupBy && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {employees.map(emp => (
              <EmployeeCard
                key={emp.id}
                employee={emp}
                onView={(id) => navigate(`/employees/${id}`)}
                onEdit={(id) => navigate(`/employees/edit/${id}`)}
                onDelete={setDeleteConfirm}
              />
            ))}
          </div>
        )}

        {view === VIEWS.KANBAN && groupBy && groupedEmployees && (
          <div className="p-4 space-y-6">
            {Object.entries(groupedEmployees).map(([group, emps]) => (
              <div key={group}>
                <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span>{group}</span>
                  <span className="text-sm font-normal text-gray-500">({emps.length})</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {emps.map(emp => (
                    <EmployeeCard
                      key={emp.id}
                      employee={emp}
                      onView={(id) => navigate(`/employees/${id}`)}
                      onEdit={(id) => navigate(`/employees/edit/${id}`)}
                      onDelete={setDeleteConfirm}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {view === VIEWS.GRID && (
          <div className="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {employees.map(emp => (
              <EmployeeGridCard
                key={emp.id}
                employee={emp}
                onView={(id) => navigate(`/employees/${id}`)}
                onEdit={(id) => navigate(`/employees/edit/${id}`)}
                onDelete={setDeleteConfirm}
              />
            ))}
          </div>
        )}

        {view === VIEWS.LIST && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <SortHeader field="file_number">File No</SortHeader>
                  <SortHeader field="surname">Name</SortHeader>
                  <SortHeader field="department_name">Department</SortHeader>
                  <SortHeader field="rank_name">Rank</SortHeader>
                  <SortHeader field="status">Status</SortHeader>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees.map(emp => (
                  <tr key={emp.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{emp.file_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {emp.avatar_url ? (
                          <img src={emp.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">
                            {emp.surname?.charAt(0)}{emp.first_name?.charAt(0)}
                          </div>
                        )}
                        <span className="text-sm text-gray-900">
                          {emp.surname}, {emp.first_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.department_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.rank_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        emp.status === 'Active' ? 'bg-green-100 text-green-700' :
                        emp.status === 'Suspended' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button onClick={() => navigate(`/employees/${emp.id}`)} className="text-blue-600 hover:text-blue-900">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => navigate(`/employees/edit/${emp.id}`)} className="text-green-600 hover:text-green-900">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => setDeleteConfirm(emp)} className="text-red-600 hover:text-red-900">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {employees.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            {searchTerm || filters.department || filters.status || filters.location
              ? 'No employees match your filters.'
              : 'No employees found. Import CSV or add manually.'}
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Page {page} of {totalPages} ({totalCount} records)
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(1)} disabled={page === 1} className="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-gray-100">
                First
              </button>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-gray-100">
                Previous
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-gray-100">
                Next
              </button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-gray-100">
                Last
              </button>
            </div>
          </div>
        )}
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete Employee</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete{' '}
              <span className="font-medium">
                {deleteConfirm.surname}, {deleteConfirm.first_name}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}