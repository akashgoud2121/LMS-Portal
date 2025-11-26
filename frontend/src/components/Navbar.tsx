import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const isAdminRoute = location.pathname.startsWith('/admin');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">EduMaster</span>
            </Link>
            {/* Hide navbar links on admin/instructor/student pages - sidebars handle navigation */}
            {!isAdminRoute && !location.pathname.startsWith('/instructor') && !location.pathname.startsWith('/dashboard') && !location.pathname.includes('/lesson/') && !location.pathname.includes('/quiz/') && (
              <div className="hidden sm:ml-8 sm:flex sm:space-x-6">
                <Link
                  to="/courses"
                  className="text-gray-600 hover:text-blue-600 inline-flex items-center px-3 py-2 text-sm font-medium transition-colors duration-200"
                >
                  Courses
                </Link>
                {user && user.role === 'student' && (
                  <Link
                    to="/dashboard"
                    className="text-gray-600 hover:text-blue-600 inline-flex items-center px-3 py-2 text-sm font-medium transition-colors duration-200"
                  >
                    Dashboard
                  </Link>
                )}
              </div>
            )}
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {user ? (
              <div className="ml-3 relative">
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700 text-sm font-medium">{user.name}</span>
                  <button
                    onClick={handleLogout}
                    className="text-gray-600 hover:text-red-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex space-x-3">
                <Link
                  to="/student/login"
                  className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:bg-gray-100"
                >
                  Login
                </Link>
                <Link
                  to="/student/register"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
          <div className="sm:hidden flex items-center">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
      {menuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              to="/courses"
              className="block pl-3 pr-4 py-2 border-l-4 text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 hover:border-gray-300"
            >
              Courses
            </Link>
            {user && (
              <>
                {user.role === 'student' && (
                  <Link
                    to="/dashboard"
                    className="block pl-3 pr-4 py-2 border-l-4 text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                  >
                    My Dashboard
                  </Link>
                )}
                {user.role === 'instructor' && (
                  <Link
                    to="/instructor/dashboard"
                    className="block pl-3 pr-4 py-2 border-l-4 text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                  >
                    Instructor Dashboard
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link
                    to="/admin/dashboard"
                    className="block pl-3 pr-4 py-2 border-l-4 text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                  >
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="block w-full text-left pl-3 pr-4 py-2 border-l-4 text-base font-medium text-red-500 hover:text-red-700 hover:bg-gray-50 hover:border-red-300"
                >
                  Logout
                </button>
              </>
            )}
            {!user && (
              <Link
                to="/student/login"
                className="block pl-3 pr-4 py-2 border-l-4 text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 hover:border-gray-300"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;


