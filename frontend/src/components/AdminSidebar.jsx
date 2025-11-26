import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaChartLine, FaUsers, FaBook, FaCheckCircle, FaShieldAlt } from 'react-icons/fa';
const AdminSidebar = () => {
    const location = useLocation();
    const menuItems = [
        {
            path: '/admin',
            icon: FaHome,
            label: 'Home',
            description: 'Welcome dashboard'
        },
        {
            path: '/admin/dashboard',
            icon: FaChartLine,
            label: 'Analytics',
            description: 'Analytics overview'
        },
        {
            path: '/admin/users',
            icon: FaUsers,
            label: 'Users',
            description: 'Manage all users'
        },
        {
            path: '/admin/courses',
            icon: FaBook,
            label: 'Courses',
            description: 'Manage courses'
        },
        {
            path: '/admin/approvals',
            icon: FaCheckCircle,
            label: 'Approvals',
            description: 'Pending approvals',
            badge: true
        },
    ];
    const isActive = (path) => {
        if (path === '/admin') {
            return location.pathname === '/admin' || location.pathname === '/admin/';
        }
        return location.pathname === path;
    };
    return (<div className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-2xl z-40">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-gray-700">
        <Link to="/admin" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-500 transition-colors duration-200">
            <FaChartLine className="text-xl text-white"/>
          </div>
          <div>
            <h1 className="text-xl font-bold">EduMaster</h1>
            <p className="text-xs text-gray-400">Admin Panel</p>
          </div>
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav className="p-4 space-y-2 mt-4">
        {menuItems.map((item) => {
            const active = isActive(item.path);
            const IconComponent = item.icon;
            return (<Link key={item.path} to={item.path} className={`group relative flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${active
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
              <IconComponent className={`text-xl transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`}/>
              <div className="flex-1">
                <div className="font-semibold text-sm">{item.label}</div>
                <div className={`text-xs ${active ? 'text-blue-100' : 'text-gray-400 group-hover:text-gray-300'}`}>
                  {item.description}
                </div>
              </div>
              {active && (<div className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>)}
              {item.badge && (<span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full animate-ping"></span>)}
            </Link>);
        })}
      </nav>

      {/* Admin Info & Platform Status */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <FaShieldAlt className="text-lg text-white"/>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">Admin</p>
            <p className="text-xs text-gray-400 truncate">Administrator</p>
          </div>
        </div>
        <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-2">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-xs text-green-400 font-medium">System Active</p>
          </div>
        </div>
      </div>
    </div>);
};
export default AdminSidebar;
