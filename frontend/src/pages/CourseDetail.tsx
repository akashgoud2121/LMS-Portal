import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUtils';
import { showToast } from '../utils/toast';
import { FaQuestionCircle, FaClock, FaCheckCircle, FaLock } from 'react-icons/fa';

interface Lesson {
  _id: string;
  title: string;
  description: string;
  order: number;
  duration: number;
}

interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnail: string;
  instructor: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    bio?: string;
  };
  category: string;
  price: number;
  lessons: Lesson[];
  totalLessons: number;
  enrolledStudents: number;
}

interface Quiz {
  _id: string;
  title: string;
  description: string;
  timeLimit: number;
  passingScore: number;
  totalPoints: number;
  questions: Array<{ _id: string }>;
}

const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  useEffect(() => {
    if (id) {
      fetchCourse();
    }
  }, [id, user]);

  const fetchCourse = async () => {
    try {
      const response = await axios.get(`/api/courses/${id}`);
      setCourse(response.data.course);
      
      // Always check enrollment status separately for accuracy
      if (user && user.role === 'student') {
        await checkEnrollment();
      } else {
        setIsEnrolled(false);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollment = async () => {
    try {
      const response = await axios.get(`/api/enrollments/check/${id}`);
      const enrolled = response.data.isEnrolled || false;
      setIsEnrolled(enrolled);
      
      // Fetch quizzes only if enrolled
      if (enrolled) {
        try {
          const quizzesResponse = await axios.get(`/api/quizzes/course/${id}`);
          setQuizzes(quizzesResponse.data || []);
        } catch (error) {
          console.error('Error fetching quizzes:', error);
        }
      } else {
        setQuizzes([]);
      }
    } catch (error) {
      console.error('Error checking enrollment:', error);
      setIsEnrolled(false);
      setQuizzes([]);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      // Store the course ID to redirect back after login
      if (id) {
        localStorage.setItem('redirectAfterLogin', `/courses/${id}`);
      }
      navigate('/student/login');
      return;
    }

    setEnrolling(true);
    try {
      await axios.post(`/api/enrollments/${id}`);
      setIsEnrolled(true);
      showToast.success('Successfully enrolled in course!');
      navigate(`/courses/${id}/lesson/${course?.lessons[0]?._id}`);
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Enrollment failed');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Course not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {course.thumbnail && (
            <img
              src={getImageUrl(course.thumbnail)}
              alt={course.title}
              className="w-full h-64 md:h-96 object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/1200x400?text=Course+Image';
              }}
            />
          )}
          <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{course.title}</h1>
                <p className="text-gray-600 mb-4">{course.description}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>By {course.instructor.name}</span>
                  <span>•</span>
                  <span>{course.category}</span>
                  <span>•</span>
                  <span>{course.totalLessons} lessons</span>
                  <span>•</span>
                  <span>{course.enrolledStudents} students</span>
                </div>
              </div>
              <div className="mt-4 md:mt-0 md:ml-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="text-3xl font-bold text-primary-600 mb-4">
                    {course.price === 0 ? 'Free' : `$${course.price}`}
                  </div>
                  {user && user.role === 'student' && isEnrolled ? (
                    <Link
                      to={`/courses/${id}/lesson/${course.lessons[0]?._id || ''}`}
                      className="block w-full text-center bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700 transition"
                    >
                      Continue Learning
                    </Link>
                  ) : user && user.role === 'student' ? (
                    <button
                      onClick={handleEnroll}
                      disabled={enrolling}
                      className="w-full bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700 transition disabled:opacity-50"
                    >
                      {enrolling ? 'Enrolling...' : 'Enroll Now'}
                    </button>
                  ) : (
                    <Link
                      to="/student/login"
                      onClick={() => {
                        if (id) {
                          localStorage.setItem('redirectAfterLogin', `/courses/${id}`);
                        }
                      }}
                      className="block w-full text-center bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700 transition"
                    >
                      Login to Enroll
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Enrollment Status Banner */}
            {user && user.role === 'student' && (
              <div className={`mt-8 p-4 rounded-lg border-2 ${
                isEnrolled 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-center gap-3">
                  {isEnrolled ? (
                    <>
                      <FaCheckCircle className="text-green-600 text-xl" />
                      <div>
                        <h3 className="font-bold text-green-800">You are enrolled in this course</h3>
                        <p className="text-sm text-green-700">You can access all lessons and quizzes below.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <FaLock className="text-yellow-600 text-xl" />
                      <div>
                        <h3 className="font-bold text-yellow-800">You are not enrolled in this course</h3>
                        <p className="text-sm text-yellow-700">Enroll now to access course content, lessons, and quizzes.</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Quizzes Section - Only show if enrolled */}
            {isEnrolled && quizzes.length > 0 && (
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Course Quizzes</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {quizzes.map((quiz) => (
                    <div
                      key={quiz._id}
                      className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-5 hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                          <FaQuestionCircle className="text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 mb-1">{quiz.title}</h3>
                          {quiz.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{quiz.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            {quiz.timeLimit > 0 && (
                              <div className="flex items-center gap-1">
                                <FaClock className="text-xs" />
                                <span>{quiz.timeLimit} min</span>
                              </div>
                            )}
                            <span>{quiz.questions?.length || 0} questions</span>
                            <span>Pass: {quiz.passingScore}%</span>
                          </div>
                          <Link
                            to={`/courses/${id}/quiz/${quiz._id}`}
                            className="block w-full text-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 font-medium text-sm"
                          >
                            Start Quiz
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Course Curriculum - Show preview if not enrolled, full access if enrolled */}
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Course Curriculum
                {!isEnrolled && user && user.role === 'student' && (
                  <span className="text-sm font-normal text-gray-500 ml-2">(Preview - Enroll to access)</span>
                )}
              </h2>
              <div className="space-y-2">
                {course.lessons.map((lesson, index) => (
                  <div
                    key={lesson._id}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      isEnrolled 
                        ? 'bg-gray-50 hover:bg-gray-100 cursor-pointer' 
                        : 'bg-gray-50 opacity-75'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <span className="text-gray-500 font-medium">{index + 1}</span>
                      <div>
                        <h3 className={`font-medium ${isEnrolled ? 'text-gray-900' : 'text-gray-500'}`}>
                          {lesson.title}
                          {!isEnrolled && <FaLock className="inline-block ml-2 text-xs" />}
                        </h3>
                        {lesson.description && (
                          <p className="text-sm text-gray-500">{lesson.description}</p>
                        )}
                      </div>
                    </div>
                    {lesson.duration > 0 && (
                      <span className="text-sm text-gray-500">{lesson.duration} min</span>
                    )}
                  </div>
                ))}
              </div>
              {!isEnrolled && user && user.role === 'student' && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                  <p className="text-blue-800 font-medium mb-2">Enroll to unlock all lessons</p>
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium"
                  >
                    {enrolling ? 'Enrolling...' : 'Enroll Now'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;


