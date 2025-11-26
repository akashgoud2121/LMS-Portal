import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { useAuth } from '../context/AuthContext';
import { 
  FaShieldAlt,
  FaArrowRight,
  FaChartLine
} from 'react-icons/fa';

const AdminHome: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getDisplayName = () => {
    if (!user?.name) return 'Admin';
    // If name is generic like "User" or "Admin User", just return "Admin"
    const name = user.name.trim();
    if (name.toLowerCase() === 'user' || name.toLowerCase() === 'admin user') {
      return 'Admin';
    }
    return name;
  };

  const handleGoToDashboard = () => {
    navigate('/admin/dashboard');
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center max-w-2xl">
          {/* Welcome Icon */}
          <div className="mb-8 flex justify-center">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-2xl">
              <FaShieldAlt className="text-6xl text-white" />
            </div>
          </div>

          {/* Welcome Message */}
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            {getGreeting()}, {getDisplayName()}! 👋
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-2">
            Welcome to EduMaster Admin Panel
          </p>
          
          <p className="text-gray-500 mb-12">
            Your central hub for managing the learning platform
          </p>

          {/* Call to Action Button */}
          <button
            onClick={handleGoToDashboard}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-lg"
          >
            <FaChartLine className="text-xl" />
            <span>Go to Analytics Dashboard</span>
            <FaArrowRight className="text-xl" />
          </button>

          {/* Quick Links */}
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate('/admin/users')}
              className="px-6 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-all duration-200 font-medium"
            >
              Manage Users
            </button>
            <button
              onClick={() => navigate('/admin/courses')}
              className="px-6 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:border-purple-500 hover:text-purple-600 transition-all duration-200 font-medium"
            >
              Manage Courses
            </button>
            <button
              onClick={() => navigate('/admin/approvals')}
              className="px-6 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:border-orange-500 hover:text-orange-600 transition-all duration-200 font-medium"
            >
              Pending Approvals
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminHome;

