import React, { useState, useEffect } from 'react';
import { db } from '../../db/indexedDB';
import { Search, Filter, Plus, Edit2, Eye, Archive } from 'lucide-react';
import { formatDDMMYYYY, calculateMonthsToRetirement, getRetirementStatus } from '../../utils/dateHelpers';

const EmployeeList = ({ onSelectEmployee, onAddNew }) => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [departments, setDepartments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchTerm, filterDepartment, filterStatus]);

  const loadData = async () => {
    const emps = await db.employees.toArray();
    const depts = await db.departments.toArray();
    setEmployees(emps);
    setDepartments(depts);
  };

  const filterEmployees = () => {
    let filtered = [...employees];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(e =>
        e.surname?.toLowerCase().includes(term) ||
        e.firstName?.toLowerCase().includes(term) ||
        e.fileNumber?.toLowerCase().includes(term) ||
        e.department?.toLowerCase().includes(term) ||
        e.rank?.toLowerCase().includes(term)
      );
    }

    if (filterDepartment) {
      filtered = filtered.filter(e => e.department === filterDepartment);
    }

    if (filterStatus) {
      filtered = filtered.filter(e => e.status === filterStatus);
    }

    setFilteredEmployees(filtered);
    setCurrentPage(1);
  };

  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

  const getRetirementBadge = (employee) => {
    const status = employee.retirementStatus || getRetirementStatus(employee.retirementDate);
    const months = calculateMonthsToRetirement(employee.retirementDate);

    if (status === 'Retired') {
      return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">🔴 Retired</span>;
    }
    if (status === 'Approaching') {
      return <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">🟠 {months} months</span>;
    }
    return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">🟢 Active</span>;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Employees</h1>
        <button
          onClick={onAddNew}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, file number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.name}>{dept.name}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
            <option value="Retired">Retired</option>
            <option value="Resigned">Resigned</option>
          </select>

          <div className="text-gray-600 text-sm pt-2">
            Showing {filteredEmployees.length} of {employees.length} employees
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">File Number</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Department</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Rank</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Present Appointment</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Retirement</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedEmployees.map((employee) => (
              <tr key={employee.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">{employee.fileNumber}</td>
                <td className="px-4 py-3 text-sm">{employee.surname}, {employee.firstName}</td>
                <td className="px-4 py-3 text-sm">{employee.department}</td>
                <td className="px-4 py-3 text-sm">{employee.rank}</td>
                <td className="px-4 py-3 text-sm">{formatDDMMYYYY(employee.dateOfPresentAppointment)}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    employee.status === 'Active' ? 'bg-green-100 text-green-800' :
                    employee.status === 'Suspended' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {employee.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">{getRetirementBadge(employee)}</td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onSelectEmployee(employee)}
                      className="text-blue-600 hover:text-blue-800"
                      title="View/Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className="text-gray-600 hover:text-gray-800"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredEmployees.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No employees found. Add your first employee or import from CSV.
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;
