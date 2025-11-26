import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FaBook, 
  FaVideo, 
  FaQuestionCircle, 
  FaChartLine,
  FaGraduationCap,
  FaSignOutAlt,
  FaHome
} from 'react-icons/fa';

const StudentSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    if (path === '/student/courses') {
      return location.pathname === '/student/courses';
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: FaHome,
      description: 'Overview'
    },
    {
      title: 'Enroll Courses',
      path: '/student/courses',
      icon: FaBook,
      description: 'Browse & enroll'
    },
    {
      title: 'Watch Lessons',
      path: '/student/watch-lessons',
      icon: FaVideo,
      description: 'Continue learning'
    },
    {
      title: 'Attempt Quizzes',
      path: '/student/attempt-quizzes',
      icon: FaQuestionCircle,
      description: 'Test your knowledge'
    },
    {
      title: 'Track Progress',
      path: '/student/track-progress',
      icon: FaChartLine,
      description: 'View statistics'
    }
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-slate-900 via-indigo-900 to-slate-900 text-white shadow-2xl z-50">
      <div className="flex flex-col h-full">
        {/* Logo/Header */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl shadow-lg group-hover:shadow-blue-500/50 transition-all duration-300 group-hover:scale-110">
              <FaGraduationCap className="text-xl text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Student</h1>
              <p className="text-xs text-slate-400">Learning Portal</p>
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
                key={item.title}
                to={item.path}
                className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  active
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/50 transform scale-105'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white hover:scale-[1.02] hover:shadow-md'
                }`}
              >
                <Icon className={`text-xl transition-all duration-300 ${active ? 'text-white scale-110' : 'text-slate-400 group-hover:text-blue-400 group-hover:scale-110'}`} />
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.title}</div>
                  <div className={`text-xs transition-colors duration-300 ${active ? 'text-blue-100' : 'text-slate-400 group-hover:text-slate-300'}`}>
                    {item.description}
                  </div>
                </div>
                {active && (
                  <div className="absolute right-2 w-2 h-2 bg-white rounded-full animate-pulse shadow-lg shadow-white/50"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700/50 space-y-3">
          {user && (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-3 mb-2 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300">
              <p className="text-xs text-slate-400 mb-1">Logged in as</p>
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-slate-300 hover:bg-slate-800/50 hover:text-white hover:scale-[1.02] active:scale-95 border border-transparent hover:border-slate-700/50"
          >
            <FaSignOutAlt className="text-xl text-slate-400 group-hover:text-red-400 transition-colors duration-300" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentSidebar;

