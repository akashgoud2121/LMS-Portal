import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { getImageUrl } from '../utils/imageUtils';
import { FaStar, FaArrowRight, FaUsers, FaBook, FaPlayCircle, FaGraduationCap, FaClock, FaLaptop, FaRocket } from 'react-icons/fa';
const Home = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    useEffect(() => {
        if (user?.role === 'admin') {
            navigate('/admin', { replace: true });
        }
    }, [user, navigate]);
    useEffect(() => {
        fetchCourses();
        fetchCategories();
        fetchStats();
    }, []);
    const fetchCourses = async () => {
        try {
            const response = await axios.get('/api/courses', { params: { limit: 6 } });
            // Ensure response.data is an array
            const courses = Array.isArray(response.data) ? response.data : [];
            setCourses(courses.slice(0, 6));
        }
        catch (error) {
            console.error('Error fetching courses:', error);
            setCourses([]); // Set empty array on error
        }
        finally {
            setLoading(false);
        }
    };
    const fetchStats = async () => {
        try {
            const response = await axios.get('/api/stats/overview');
            setStats(response.data);
        }
        catch (error) {
            console.error('Error fetching stats:', error);
        }
        finally {
            setStatsLoading(false);
        }
    };
    const fetchCategories = async () => {
        try {
            const response = await axios.get('/api/courses');
            // Ensure response.data is an array
            const courses = Array.isArray(response.data) ? response.data : [];
            const uniqueCategories = Array.from(new Set(courses.map((c) => c.category).filter(Boolean)));
            setCategories(uniqueCategories.slice(0, 6));
        }
        catch (error) {
            console.error('Error fetching categories:', error);
            setCategories([]); // Set empty array on error
        }
    };
    const handleCourseClick = (courseId) => {
        if (!user) {
            localStorage.setItem('redirectAfterLogin', `/courses/${courseId}`);
            navigate('/student/login');
        }
        else {
            navigate(`/courses/${courseId}`);
        }
    };
    const differentiators = [
        {
            title: 'Course catalog + enrollment',
            description: 'Browse courses, preview lessons, and enroll with one click using the same data powering the student dashboard.',
            footer: 'Live data from `/api/courses` & enrollments'
        },
        {
            title: 'Lesson streaming & resources',
            description: 'Students jump back into lessons, watch videos, and open instructor uploads through the lesson player.',
            footer: 'Backed by `WatchLessons` & `LessonPlayer`'
        },
        {
            title: 'Assessments & progress',
            description: 'Quizzes, attempts, and course progress sync across dashboards so learners always know what is next.',
            footer: 'Quiz + progress APIs in use'
        }
    ];
    const learningTracks = [
        {
            title: 'Student experience',
            tag: 'Learner view',
            description: 'Personal dashboard shows enrollments, progress bars, and available quizzes pulled from real enrollments.',
            bullets: ['Track course completion %', 'Jump into lessons instantly', 'Attempt published quizzes']
        },
        {
            title: 'Instructor workspace',
            tag: 'Creator tools',
            description: 'Manage courses, upload materials, and publish quizzes directly from the instructor dashboard.',
            bullets: ['Course & lesson builders', 'Material uploads with previews', 'Quiz builder with publishing']
        },
        {
            title: 'Admin control',
            tag: 'Platform ops',
            description: 'Approve instructors, manage users, and monitor courses using the admin routes already in the codebase.',
            bullets: ['User approval queue', 'Course overview', 'Role-based access control']
        }
    ];
    const toolkit = [
        {
            icon: <FaPlayCircle className="text-3xl"/>,
            title: 'Lesson player',
            description: 'Stream uploaded lessons or fallback media straight from the course detail and watch pages.'
        },
        {
            icon: <FaLaptop className="text-3xl"/>,
            title: 'Course builder',
            description: 'Instructors scaffold curriculum, sections, and metadata with the builder flows already shipping.'
        },
        {
            icon: <FaUsers className="text-3xl"/>,
            title: 'Quiz engine',
            description: 'Publishable quizzes with attempts, scoring, and retakes keep assessments inside the platform.'
        },
        {
            icon: <FaBook className="text-3xl"/>,
            title: 'Material library',
            description: 'Upload PDFs, slides, or supporting files and make them available per course module.'
        }
    ];
    const supportPoints = [
        {
            icon: <FaUsers className="text-2xl text-blue-500"/>,
            title: 'Role-aware dashboards',
            description: 'Separate layouts for students, instructors, and admins so everyone sees the data they need.'
        },
        {
            icon: <FaClock className="text-2xl text-blue-500"/>,
            title: 'Progress snapshots',
            description: 'Dashboard cards compute live completion percentages from enrollment progress fields.'
        },
        {
            icon: <FaGraduationCap className="text-2xl text-blue-500"/>,
            title: 'Quiz history',
            description: 'Attempts are fetched per quiz so learners can review scores before re-taking assessments.'
        }
    ];
    const formatStatValue = (value, { decimals = 0 } = {}) => {
        if (statsLoading) {
            return '...';
        }
        if (value === null || value === undefined) {
            return '--';
        }
        const numericValue = Number(value);
        return decimals > 0 ? numericValue.toFixed(decimals) : numericValue.toLocaleString();
    };
    return (<div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-block mb-6">
              <span className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold">
                🎓 Learn. Grow. Succeed.
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.25)]">
              Build job-ready skills
              <span className="block text-yellow-200 md:text-yellow-100 drop-shadow-[0_3px_8px_rgba(0,0,0,0.35)]">
                with guided learning paths
              </span>
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              Stop piecing together tutorials. EduMaster gives you structured roadmaps, practice labs, and mentor feedback so you can learn confidently.
            </p>
            
            {!user ? (<div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
                <Link to="/student/register" className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-all shadow-xl hover:shadow-2xl hover:scale-105 flex items-center justify-center gap-2">
                  <FaRocket className="text-sm"/>
                  Get Started Free
                </Link>
                <Link to="/courses" className="bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-lg text-lg font-semibold border-2 border-white/30 hover:bg-white/20 transition-all">
                  Explore Courses
                </Link>
              </div>) : user.role === 'student' ? (<Link to="/dashboard" className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-all shadow-xl hover:shadow-2xl hover:scale-105">
                Go to Dashboard
                <FaArrowRight />
              </Link>) : user.role === 'instructor' ? (<Link to="/instructor/dashboard" className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-all shadow-xl hover:shadow-2xl hover:scale-105">
                Instructor Dashboard
                <FaArrowRight />
              </Link>) : null}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {!user && (<section className="py-12 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="transform hover:scale-105 transition-transform">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">{formatStatValue(stats?.activeStudents)}</div>
                <div className="text-gray-600 font-medium">Active Students</div>
              </div>
              <div className="transform hover:scale-105 transition-transform">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">{formatStatValue(stats?.expertCourses)}</div>
                <div className="text-gray-600 font-medium">Expert Courses</div>
              </div>
              <div className="transform hover:scale-105 transition-transform">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">{formatStatValue(stats?.instructors)}</div>
                <div className="text-gray-600 font-medium">Instructors</div>
              </div>
              <div className="transform hover:scale-105 transition-transform">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">{formatStatValue(stats?.averageRating, { decimals: 1 })}</div>
                <div className="text-gray-600 font-medium">Average Rating</div>
              </div>
            </div>
          </div>
        </section>)}

      {/* Differentiators Section */}
      {!user && (<section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                The EduMaster difference
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Structured, outcome-focused learning with real accountability
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {differentiators.map((item, index) => (<div key={index} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300">
                  <div className="text-sm font-semibold uppercase tracking-wide text-blue-500 mb-3">
                    {index === 0 ? 'Curriculum' : index === 1 ? 'Practice' : 'Support'}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{item.title}</h3>
                  <p className="text-gray-600 mb-6">{item.description}</p>
                  <div className="text-sm font-semibold bg-blue-50 text-blue-600 inline-flex px-4 py-2 rounded-full">
                    {item.footer}
                  </div>
                </div>))}
            </div>
          </div>
        </section>)}
      
      {/* Learning Tracks */}
      {!user && (<section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Designed for every learning goal
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Pick a path that matches where you are today and where you want to be next.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {learningTracks.map((track, index) => (<div key={index} className="p-8 rounded-2xl border border-gray-200 hover:border-blue-500 hover:shadow-xl transition-all duration-300">
                  <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full text-sm font-semibold bg-blue-50 text-blue-600 mb-4">
                    {track.tag}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{track.title}</h3>
                  <p className="text-gray-600 mb-6">{track.description}</p>
                  <ul className="space-y-3 text-sm text-gray-700">
                    {track.bullets.map((bullet, bulletIndex) => (<li key={bulletIndex} className="flex items-start gap-2">
                        <FaPlayCircle className="text-blue-500 mt-1 text-xs"/>
                        <span>{bullet}</span>
                      </li>))}
                  </ul>
                </div>))}
            </div>
          </div>
        </section>)}

      {/* Toolkit Section */}
      {!user && (<section className="py-20 bg-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10 mb-12">
              <div>
                <p className="uppercase text-sm tracking-[0.3em] text-blue-300 mb-3">Platform Toolkit</p>
                <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                  Everything you need to stay consistent
                </h2>
              </div>
              <p className="text-lg text-blue-100 max-w-2xl">
                From premium lessons to accountability nudges, every tool inside EduMaster pushes you to finish more and second-guess less.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {toolkit.map((item, index) => (<div key={index} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-blue-400 hover:bg-white/10 transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4">
                    {item.icon}
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-blue-100 text-sm">{item.description}</p>
                </div>))}
            </div>
          </div>
        </section>)}

      {/* Categories Section */}
      {!user && categories.length > 0 && (<section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Explore Categories
              </h2>
              <p className="text-lg text-gray-600">
                Find courses in your area of interest
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((category, index) => (<Link key={index} to={`/courses?category=${category}`} className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all duration-300 text-center group">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <FaBook className="text-white text-xl"/>
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {category}
                  </h3>
                </Link>))}
            </div>
          </div>
        </section>)}

      {/* Featured Courses Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
                Featured Courses
              </h2>
              <p className="text-lg text-gray-600">
                Handpicked courses to help you achieve your goals
              </p>
            </div>
            <Link to="/courses" className="hidden md:flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors group">
              View All Courses
              <FaArrowRight className="group-hover:translate-x-1 transition-transform"/>
            </Link>
          </div>

          {loading ? (<div className="flex justify-center items-center py-32">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
            </div>) : courses.length === 0 ? (<div className="text-center py-20">
              <FaBook className="text-6xl text-gray-300 mx-auto mb-4"/>
              <p className="text-gray-500 text-xl">No courses available. Check back soon!</p>
            </div>) : (<>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {courses.map((course) => (<div key={course._id} onClick={() => handleCourseClick(course._id)} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-2xl hover:border-blue-300 transition-all duration-300 cursor-pointer group transform hover:-translate-y-2">
                    <div className="relative h-48 bg-gray-200 overflow-hidden">
                      {course.thumbnail ? (<img src={getImageUrl(course.thumbnail)} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x250?text=Course';
                    }}/>) : (<div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                          <FaBook className="text-6xl text-blue-300"/>
                        </div>)}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 transform group-hover:scale-110 transition-transform">
                          <FaPlayCircle className="text-white text-4xl"/>
                        </div>
                      </div>
                      <div className="absolute top-4 left-4">
                        <span className="bg-blue-600 text-white px-3 py-1 rounded-md text-xs font-semibold shadow-lg">
                          {course.category}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1">
                          <FaStar className="text-yellow-400 text-sm"/>
                          <span className="text-sm font-semibold text-gray-700">{course.rating || 4.5}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <FaUsers className="text-xs"/>
                            {course.enrolledStudents}
                          </span>
                          <span className="flex items-center gap-1">
                            <FaBook className="text-xs"/>
                            {course.totalLessons}
                          </span>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {course.title}
                      </h3>
                      
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {course.description}
                      </p>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Instructor</p>
                          <p className="text-sm font-medium text-gray-900">{course.instructor.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            {course.price === 0 ? 'Free' : `$${course.price}`}
                          </p>
                        </div>
                      </div>
                      
                      <button className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl">
                        Enroll Now
                        <FaArrowRight className="text-sm"/>
                      </button>
                    </div>
                  </div>))}
              </div>
              
              <div className="text-center md:hidden">
                <Link to="/courses" className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg">
                  View All Courses
                  <FaArrowRight />
                </Link>
              </div>
            </>)}
        </div>
      </section>

      {/* Support Section */}
      {!user && (<section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Guidance when you actually need it
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Learning online shouldn&apos;t feel lonely. EduMaster pairs self-paced content with real human support.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {supportPoints.map((point, index) => (<div key={index} className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300">
                  <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                    {point.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{point.title}</h3>
                  <p className="text-gray-600 text-sm">{point.description}</p>
                </div>))}
            </div>
          </div>
        </section>)}

      {/* CTA Section */}
      {!user && (<section className="py-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Start Learning?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of students already learning on EduMaster
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/student/register" className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-all shadow-xl hover:shadow-2xl hover:scale-105 flex items-center justify-center gap-2">
                <FaRocket className="text-sm"/>
                Get Started Free
              </Link>
              <Link to="/courses" className="bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-lg text-lg font-semibold border-2 border-white/30 hover:bg-white/20 transition-all">
                Browse Courses
              </Link>
            </div>
          </div>
        </section>)}
    </div>);
};
export default Home;
