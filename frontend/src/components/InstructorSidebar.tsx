import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FaBook, 
  FaVideo, 
  FaQuestionCircle, 
  FaHome,
  FaGraduationCap,
  FaSignOutAlt
} from 'react-icons/fa';

const InstructorSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    {
      title: 'Dashboard',
      path: '/instructor/dashboard',
      icon: FaHome
    },
    {
      title: 'Courses',
      path: '/instructor/courses',
      icon: FaBook
    },
    {
      title: 'Videos/Materials',
      path: '/instructor/materials',
      icon: FaVideo
    },
    {
      title: 'Quizzes',
      path: '/instructor/quizzes',
      icon: FaQuestionCircle
    }
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-indigo-900 to-purple-900 text-white shadow-2xl z-50">
      <div className="flex flex-col h-full">
        {/* Logo/Header */}
        <div className="p-6 border-b border-indigo-800">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 p-2 rounded-lg">
              <FaGraduationCap className="text-2xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Instructor</h1>
              <p className="text-xs text-indigo-200">Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  active
                    ? 'bg-white bg-opacity-20 text-white shadow-lg transform scale-105'
                    : 'text-indigo-200 hover:bg-white hover:bg-opacity-10 hover:text-white'
                }`}
              >
                <Icon className={`text-xl ${active ? 'text-white' : 'text-indigo-300'}`} />
                <span className="font-medium">{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-indigo-800 space-y-3">
          {user && (
            <div className="bg-white bg-opacity-10 rounded-lg p-3 mb-2">
              <p className="text-xs text-indigo-200 mb-1">Logged in as</p>
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-indigo-200 hover:bg-white hover:bg-opacity-10 hover:text-white"
          >
            <FaSignOutAlt className="text-xl text-indigo-300" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstructorSidebar;

