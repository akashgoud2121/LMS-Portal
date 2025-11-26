import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Welcome to EduMaster
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              Your Gateway to Online Learning Excellence
            </p>
            {!user ? (
              <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <Link
                  to="/student/register"
                  className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition"
                >
                  Join as Student
                </Link>
                <Link
                  to="/instructor/register"
                  className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition"
                >
                  Join as Instructor
                </Link>
                <Link
                  to="/courses"
                  className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition"
                >
                  Browse Courses
                </Link>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                {user.role === 'student' && (
                  <Link
                    to="/dashboard"
                    className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition"
                  >
                    Go to Dashboard
                  </Link>
                )}
                {user.role === 'instructor' && (
                  <Link
                    to="/instructor/dashboard"
                    className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition"
                  >
                    Instructor Dashboard
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link
                    to="/admin/dashboard"
                    className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition"
                  >
                    Admin Dashboard
                  </Link>
                )}
                <Link
                  to="/courses"
                  className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition"
                >
                  Browse Courses
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Login Options Section */}
      {!user && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Access Your Account</h2>
            <p className="text-gray-600">Choose your login portal</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Link
              to="/student/login"
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition text-center"
            >
              <div className="text-primary-600 text-4xl mb-4">🎓</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Student Login</h3>
              <p className="text-gray-600">Access your learning dashboard</p>
            </Link>
            <Link
              to="/instructor/login"
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition text-center"
            >
              <div className="text-green-600 text-4xl mb-4">👨‍🏫</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Instructor Login</h3>
              <p className="text-gray-600">Manage your courses</p>
            </Link>
            <Link
              to="/admin/login"
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition text-center"
            >
              <div className="text-blue-600 text-4xl mb-4">👑</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Admin Login</h3>
              <p className="text-gray-600">Administrative access</p>
            </Link>
          </div>
        </div>
      )}

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose EduMaster?</h2>
          <p className="text-gray-600">Everything you need to succeed in online learning</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-primary-600 text-4xl mb-4">📚</div>
            <h3 className="text-xl font-semibold mb-2">Comprehensive Courses</h3>
            <p className="text-gray-600">Access a wide range of courses across multiple disciplines</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-primary-600 text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-2">Interactive Quizzes</h3>
            <p className="text-gray-600">Test your knowledge with engaging quizzes and assessments</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-primary-600 text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">Progress Tracking</h3>
            <p className="text-gray-600">Monitor your learning progress with detailed analytics</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
