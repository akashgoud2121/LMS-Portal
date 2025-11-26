import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';
import { getImageUrl } from '../utils/imageUtils';
import { showToast } from '../utils/toast';
import { FaBook, FaCheckCircle, FaUsers, FaBookOpen } from 'react-icons/fa';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  instructor: {
    name: string;
    email: string;
  };
  category: string;
  isPublished: boolean;
  totalLessons: number;
  enrolledStudents: number;
  createdAt: string;
}

const AdminCourses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await axios.get('/api/admin/courses');
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (courseId: string, currentStatus: boolean) => {
    try {
      await axios.put(`/api/admin/courses/${courseId}/publish`, {
        isPublished: !currentStatus
      });
      fetchCourses();
      showToast.success(`Course ${!currentStatus ? 'published' : 'unpublished'} successfully`);
    } catch (error) {
      showToast.error('Failed to update course status');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <FaBook className="text-3xl mb-2" />
          <div className="text-3xl font-bold">{courses.length}</div>
          <div className="text-sm opacity-90">Total Courses</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <FaCheckCircle className="text-3xl mb-2" />
          <div className="text-3xl font-bold">{courses.filter(c => c.isPublished).length}</div>
          <div className="text-sm opacity-90">Published</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <FaUsers className="text-3xl mb-2" />
          <div className="text-3xl font-bold">{courses.reduce((sum, c) => sum + (c.enrolledStudents || 0), 0)}</div>
          <div className="text-sm opacity-90">Total Enrollments</div>
        </div>
      </div>

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <FaBook className="text-6xl text-gray-400 mb-4 mx-auto" />
          <p className="text-gray-500 text-lg">No courses found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 border-transparent hover:border-blue-500"
            >
              {/* Course Thumbnail */}
              {course.thumbnail && (
                <div className="relative overflow-hidden h-48 bg-gray-200">
                  <img
                    src={getImageUrl(course.thumbnail)}
                    alt={course.title}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x250?text=Course+Image';
                    }}
                  />
                </div>
              )}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{course.title}</h3>
                    <p className="text-xs text-gray-500 mb-2">{course.category}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    course.isPublished
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {course.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.description}</p>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4 pb-4 border-b border-gray-200">
                  <div>
                    <p className="font-medium text-gray-700">{course.instructor.name}</p>
                    <p className="text-xs">{course.instructor.email}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-gray-600 flex items-center gap-1">
                    <FaBookOpen className="text-blue-500" />
                    {course.totalLessons} lessons
                  </span>
                  <span className="text-gray-600 flex items-center gap-1">
                    <FaUsers className="text-purple-500" />
                    {course.enrolledStudents || 0} students
                  </span>
                </div>

                <button
                  onClick={() => handleTogglePublish(course.id, course.isPublished)}
                  className={`w-full py-2.5 rounded-lg font-semibold transition-all duration-200 hover:scale-105 ${
                    course.isPublished
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {course.isPublished ? 'Unpublish' : 'Publish'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminCourses;
