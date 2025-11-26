import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';
import { FaUsers, FaUserGraduate, FaChalkboardTeacher, FaBook, FaClipboardList, FaCheckCircle, FaChartLine, FaArrowRight } from 'react-icons/fa';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Analytics {
  overview: {
    totalUsers: number;
    totalStudents: number;
    totalInstructors: number;
    totalCourses: number;
    publishedCourses: number;
    totalEnrollments: number;
    totalQuizAttempts: number;
  };
  recentEnrollments: Array<{
    id: string;
    student: { name: string };
    course: { title: string };
    enrolledAt: string;
  }>;
  enrollmentStats?: Array<{
    month: string;
    enrollments: number;
  }>;
  userGrowthStats?: Array<{
    month: string;
    users: number;
  }>;
}

const AdminDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get('/api/admin/analytics');
      setAnalytics(response.data);
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      setAnalytics({
        overview: {
          totalUsers: 0,
          totalStudents: 0,
          totalInstructors: 0,
          totalCourses: 0,
          publishedCourses: 0,
          totalEnrollments: 0,
          totalQuizAttempts: 0
        },
        recentEnrollments: [],
        enrollmentStats: [],
        userGrowthStats: []
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!analytics) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-500">Unable to load dashboard data</p>
        </div>
      </AdminLayout>
    );
  }

  const { overview } = analytics;
  const enrollmentChartData = analytics.enrollmentStats || [];
  const userGrowthChartData = analytics.userGrowthStats || [];
  
  const publishedPercentage = overview.totalCourses > 0 
    ? Math.round((overview.publishedCourses / overview.totalCourses) * 100) 
    : 0;

  return (
    <AdminLayout>
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div 
          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/admin/users')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <FaUsers className="text-blue-600 text-xl" />
            </div>
            <FaArrowRight className="text-gray-400 text-sm" />
          </div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Users</h3>
          <p className="text-3xl font-bold text-gray-900">{overview.totalUsers}</p>
          <p className="text-xs text-gray-500 mt-2">
            {overview.totalStudents} students • {overview.totalInstructors} instructors
          </p>
        </div>

        <div 
          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/admin/courses')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 rounded-lg">
              <FaBook className="text-purple-600 text-xl" />
            </div>
            <FaArrowRight className="text-gray-400 text-sm" />
          </div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Courses</h3>
          <p className="text-3xl font-bold text-gray-900">{overview.totalCourses}</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-purple-600 h-1.5 rounded-full" 
                style={{ width: `${publishedPercentage}%` }}
              ></div>
            </div>
            <span className="text-xs text-gray-500">{publishedPercentage}% published</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <FaClipboardList className="text-green-600 text-xl" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Enrollments</h3>
          <p className="text-3xl font-bold text-gray-900">{overview.totalEnrollments}</p>
          <p className="text-xs text-gray-500 mt-2">Active course enrollments</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-50 rounded-lg">
              <FaCheckCircle className="text-orange-600 text-xl" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Quiz Attempts</h3>
          <p className="text-3xl font-bold text-gray-900">{overview.totalQuizAttempts}</p>
          <p className="text-xs text-gray-500 mt-2">Total quiz submissions</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Enrollment Trends */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Enrollment Trends</h2>
              <p className="text-sm text-gray-500 mt-1">Last 6 months</p>
            </div>
            <div className="p-2 bg-indigo-50 rounded-lg">
              <FaChartLine className="text-indigo-600" />
            </div>
          </div>
          {enrollmentChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={enrollmentChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="enrollments" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  dot={{ fill: '#6366f1', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] border-2 border-dashed border-gray-200 rounded-lg">
              <p className="text-sm text-gray-400">No enrollment data available</p>
            </div>
          )}
        </div>

        {/* User Growth */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">User Growth</h2>
              <p className="text-sm text-gray-500 mt-1">Cumulative over time</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <FaUsers className="text-blue-600" />
            </div>
          </div>
          {userGrowthChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={userGrowthChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }} 
                />
                <Bar dataKey="users" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] border-2 border-dashed border-gray-200 rounded-lg">
              <p className="text-sm text-gray-400">No user growth data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Enrollments */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <p className="text-sm text-gray-500 mt-1">Latest course enrollments</p>
          </div>
          <div className="p-6">
            {analytics.recentEnrollments.length === 0 ? (
              <div className="text-center py-12">
                <FaClipboardList className="text-gray-300 text-4xl mx-auto mb-3" />
                <p className="text-sm text-gray-400">No recent enrollments</p>
              </div>
            ) : (
              <div className="space-y-4">
                {analytics.recentEnrollments.slice(0, 5).map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                        <FaUserGraduate className="text-blue-600 text-sm" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{enrollment.student.name}</p>
                        <p className="text-xs text-gray-500">
                          enrolled in <span className="font-medium">{enrollment.course.title}</span>
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {new Date(enrollment.enrolledAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {analytics.recentEnrollments.length > 5 && (
            <div className="border-t border-gray-200 px-6 py-3 bg-gray-50">
              <button
                onClick={() => navigate('/admin/users')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all activity →
              </button>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Platform Status</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <FaCheckCircle className="text-green-600 text-xs" />
                </div>
                <span className="text-sm text-gray-600">Published Courses</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{overview.publishedCourses}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <FaUserGraduate className="text-blue-600 text-xs" />
                </div>
                <span className="text-sm text-gray-600">Students</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{overview.totalStudents}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <FaChalkboardTeacher className="text-purple-600 text-xs" />
                </div>
                <span className="text-sm text-gray-600">Instructors</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{overview.totalInstructors}</span>
            </div>
          </div>
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <button
              onClick={() => navigate('/admin/approvals')}
              className="w-full bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Review Approvals
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
