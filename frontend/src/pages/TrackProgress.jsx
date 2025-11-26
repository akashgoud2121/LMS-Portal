import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { getImageUrl } from '../utils/imageUtils';
import StudentSidebar from '../components/StudentSidebar';
import { FaChartLine, FaTrophy, FaBook, FaCheckCircle, FaClock, FaGraduationCap, FaArrowRight, FaFire, FaStar, FaUsers } from 'react-icons/fa';

const TrackProgress = () => {
    const [enrollments, setEnrollments] = useState([]);
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
        
        // Refresh data periodically to ensure accuracy
        const refreshInterval = setInterval(() => {
            fetchEnrollments();
        }, 30000); // Refresh every 30 seconds
        
        // Refresh when page becomes visible (user switches back to tab)
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                fetchEnrollments();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            clearInterval(refreshInterval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    const fetchEnrollments = async () => {
        try {
            const response = await axios.get('/api/enrollments/my-enrollments');
            const enrollmentsData = response.data;
            
            console.log('Enrollments data:', enrollmentsData);
            
            setEnrollments(enrollmentsData);
            
            // Calculate statistics
            const totalCourses = enrollmentsData.length;
            const completedCourses = enrollmentsData.filter((e) => e.completed).length;
            const inProgressCourses = totalCourses - completedCourses;
            let totalLessons = 0;
            let completedLessons = 0;
            let totalProgress = 0;
            
            enrollmentsData.forEach((enrollment) => {
                totalLessons += enrollment.course?.totalLessons || 0;
                // Handle completedLessons - it's an array of objects {lessonId, completedAt}
                // Filter out any null/undefined entries
                let completed = 0;
                if (Array.isArray(enrollment.completedLessons)) {
                    // Filter out invalid entries and count valid ones
                    completed = enrollment.completedLessons.filter(cl => {
                        // Valid entry should have lessonId or lesson property
                        return cl && (cl.lessonId || cl.lesson || (typeof cl === 'string' && cl.trim() !== ''));
                    }).length;
                }
                
                console.log(`Course: ${enrollment.course?.title}, Completed: ${completed}, Total: ${enrollment.course?.totalLessons || 0}, Progress: ${enrollment.progress || 0}%`, {
                    completedLessons: enrollment.completedLessons,
                    completedLessonsArray: enrollment.completedLessons,
                    completedLessonsType: typeof enrollment.completedLessons,
                    completedLessonsIsArray: Array.isArray(enrollment.completedLessons)
                });
                
                completedLessons += completed;
                totalProgress += enrollment.progress || 0;
            });
            
            const averageProgress = totalCourses > 0 ? Math.round(totalProgress / totalCourses) : 0;
            
            console.log('Calculated stats:', {
                totalCourses,
                completedCourses,
                inProgressCourses,
                totalLessons,
                completedLessons,
                averageProgress
            });
            
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
            <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
                <StudentSidebar />
                <div className="flex-1 ml-64 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600 text-lg">Loading your progress...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
            <StudentSidebar />
            <div className="flex-1 ml-64 p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h1 className="text-4xl font-bold text-gray-900 mb-2">Track Your Progress</h1>
                                <p className="text-gray-600 text-lg">Monitor your learning journey and celebrate your achievements</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {enrollments.length > 0 && (
                                    <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md border border-gray-200">
                                        <FaFire className="text-orange-500" />
                                        <span className="text-sm font-semibold text-gray-700">
                                            {stats.completedLessons} Lessons Completed
                                        </span>
                                    </div>
                                )}
                                <button
                                    onClick={fetchEnrollments}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full shadow-md hover:bg-blue-700 transition-colors text-sm font-semibold"
                                    title="Refresh progress data"
                                >
                                    <FaChartLine className="text-sm" />
                                    Refresh
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {/* Total Courses */}
                        <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                    <FaBook className="text-2xl" />
                                </div>
                                <div className="text-right">
                                    <p className="text-4xl font-bold">{stats.totalCourses}</p>
                                    <p className="text-sm opacity-90 mt-1">Total Courses</p>
                                </div>
                            </div>
                            <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                                <div className="h-full bg-white rounded-full" style={{ width: '100%' }}></div>
                            </div>
                        </div>

                        {/* Completed Courses */}
                        <div className="bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                    <FaTrophy className="text-2xl" />
                                </div>
                                <div className="text-right">
                                    <p className="text-4xl font-bold">{stats.completedCourses}</p>
                                    <p className="text-sm opacity-90 mt-1">Completed</p>
                                </div>
                            </div>
                            <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-white rounded-full transition-all duration-500" 
                                    style={{ width: `${stats.totalCourses > 0 ? (stats.completedCourses / stats.totalCourses) * 100 : 0}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Average Progress */}
                        <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-rose-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                    <FaChartLine className="text-2xl" />
                                </div>
                                <div className="text-right">
                                    <p className="text-4xl font-bold">{stats.averageProgress}%</p>
                                    <p className="text-sm opacity-90 mt-1">Avg Progress</p>
                                </div>
                            </div>
                            <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-white rounded-full transition-all duration-500" 
                                    style={{ width: `${stats.averageProgress}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* In Progress */}
                        <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                    <FaGraduationCap className="text-2xl" />
                                </div>
                                <div className="text-right">
                                    <p className="text-4xl font-bold">{stats.inProgressCourses}</p>
                                    <p className="text-sm opacity-90 mt-1">In Progress</p>
                                </div>
                            </div>
                            <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-white rounded-full transition-all duration-500" 
                                    style={{ width: `${stats.totalCourses > 0 ? (stats.inProgressCourses / stats.totalCourses) * 100 : 0}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Additional Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                                    <FaCheckCircle className="text-blue-600 text-2xl" />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-gray-900">{stats.completedLessons}</p>
                                    <p className="text-sm text-gray-600 font-medium">Lessons Completed</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl flex items-center justify-center">
                                    <FaClock className="text-indigo-600 text-2xl" />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-gray-900">{stats.totalLessons - stats.completedLessons}</p>
                                    <p className="text-sm text-gray-600 font-medium">Lessons Remaining</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                                    <FaStar className="text-purple-600 text-2xl" />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {stats.totalLessons > 0 ? Math.round((stats.completedLessons / stats.totalLessons) * 100) : 0}%
                                    </p>
                                    <p className="text-sm text-gray-600 font-medium">Overall Completion</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Course Progress */}
                    <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b-2 border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Course Progress</h2>
                                    <p className="text-sm text-gray-600 mt-1">Track your progress across all enrolled courses</p>
                                </div>
                                {enrollments.length > 0 && (
                                    <div className="flex items-center gap-2 text-blue-600">
                                        <FaUsers className="text-lg" />
                                        <span className="font-semibold">{enrollments.length} Course{enrollments.length !== 1 ? 's' : ''}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="p-8">
                            {enrollments.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 mb-6 shadow-lg">
                                        <FaBook className="text-4xl text-blue-600" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Start Your Learning Journey</h3>
                                    <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                                        You haven't enrolled in any courses yet. Browse our courses and start learning today!
                                    </p>
                                    <Link 
                                        to="/student/courses" 
                                        className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl font-semibold text-lg"
                                    >
                                        Browse Courses
                                        <FaArrowRight />
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {enrollments.map((enrollment) => {
                                        // Handle completedLessons - it's an array of objects {lessonId, completedAt}
                                        // Filter out any null/undefined entries
                                        let completedCount = 0;
                                        if (Array.isArray(enrollment.completedLessons)) {
                                            completedCount = enrollment.completedLessons.filter(cl => {
                                                // Valid entry should have lessonId or lesson property
                                                return cl && (cl.lessonId || cl.lesson || (typeof cl === 'string' && cl.trim() !== ''));
                                            }).length;
                                        }
                                        const totalLessons = enrollment.course.totalLessons || 0;
                                        const progressPercentage = enrollment.progress || 0;
                                        
                                        return (
                                            <div 
                                                key={enrollment._id} 
                                                className="group border-2 border-gray-200 rounded-2xl p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-gray-50"
                                            >
                                                <div className="flex items-start gap-6">
                                                    {/* Course Thumbnail */}
                                                    <div className="flex-shrink-0">
                                                        {enrollment.course.thumbnail ? (
                                                            <img 
                                                                src={getImageUrl(enrollment.course.thumbnail)} 
                                                                alt={enrollment.course.title} 
                                                                className="w-32 h-24 object-cover rounded-xl shadow-md group-hover:shadow-lg transition-shadow"
                                                                onError={(e) => {
                                                                    e.target.src = 'https://via.placeholder.com/400x250?text=Course+Image';
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="w-32 h-24 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl shadow-md flex items-center justify-center">
                                                                <FaBook className="text-4xl text-white opacity-80" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Course Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex-1">
                                                                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                                                    {enrollment.course.title}
                                                                </h3>
                                                                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <FaGraduationCap className="text-blue-500" />
                                                                        <span>{enrollment.course.instructor.name}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <FaBook className="text-indigo-500" />
                                                                        <span>{totalLessons} Lessons</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Status Badge */}
                                                            {enrollment.completed ? (
                                                                <div className="flex items-center gap-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold border-2 border-green-300 flex-shrink-0">
                                                                    <FaTrophy className="text-base" />
                                                                    <span>Completed</span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold border-2 border-blue-300 flex-shrink-0">
                                                                    <FaClock className="text-base" />
                                                                    <span>In Progress</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        
                                                        {/* Progress Bar */}
                                                        <div className="mb-4">
                                                            <div className="flex justify-between items-center text-sm mb-2">
                                                                <span className="font-semibold text-gray-700">
                                                                    {completedCount} of {totalLessons} lessons completed
                                                                </span>
                                                                <span className="font-bold text-blue-600 text-lg">{progressPercentage}%</span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                                                                <div 
                                                                    className={`h-4 rounded-full transition-all duration-700 ease-out ${
                                                                        enrollment.completed
                                                                            ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500'
                                                                            : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500'
                                                                    }`} 
                                                                    style={{ width: `${progressPercentage}%` }}
                                                                >
                                                                    <div className="h-full w-full bg-white/20 animate-pulse"></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Action Button */}
                                                        <div className="flex items-center gap-3">
                                                            <Link
                                                                to={`/courses/${enrollment.course._id || enrollment.course.id}`}
                                                                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors group/link"
                                                            >
                                                                {enrollment.completed ? 'Review Course' : 'Continue Learning'}
                                                                <FaArrowRight className="text-sm group-hover/link:translate-x-1 transition-transform" />
                                                            </Link>
                                                        </div>
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
