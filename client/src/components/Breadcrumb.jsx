import { Link, useLocation } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';

const BREADCRUMB_MAP = {
  '/dashboard': 'Dashboard',
  '/employees': 'Employees',
  '/employees/new': 'Add Employee',
  '/import': 'Import CSV',
};

export default function Breadcrumb() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const segments = [{ label: 'Home', path: '/dashboard', icon: true }];

  pathnames.forEach((segment, index) => {
    const path = `/${pathnames.slice(0, index + 1).join('/')}`;
    const isEdit = segment === 'edit' && pathnames[index + 1];
    const isEmployeeId = /^\d+$/.test(segment);

    if (isEdit) return; // Skip 'edit' segment, handled below
    if (isEmployeeId) {
      const editIndex = pathnames.indexOf('edit', index - 1);
      if (editIndex >= 0) {
        segments.push({ label: `Edit Employee #${segment}`, path });
      } else {
        segments.push({ label: `Employee #${segment}`, path });
      }
      return;
    }

    const label = BREADCRUMB_MAP[path] || segment.charAt(0).toUpperCase() + segment.slice(1);
    segments.push({ label, path });
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-gray-500 mb-4">
      {segments.map((seg, i) => (
        <div key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight size={14} className="text-gray-400" />}
          {i === segments.length - 1 ? (
            <span className="text-gray-800 font-medium">{seg.icon ? <Home size={14} /> : seg.label}</span>
          ) : (
            <Link to={seg.path} className="hover:text-green-600 transition">
              {seg.icon ? <Home size={14} /> : seg.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
