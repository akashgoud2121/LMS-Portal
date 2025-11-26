import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import StudentSidebar from '../components/StudentSidebar';

interface Lesson {
  _id: string;
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
  lessons: Lesson[];
}

interface Quiz {
  _id: string;
  title: string;
}

const LessonPlayer: React.FC = () => {
  const { id, lessonId } = useParams<{ id: string; lessonId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    fetchCourse();
    fetchQuizzes();
  }, [id]);

  useEffect(() => {
    if (course && lessonId) {
      const lesson = course.lessons.find(l => l._id === lessonId);
      setCurrentLesson(lesson || null);
      fetchEnrollment();
    }
  }, [course, lessonId]);

  const fetchCourse = async () => {
    try {
      const response = await axios.get(`/api/courses/${id}`);
      setCourse(response.data.course);
    } catch (error) {
      console.error('Error fetching course:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizzes = async () => {
    try {
      const response = await axios.get(`/api/quizzes/course/${id}`);
      setQuizzes(response.data);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    }
  };

  const fetchEnrollment = async () => {
    try {
      const response = await axios.get(`/api/enrollments/check/${id}`);
      const enrolled = response.data.isEnrolled || false;
      setIsEnrolled(enrolled);
      
      if (response.data.enrollment) {
        const completed = response.data.enrollment.completedLessons.map(
          (cl: any) => cl.lesson?.toString() || cl.lessonId?.toString()
        );
        setCompletedLessons(completed);
      }
    } catch (error) {
      console.error('Error fetching enrollment:', error);
      setIsEnrolled(false);
    }
  };

  const markLessonComplete = async () => {
    if (!lessonId) return;

    try {
      const enrollmentResponse = await axios.get(`/api/enrollments/check/${id}`);
      const enrollment = enrollmentResponse.data.enrollment;

      if (enrollment) {
        await axios.post(`/api/enrollments/${enrollment._id}/complete-lesson`, {
          lessonId
        });
        setCompletedLessons([...completedLessons, lessonId]);
      }
    } catch (error) {
      console.error('Error marking lesson complete:', error);
    }
  };

  const getNextLesson = () => {
    if (!course || !currentLesson) return null;
    const currentIndex = course.lessons.findIndex(l => l._id === currentLesson._id);
    return course.lessons[currentIndex + 1] || null;
  };

  const getPrevLesson = () => {
    if (!course || !currentLesson) return null;
    const currentIndex = course.lessons.findIndex(l => l._id === currentLesson._id);
    return course.lessons[currentIndex - 1] || null;
  };

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

  if (!course || !currentLesson) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <StudentSidebar />
        <div className="flex-1 ml-64 flex items-center justify-center">
          <p className="text-gray-500">Lesson not found</p>
        </div>
      </div>
    );
  }

  // Check if enrolled - redirect if not
  if (!isEnrolled) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <StudentSidebar />
        <div className="flex-1 ml-64 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
            <p className="text-gray-600 mb-6">You need to enroll in this course to access lessons.</p>
            <button
              onClick={() => navigate(`/courses/${id}`)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Go to Course Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  const nextLesson = getNextLesson();
  const prevLesson = getPrevLesson();
  const isCompleted = completedLessons.includes(lessonId || '');

  // Helper function to extract YouTube video ID from various URL formats
  const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;
    
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  };

  // Check if URL is a YouTube video
  const isYouTubeUrl = (url: string): boolean => {
    return /youtube\.com|youtu\.be/.test(url);
  };

  // Get embed URL for YouTube
  const getYouTubeEmbedUrl = (url: string): string | null => {
    const videoId = getYouTubeVideoId(url);
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return null;
  };

  const renderVideoPlayer = () => {
    if (!currentLesson.videoUrl && !currentLesson.videoFile) {
      return (
        <div className="text-white text-center">
          <p className="text-xl mb-4">Video content coming soon</p>
          <p className="text-gray-400">{currentLesson.description || 'No video available for this lesson'}</p>
        </div>
      );
    }

    // Check if it's a YouTube URL
    if (currentLesson.videoUrl && isYouTubeUrl(currentLesson.videoUrl)) {
      const embedUrl = getYouTubeEmbedUrl(currentLesson.videoUrl);
      if (embedUrl) {
        return (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="relative w-full max-w-6xl" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={embedUrl}
                className="absolute top-0 left-0 w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={currentLesson.title}
              />
            </div>
          </div>
        );
      }
    }

    // Regular video file or direct video URL
    const videoSrc = currentLesson.videoUrl || `/uploads/${currentLesson.videoFile}`;
    return (
      <video
        controls
        className="w-full h-full max-w-6xl"
        src={videoSrc}
      />
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <StudentSidebar />
      <div className="flex-1 ml-64 flex h-screen">
        {/* Course Navigation Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto shadow-sm">
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <Link
              to={`/courses/${id}`}
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
            >
              ← Back to Course
            </Link>
            <h2 className="text-lg font-semibold text-gray-900 mt-2">{course.title}</h2>
          </div>
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Lessons</h3>
            <div className="space-y-1">
              {course.lessons.map((lesson) => (
                <Link
                  key={lesson._id}
                  to={`/courses/${id}/lesson/${lesson._id}`}
                  className={`block p-3 rounded-lg transition-all duration-200 ${
                    lesson._id === lessonId
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 font-medium shadow-sm scale-105 border border-blue-200'
                      : completedLessons.includes(lesson._id)
                      ? 'bg-gray-50 text-gray-700 hover:bg-blue-50 hover:scale-[1.02] border border-transparent hover:border-blue-200'
                      : 'text-gray-600 hover:bg-blue-50 hover:scale-[1.02] border border-transparent hover:border-blue-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{lesson.order}. {lesson.title}</span>
                    {completedLessons.includes(lesson._id) && (
                      <span className="text-blue-500 font-bold">✓</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Video Player */}
          <div className="bg-black flex-1 flex items-center justify-center">
            {renderVideoPlayer()}
          </div>

          {/* Lesson Info */}
          <div className="bg-white border-t border-gray-200 p-6">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{currentLesson.title}</h1>
              {currentLesson.description && (
                <p className="text-gray-600 mb-6">{currentLesson.description}</p>
              )}

              {/* Materials */}
              {currentLesson.materials && currentLesson.materials.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Materials</h3>
                  <div className="space-y-2">
                    {currentLesson.materials.map((material, index) => (
                      <a
                        key={index}
                        href={material.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-primary-600 hover:text-primary-700"
                      >
                        📎 {material.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Quizzes for this lesson */}
              {quizzes.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Quizzes</h3>
                  <div className="space-y-2">
                    {quizzes.map((quiz) => (
                      <Link
                        key={quiz._id}
                        to={`/courses/${id}/quiz/${quiz._id}`}
                        className="block bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-4 py-2 rounded-lg hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 hover:scale-105 shadow-sm border border-blue-200 hover:border-blue-300 font-medium"
                      >
                        📝 {quiz.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                <div>
                  {prevLesson ? (
                    <Link
                      to={`/courses/${id}/lesson/${prevLesson._id}`}
                      className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 hover:scale-105"
                    >
                      ← Previous Lesson
                    </Link>
                  ) : (
                    <span className="text-gray-400">← Previous Lesson</span>
                  )}
                </div>
                <div className="flex space-x-4">
                  {!isCompleted && (
                    <button
                      onClick={markLessonComplete}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg font-medium"
                    >
                      Mark as Complete
                    </button>
                  )}
                  {isCompleted && (
                    <span className="text-blue-600 font-semibold">✓ Completed</span>
                  )}
                </div>
                <div>
                  {nextLesson ? (
                    <Link
                      to={`/courses/${id}/lesson/${nextLesson._id}`}
                      className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 hover:scale-105"
                    >
                      Next Lesson →
                    </Link>
                  ) : (
                    <span className="text-gray-400">Next Lesson →</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonPlayer;


