import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../db/indexedDB';
import supabase from '../lib/supabase';
import { Users, Clock, Calendar, Building2, UserPlus, Download } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [{ data: emps, count }, { data: depts }] = await Promise.all([
          supabase.from('employees').select('*', { count: 'exact' }),
          supabase.from('departments').select('name')
        ]);
        
        setEmployees(emps || []);
        setDepartments(depts || []);
        setTotalCount(count || 0);
      } catch (err) {
        console.error('Error loading dashboard stats:', err);
        setError('Failed to load dashboard statistics.');
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  const stats = useMemo(() => {
    return { 
      totalEmployees: totalCount, 
      uniqueDepartments: departments.length || 0, 
      pendingLeave: 0 
    };
  }, [totalCount, departments]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-gray-600 text-lg">Loading dashboard...</div>
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
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Dashboard</h1>
        <span className="text-sm lg:text-base text-gray-600">Welcome, {user?.username}</span>
      </div>

      {/* Stats Cards - All Active */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        <div
          onClick={() => navigate('/employees')}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/employees')}
          role="button"
          tabIndex={0}
          aria-label={`View all ${stats.totalEmployees} employees`}
          className="bg-white p-4 lg:p-6 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer transform hover:-translate-y-1 border-l-4 border-green-500"
        >
          <h3 className="text-gray-500 text-xs lg:text-sm font-medium uppercase">Total Employees</h3>
          <p className="text-2xl lg:text-3xl font-bold text-gray-900 mt-2">{stats.totalEmployees}</p>
          <p className="text-xs text-green-600 mt-2 font-medium">View All →</p>
        </div>
        <div
          role="button"
          tabIndex={0}
          aria-label="View pending leave requests"
          className="bg-white p-4 lg:p-6 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer transform hover:-translate-y-1 border-l-4 border-blue-500 opacity-60"
          title="Leave management coming soon"
        >
          <h3 className="text-gray-500 text-xs lg:text-sm font-medium uppercase">Pending Leave</h3>
          <p className="text-2xl lg:text-3xl font-bold text-gray-900 mt-2">{stats.pendingLeave}</p>
          <p className="text-xs text-blue-600 mt-2 font-medium">Coming Soon</p>
        </div>
        <div
          onClick={() => navigate('/employees')}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/employees')}
          role="button"
          tabIndex={0}
          aria-label="View active employees"
          className="bg-white p-4 lg:p-6 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer transform hover:-translate-y-1 border-l-4 border-yellow-500"
        >
          <h3 className="text-gray-500 text-xs lg:text-sm font-medium uppercase">Active Employees</h3>
          <p className="text-2xl lg:text-3xl font-bold text-gray-900 mt-2">{stats.totalEmployees}</p>
          <p className="text-xs text-yellow-600 mt-2 font-medium">Currently Active</p>
        </div>
        <div
          onClick={() => navigate('/departments')}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/departments')}
          role="button"
          tabIndex={0}
          aria-label={`View ${stats.uniqueDepartments} departments`}
          className="bg-white p-4 lg:p-6 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer transform hover:-translate-y-1 border-l-4 border-purple-500"
        >
          <h3 className="text-gray-500 text-xs lg:text-sm font-medium uppercase">Departments</h3>
          <p className="text-2xl lg:text-3xl font-bold text-gray-900 mt-2">{stats.uniqueDepartments}</p>
          <p className="text-xs text-purple-600 mt-2 font-medium">View All →</p>
        </div>
      </div>

      {/* Quick Actions - All Active */}
      <div className="bg-white rounded-xl shadow-md p-4 lg:p-6">
        <h2 className="text-lg lg:text-xl font-semibold text-gray-800 mb-4 lg:mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-6">
          <div
            onClick={() => navigate('/employees/new')}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/employees/new')}
            role="button"
            tabIndex={0}
            aria-label="Add new employee"
            className="group flex items-center p-4 lg:p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:from-green-100 hover:to-green-200 transition-all transform hover:-translate-y-1 cursor-pointer"
          >
            <div className="w-10 lg:w-14 h-10 lg:h-14 bg-green-500 rounded-full flex items-center justify-center text-white mr-3 lg:mr-5 shadow-md group-hover:scale-110 transition flex-shrink-0">
              <UserPlus className="w-5 h-5 lg:w-6 lg:h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-base lg:text-lg">Add Employee</h3>
              <p className="text-sm text-gray-600 mt-1 hidden sm:block">Create new staff record</p>
            </div>
          </div>

          <div
            onClick={() => navigate('/import')}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/import')}
            role="button"
            tabIndex={0}
            aria-label="Import employees from CSV"
            className="group flex items-center p-4 lg:p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all transform hover:-translate-y-1 cursor-pointer"
          >
            <div className="w-10 lg:w-14 h-10 lg:h-14 bg-blue-500 rounded-full flex items-center justify-center text-white mr-3 lg:mr-5 shadow-md group-hover:scale-110 transition flex-shrink-0">
              <Download className="w-5 h-5 lg:w-6 lg:h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-base lg:text-lg">Import CSV</h3>
              <p className="text-sm text-gray-600 mt-1 hidden sm:block">Bulk upload employees</p>
            </div>
          </div>

          <div
            onClick={() => navigate('/employees')}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/employees')}
            role="button"
            tabIndex={0}
            aria-label="View and manage employees"
            className="group flex items-center p-4 lg:p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all transform hover:-translate-y-1 cursor-pointer"
          >
            <div className="w-10 lg:w-14 h-10 lg:h-14 bg-purple-500 rounded-full flex items-center justify-center text-white mr-3 lg:mr-5 shadow-md group-hover:scale-110 transition flex-shrink-0">
              <Users className="w-5 h-5 lg:w-6 lg:h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-base lg:text-lg">View Employees</h3>
              <p className="text-sm text-gray-600 mt-1 hidden sm:block">Manage staff records</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
