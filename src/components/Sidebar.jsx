import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/employees', label: 'Employees', icon: '👥' },
  { path: '/import', label: 'Import CSV', icon: '📥' },
];

export default function Sidebar({ isOpen, toggle }) {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden" onClick={toggle}></div>}
      
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-30 h-screen w-64 bg-green-800 text-white transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex items-center justify-between p-6 border-b border-green-700">
          <h1 className="text-2xl font-bold">TaniHR</h1>
          <button onClick={toggle} className="lg:hidden text-white hover:text-green-200">✕</button>
        </div>
        
        <nav className="mt-6 px-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                location.pathname === item.path
                  ? 'bg-green-700 text-white'
                  : 'text-green-100 hover:bg-green-700 hover:text-white'
              }`}
              onClick={() => window.innerWidth < 1024 && toggle()}
            >
              <span className="text-xl mr-3">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-green-700">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-lg font-bold">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{user?.fullName || user?.username}</p>
              <p className="text-xs text-green-300 capitalize">{user?.role}</p>
            </div>
          </div>
          <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-red-300 hover:text-red-100 hover:bg-green-700 rounded transition">
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
