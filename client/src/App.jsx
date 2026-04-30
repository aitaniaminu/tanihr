import React, { useState, useEffect } from 'react';
import { db } from './db/indexedDB';
import { LayoutDashboard, Users, Calendar, LogOut, FileSpreadsheet, Menu, X } from 'lucide-react';
import EmployeeList from './pages/Employees/EmployeeList';
import EmployeeForm from './pages/Employees/EmployeeForm';
import ImportEmployees from './pages/Employees/ImportEmployees';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'import', label: 'Import CSV', icon: FileSpreadsheet },
    { id: 'leave', label: 'Leave Management', icon: Calendar },
  ];

  const renderContent = () => {
    if (selectedEmployee) {
      return (
        <EmployeeForm 
          employee={selectedEmployee} 
          onBack={() => setSelectedEmployee(null)}
        />
      );
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'employees':
        return (
          <EmployeeList 
            onSelectEmployee={setSelectedEmployee}
            onAddNew={() => setSelectedEmployee({})}
          />
        );
      case 'import':
        return <ImportEmployees />;
      case 'leave':
        return <div className="p-6"><h1 className="text-2xl font-bold">Leave Management (Coming Soon)</h1></div>;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-primary text-white transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-green-700 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-xl font-bold">TaniHR</h1>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-green-700 rounded">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id);
                  setSelectedEmployee(null);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-lg mb-1 transition-colors ${
                  currentPage === item.id ? 'bg-green-700' : 'hover:bg-green-700'
                }`}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-2 border-t border-green-700">
          <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-green-700 transition-colors">
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Offline Banner */}
        {!isOnline && (
          <div className="bg-yellow-500 text-black px-4 py-2 text-center text-sm">
            You are working offline. Changes will sync when connected.
          </div>
        )}

        {renderContent()}
      </main>
    </div>
  );
}

function Dashboard() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    approachingRetirement: 0,
    retired: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const employees = await db.employees.toArray();
    setStats({
      totalEmployees: employees.length,
      activeEmployees: employees.filter(e => e.status === 'Active').length,
      approachingRetirement: employees.filter(e => e.retirementStatus === 'Approaching').length,
      retired: employees.filter(e => e.retirementStatus === 'Retired' || e.status === 'Retired').length
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Employees" value={stats.totalEmployees} color="bg-blue-500" />
        <StatCard title="Active" value={stats.activeEmployees} color="bg-green-500" />
        <StatCard title="Approaching Retirement" value={stats.approachingRetirement} color="bg-orange-500" />
        <StatCard title="Retired" value={stats.retired} color="bg-red-500" />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
            Add New Employee
          </button>
          <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">
            Import CSV
          </button>
          <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">
            Generate Report
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color }) {
  return (
    <div className={`${color} text-white rounded-lg shadow p-6`}>
      <h3 className="text-sm opacity-90">{title}</h3>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}

export default App;
