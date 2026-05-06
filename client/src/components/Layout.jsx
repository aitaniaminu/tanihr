import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Breadcrumb from './Breadcrumb';
import { Menu } from 'lucide-react';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} toggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className={`transition-all ${isMobile ? '' : 'lg:ml-64'}`}>
        <header className="bg-white shadow-sm lg:hidden sticky top-0 z-10">
          <div className="flex items-center justify-between px-4 py-3">
            <button onClick={() => setSidebarOpen(true)} className="text-green-700 p-2 -ml-2">
              <Menu size={24} />
            </button>
            <h1 className="text-lg font-bold text-green-700">TaniHR</h1>
            <div className="w-10"></div>
          </div>
        </header>
        <main className="p-3 sm:p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            <Breadcrumb />
            <div className="mt-3 sm:mt-4">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
