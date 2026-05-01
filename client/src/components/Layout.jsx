import { useState } from 'react';
import Sidebar from './Sidebar';
import Breadcrumb from './Breadcrumb';
import { Menu } from 'lucide-react';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} toggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="lg:ml-64 transition-all">
        <header className="bg-white shadow-sm lg:hidden">
          <div className="flex items-center justify-between px-4 py-4">
            <button onClick={() => setSidebarOpen(true)} className="text-2xl">
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-bold text-green-700">TaniHR</h1>
            <div className="w-8"></div>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">
          <Breadcrumb />
          {children}
        </main>
      </div>
    </div>
  );
}
