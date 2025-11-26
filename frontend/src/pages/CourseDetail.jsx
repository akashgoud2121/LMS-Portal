import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUtils';
import { showToast } from '../utils/toast';
import { FaQuestionCircle, FaClock, FaCheckCircle, FaLock, FaStar, FaBook, FaUsers, FaPlayCircle, FaArrowRight, FaGraduationCap } from 'react-icons/fa';

const CourseDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);
    const [quizzes, setQuizzes] = useState([]);
    const [enrollmentInfo, setEnrollmentInfo] = useState(null);
    const [ratingValue, setRatingValue] = useState(0);
    const [ratingComment, setRatingComment] = useState('');
    const [submittingRating, setSubmittingRating] = useState(false);

    useEffect(() => {
        if (id) {
            fetchCourse();
        }
    }, [id, user]);

    const fetchCourse = async () => {
        try {
            const response = await axios.get(`/api/courses/${id}`);
            setCourse(response.data.course);
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
            const enrollmentData = response.data.enrollment || null;
            setIsEnrolled(enrolled);
            setEnrollmentInfo(enrollmentData);
            if (enrollmentData) {
                setRatingValue(enrollmentData.rating || 0);
                setRatingComment(enrollmentData.ratingComment || '');
            } else {
                setRatingValue(0);
                setRatingComment('');
            }
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
            setEnrollmentInfo(null);
            setRatingValue(0);
            setRatingComment('');
            setQuizzes([]);
        }
    };

    const handleEnroll = async () => {
        if (!user) {
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
        } catch (error) {
            showToast.error(error.response?.data?.message || 'Enrollment failed');
        } finally {
            setEnrolling(false);
        }
    };

    const handleRatingSubmit = async () => {
        if (!id) return;
        if (ratingValue < 1 || ratingValue > 5) {
            showToast.error('Please select a rating between 1 and 5 stars.');
            return;
        }
        setSubmittingRating(true);
        try {
            const response = await axios.post(`/api/courses/${id}/rate`, {
                rating: ratingValue,
                comment: ratingComment || undefined
            });
            showToast.success('Thanks for rating this course!');
            setCourse((prev) => prev ? {
                ...prev,
                rating: response.data.rating,
                ratingCount: response.data.ratingCount
            } : prev);
            setEnrollmentInfo((prev) => prev ? {
                ...prev,
                rating: ratingValue,
                ratingComment: ratingComment
            } : prev);
        } catch (error) {
            showToast.error(error.response?.data?.message || 'Failed to submit rating');
        } finally {
            setSubmittingRating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="text-center">
                    <p className="text-gray-500 text-xl">Course not found</p>
                    <Link to="/courses" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">Browse Courses</Link>
                </div>
              </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
            {/* Hero Section with Course Image */}
            <div className="relative h-96 overflow-hidden">
                {course.thumbnail ? (
                    <img 
                        src={getImageUrl(course.thumbnail)} 
                        alt={course.title} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/1200x400?text=Course+Image';
                        }}
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600"></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                    <div className="max-w-7xl mx-auto">
                        <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium mb-4">
                            {course.category}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">{course.title}</h1>
                        <div className="flex items-center gap-6 text-sm md:text-base">
                            <div className="flex items-center gap-2">
                                <FaGraduationCap className="text-blue-300" />
                                <span className="font-medium">{course.instructor.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FaBook className="text-blue-300" />
                                <span>{course.totalLessons} Lessons</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FaUsers className="text-blue-300" />
                                <span>{course.enrolledStudents} Students</span>
                  </div>
                            <div className="flex items-center gap-1">
                                <FaStar className="text-yellow-400" />
                                <span className="font-semibold">
                                    {(course.ratingCount || 0) > 0 ? Number(course.rating || 0).toFixed(1) : 'New'}
                                </span>
                                {(course.ratingCount || 0) > 0 && (
                                    <span className="text-blue-200">({course.ratingCount})</span>
                                )}
                </div>
              </div>
            </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Course Info Card */}
                        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Course</h2>
                            <p className="text-gray-700 leading-relaxed text-lg">{course.description}</p>
                        </div>

                        {/* Enrollment Status */}
                        {user && user.role === 'student' && (
                            <div className={`rounded-2xl shadow-lg p-6 border-2 ${
                                isEnrolled
                                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                                    : 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200'
                            }`}>
                                <div className="flex items-center gap-4">
                                    {isEnrolled ? (
                                        <>
                                            <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                                                <FaCheckCircle className="text-white text-xl" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-green-900 text-lg">You're Enrolled!</h3>
                                                <p className="text-green-700 text-sm">Access all lessons, quizzes, and materials below.</p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex-shrink-0 w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center">
                                                <FaLock className="text-white text-xl" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-amber-900 text-lg">Not Enrolled</h3>
                                                <p className="text-amber-700 text-sm">Enroll now to unlock all course content.</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Quizzes Section */}
                        {isEnrolled && quizzes.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                                        <FaQuestionCircle className="text-white" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900">Course Quizzes</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {quizzes.map((quiz) => (
                                        <div key={quiz._id} className="group relative bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 rounded-xl p-6 border border-purple-200 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                                            <div className="flex items-start gap-4 mb-4">
                                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                                                    <FaQuestionCircle className="text-white text-lg" />
                        </div>
                        <div className="flex-1">
                                                    <h3 className="font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">{quiz.title}</h3>
                                                    {quiz.description && (
                                                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{quiz.description}</p>
                                                    )}
                                                    <div className="flex items-center gap-4 text-xs text-gray-600">
                                                        {quiz.timeLimit > 0 && (
                                                            <div className="flex items-center gap-1">
                                                                <FaClock className="text-purple-500" />
                                <span>{quiz.timeLimit} min</span>
                                                            </div>
                                                        )}
                            <span>{quiz.questionCount || quiz.questions?.length || 0} questions</span>
                                                        <span className="font-semibold text-purple-600">Pass: {quiz.passingScore}%</span>
                                                    </div>
                                                </div>
                          </div>
                                            <Link 
                                                to={`/courses/${id}/quiz/${quiz._id}`} 
                                                className="w-full text-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 font-medium text-sm shadow-md hover:shadow-lg inline-block"
                                            >
                            Start Quiz
                          </Link>
                        </div>
                                    ))}
                      </div>
                </div>
                        )}

                        {/* Course Curriculum */}
                        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                                    <FaBook className="text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Course Curriculum</h2>
                                {!isEnrolled && user && user.role === 'student' && (
                                    <span className="text-sm text-gray-500 font-normal">(Preview - Enroll to access)</span>
                                )}
                            </div>
                            <div className="space-y-3">
                                {course.lessons.map((lesson, index) => (
                                    <div 
                                        key={lesson._id} 
                                        className={`group flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                                            isEnrolled
                                                ? 'bg-gradient-to-r from-gray-50 to-blue-50 border-blue-200 hover:border-blue-400 hover:shadow-md cursor-pointer'
                                                : 'bg-gray-50 border-gray-200 opacity-75'
                                        }`}
                                        onClick={isEnrolled ? () => navigate(`/courses/${id}/lesson/${lesson._id}`) : undefined}
                                    >
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                                                isEnrolled 
                                                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md' 
                                                    : 'bg-gray-300 text-gray-600'
                                            }`}>
                                                {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className={`font-semibold ${isEnrolled ? 'text-gray-900' : 'text-gray-500'}`}>
                          {lesson.title}
                        </h3>
                                                    {!isEnrolled && <FaLock className="text-gray-400 text-xs" />}
                                                </div>
                                                {lesson.description && (
                                                    <p className="text-sm text-gray-500 mt-1">{lesson.description}</p>
                                                )}
                                            </div>
                                        </div>
                                        {lesson.duration > 0 && (
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <FaClock className="text-blue-500" />
                                                <span>{lesson.duration} min</span>
                                            </div>
                                        )}
                                        {isEnrolled && (
                                            <FaArrowRight className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity ml-4" />
                                        )}
                                    </div>
                                ))}
                            </div>
                            {!isEnrolled && user && user.role === 'student' && (
                                <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 text-center">
                                    <p className="text-blue-900 font-semibold mb-3">Enroll to unlock all lessons</p>
                                    <button 
                                        onClick={handleEnroll} 
                                        disabled={enrolling} 
                                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 font-medium shadow-lg hover:shadow-xl"
                                    >
                                        {enrolling ? 'Enrolling...' : 'Enroll Now'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Rating Section */}
                        {user && user.role === 'student' && isEnrolled && (
                            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">Rate this course</h3>
                                        <p className="text-sm text-gray-500 mt-1">Share your feedback to help other students</p>
                                    </div>
                                    {enrollmentInfo?.rating && (
                                        <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                                            You rated {enrollmentInfo.rating}/5
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 mb-6">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button 
                                            key={star} 
                                            type="button" 
                                            onClick={() => setRatingValue(star)} 
                                            className="focus:outline-none transform hover:scale-110 transition-transform"
                                            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                                        >
                                            <FaStar className={`text-4xl ${star <= ratingValue ? 'text-yellow-400' : 'text-gray-300'}`} />
                                        </button>
                                    ))}
                                    {ratingValue > 0 && (
                                        <span className="text-lg font-semibold text-gray-700 ml-2">{ratingValue}/5</span>
                                    )}
                                </div>
                                <textarea 
                                    value={ratingComment} 
                                    onChange={(e) => setRatingComment(e.target.value.slice(0, 1000))} 
                                    rows={4} 
                                    className="w-full border-2 border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all mb-4" 
                                    placeholder="What did you think about this course? (Optional, 1000 characters max)"
                                />
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-gray-500">
                                        {enrollmentInfo?.rating ? 'You can update your rating at any time.' : 'Your feedback is shared with the instructor.'}
                                    </p>
                                    <button 
                                        onClick={handleRatingSubmit} 
                                        disabled={submittingRating || ratingValue === 0} 
                                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-medium hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                                    >
                                        {submittingRating ? 'Submitting...' : enrollmentInfo?.rating ? 'Update Rating' : 'Submit Rating'}
                                    </button>
                                </div>
                      </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-8 space-y-6">
                            {/* Price & Action Card */}
                            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                                <div className="text-center mb-6">
                                    <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                                        {course.price === 0 ? 'Free' : `$${course.price}`}
                                    </div>
                                    {course.price > 0 && (
                                        <p className="text-sm text-gray-500">One-time payment</p>
                                    )}
              </div>
                                {user && user.role === 'student' && isEnrolled ? (
                                    <Link 
                                        to={`/courses/${id}/lesson/${course.lessons[0]?._id || ''}`} 
                                        className="w-full text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                                    >
                                        <FaPlayCircle />
                                        Continue Learning
                                    </Link>
                                ) : user && user.role === 'student' ? (
                                    <button 
                                        onClick={handleEnroll} 
                                        disabled={enrolling} 
                                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 font-semibold shadow-lg hover:shadow-xl"
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
                                        className="block w-full text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
                                    >
                                        Login to Enroll
                                    </Link>
                                )}
                            </div>

                            {/* Course Stats */}
                            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                                <h3 className="font-bold text-gray-900 mb-4">Course Includes</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm">
                                        <FaBook className="text-blue-600" />
                                        <span className="text-gray-700">{course.totalLessons} Video Lessons</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <FaQuestionCircle className="text-purple-600" />
                                        <span className="text-gray-700">{quizzes.length} Quizzes</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <FaUsers className="text-green-600" />
                                        <span className="text-gray-700">{course.enrolledStudents} Enrolled Students</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <FaClock className="text-orange-600" />
                                        <span className="text-gray-700">Lifetime Access</span>
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

export default CourseDetail;
