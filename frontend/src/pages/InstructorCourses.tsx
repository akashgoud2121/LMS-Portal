import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import InstructorSidebar from '../components/InstructorSidebar';
import { getImageUrl } from '../utils/imageUtils';
import { 
  FaBook, 
  FaUsers, 
  FaGraduationCap, 
  FaPlusCircle, 
  FaEdit,
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaRocket,
  FaSearch,
  FaFilter,
  FaSort,
  FaList,
  FaTh,
  FaChevronDown
} from 'react-icons/fa';

interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnail: string;
  category: string;
  isPublished: boolean;
  totalLessons: number;
  enrolledStudents: number;
  createdAt: string;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'newest' | 'oldest' | 'title' | 'students' | 'lessons';
type FilterOption = 'all' | 'published' | 'draft';

const InstructorCourses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await axios.get('/api/courses/instructor/my-courses');
      if (Array.isArray(response.data)) {
        setCourses(response.data);
      } else {
        setCourses([]);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (courseId: string, currentStatus: boolean) => {
    try {
      await axios.put(`/api/courses/${courseId}`, {
        isPublished: !currentStatus
      });
      fetchCourses();
    } catch (error) {
      console.error('Error toggling publish status:', error);
      alert('Failed to update course status');
    }
  };

  const handleDeleteCourse = async (courseId: string, courseTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${courseTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await axios.delete(`/api/courses/${courseId}`);
      alert('Course deleted successfully!');
      fetchCourses();
    } catch (error: any) {
      console.error('Error deleting course:', error);
      alert(error.response?.data?.message || 'Failed to delete course');
    }
  };

  // Filter and sort courses
  const filteredAndSortedCourses = courses
    .filter(course => {
      // Filter by status
      if (filterBy === 'published' && !course.isPublished) return false;
      if (filterBy === 'draft' && course.isPublished) return false;
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          course.title.toLowerCase().includes(query) ||
          course.description.toLowerCase().includes(query) ||
          course.category?.toLowerCase().includes(query)
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'students':
          return (b.enrolledStudents || 0) - (a.enrolledStudents || 0);
        case 'lessons':
          return (b.totalLessons || 0) - (a.totalLessons || 0);
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <InstructorSidebar />
        <div className="flex-1 ml-64 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading courses...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <InstructorSidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Course Management</h1>
                <p className="text-gray-600 text-lg">
                  Manage, organize, and track all your courses
                </p>
              </div>
              <Link
                to="/instructor/courses/create"
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <FaPlusCircle />
                Create New Course
              </Link>
            </div>

            {/* Search and Filters Bar */}
            <div className="bg-white rounded-xl shadow-md p-4 mb-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search courses by title, description, or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded transition-all ${
                      viewMode === 'grid'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <FaTh />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded transition-all ${
                      viewMode === 'list'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <FaList />
                  </button>
                </div>

                {/* Filter Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all font-medium text-gray-700"
                  >
                    <FaFilter />
                    Filter
                    <FaChevronDown className={`text-xs transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showFilters && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-10">
                      <div className="p-4 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                          <div className="space-y-2">
                            {(['all', 'published', 'draft'] as FilterOption[]).map((option) => (
                              <label key={option} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="filter"
                                  value={option}
                                  checked={filterBy === option}
                                  onChange={(e) => setFilterBy(e.target.value as FilterOption)}
                                  className="text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-sm text-gray-700 capitalize">{option}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                          <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="title">Title (A-Z)</option>
                            <option value="students">Most Students</option>
                            <option value="lessons">Most Lessons</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Active Filters Display */}
              {(filterBy !== 'all' || searchQuery) && (
                <div className="flex items-center gap-2 mt-4 flex-wrap">
                  <span className="text-sm text-gray-600">Active filters:</span>
                  {filterBy !== 'all' && (
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium capitalize">
                      {filterBy}
                    </span>
                  )}
                  {searchQuery && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                      Search: "{searchQuery}"
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setFilterBy('all');
                      setSearchQuery('');
                    }}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredAndSortedCourses.length}</span> of{' '}
              <span className="font-semibold text-gray-900">{courses.length}</span> courses
            </p>
          </div>

          {/* Courses Display */}
          {filteredAndSortedCourses.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-16 text-center">
              <FaBook className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {searchQuery || filterBy !== 'all' ? 'No Courses Found' : 'No Courses Yet'}
              </h3>
              <p className="text-gray-600 mb-8">
                {searchQuery || filterBy !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Create your first course to get started!'}
              </p>
              {!searchQuery && filterBy === 'all' && (
                <Link
                  to="/instructor/courses/create"
                  className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-indigo-700 transition-all duration-300"
                >
                  <FaPlusCircle />
                  Create Your First Course
                </Link>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedCourses.map((course) => (
                <div
                  key={course._id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  {/* Thumbnail */}
                  <div className="relative h-48 bg-gradient-to-br from-indigo-400 to-purple-500">
                    {course.thumbnail ? (
                      <img
                        src={getImageUrl(course.thumbnail)}
                        alt={course.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FaBook className="text-6xl text-white opacity-50" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold shadow-lg ${
                          course.isPublished
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-700 text-white'
                        }`}
                      >
                        {course.isPublished ? (
                          <span className="flex items-center gap-1">
                            <FaEye className="text-xs" />
                            Published
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <FaEyeSlash className="text-xs" />
                            Draft
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="mb-3">
                      <span className="text-xs font-semibold text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full">
                        {course.category || 'Uncategorized'}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem]">
                      {course.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[2.5rem]">
                      {course.description}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4 pb-4 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <FaGraduationCap className="text-indigo-500" />
                        <span>{course.totalLessons || 0} lessons</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaUsers className="text-purple-500" />
                        <span>{course.enrolledStudents || 0} students</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Link
                          to={`/instructor/courses/${course._id}/edit`}
                          className="flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-all duration-300 text-center flex items-center justify-center gap-2"
                        >
                          <FaEdit className="text-sm" />
                          Edit
                        </Link>
                        <button
                          onClick={() => handleTogglePublish(course._id, course.isPublished)}
                          className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                            course.isPublished
                              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {course.isPublished ? (
                            <>
                              <FaEyeSlash className="text-sm" />
                              Unpublish
                            </>
                          ) : (
                            <>
                              <FaRocket className="text-sm" />
                              Publish
                            </>
                          )}
                        </button>
                      </div>
                      <button
                        onClick={() => handleDeleteCourse(course._id, course.title)}
                        className="w-full bg-red-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-red-700 transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        <FaTrash className="text-sm" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Course</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Lessons</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Students</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAndSortedCourses.map((course) => (
                    <tr key={course._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center overflow-hidden">
                            {course.thumbnail ? (
                              <img
                                src={getImageUrl(course.thumbnail)}
                                alt={course.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <FaBook className="text-2xl text-white opacity-50" />
                            )}
                          </div>
                          <div>
                            <Link
                              to={`/instructor/courses/${course._id}/edit`}
                              className="font-bold text-gray-900 hover:text-indigo-600 transition-colors"
                            >
                              {course.title}
                            </Link>
                            <p className="text-sm text-gray-600 line-clamp-1 mt-1">{course.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full">
                          {course.category || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        <div className="flex items-center gap-2">
                          <FaGraduationCap className="text-indigo-500" />
                          {course.totalLessons || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        <div className="flex items-center gap-2">
                          <FaUsers className="text-purple-500" />
                          {course.enrolledStudents || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            course.isPublished
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {course.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/instructor/courses/${course._id}/edit`}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <FaEdit />
                          </Link>
                          <button
                            onClick={() => handleTogglePublish(course._id, course.isPublished)}
                            className={`p-2 rounded-lg transition-colors ${
                              course.isPublished
                                ? 'text-gray-600 hover:bg-gray-100'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={course.isPublished ? 'Unpublish' : 'Publish'}
                          >
                            {course.isPublished ? <FaEyeSlash /> : <FaRocket />}
                          </button>
                          <button
                            onClick={() => handleDeleteCourse(course._id, course.title)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstructorCourses;
