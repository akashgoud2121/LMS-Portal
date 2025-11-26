import React from 'react';
import { useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { Link } from 'react-router-dom';
import { FaHome } from 'react-icons/fa';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();

  const getPageTitle = () => {
    if (location.pathname === '/admin/dashboard') return 'Dashboard';
    if (location.pathname === '/admin/users') return 'User Management';
    if (location.pathname === '/admin/courses') return 'Course Management';
    if (location.pathname === '/admin/approvals') return 'Pending Approvals';
    return 'Admin Panel';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="ml-64 min-h-screen">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="px-8 py-5 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{getPageTitle()}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="text-gray-500 hover:text-gray-700 p-2.5 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                title="Back to Home"
              >
                <FaHome className="text-lg" />
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

