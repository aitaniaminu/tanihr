import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, Download, Building2, X, Network, FileText, RefreshCw, BarChart3, Award, Calendar, Briefcase, Settings, Shield, User, Clock, Clock3, Lock, ChevronDown, ChevronRight, UserPlus } from 'lucide-react';

const mainNavItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: null },
  { path: '/employees', label: 'Employees', icon: Users, permission: 'canViewAllEmployees' },
  { path: '/departments', label: 'Departments', icon: Building2, permission: null },
  { path: '/attendance', label: 'Attendance', icon: Clock3, permission: null },
  { path: '/leave', label: 'Leave', icon: Calendar, permission: 'canManageLeave' },
  { path: '/recruitment', label: 'Recruitment', icon: UserPlus, permission: null },
  { path: '/reports', label: 'Reports', icon: BarChart3, permission: 'canViewReports' },
  { path: '/my-profile', label: 'My Profile', icon: User, permission: null },
];

const userManagementSubItems = [
  { path: '/users', label: 'User Management', icon: Shield, permission: 'canManageUsers' },
  { path: '/change-password', label: 'Change Password', icon: Lock, permission: null },
];

const settingsSubItems = [
  { path: '/settings', label: 'Settings', icon: Settings, permission: 'canManageSettings' },
  { path: '/org-chart', label: 'Org Chart', icon: Network, permission: null },
  { path: '/documents', label: 'Document Vault', icon: FileText, permission: 'canViewAllEmployees' },
  { path: '/skills', label: 'Skills', icon: Award, permission: 'canManageTraining' },
  { path: '/contracts', label: 'Contracts', icon: Briefcase, permission: 'canViewAllEmployees' },
  { path: '/login-history', label: 'Login History', icon: Clock, permission: 'canManageUsers' },
  { path: '/sync', label: 'Sync Database', icon: RefreshCw, permission: 'canManageUsers' },
  { path: '/import', label: 'Import CSV', icon: Download, permission: 'canManageUsers' },
];

export default function Sidebar({ isOpen, toggle }) {
  const location = useLocation();
  const { user, logout, hasPermission } = useAuth();
  const [settingsExpanded, setSettingsExpanded] = useState(true);
  const [userManagementExpanded, setUserManagementExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const visibleMainItems = mainNavItems.filter(item => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  const visibleUserManagementItems = userManagementSubItems.filter(item => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  const visibleSettingsItems = settingsSubItems.filter(item => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  const hasUserManagementAccess = visibleUserManagementItems.length > 0;
  const hasSettingsAccess = visibleSettingsItems.length > 0;

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
        className={`fixed top-0 left-0 z-30 h-screen w-64 bg-green-800 text-white transition-transform overflow-y-auto ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="flex items-center justify-between p-4 lg:p-6 border-b border-green-700">
          <h1 className="text-xl lg:text-2xl font-bold">TaniHR</h1>
          <button onClick={toggle} className="lg:hidden text-white p-2 -mr-2" aria-label="Close sidebar">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="mt-2 lg:mt-6 px-2 lg:px-4 space-y-1">
          {visibleMainItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg transition ${location.pathname === item.path ? 'bg-green-700' : 'hover:bg-green-700'}`}
              onClick={() => window.innerWidth < 1024 && toggle()}
            >
              <span className="lg:text-xl mr-2 lg:mr-3 flex-shrink-0">
                <item.icon className="w-5 h-5" />
              </span>
              <span className="text-sm lg:text-base truncate">{item.label}</span>
            </Link>
          ))}

          {hasUserManagementAccess && (
            <div className="mt-2 lg:mt-4 pt-2 lg:pt-4 border-t border-green-700">
              <button
                onClick={() => setUserManagementExpanded(!userManagementExpanded)}
                className="flex items-center w-full px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg transition hover:bg-green-700"
              >
                <span className="lg:text-xl mr-2 lg:mr-3 flex-shrink-0">
                  {userManagementExpanded ? <ChevronDown className="w-4 h-4 lg:w-5 lg:h-5" /> : <ChevronRight className="w-4 h-4 lg:w-5 lg:h-5" />}
                </span>
                <span className="text-sm lg:text-base font-semibold truncate">User Management</span>
              </button>
              
              {userManagementExpanded && (
                <div className="ml-2 lg:ml-4 mt-1 space-y-1">
                  {visibleUserManagementItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center px-3 lg:px-4 py-2 lg:py-2.5 rounded-lg transition text-sm ${location.pathname === item.path ? 'bg-green-600' : 'hover:bg-green-600'}`}
                      onClick={() => window.innerWidth < 1024 && toggle()}
                    >
                      <span className="mr-2 lg:mr-3 flex-shrink-0">
                        <item.icon className="w-4 h-4" />
                      </span>
                      <span className="truncate">{item.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {hasSettingsAccess && (
            <div className="mt-2 lg:mt-4 pt-2 lg:pt-4 border-t border-green-700">
              <button
                onClick={() => setSettingsExpanded(!settingsExpanded)}
                className="flex items-center w-full px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg transition hover:bg-green-700"
              >
                <span className="lg:text-xl mr-2 lg:mr-3 flex-shrink-0">
                  {settingsExpanded ? <ChevronDown className="w-4 h-4 lg:w-5 lg:h-5" /> : <ChevronRight className="w-4 h-4 lg:w-5 lg:h-5" />}
                </span>
                <span className="text-sm lg:text-base font-semibold truncate">Settings</span>
              </button>
              
              {settingsExpanded && (
                <div className="ml-2 lg:ml-4 mt-1 space-y-1">
                  {visibleSettingsItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center px-3 lg:px-4 py-2 lg:py-2.5 rounded-lg transition text-sm ${location.pathname === item.path ? 'bg-green-600' : 'hover:bg-green-600'}`}
                      onClick={() => window.innerWidth < 1024 && toggle()}
                    >
                      <span className="mr-2 lg:mr-3 flex-shrink-0">
                        <item.icon className="w-4 h-4" />
                      </span>
                      <span className="truncate">{item.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>
        <div className="sticky bottom-0 w-full p-3 lg:p-4 border-t border-green-700 bg-green-800">
          <div className="flex items-center mb-2 lg:mb-4">
            <div className="w-8 lg:w-10 h-8 lg:h-10 rounded-full bg-green-600 flex items-center justify-center font-bold text-sm lg:text-base">
              {user?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="ml-2 lg:ml-3 min-w-0">
              <p className="text-sm font-medium truncate">{user?.username || user?.email}</p>
              <p className="text-xs text-green-300 capitalize truncate">{user?.role || 'Employee'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full text-left px-3 lg:px-4 py-2 text-sm text-red-300 hover:text-red-100 hover:bg-green-700 rounded"
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
