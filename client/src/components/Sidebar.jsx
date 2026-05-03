import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, Download, Building2, X, Network, FileText, RefreshCw, BarChart3, Award, Calendar } from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/employees', label: 'Employees', icon: Users },
  { path: '/departments', label: 'Departments', icon: Building2 },
  { path: '/org-chart', label: 'Org Chart', icon: Network },
  { path: '/documents', label: 'Document Vault', icon: FileText },
  { path: '/skills', label: 'Skills', icon: Award },
  { path: '/leave', label: 'Leave', icon: Calendar },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/sync', label: 'Sync Data', icon: RefreshCw },
  { path: '/import', label: 'Import CSV', icon: Download },
];

export default function Sidebar({ isOpen, toggle }) {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={toggle}
          onKeyDown={(e) => e.key === 'Escape' && toggle()}
          role="button"
          tabIndex={0}
          aria-label="Close sidebar overlay"
        ></div>
      )}
      <aside
        className={`fixed top-0 left-0 z-30 h-screen w-64 bg-green-800 text-white transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="flex items-center justify-between p-6 border-b border-green-700">
          <h1 className="text-2xl font-bold">TaniHR</h1>
          <button onClick={toggle} className="lg:hidden text-white" aria-label="Close sidebar">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="mt-6 px-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 rounded-lg transition ${location.pathname === item.path ? 'bg-green-700' : 'hover:bg-green-700'}`}
              onClick={() => window.innerWidth < 1024 && toggle()}
            >
              <span className="text-xl mr-3" aria-hidden="true">
                <item.icon className="w-5 h-5" />
              </span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t border-green-700">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center font-bold">
              {user?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{user?.username || user?.email}</p>
              <p className="text-xs text-green-300 capitalize">{user?.role || 'Employee'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full text-left px-4 py-2 text-sm text-red-300 hover:text-red-100 hover:bg-green-700 rounded"
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
