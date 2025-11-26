import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import InstructorSidebar from '../components/InstructorSidebar';
import { FaVideo, FaFile, FaPlusCircle, FaTrash, FaEdit, FaLink, FaFilePdf, FaYoutube, FaPlay, FaImage } from 'react-icons/fa';
import { getYouTubeThumbnail, getYouTubeEmbedUrl, isYouTubeUrl } from '../utils/videoUtils';

interface Lesson {
  _id: string;
  title: string;
  description: string;
  videoUrl: string;
  materials: Array<{ name: string; fileUrl: string }>;
  order: number;
  course: {
    _id: string;
    title: string;
  };
}

interface Material {
  _id: string;
  title: string;
  description: string;
  type: 'video' | 'document' | 'link' | 'file';
  url: string;
  fileUrl?: string;
  fileName?: string;
}

const InstructorMaterials: React.FC = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'lessons' | 'materials'>('all');
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string>('');
  const [selectedVideoTitle, setSelectedVideoTitle] = useState<string>('');
  const [newMaterial, setNewMaterial] = useState<Partial<Material>>({
    title: '',
    description: '',
    type: 'video',
    url: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      // Fetch all courses first, then get lessons
      const coursesResponse = await axios.get('/api/courses/instructor/my-courses');
      const courses = coursesResponse.data;
      
      // Get lessons for all courses
      const allLessons: Lesson[] = [];
      for (const course of courses) {
        try {
          const courseResponse = await axios.get(`/api/courses/${course._id || course.id}`);
          if (courseResponse.data.course.lessons) {
            const courseLessons = courseResponse.data.course.lessons.map((lesson: any) => ({
              ...lesson,
              course: { _id: course._id || course.id, title: course.title }
            }));
            allLessons.push(...courseLessons);
          }
        } catch (error) {
          console.error(`Error fetching lessons for course ${course._id}:`, error);
        }
      }
      
      setLessons(allLessons);

      // Fetch independent materials
      const materialsResponse = await axios.get('/api/materials');
      setMaterials(materialsResponse.data);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterial.title || !newMaterial.url) {
      alert('Please fill in title and URL');
      return;
    }

    setSaving(true);
    try {
      if (newMaterial._id) {
        await axios.put(`/api/materials/${newMaterial._id}`, newMaterial);
        alert('Material updated successfully!');
      } else {
        await axios.post('/api/materials', newMaterial);
        alert('Material added successfully!');
      }
      setShowAddModal(false);
      setNewMaterial({ title: '', description: '', type: 'video', url: '' });
      fetchMaterials();
    } catch (error: any) {
      console.error('Error adding material:', error);
      alert(error.response?.data?.message || 'Error adding material');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMaterial = async (materialId: string, materialTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${materialTitle}"?`)) {
      return;
    }

    try {
      await axios.delete(`/api/materials/${materialId}`);
      alert('Material deleted successfully!');
      fetchMaterials();
    } catch (error: any) {
      console.error('Error deleting material:', error);
      alert(error.response?.data?.message || 'Failed to delete material');
    }
  };

  const handleDeleteLesson = async (lessonId: string, courseId: string, lessonTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${lessonTitle}"?`)) {
      return;
    }

    try {
      await axios.delete(`/api/courses/${courseId}/lessons/${lessonId}`);
      alert('Lesson deleted successfully!');
      fetchMaterials();
    } catch (error: any) {
      console.error('Error deleting lesson:', error);
      alert(error.response?.data?.message || 'Failed to delete lesson');
    }
  };

  const handlePlayVideo = (videoUrl: string, title: string) => {
    setSelectedVideoUrl(videoUrl);
    setSelectedVideoTitle(title);
    setShowVideoModal(true);
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <FaYoutube className="text-red-600 text-xl" />;
      case 'document':
        return <FaFilePdf className="text-red-600 text-xl" />;
      case 'file':
        return <FaFile className="text-blue-600 text-xl" />;
      case 'link':
        return <FaLink className="text-green-600 text-xl" />;
      default:
        return <FaFile className="text-gray-600 text-xl" />;
    }
  };

  const getDisplayItems = () => {
    switch (activeTab) {
      case 'lessons':
        return lessons.map(lesson => ({ type: 'lesson', data: lesson }));
      case 'materials':
        return materials.map(material => ({ type: 'material', data: material }));
      default:
        return [
          ...lessons.map(lesson => ({ type: 'lesson', data: lesson })),
          ...materials.map(material => ({ type: 'material', data: material }))
        ];
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <InstructorSidebar />
        <div className="flex-1 ml-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  const displayItems = getDisplayItems();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <InstructorSidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Videos & Materials</h1>
              <p className="text-gray-600">Manage your course videos and learning materials</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setNewMaterial({ title: '', description: '', type: 'video', url: '' });
                  setShowAddModal(true);
                }}
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <FaPlusCircle />
                Add Material
              </button>
              <Link
                to="/instructor/courses/create"
                className="bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <FaPlusCircle />
                Create Course
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex gap-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'all'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-indigo-600'
              }`}
            >
              All ({lessons.length + materials.length})
            </button>
            <button
              onClick={() => setActiveTab('lessons')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'lessons'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-indigo-600'
              }`}
            >
              Course Videos ({lessons.length})
            </button>
            <button
              onClick={() => setActiveTab('materials')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'materials'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-indigo-600'
              }`}
            >
              Independent Materials ({materials.length})
            </button>
          </div>

          {displayItems.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-16 text-center">
              <FaVideo className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No Materials Yet</h3>
              <p className="text-gray-600 mb-8">
                Add videos from your courses or create independent materials.
              </p>
              <button
                onClick={() => {
                  setNewMaterial({ title: '', description: '', type: 'video', url: '' });
                  setShowAddModal(true);
                }}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-indigo-700 transition-all duration-300"
              >
                <FaPlusCircle />
                Add Your First Material
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Course Lessons */}
              {(activeTab === 'all' || activeTab === 'lessons') && lessons.map((lesson) => {
                const thumbnailUrl = lesson.videoUrl && isYouTubeUrl(lesson.videoUrl) 
                  ? getYouTubeThumbnail(lesson.videoUrl) 
                  : null;
                
                return (
                  <div
                    key={`lesson-${lesson._id}`}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
                  >
                    {/* Thumbnail */}
                    {thumbnailUrl ? (
                      <div className="relative h-48 bg-gray-200">
                        <img
                          src={thumbnailUrl}
                          alt={lesson.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        {lesson.videoUrl && (
                          <button
                            onClick={() => handlePlayVideo(lesson.videoUrl, lesson.title)}
                            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-50 transition-all group"
                          >
                            <div className="bg-white bg-opacity-90 rounded-full p-4 group-hover:scale-110 transition-transform">
                              <FaPlay className="text-indigo-600 text-2xl ml-1" />
                            </div>
                          </button>
                        )}
                      </div>
                    ) : lesson.videoUrl ? (
                      <div className="relative h-48 bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                        <button
                          onClick={() => handlePlayVideo(lesson.videoUrl, lesson.title)}
                          className="bg-white bg-opacity-90 rounded-full p-4 hover:scale-110 transition-transform"
                        >
                          <FaPlay className="text-indigo-600 text-2xl ml-1" />
                        </button>
                      </div>
                    ) : (
                      <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                        <FaVideo className="text-4xl text-gray-400" />
                      </div>
                    )}

                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            Lesson {lesson.order}
                          </span>
                        </div>
                        <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                          Course Video
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 min-h-[3rem]">
                        {lesson.title}
                      </h3>
                      
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[2.5rem]">
                        {lesson.description || 'No description'}
                      </p>
                      
                      <div className="mb-4 space-y-2">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Course</p>
                          <p className="text-sm font-medium text-indigo-600">{lesson.course.title}</p>
                        </div>
                        {lesson.materials && lesson.materials.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Materials ({lesson.materials.length})</p>
                            <div className="space-y-1">
                              {lesson.materials.slice(0, 2).map((mat, idx) => (
                                <a
                                  key={idx}
                                  href={mat.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline block"
                                >
                                  📎 {mat.name}
                                </a>
                              ))}
                              {lesson.materials.length > 2 && (
                                <p className="text-xs text-gray-500">+{lesson.materials.length - 2} more</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {lesson.videoUrl && (
                          <button
                            onClick={() => handlePlayVideo(lesson.videoUrl, lesson.title)}
                            className="flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-all duration-300 flex items-center justify-center gap-2"
                          >
                            <FaPlay className="text-sm" />
                            Play
                          </button>
                        )}
                        <Link
                          to={`/instructor/courses/${lesson.course._id}/edit`}
                          className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-all duration-300 text-center flex items-center justify-center gap-2"
                        >
                          <FaEdit className="text-sm" />
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDeleteLesson(lesson._id, lesson.course._id, lesson.title)}
                          className="bg-red-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-red-700 transition-all duration-300 flex items-center justify-center gap-2"
                        >
                          <FaTrash className="text-sm" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Independent Materials */}
              {(activeTab === 'all' || activeTab === 'materials') && materials.map((material) => {
                const thumbnailUrl = material.type === 'video' && isYouTubeUrl(material.url)
                  ? getYouTubeThumbnail(material.url)
                  : null;

                return (
                  <div
                    key={`material-${material._id}`}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
                  >
                    {/* Thumbnail */}
                    {thumbnailUrl ? (
                      <div className="relative h-48 bg-gray-200">
                        <img
                          src={thumbnailUrl}
                          alt={material.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        {material.type === 'video' && (
                          <button
                            onClick={() => handlePlayVideo(material.url, material.title)}
                            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-50 transition-all group"
                          >
                            <div className="bg-white bg-opacity-90 rounded-full p-4 group-hover:scale-110 transition-transform">
                              <FaPlay className="text-indigo-600 text-2xl ml-1" />
                            </div>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="h-48 bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                        <div className="bg-white bg-opacity-20 p-4 rounded-xl">
                          {getMaterialIcon(material.type)}
                        </div>
                      </div>
                    )}

                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="bg-purple-100 p-2 rounded-lg">
                          {getMaterialIcon(material.type)}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded capitalize">
                            {material.type}
                          </span>
                          <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                            Independent
                          </span>
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 min-h-[3rem]">
                        {material.title}
                      </h3>
                      
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[2.5rem]">
                        {material.description || 'No description'}
                      </p>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {material.type === 'video' && (
                          <button
                            onClick={() => handlePlayVideo(material.url, material.title)}
                            className="flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-all duration-300 flex items-center justify-center gap-2"
                          >
                            <FaPlay className="text-sm" />
                            Play
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setNewMaterial(material);
                            setShowAddModal(true);
                          }}
                          className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-all duration-300 flex items-center justify-center gap-2"
                        >
                          <FaEdit className="text-sm" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteMaterial(material._id, material.title)}
                          className="bg-red-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-red-700 transition-all duration-300 flex items-center justify-center gap-2"
                        >
                          <FaTrash className="text-sm" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Video Player Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">{selectedVideoTitle}</h2>
              <button
                onClick={() => {
                  setShowVideoModal(false);
                  setSelectedVideoUrl('');
                  setSelectedVideoTitle('');
                }}
                className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
              {isYouTubeUrl(selectedVideoUrl) ? (
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src={getYouTubeEmbedUrl(selectedVideoUrl) || ''}
                    className="absolute top-0 left-0 w-full h-full rounded-lg"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={selectedVideoTitle}
                  />
                </div>
              ) : (
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <video
                    controls
                    className="absolute top-0 left-0 w-full h-full rounded-lg"
                    src={selectedVideoUrl}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Material Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {newMaterial._id ? 'Edit Material' : 'Add New Material'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewMaterial({ title: '', description: '', type: 'video', url: '' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMaterial} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  value={newMaterial.title || ''}
                  onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                  placeholder="Enter material title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  value={newMaterial.description || ''}
                  onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                  placeholder="Enter description (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type *
                </label>
                <select
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  value={newMaterial.type || 'video'}
                  onChange={(e) => setNewMaterial({ ...newMaterial, type: e.target.value as any })}
                >
                  <option value="video">Video (YouTube, etc.)</option>
                  <option value="document">Document (PDF, etc.)</option>
                  <option value="link">Link</option>
                  <option value="file">File</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL *
                </label>
                <input
                  type="url"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  value={newMaterial.url || ''}
                  onChange={(e) => setNewMaterial({ ...newMaterial, url: e.target.value })}
                  placeholder="https://youtube.com/watch?v=... or https://example.com/file.pdf"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter YouTube URL, document link, or any resource URL
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewMaterial({ title: '', description: '', type: 'video', url: '' });
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : newMaterial._id ? 'Update Material' : 'Add Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorMaterials;
