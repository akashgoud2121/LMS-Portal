import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { getImageUrl } from '../utils/imageUtils';
import StudentSidebar from '../components/StudentSidebar';
import { FaBook, FaQuestionCircle, FaClock, FaTrophy, FaChartLine, FaCheckCircle, FaGraduationCap, FaArrowRight } from 'react-icons/fa';

interface Enrollment {
  _id: string;
  course: {
    _id: string;
    title: string;
    thumbnail: string;
    instructor: {
      name: string;
    };
  };
  progress: number;
  completed: boolean;
  enrolledAt: string;
}

interface Quiz {
  _id: string;
  title: string;
  description: string;
  course: {
    _id: string;
    title: string;
  };
  timeLimit: number;
  passingScore: number;
  totalPoints: number;
  questions: Array<{ _id: string }>;
}

const Dashboard: React.FC = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      const response = await axios.get('/api/enrollments/my-enrollments');
      
      // Normalize IDs (backend should already normalize, but ensure compatibility)
      const normalizedEnrollments = response.data.map((e: any) => ({
        ...e,
        _id: e._id || e.id,
        course: {
          ...e.course,
          _id: e.course._id || e.course.id,
          instructor: {
            ...e.course.instructor,
            _id: e.course.instructor?._id || e.course.instructor?.id
          }
        }
      }));
      
      // Remove duplicate enrollments (keep only one per course) - in case of duplicates
      const seenCourseIds = new Set<string>();
      const uniqueEnrollments = normalizedEnrollments.filter((e: Enrollment) => {
        const courseId = e.course._id;
        if (seenCourseIds.has(courseId)) {
          return false; // Duplicate, skip it
        }
        seenCourseIds.add(courseId);
        return true;
      });
      
      setEnrollments(uniqueEnrollments);
      
      // Fetch quizzes for enrolled courses (using unique course IDs)
      const courseIds = uniqueEnrollments.map((e: Enrollment) => e.course._id);
      const quizPromises = courseIds.map(async (courseId: string) => {
        try {
          const quizResponse = await axios.get(`/api/quizzes/course/${courseId}`);
          return quizResponse.data.map((quiz: any) => ({
            ...quiz,
            course: uniqueEnrollments.find((e: Enrollment) => e.course._id === courseId)?.course
          }));
        } catch (error) {
          return [];
        }
      });
      
      const quizArrays = await Promise.all(quizPromises);
      const allQuizzes = quizArrays.flat();
      setQuizzes(allQuizzes);
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here's your learning overview.</p>
          </div>

          {enrollments.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all duration-300">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 mb-4">
                  <FaBook className="text-3xl text-blue-600" />
                </div>
              </div>
              <p className="text-gray-600 text-lg mb-6 font-medium">You haven't enrolled in any courses yet.</p>
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl font-medium"
              >
                <FaBook className="text-sm" />
                Browse Courses
              </Link>
            </div>
          ) : (
            <>
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <FaBook className="text-blue-600 text-xl" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">
                    {new Set(enrollments.map(e => e.course._id)).size}
                  </h3>
                  <p className="text-sm text-gray-600">Enrolled Courses</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <FaChartLine className="text-green-600 text-xl" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">
                    {enrollments.length > 0 
                      ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length)
                      : 0}%
                  </h3>
                  <p className="text-sm text-gray-600">Average Progress</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <FaQuestionCircle className="text-purple-600 text-xl" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{quizzes.length}</h3>
                  <p className="text-sm text-gray-600">Available Quizzes</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <FaTrophy className="text-orange-600 text-xl" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">
                    {enrollments.filter(e => e.completed).length}
                  </h3>
                  <p className="text-sm text-gray-600">Completed Courses</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link
                    to="/student/courses"
                    className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
                  >
                    <div className="p-2 bg-blue-600 rounded-lg group-hover:scale-110 transition-transform">
                      <FaBook className="text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Browse Courses</h3>
                      <p className="text-sm text-gray-600">Discover new courses</p>
                    </div>
                    <FaArrowRight className="text-gray-400 group-hover:text-blue-600" />
                  </Link>

                  <Link
                    to="/student/watch-lessons"
                    className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group"
                  >
                    <div className="p-2 bg-purple-600 rounded-lg group-hover:scale-110 transition-transform">
                      <FaGraduationCap className="text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Watch Lessons</h3>
                      <p className="text-sm text-gray-600">Continue learning</p>
                    </div>
                    <FaArrowRight className="text-gray-400 group-hover:text-purple-600" />
                  </Link>

                  <Link
                    to="/student/attempt-quizzes"
                    className="flex items-center gap-3 p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors group"
                  >
                    <div className="p-2 bg-indigo-600 rounded-lg group-hover:scale-110 transition-transform">
                      <FaQuestionCircle className="text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Take Quizzes</h3>
                      <p className="text-sm text-gray-600">Test your knowledge</p>
                    </div>
                    <FaArrowRight className="text-gray-400 group-hover:text-indigo-600" />
                  </Link>
                </div>
              </div>

              {/* Quizzes Section */}
              {quizzes.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Available Quizzes</h2>
                      <p className="text-gray-600">Test your knowledge with quizzes from your courses</p>
                    </div>
                    <Link
                      to="/student/attempt-quizzes"
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-2"
                    >
                      View All
                      <FaQuestionCircle />
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {quizzes.slice(0, 3).map((quiz) => (
                      <div
                        key={quiz._id}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 overflow-hidden group"
                      >
                        <div className="p-6">
                          <div className="flex items-start gap-4 mb-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                              <FaQuestionCircle className="text-white text-xl" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors line-clamp-2">
                                {quiz.title}
                              </h3>
                              <p className="text-sm text-gray-500">{quiz.course?.title}</p>
                            </div>
                          </div>

                          {quiz.description && (
                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{quiz.description}</p>
                          )}

                          <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                            {quiz.timeLimit > 0 && (
                              <div className="flex items-center gap-1">
                                <FaClock className="text-xs" />
                                <span>{quiz.timeLimit} min</span>
                              </div>
                            )}
                            <div>
                              <span>{quiz.questions?.length || 0} questions</span>
                            </div>
                          </div>

                          <Link
                            to={`/courses/${quiz.course?._id}/quiz/${quiz._id}`}
                            className="block w-full text-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-3 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg font-medium"
                          >
                            Start Quiz
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Courses Section */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">My Courses</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrollments.map((enrollment) => (
                <div 
                  key={enrollment._id} 
                  className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-2xl hover:scale-[1.02] hover:border-blue-200 transition-all duration-300 group cursor-pointer"
                >
                  {enrollment.course.thumbnail && (
                    <div className="relative overflow-hidden">
                      <img
                        src={getImageUrl(enrollment.course.thumbnail)}
                        alt={enrollment.course.title}
                        className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-700"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x250?text=Course+Image';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-blue-600 shadow-lg">
                          {enrollment.progress}% Complete
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300 line-clamp-2">
                      {enrollment.course.title}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Instructor: {enrollment.course.instructor.name}
                    </p>
                    
                    {/* Progress Bar */}
                    <div className="mb-5">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span className="font-medium">Progress</span>
                        <span className="font-bold text-blue-600">{enrollment.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden shadow-inner">
                        <div
                          className="bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 h-2.5 rounded-full transition-all duration-700 group-hover:shadow-lg group-hover:shadow-blue-500/50"
                          style={{ width: `${enrollment.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <Link
                      to={`/courses/${enrollment.course._id}`}
                      className="block w-full text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg font-medium"
                    >
                      {enrollment.completed ? 'Review Course' : 'Continue Learning'}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;


