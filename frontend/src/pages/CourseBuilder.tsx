import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getImageUrl } from '../utils/imageUtils';
import { showToast } from '../utils/toast';

interface Lesson {
  _id?: string;
  title: string;
  description: string;
  videoUrl: string;
  videoFile: string;
  materials: Array<{ name: string; fileUrl: string }>;
  order: number;
  duration: number;
}

interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnail: string;
  category: string;
  price: number;
  isPublished: boolean;
  lessons: Lesson[];
}

const CourseBuilder: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [course, setCourse] = useState<Partial<Course>>({
    title: '',
    description: '',
    category: '',
    price: 0,
    thumbnail: '',
    lessons: []
  });

  useEffect(() => {
    if (isEditing) {
      fetchCourse();
    }
  }, [id]);

  const fetchCourse = async () => {
    try {
      const response = await axios.get(`/api/courses/${id}`);
      setCourse(response.data.course);
      if (response.data.course.thumbnail) {
        setThumbnailPreview(getImageUrl(response.data.course.thumbnail));
      }
    } catch (error) {
      console.error('Error fetching course:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match('image.*')) {
      showToast.warning('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast.warning('File size must be less than 5MB');
      return;
    }

    setUploadingThumbnail(true);
    const formData = new FormData();
    formData.append('thumbnail', file);

    try {
      const response = await axios.post('/api/upload/thumbnail', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // The backend returns /uploads/filename.jpg
      // Store the relative path in the course (it will be saved to DB)
      // Use getImageUrl helper for display
      const fileUrl = response.data.fileUrl;
      const displayUrl = getImageUrl(fileUrl);
      
      console.log('Upload successful:', {
        fileUrl,
        displayUrl,
        response: response.data
      });
      
      // Store the relative path in course.thumbnail (e.g., /uploads/filename.jpg)
      // This will be saved to the database
      setCourse({ ...course, thumbnail: fileUrl });
      // Set preview to the full URL for display
      setThumbnailPreview(displayUrl);
      
      // Clear the file input so user can upload again if needed
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      showToast.success('Thumbnail uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading thumbnail:', error);
      showToast.error(error.response?.data?.message || 'Error uploading image');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (isEditing) {
        await axios.put(`/api/courses/${id}`, course);
      } else {
        const response = await axios.post('/api/courses', course);
        // Backend now returns both 'id' and '_id' for compatibility
        const courseId = response.data._id || response.data.id;
        if (!courseId) {
          console.error('Course ID not found in response:', response.data);
          showToast.error('Course created but ID not found. Please refresh the page.');
          navigate('/instructor/dashboard');
          return;
        }
        showToast.success('Course created successfully!');
        navigate(`/instructor/courses/${courseId}/edit`);
        return;
      }
      showToast.success('Course saved successfully!');
      navigate('/instructor/dashboard');
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Error saving course');
    } finally {
      setSaving(false);
    }
  };

  const handleAddLesson = () => {
    const newLesson: Lesson = {
      title: '',
      description: '',
      videoUrl: '',
      videoFile: '',
      materials: [],
      order: (course.lessons?.length || 0) + 1,
      duration: 0
    };
    setCourse({
      ...course,
      lessons: [...(course.lessons || []), newLesson]
    });
  };

  const handleLessonChange = (index: number, field: keyof Lesson, value: any) => {
    const updatedLessons = [...(course.lessons || [])];
    updatedLessons[index] = {
      ...updatedLessons[index],
      [field]: value
    };
    setCourse({ ...course, lessons: updatedLessons });
  };

  const handleDeleteLesson = async (index: number, lessonId?: string) => {
    if (!window.confirm('Are you sure you want to delete this lesson?')) return;

    if (lessonId && isEditing) {
      try {
        await axios.delete(`/api/courses/${id}/lessons/${lessonId}`);
        fetchCourse();
      } catch (error) {
        console.error('Error deleting lesson:', error);
      }
    } else {
      const updatedLessons = [...(course.lessons || [])];
      updatedLessons.splice(index, 1);
      updatedLessons.forEach((lesson, idx) => {
        lesson.order = idx + 1;
      });
      setCourse({ ...course, lessons: updatedLessons });
    }
  };

  const handleAddLessonToCourse = async (index: number) => {
    if (!isEditing || !id) {
      showToast.warning('Please save the course first before adding lessons');
      return;
    }

    const lesson = course.lessons![index];
    
    // Validate required fields
    if (!lesson.title || lesson.title.trim() === '') {
      showToast.warning('Please enter a lesson title');
      return;
    }

    // Prepare lesson data for API
    const lessonData = {
      title: lesson.title.trim(),
      description: lesson.description || '',
      videoUrl: lesson.videoUrl || '',
      videoFile: lesson.videoFile || '',
      materials: lesson.materials || [],
      duration: lesson.duration || 0
    };

    console.log('Saving lesson with data:', {
      title: lessonData.title,
      videoUrl: lessonData.videoUrl,
      courseId: id
    });

    try {
      const response = await axios.post(`/api/courses/${id}/lessons`, lessonData);
      console.log('Lesson saved successfully:', response.data);
      fetchCourse();
      showToast.success('Lesson added successfully!');
    } catch (error: any) {
      console.error('Error adding lesson:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors?.[0]?.msg || 
                          error.response?.data?.errors?.[0]?.message ||
                          error.message ||
                          'Error adding lesson';
      showToast.error(`Failed to save lesson: ${errorMessage}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pr-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {isEditing ? 'Edit Course' : 'Create New Course'}
        </h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Title *
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                value={course.title || ''}
                onChange={(e) => setCourse({ ...course, title: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                required
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                value={course.description || ''}
                onChange={(e) => setCourse({ ...course, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  value={course.category || ''}
                  onChange={(e) => setCourse({ ...course, category: e.target.value })}
                  placeholder="e.g., Web Development"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price ($)
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  value={course.price || 0}
                  onChange={(e) => setCourse({ ...course, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Thumbnail
              </label>
              
              {/* Thumbnail Preview */}
              {thumbnailPreview && (
                <div className="mb-4">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="w-full h-48 object-cover rounded-lg border border-gray-300"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      console.error('Failed to load image:', thumbnailPreview);
                      
                      // Try alternative URL formats
                      if (thumbnailPreview.startsWith('http://localhost:5000')) {
                        // Try relative path through proxy
                        const relativePath = thumbnailPreview.replace('http://localhost:5000', '');
                        img.src = relativePath;
                      } else if (thumbnailPreview.startsWith('/uploads')) {
                        // Try full backend URL
                        img.src = `http://localhost:5000${thumbnailPreview}`;
                      } else {
                        // Show placeholder
                        img.style.display = 'none';
                        const parent = img.parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div class="w-full h-48 bg-gray-200 rounded-lg border border-gray-300 flex items-center justify-center">
                              <p class="text-gray-500 text-sm">Image failed to load</p>
                            </div>
                          `;
                        }
                      }
                    }}
                    onLoad={() => {
                      console.log('Image loaded successfully:', thumbnailPreview);
                    }}
                  />
                </div>
              )}

              {/* Upload Option */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Image
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailUpload}
                      className="hidden"
                      disabled={uploadingThumbnail}
                    />
                    <div className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 transition-colors">
                      {uploadingThumbnail ? (
                        <span className="text-gray-500">Uploading...</span>
                      ) : (
                        <span className="text-gray-600">📷 Choose Image (Max 5MB)</span>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              {/* URL Option */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or Enter Image URL
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  value={course.thumbnail || ''}
                  onChange={(e) => {
                    const newUrl = e.target.value;
                    setCourse({ ...course, thumbnail: newUrl });
                    // Update preview with the new URL
                    if (newUrl) {
                      setThumbnailPreview(getImageUrl(newUrl));
                    } else {
                      setThumbnailPreview('');
                    }
                  }}
                  placeholder="/uploads/filename.jpg or https://example.com/image.jpg"
                />
                <p className="mt-1 text-xs text-gray-500">
                  You can either upload an image or paste an image URL (supports /uploads/ paths or full URLs)
                </p>
                {course.thumbnail && (
                  <p className="mt-1 text-xs text-blue-600">
                    Current: {course.thumbnail}
                  </p>
                )}
              </div>
            </div>

            {/* Lessons Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Lessons
                </label>
                <button
                  type="button"
                  onClick={handleAddLesson}
                  className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                >
                  Add Lesson
                </button>
              </div>

              <div className="space-y-4">
                {(course.lessons || []).map((lesson, index) => (
                  <div key={index} className="border border-gray-300 rounded-md p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Lesson {lesson.order}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteLesson(index, lesson._id)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Lesson Title"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        value={lesson.title}
                        onChange={(e) => handleLessonChange(index, 'title', e.target.value)}
                      />
                      <textarea
                        placeholder="Lesson Description"
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        value={lesson.description}
                        onChange={(e) => handleLessonChange(index, 'description', e.target.value)}
                      />
                      <input
                        type="url"
                        placeholder="Video URL (YouTube or direct video link)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        value={lesson.videoUrl}
                        onChange={(e) => handleLessonChange(index, 'videoUrl', e.target.value)}
                      />
                      <p className="text-xs text-gray-500">
                        Supports YouTube links (e.g., https://www.youtube.com/watch?v=...) or direct video URLs
                      </p>
                      {isEditing && id && (
                        <button
                          type="button"
                          onClick={() => handleAddLessonToCourse(index)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                        >
                          Save Lesson to Course
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate('/instructor/dashboard')}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : isEditing ? 'Update Course' : 'Create Course'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseBuilder;


