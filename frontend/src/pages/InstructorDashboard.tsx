import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import InstructorSidebar from '../components/InstructorSidebar';
import { 
  FaBook, 
  FaUsers, 
  FaGraduationCap, 
  FaChartLine, 
  FaPlusCircle, 
  FaRocket,
  FaTrophy,
  FaLightbulb,
  FaArrowRight,
  FaArrowUp,
  FaClock,
  FaCheckCircle,
  FaQuestionCircle,
  FaChartBar,
  FaEye,
  FaEdit,
  FaUserCheck,
  FaFire
} from 'react-icons/fa';

interface Course {
  _id: string;
  title: string;
  enrolledStudents: number;
  totalLessons: number;
  isPublished: boolean;
  createdAt: string;
}

interface Quiz {
  _id: string;
  title: string;
  courseId: string;
  totalAttempts?: number;
  averageScore?: number;
}

const InstructorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    publishedCourses: 0,
    totalStudents: 0,
    totalLessons: 0,
    totalQuizzes: 0,
    totalQuizAttempts: 0,
    averageQuizScore: 0,
    totalEnrollments: 0,
    completedEnrollments: 0,
    completionRate: 0,
    averageProgress: 0,
    activeStudents: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch courses
      const coursesResponse = await axios.get('/api/courses/instructor/my-courses');
      let coursesData: Course[] = [];
      if (Array.isArray(coursesResponse.data)) {
        coursesData = coursesResponse.data;
        setCourses(coursesData);
      }

      // Fetch unique student count
      let uniqueStudentsCount = 0;
      try {
        const uniqueStudentsResponse = await axios.get('/api/courses/instructor/unique-students-count');
        uniqueStudentsCount = uniqueStudentsResponse.data?.uniqueStudentsCount || 0;
      } catch (error) {
        console.error('Error fetching unique students count:', error);
        // Fallback to summing enrollments if endpoint fails
        uniqueStudentsCount = coursesData.reduce((sum: number, c: Course) => sum + (c.enrolledStudents || 0), 0);
      }

      // Fetch performance metrics
      let performanceMetrics = {
        totalEnrollments: 0,
        completedEnrollments: 0,
        completionRate: 0,
        averageProgress: 0,
        activeStudents: 0
      };
      try {
        const performanceResponse = await axios.get('/api/courses/instructor/performance-metrics');
        performanceMetrics = performanceResponse.data || performanceMetrics;
      } catch (error) {
        console.error('Error fetching performance metrics:', error);
      }

      // Fetch quizzes
      try {
        const quizzesResponse = await axios.get('/api/quizzes/instructor/my-quizzes');
        const quizzesData = Array.isArray(quizzesResponse.data) ? quizzesResponse.data : [];
        setQuizzes(quizzesData);

        // Fetch quiz attempts for analytics
        let totalQuizAttempts = 0;
        let totalScores = 0;
        
        for (const quiz of quizzesData) {
          try {
            const attemptsResponse = await axios.get(`/api/quizzes/${quiz._id}/attempts`);
            const attempts = Array.isArray(attemptsResponse.data) ? attemptsResponse.data : [];
            totalQuizAttempts += attempts.length;
            
            // Calculate total scores
            attempts.forEach((attempt: any) => {
              if (attempt.score !== undefined && attempt.score !== null) {
                totalScores += attempt.score;
              }
            });
          } catch (error) {
            console.log(`No attempts data for quiz ${quiz._id}`);
          }
        }
        
        const averageQuizScore = totalQuizAttempts > 0 ? Math.round(totalScores / totalQuizAttempts) : 0;

        // Calculate course stats
        const published = coursesData.filter((c: Course) => c.isPublished).length;
        const totalLessons = coursesData.reduce((sum: number, c: Course) => sum + (c.totalLessons || 0), 0);

        setStats({
          totalCourses: coursesData.length,
          publishedCourses: published,
          totalStudents: uniqueStudentsCount,
          totalLessons,
          totalQuizzes: quizzesData.length,
          totalQuizAttempts,
          averageQuizScore,
          ...performanceMetrics
        });
      } catch (error) {
        console.error('Error fetching quizzes:', error);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const recentCourses = courses
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <InstructorSidebar />
        <div className="flex-1 ml-64 w-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <InstructorSidebar />
      <div className="flex-1 ml-64 w-full">
        {/* Hero Section with Gradient */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-12 w-full">
          <div className="px-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  Welcome back, {user?.name || 'Instructor'}! 👋
                </h1>
                <p className="text-indigo-100 text-lg">
                  Here's what's happening with your courses today
                </p>
              </div>
              <Link
                to="/instructor/courses/create"
                className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-all duration-300 shadow-lg flex items-center gap-2"
              >
                <FaPlusCircle />
                Create Course
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="py-8 px-8 w-full">
          {/* Stats Cards - Compact Design */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Total Courses</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
                    <p className="text-gray-400 text-xs mt-1">{stats.publishedCourses} published</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <FaBook className="text-blue-600 text-lg" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Students</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                    <p className="text-gray-400 text-xs mt-1">Across all courses</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <FaUsers className="text-purple-600 text-lg" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Lessons</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalLessons}</p>
                    <p className="text-gray-400 text-xs mt-1">
                      {stats.totalCourses > 0 ? Math.round(stats.totalLessons / stats.totalCourses) : 0} avg/course
                    </p>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <FaGraduationCap className="text-orange-600 text-lg" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Quizzes</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalQuizzes}</p>
                    <p className="text-gray-400 text-xs mt-1">{stats.totalQuizAttempts} attempts</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <FaQuestionCircle className="text-green-600 text-lg" />
                  </div>
                </div>
              </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Left Column - 2/3 width */}
              <div className="lg:col-span-2 space-y-6">
                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
                    <Link
                      to="/instructor/courses"
                      className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1"
                    >
                      View All
                      <FaArrowRight className="text-xs" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
          <Link
            to="/instructor/courses/create"
                      className="group p-5 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg hover:from-indigo-100 hover:to-indigo-200 transition-all duration-200 border border-indigo-200"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="bg-indigo-600 p-2 rounded-lg">
                          <FaPlusCircle className="text-white text-sm" />
                        </div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600">New Course</h3>
                      </div>
                      <p className="text-sm text-gray-600">Create and publish a course</p>
                    </Link>

                    <Link
                      to="/instructor/quizzes/create"
                      className="group p-5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg hover:from-purple-100 hover:to-purple-200 transition-all duration-200 border border-purple-200"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="bg-purple-600 p-2 rounded-lg">
                          <FaLightbulb className="text-white text-sm" />
                        </div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-purple-600">New Quiz</h3>
                      </div>
                      <p className="text-sm text-gray-600">Add interactive quizzes</p>
                    </Link>

                    <Link
                      to="/instructor/materials"
                      className="group p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all duration-200 border border-blue-200"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="bg-blue-600 p-2 rounded-lg">
                          <FaGraduationCap className="text-white text-sm" />
                        </div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">Materials</h3>
                      </div>
                      <p className="text-sm text-gray-600">Upload resources</p>
                    </Link>

                    <Link
                      to="/instructor/quizzes"
                      className="group p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-lg hover:from-green-100 hover:to-green-200 transition-all duration-200 border border-green-200"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="bg-green-600 p-2 rounded-lg">
                          <FaTrophy className="text-white text-sm" />
                        </div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-green-600">Manage Quizzes</h3>
                      </div>
                      <p className="text-sm text-gray-600">Review performance</p>
                    </Link>
                  </div>
                </div>

                {/* Recent Courses */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Recent Courses</h2>
                    <Link
                      to="/instructor/courses"
                      className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1"
                    >
                      View All
                      <FaArrowRight className="text-xs" />
          </Link>
        </div>

                  {recentCourses.length === 0 ? (
                    <div className="text-center py-8">
                      <FaBook className="text-4xl text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm mb-4">No courses yet</p>
            <Link
              to="/instructor/courses/create"
                        className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
                        <FaPlusCircle />
                        Create Course
            </Link>
          </div>
        ) : (
                    <div className="space-y-3">
                      {recentCourses.map((course) => (
                        <Link
                          key={course._id}
                          to={`/instructor/courses/${course._id}/edit`}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-all duration-200 group"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${
                              course.isPublished 
                                ? 'bg-green-100 text-green-600' 
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                              <FaBook className="text-sm" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 mb-1">
                                {course.title}
                              </h3>
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <FaGraduationCap className="text-xs" />
                                  {course.totalLessons || 0} lessons
                                </span>
                                <span className="flex items-center gap-1">
                                  <FaUsers className="text-xs" />
                                  {course.enrolledStudents || 0} students
                                </span>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      course.isPublished
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-200 text-gray-700'
                    }`}>
                      {course.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                            </div>
                          </div>
                          <FaArrowRight className="text-gray-400 group-hover:text-indigo-600 transition-colors" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - 1/3 width */}
              <div className="space-y-6">
                {/* Performance Metrics */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Performance</h2>
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FaCheckCircle className="text-green-600 text-sm" />
                          <span className="text-sm font-medium text-gray-600">Completion Rate</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">
                          {stats.completionRate}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${stats.completionRate}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {stats.completedEnrollments} of {stats.totalEnrollments} enrollments completed
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FaChartLine className="text-blue-600 text-sm" />
                          <span className="text-sm font-medium text-gray-600">Average Progress</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">
                          {stats.averageProgress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${stats.averageProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Average progress across all enrollments
                      </p>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-gray-600 mb-2">
                        <FaFire className="text-orange-600 text-sm" />
                        <span className="text-sm font-medium">Active Students</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.activeStudents}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Students making progress
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quiz Analytics */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Quiz Stats</h2>
                    <Link
                      to="/instructor/quizzes"
                      className="text-indigo-600 hover:text-indigo-700 text-xs font-medium"
                    >
                      View All
                    </Link>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="bg-indigo-600 p-2 rounded-lg">
                          <FaQuestionCircle className="text-white text-sm" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Total Quizzes</p>
                          <p className="text-lg font-bold text-gray-900">{stats.totalQuizzes}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="bg-purple-600 p-2 rounded-lg">
                          <FaChartBar className="text-white text-sm" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Total Attempts</p>
                          <p className="text-lg font-bold text-gray-900">{stats.totalQuizAttempts}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-600 p-2 rounded-lg">
                          <FaTrophy className="text-white text-sm" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Average Score</p>
                          <p className="text-lg font-bold text-gray-900">
                            {stats.totalQuizAttempts > 0 ? `${stats.averageQuizScore}%` : '0%'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboard;
