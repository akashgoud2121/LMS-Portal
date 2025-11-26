import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { getImageUrl } from '../utils/imageUtils';
import StudentSidebar from '../components/StudentSidebar';
import { FaChartLine, FaTrophy, FaBook, FaCheckCircle, FaClock, FaGraduationCap } from 'react-icons/fa';

interface Enrollment {
  _id: string;
  course: {
    _id: string;
    title: string;
    thumbnail: string;
    instructor: {
      name: string;
    };
    totalLessons: number;
  };
  progress: number;
  completed: boolean;
  completedLessons: Array<{ lesson: string; completedAt: string }>;
  enrolledAt: string;
}

const TrackProgress: React.FC = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    totalLessons: 0,
    completedLessons: 0,
    averageProgress: 0
  });

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      const response = await axios.get('/api/enrollments/my-enrollments');
      setEnrollments(response.data);

      // Calculate statistics
      const totalCourses = response.data.length;
      const completedCourses = response.data.filter((e: Enrollment) => e.completed).length;
      const inProgressCourses = totalCourses - completedCourses;
      
      let totalLessons = 0;
      let completedLessons = 0;
      let totalProgress = 0;

      response.data.forEach((enrollment: Enrollment) => {
        totalLessons += enrollment.course.totalLessons || 0;
        const completed = enrollment.completedLessons?.length || 0;
        completedLessons += completed;
        totalProgress += enrollment.progress || 0;
      });

      const averageProgress = totalCourses > 0 ? Math.round(totalProgress / totalCourses) : 0;

      setStats({
        totalCourses,
        completedCourses,
        inProgressCourses,
        totalLessons,
        completedLessons,
        averageProgress
      });
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <StudentSidebar />
        <div className="flex-1 ml-64 flex items-center justify-center">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <StudentSidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Progress</h1>
            <p className="text-gray-600">Monitor your learning journey and achievements</p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <FaBook className="text-3xl opacity-80" />
                <div className="text-right">
                  <p className="text-3xl font-bold">{stats.totalCourses}</p>
                  <p className="text-sm opacity-90">Total Courses</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <FaTrophy className="text-3xl opacity-80" />
                <div className="text-right">
                  <p className="text-3xl font-bold">{stats.completedCourses}</p>
                  <p className="text-sm opacity-90">Completed</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <FaChartLine className="text-3xl opacity-80" />
                <div className="text-right">
                  <p className="text-3xl font-bold">{stats.averageProgress}%</p>
                  <p className="text-sm opacity-90">Avg Progress</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FaCheckCircle className="text-blue-600 text-xl" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedLessons}</p>
                  <p className="text-sm text-gray-600">Lessons Completed</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <FaClock className="text-indigo-600 text-xl" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalLessons - stats.completedLessons}</p>
                  <p className="text-sm text-gray-600">Lessons Remaining</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <FaGraduationCap className="text-purple-600 text-xl" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.inProgressCourses}</p>
                  <p className="text-sm text-gray-600">In Progress</p>
                </div>
              </div>
            </div>
          </div>

          {/* Course Progress */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Course Progress</h2>
            </div>
            <div className="p-6">
              {enrollments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 mb-4">
                    <FaBook className="text-3xl text-blue-600" />
                  </div>
                  <p className="text-gray-600 text-lg mb-6 font-medium">You haven't enrolled in any courses yet.</p>
                  <Link
                    to="/student/courses"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl font-medium"
                  >
                    Browse Courses
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {enrollments.map((enrollment) => {
                    const completedCount = enrollment.completedLessons?.length || 0;
                    const totalLessons = enrollment.course.totalLessons || 0;

                    return (
                      <div key={enrollment._id} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                        <div className="flex items-start gap-4 mb-4">
                          {enrollment.course.thumbnail && (
                            <img
                              src={getImageUrl(enrollment.course.thumbnail)}
                              alt={enrollment.course.title}
                              className="w-20 h-16 object-cover rounded-xl"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x250?text=Course+Image';
                              }}
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">{enrollment.course.title}</h3>
                            <p className="text-sm text-gray-500 mb-3">Instructor: {enrollment.course.instructor.name}</p>
                            
                            <div className="mb-3">
                              <div className="flex justify-between text-sm text-gray-600 mb-2">
                                <span className="font-medium">
                                  {completedCount} of {totalLessons} lessons completed
                                </span>
                                <span className="font-bold text-blue-600">{enrollment.progress}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div
                                  className={`h-3 rounded-full transition-all duration-500 ${
                                    enrollment.completed
                                      ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                                      : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600'
                                  }`}
                                  style={{ width: `${enrollment.progress}%` }}
                                ></div>
                              </div>
                            </div>

                            {enrollment.completed && (
                              <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-lg text-sm font-semibold">
                                <FaTrophy className="text-sm" />
                                Course Completed
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackProgress;

