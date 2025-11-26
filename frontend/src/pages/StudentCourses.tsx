import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { getImageUrl } from '../utils/imageUtils';
import StudentSidebar from '../components/StudentSidebar';
import { FaBook, FaUser, FaPlay, FaCheckCircle, FaLock } from 'react-icons/fa';

interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnail: string;
  instructor: {
    name: string;
    avatar?: string;
  };
  category: string;
  price: number;
  totalLessons: number;
  enrolledStudents: number;
  rating: number;
}

const StudentCourses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);
  const [filterEnrolled, setFilterEnrolled] = useState<'all' | 'enrolled' | 'not-enrolled'>('all');

  useEffect(() => {
    fetchCourses();
    fetchEnrollments();
  }, [category, search]);

  const fetchCourses = async () => {
    try {
      const params: any = {};
      if (category) params.category = category;
      if (search) params.search = search;

      const response = await axios.get('/api/courses', { params });
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    try {
      const response = await axios.get('/api/enrollments/my-enrollments');
      const ids = response.data.map((e: any) => e.course._id);
      setEnrolledCourseIds(ids);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    }
  };

  const categories = ['All', 'Web Development', 'Data Science', 'Design', 'Business', 'Programming', 'Other'];

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Enroll Courses</h1>
            <p className="text-gray-600">Discover and enroll in new courses to expand your knowledge</p>
          </div>

          {/* Search and Filter */}
          <div className="mb-8 flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search courses..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="md:w-48">
              <select
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat === 'All' ? '' : cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:w-48">
              <select
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                value={filterEnrolled}
                onChange={(e) => setFilterEnrolled(e.target.value as 'all' | 'enrolled' | 'not-enrolled')}
              >
                <option value="all">All Courses</option>
                <option value="enrolled">Enrolled Only</option>
                <option value="not-enrolled">Not Enrolled</option>
              </select>
            </div>
          </div>

          {/* Courses Grid */}
          {courses.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 mb-4">
                  <FaBook className="text-3xl text-blue-600" />
                </div>
              </div>
              <p className="text-gray-500 text-lg">No courses found. Try different search terms.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses
                .filter((course) => {
                  const isEnrolled = enrolledCourseIds.includes(course._id);
                  if (filterEnrolled === 'enrolled') return isEnrolled;
                  if (filterEnrolled === 'not-enrolled') return !isEnrolled;
                  return true;
                })
                .map((course) => {
                const isEnrolled = enrolledCourseIds.includes(course._id);
                return (
                  <div
                    key={course._id}
                    className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-2xl hover:scale-[1.02] hover:border-blue-200 transition-all duration-300 group relative"
                  >
                    {/* Clear Enrollment Status Badge */}
                    <div className={`absolute top-4 right-4 z-10 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg ${
                      isEnrolled 
                        ? 'bg-green-500 text-white' 
                        : 'bg-blue-500 text-white'
                    }`}>
                      {isEnrolled ? (
                        <span className="flex items-center gap-1.5">
                          <FaCheckCircle />
                          Enrolled
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <FaLock />
                          Not Enrolled
                        </span>
                      )}
                    </div>
                    
                    {course.thumbnail && (
                      <div className="relative overflow-hidden">
                        <img
                          src={getImageUrl(course.thumbnail)}
                          alt={course.title}
                          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-700"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x250?text=Course+Image';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300 line-clamp-2">
                        {course.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {course.description}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                        <div className="flex items-center gap-2">
                          <FaUser className="text-xs" />
                          <span className="font-medium">{course.instructor.name}</span>
                        </div>
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold">{course.category}</span>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                        <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                          {course.price === 0 ? 'Free' : `$${course.price}`}
                        </span>
                        <span className="text-sm text-gray-500">
                          {course.totalLessons} lessons • {course.enrolledStudents} students
                        </span>
                      </div>
                      <Link
                        to={`/courses/${course._id}`}
                        className={`mt-4 block w-full text-center py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg ${
                          isEnrolled
                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                        }`}
                      >
                        {isEnrolled ? (
                          <span className="flex items-center justify-center gap-2">
                            <FaPlay className="text-sm" />
                            Access Course
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <FaBook className="text-sm" />
                            View & Enroll
                          </span>
                        )}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentCourses;

