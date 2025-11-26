import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import StudentSidebar from '../components/StudentSidebar';
import { showToast } from '../utils/toast';
import { FaCheckCircle, FaLock, FaPlayCircle, FaArrowLeft, FaArrowRight, FaClock, FaFileAlt, FaQuestionCircle } from 'react-icons/fa';

const LessonPlayer = () => {
    const { id, lessonId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [currentLesson, setCurrentLesson] = useState(null);
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [completedLessons, setCompletedLessons] = useState([]);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [videoReady, setVideoReady] = useState(false);

    useEffect(() => {
        fetchCourse();
        fetchQuizzes();
    }, [id]);

    useEffect(() => {
        if (course && lessonId) {
            const lesson = course.lessons.find(l => {
                const lessonIdToCheck = l._id || l.id;
                return lessonIdToCheck?.toString() === lessonId?.toString();
            });
            setCurrentLesson(lesson || null);
            if (lesson) {
                fetchEnrollment();
            }
        }
    }, [course, lessonId]);
    
    // Refresh course data when lessonId changes to get latest materials
    useEffect(() => {
        if (id && lessonId && course) {
            // Only refresh if we're switching to a different lesson
            const currentLessonId = currentLesson?._id || currentLesson?.id;
            const newLessonId = lessonId;
            if (currentLessonId?.toString() !== newLessonId?.toString()) {
                fetchCourse();
            }
        }
    }, [lessonId]);

    const fetchCourse = async () => {
        try {
            // Add cache-busting parameter to ensure fresh data
            const response = await axios.get(`/api/courses/${id}`, {
                params: {
                    _t: Date.now() // Cache busting
                }
            });
            setCourse(response.data.course);
            
            // Debug: Log materials data
            console.log('Course data fetched:', {
                courseId: id,
                lessonsCount: response.data.course?.lessons?.length || 0,
                courseMaterialsCount: response.data.course?.courseMaterials?.length || 0,
                lessons: response.data.course?.lessons?.map(l => ({
                    id: l._id || l.id,
                    title: l.title,
                    materials: l.materials,
                    materialsType: typeof l.materials,
                    materialsIsArray: Array.isArray(l.materials),
                    materialsCount: Array.isArray(l.materials) ? l.materials.length : 0
                }))
            });
            
            // Update current lesson if it exists
            if (response.data.course && lessonId) {
                const lesson = response.data.course.lessons.find(l => {
                    const lessonIdToCheck = l._id || l.id;
                    return lessonIdToCheck?.toString() === lessonId?.toString();
                });
                if (lesson) {
                    console.log('Current lesson materials:', {
                        lessonId: lesson._id || lesson.id,
                        lessonTitle: lesson.title,
                        materials: lesson.materials,
                        materialsType: typeof lesson.materials,
                        materialsIsArray: Array.isArray(lesson.materials),
                        materialsCount: Array.isArray(lesson.materials) ? lesson.materials.length : 0,
                        independentMaterials: lesson.materials?.filter(m => m.isIndependent) || [],
                        lessonMaterials: lesson.materials?.filter(m => !m.isIndependent) || []
                    });
                    setCurrentLesson(lesson);
                }
            }
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
                // Extract lesson IDs from completedLessons array
                const completed = (response.data.enrollment.completedLessons || []).map((cl) => {
                    // Handle both object format {lessonId: "...", completedAt: "..."} and direct ID
                    const lid = cl.lessonId || cl.lesson || (typeof cl === 'string' ? cl : null);
                    return lid?.toString();
                }).filter(Boolean);
                
                setCompletedLessons(completed);
            } else {
                setCompletedLessons([]);
            }
        } catch (error) {
            console.error('Error fetching enrollment:', error);
            setIsEnrolled(false);
            setCompletedLessons([]);
        }
    };

    const markLessonComplete = async () => {
        // Get the lesson ID from URL params or current lesson
        const lessonIdToMark = lessonId || currentLesson?._id || currentLesson?.id;
        if (!lessonIdToMark) {
            showToast.error('Lesson ID not found');
            return;
        }

        const currentLessonId = lessonIdToMark?.toString();
        const isCurrentlyCompleted = completedLessons.some(completedId => {
            return completedId?.toString() === currentLessonId;
        });

        // If already completed, don't do anything
        if (isCurrentlyCompleted) {
            showToast.info('Lesson is already marked as complete');
            return;
        }

        // Optimistically update UI
        setCompletedLessons(prev => [...prev, currentLessonId]);

        try {
            const enrollmentResponse = await axios.get(`/api/enrollments/check/${id}`);
            const enrollment = enrollmentResponse.data.enrollment;
            if (!enrollment) {
                // Revert optimistic update
                setCompletedLessons(prev => prev.filter(id => id?.toString() !== currentLessonId));
                showToast.error('Enrollment not found. Please make sure you are enrolled in this course.');
                return;
            }

            const enrollmentId = enrollment._id || enrollment.id;
            if (!enrollmentId) {
                // Revert optimistic update
                setCompletedLessons(prev => prev.filter(id => id?.toString() !== currentLessonId));
                showToast.error('Invalid enrollment ID');
                return;
            }

            await axios.post(`/api/enrollments/${enrollmentId}/mark-complete`, {
                lessonId: lessonIdToMark
            });
            
            // Refresh enrollment data to get updated completed lessons (to ensure sync)
            await fetchEnrollment();
            
            showToast.success('Lesson marked as complete!');
        } catch (error) {
            console.error('Error marking lesson as complete:', error);
            // Revert optimistic update on error
            setCompletedLessons(prev => prev.filter(id => id?.toString() !== currentLessonId));
            const errorMessage = error.response?.data?.message || 'Failed to mark lesson as complete';
            showToast.error(errorMessage);
        }
    };

    const markLessonIncomplete = async () => {
        // Get the lesson ID from URL params or current lesson
        const lessonIdToMark = lessonId || currentLesson?._id || currentLesson?.id;
        if (!lessonIdToMark) {
            showToast.error('Lesson ID not found');
            return;
        }

        const currentLessonId = lessonIdToMark?.toString();
        const isCurrentlyCompleted = completedLessons.some(completedId => {
            return completedId?.toString() === currentLessonId;
        });

        // If not completed, don't do anything
        if (!isCurrentlyCompleted) {
            showToast.info('Lesson is already marked as incomplete');
            return;
        }

        // Optimistically update UI
        setCompletedLessons(prev => prev.filter(id => id?.toString() !== currentLessonId));

        try {
            const enrollmentResponse = await axios.get(`/api/enrollments/check/${id}`);
            const enrollment = enrollmentResponse.data.enrollment;
            if (!enrollment) {
                // Revert optimistic update
                setCompletedLessons(prev => [...prev, currentLessonId]);
                showToast.error('Enrollment not found. Please make sure you are enrolled in this course.');
                return;
            }

            const enrollmentId = enrollment._id || enrollment.id;
            if (!enrollmentId) {
                // Revert optimistic update
                setCompletedLessons(prev => [...prev, currentLessonId]);
                showToast.error('Invalid enrollment ID');
                return;
            }

            await axios.post(`/api/enrollments/${enrollmentId}/mark-incomplete`, {
                lessonId: lessonIdToMark
            });
            
            // Refresh enrollment data to get updated completed lessons (to ensure sync)
            await fetchEnrollment();
            
            showToast.success('Lesson marked as incomplete');
        } catch (error) {
            console.error('Error marking lesson as incomplete:', error);
            // Revert optimistic update on error
            setCompletedLessons(prev => [...prev, currentLessonId]);
            const errorMessage = error.response?.data?.message || 'Failed to mark lesson as incomplete';
            showToast.error(errorMessage);
        }
    };

    const getNextLesson = () => {
        if (!course || !currentLesson) return null;
        const currentLessonId = lessonId || currentLesson._id || currentLesson.id;
        const currentIndex = course.lessons.findIndex(l => {
            const lessonIdToCheck = l._id || l.id;
            return lessonIdToCheck?.toString() === currentLessonId?.toString();
        });
        if (currentIndex === -1) return null;
        return course.lessons[currentIndex + 1] || null;
    };

    const getPrevLesson = () => {
        if (!course || !currentLesson) return null;
        const currentLessonId = lessonId || currentLesson._id || currentLesson.id;
        const currentIndex = course.lessons.findIndex(l => {
            const lessonIdToCheck = l._id || l.id;
            return lessonIdToCheck?.toString() === currentLessonId?.toString();
        });
        if (currentIndex === -1) return null;
        return course.lessons[currentIndex - 1] || null;
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-gray-50">
        <StudentSidebar />
        <div className="flex-1 ml-64 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
                </div>
        </div>
        );
    }

    if (!course || !currentLesson) {
        return (
            <div className="flex min-h-screen bg-gray-50">
        <StudentSidebar />
        <div className="flex-1 ml-64 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-gray-500 text-xl mb-4">Lesson not found</p>
                        <Link to={`/courses/${id}`} className="text-blue-600 hover:text-blue-700">Back to Course</Link>
                    </div>
                </div>
        </div>
        );
    }

    if (!isEnrolled) {
        return (
            <div className="flex min-h-screen bg-gray-50">
        <StudentSidebar />
                <div className="flex-1 ml-64 flex items-center justify-center p-8">
                    <div className="bg-white rounded-2xl shadow-xl p-12 max-w-md text-center border border-gray-200">
                        <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FaLock className="text-white text-3xl" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">Access Restricted</h2>
                        <p className="text-gray-600 mb-8">You need to enroll in this course to access lessons.</p>
                        <button 
                            onClick={() => navigate(`/courses/${id}`)} 
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
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
    
    // Check if current lesson is completed - handle both _id and id formats
    const currentLessonId = lessonId || currentLesson?._id || currentLesson?.id;
    
    // Check if lesson is completed - default to false if we can't determine
    const isCompleted = currentLessonId && completedLessons.length > 0 ? completedLessons.some(completedId => {
        const completed = completedId?.toString();
        const current = currentLessonId?.toString();
        return completed === current;
    }) : false;
    
    const currentIndex = course.lessons.findIndex(l => {
        const lessonIdToCheck = l._id || l.id;
        return lessonIdToCheck?.toString() === currentLessonId?.toString();
    });

    const getYouTubeVideoId = (url) => {
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

    const isYouTubeUrl = (url) => {
        return /youtube\.com|youtu\.be/.test(url);
    };

    const getYouTubeEmbedUrl = (url) => {
        const videoId = getYouTubeVideoId(url);
        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
        }
        return null;
    };

    const renderVideoPlayer = () => {
        if (!currentLesson.videoUrl && !currentLesson.videoFile) {
            return (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                    <div className="text-center text-white p-8">
                        <FaPlayCircle className="text-6xl mx-auto mb-4 opacity-50" />
                        <p className="text-xl mb-2">Video content coming soon</p>
          <p className="text-gray-400">{currentLesson.description || 'No video available for this lesson'}</p>
                    </div>
                </div>
            );
        }

        if (currentLesson.videoUrl && isYouTubeUrl(currentLesson.videoUrl)) {
            const embedUrl = getYouTubeEmbedUrl(currentLesson.videoUrl);
            if (embedUrl) {
                return (
                    <div className="w-full h-full flex items-center justify-center bg-black">
                        <div className="relative w-full h-full">
                            <iframe 
                                src={embedUrl} 
                                className="absolute top-0 left-0 w-full h-full" 
                                frameBorder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowFullScreen 
                                title={currentLesson.title}
                                onLoad={() => setVideoReady(true)}
                            />
                        </div>
                    </div>
                );
            }
        }

        const videoSrc = currentLesson.videoUrl || `/uploads/${currentLesson.videoFile}`;
        return (
            <div className="w-full h-full flex items-center justify-center bg-black">
                <video 
                    controls 
                    className="w-full h-full object-contain" 
                    src={videoSrc}
                    onLoadedData={() => setVideoReady(true)}
                />
            </div>
        );
    };

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
            <StudentSidebar />
            <div className="flex-1 ml-64 flex flex-col h-screen">
                {/* Top Navigation Bar */}
                <div className="bg-white border-b border-gray-200 shadow-sm px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link 
                                to={`/courses/${id}`} 
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                            >
                                <FaArrowLeft />
                                Back to Course
                            </Link>
                            <div className="h-6 w-px bg-gray-300"></div>
                            <h2 className="text-lg font-semibold text-gray-900">{course.title}</h2>
                        </div>
                        <div className="text-sm text-gray-500">
                            Lesson {currentIndex + 1} of {course.lessons.length}
                        </div>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Lessons Sidebar */}
                    <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto shadow-sm lessons-sidebar min-h-0" style={{ 
                        scrollbarWidth: 'auto',
                        scrollbarColor: '#94a3b8 #f1f5f9'
                    }}>
                        <style>{`
                            .lessons-sidebar::-webkit-scrollbar {
                                width: 14px;
                            }
                            .lessons-sidebar::-webkit-scrollbar-track {
                                background: #f1f5f9;
                                border-left: 1px solid #e2e8f0;
                            }
                            .lessons-sidebar::-webkit-scrollbar-thumb {
                                background: #94a3b8;
                                border-radius: 7px;
                                border: 3px solid #f1f5f9;
                            }
                            .lessons-sidebar::-webkit-scrollbar-thumb:hover {
                                background: #64748b;
                            }
                        `}</style>
                        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Course Content</h3>
                            <div className="text-xs text-gray-500">
                                {completedLessons.length} of {course.lessons.length} lessons completed
                            </div>
                        </div>
                        <div className="p-4 space-y-2">
                            {course.lessons.map((lesson, index) => {
                                const lessonIdToCheck = lesson._id || lesson.id;
                                const isActive = lessonIdToCheck === (lessonId || currentLesson?._id || currentLesson?.id);
                                const isLessonCompleted = completedLessons.some(completedId => {
                                    return completedId?.toString() === lessonIdToCheck?.toString();
                                });
                                
                                return (
                                    <Link 
                                        key={lessonIdToCheck} 
                                        to={`/courses/${id}/lesson/${lessonIdToCheck}`} 
                                        className={`group relative block p-4 rounded-xl transition-all duration-200 ${
                                            isActive
                                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105'
                                                : isLessonCompleted
                                                    ? 'bg-green-50 text-gray-700 hover:bg-green-100 border-2 border-green-200'
                                                    : 'bg-gray-50 text-gray-600 hover:bg-blue-50 border-2 border-transparent hover:border-blue-200'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                                                    isActive
                                                        ? 'bg-white/20 text-white'
                                                        : isLessonCompleted
                                                            ? 'bg-green-500 text-white'
                                                            : 'bg-gray-300 text-gray-600'
                                                }`}>
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className={`font-medium text-sm truncate ${
                                                        isActive ? 'text-white' : 'text-gray-900'
                                                    }`}>
                                                        {lesson.title}
                                                    </div>
                                                    {lesson.duration > 0 && (
                                                        <div className={`text-xs mt-1 flex items-center gap-1 ${
                                                            isActive ? 'text-blue-100' : 'text-gray-500'
                                                        }`}>
                                                            <FaClock className="text-xs" />
                                                            {lesson.duration} min
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {isLessonCompleted && !isActive && (
                                                <FaCheckCircle className="text-green-500 flex-shrink-0 ml-2" />
                                            )}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                        {/* Video Player */}
                        <div className="flex-shrink-0 bg-black relative" style={{ height: '50vh', minHeight: '400px', maxHeight: '550px' }}>
                            {!videoReady && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 z-10">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-white"></div>
                                </div>
                            )}
                            {renderVideoPlayer()}
                        </div>

                        {/* Lesson Info & Controls - Scrollable with visible scrollbar */}
                        <div className="flex-1 bg-white border-t-2 border-gray-200 overflow-y-auto min-h-0" style={{ 
                            scrollbarWidth: 'auto',
                            scrollbarColor: '#94a3b8 #f1f5f9'
                        }}>
                            <style>{`
                                .lesson-info-scroll::-webkit-scrollbar {
                                    width: 14px;
                                }
                                .lesson-info-scroll::-webkit-scrollbar-track {
                                    background: #f1f5f9;
                                    border-left: 1px solid #e2e8f0;
                                }
                                .lesson-info-scroll::-webkit-scrollbar-thumb {
                                    background: #94a3b8;
                                    border-radius: 7px;
                                    border: 3px solid #f1f5f9;
                                }
                                .lesson-info-scroll::-webkit-scrollbar-thumb:hover {
                                    background: #64748b;
                                }
                            `}</style>
                            <div className="max-w-5xl mx-auto p-6 lesson-info-scroll w-full">
                                {/* Lesson Title and Description */}
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex-1 pr-4">
                                        <h1 className="text-2xl font-bold text-gray-900 mb-2">{currentLesson.title}</h1>
                                        {currentLesson.description && (
                                            <p className="text-gray-600 leading-relaxed">{currentLesson.description}</p>
                                        )}
                                    </div>
                                    {isCompleted && (
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold border border-green-300 flex-shrink-0">
                                            <FaCheckCircle className="text-sm" />
                                            <span>Completed</span>
                                        </div>
                                    )}
                                </div>

                                {/* Materials - Available to enrolled students */}
                                {(() => {
                                    // Debug logging
                                    const hasMaterials = currentLesson.materials && Array.isArray(currentLesson.materials) && currentLesson.materials.length > 0;
                                    console.log('Materials check:', {
                                        isEnrolled,
                                        hasMaterials,
                                        materials: currentLesson.materials,
                                        materialsType: typeof currentLesson.materials,
                                        materialsIsArray: Array.isArray(currentLesson.materials),
                                        materialsCount: Array.isArray(currentLesson.materials) ? currentLesson.materials.length : 0,
                                        currentLessonId: currentLesson._id || currentLesson.id
                                    });
                                    
                                    if (!isEnrolled) {
                                        return null;
                                    }
                                    
                                    if (!currentLesson.materials) {
                                        return null;
                                    }
                                    
                                    // Handle case where materials might be a string (JSON)
                                    let materialsArray = currentLesson.materials;
                                    if (typeof materialsArray === 'string') {
                                        try {
                                            materialsArray = JSON.parse(materialsArray);
                                        } catch (e) {
                                            console.error('Error parsing materials JSON:', e);
                                            materialsArray = [];
                                        }
                                    }
                                    
                                    if (!Array.isArray(materialsArray) || materialsArray.length === 0) {
                                        return null;
                                    }
                                    
                                    // Filter out empty materials
                                    const validMaterials = materialsArray.filter(m => {
                                        const hasName = m.name || m.fileName || m.title;
                                        const hasUrl = m.fileUrl || m.url || m.link;
                                        return hasName && hasUrl;
                                    });
                                    
                                    if (validMaterials.length === 0) {
                                        return null;
                                    }
                                    
                                    // Separate lesson materials and independent materials
                                    const lessonMaterials = validMaterials.filter(m => !m.isIndependent);
                                    const independentMaterials = validMaterials.filter(m => m.isIndependent);
                                    
                                    // Also get course-level materials
                                    const courseMaterials = course?.courseMaterials || [];
                                    const validCourseMaterials = courseMaterials.filter(m => {
                                        const hasName = m.name || m.fileName || m.title;
                                        const hasUrl = m.fileUrl || m.url || m.link;
                                        return hasName && hasUrl;
                                    });
                                    
                                    const totalMaterials = lessonMaterials.length + independentMaterials.length + validCourseMaterials.length;
                                    
                                    if (totalMaterials === 0) {
                                        return null;
                                    }
                                    
                                    return (
                                        <div className="mb-4 space-y-4">
                                            {/* Course-Level Materials */}
                                            {validCourseMaterials.length > 0 && (
                                                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <FaFileAlt className="text-indigo-600" />
                                                        <h3 className="font-semibold text-gray-900">Course Materials</h3>
                                                        <span className="text-xs text-gray-500">({validCourseMaterials.length})</span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {validCourseMaterials.map((material, index) => {
                                                            const materialName = material.name || material.fileName || material.title || `Material ${index + 1}`;
                                                            const materialUrl = material.fileUrl || material.url || material.link || '#';
                                                            const isPDF = materialName.toLowerCase().endsWith('.pdf') || materialUrl.toLowerCase().endsWith('.pdf') || material.type === 'pdf' || material.type === 'document';
                                                            
                                                            return (
                                                                <a 
                                                                    key={`course-${index}`} 
                                                                    href={materialUrl} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer" 
                                                                    className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors text-sm p-2 rounded hover:bg-indigo-100 border border-indigo-200 hover:border-indigo-300"
                                                                    download={isPDF ? undefined : materialName}
                                                                >
                                                                    <FaFileAlt className="text-sm" />
                                                                    <span>{materialName}</span>
                                                                    {isPDF && (
                                                                        <span className="ml-auto text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">PDF</span>
                                                                    )}
                                                                </a>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* Lesson Materials */}
                                            {lessonMaterials.length > 0 && (
                                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <FaFileAlt className="text-blue-600" />
                                                        <h3 className="font-semibold text-gray-900">Lesson Materials</h3>
                                                        <span className="text-xs text-gray-500">({lessonMaterials.length})</span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {lessonMaterials.map((material, index) => {
                                                            const materialName = material.name || material.fileName || material.title || `Material ${index + 1}`;
                                                            const materialUrl = material.fileUrl || material.url || material.link || '#';
                                                            const isPDF = materialName.toLowerCase().endsWith('.pdf') || materialUrl.toLowerCase().endsWith('.pdf') || material.type === 'pdf' || material.type === 'document';
                                                            
                                                            return (
                                                                <a 
                                                                    key={`lesson-${index}`} 
                                                                    href={materialUrl} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer" 
                                                                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors text-sm p-2 rounded hover:bg-blue-100 border border-blue-200 hover:border-blue-300"
                                                                    download={isPDF ? undefined : materialName}
                                                                >
                                                                    <FaFileAlt className="text-sm" />
                                                                    <span>{materialName}</span>
                                                                    {isPDF && (
                                                                        <span className="ml-auto text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">PDF</span>
                                                                    )}
                                                                </a>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* Independent Materials (from Material table) */}
                                            {independentMaterials.length > 0 && (
                                                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <FaFileAlt className="text-purple-600" />
                                                        <h3 className="font-semibold text-gray-900">Additional Materials</h3>
                                                        <span className="text-xs text-gray-500">({independentMaterials.length})</span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {independentMaterials.map((material, index) => {
                                                            const materialName = material.name || material.fileName || material.title || `Material ${index + 1}`;
                                                            const materialUrl = material.fileUrl || material.url || material.link || '#';
                                                            const isPDF = materialName.toLowerCase().endsWith('.pdf') || materialUrl.toLowerCase().endsWith('.pdf') || material.type === 'pdf' || material.type === 'document';
                                                            
                                                            return (
                                                                <a 
                                                                    key={`independent-${index}`} 
                                                                    href={materialUrl} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer" 
                                                                    className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium transition-colors text-sm p-2 rounded hover:bg-purple-100 border border-purple-200 hover:border-purple-300"
                                                                    download={isPDF ? undefined : materialName}
                                                                >
                                                                    <FaFileAlt className="text-sm" />
                                                                    <span>{materialName}</span>
                                                                    {isPDF && (
                                                                        <span className="ml-auto text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">PDF</span>
                                                                    )}
                                                                </a>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}

                                {/* Quizzes */}
                                {quizzes.length > 0 && (
                                    <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                                        <div className="flex items-center gap-2 mb-3">
                                            <FaQuestionCircle className="text-purple-600" />
                                            <h3 className="font-semibold text-gray-900">Related Quizzes</h3>
                                        </div>
                                        <div className="space-y-2">
                                            {quizzes.map((quiz) => (
                                                <Link 
                                                    key={quiz._id} 
                                                    to={`/courses/${id}/quiz/${quiz._id}`} 
                                                    className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium transition-colors text-sm p-1.5 rounded hover:bg-purple-100"
                                                >
                                                    <FaQuestionCircle className="text-sm" />
                                                    <span>{quiz.title}</span>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Navigation Controls */}
                                <div className="bg-gradient-to-r from-gray-50 via-blue-50 to-indigo-50 border-t-2 border-gray-300 -mx-6 -mb-6 px-6 py-4 mt-6 rounded-b-xl">
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                                        {/* Previous Lesson */}
                                        <div className="flex-1 w-full sm:w-auto flex justify-start">
                                            {prevLesson ? (
                                                <Link 
                                                    to={`/courses/${id}/lesson/${prevLesson._id || prevLesson.id}`} 
                                                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow border border-gray-200 w-full sm:w-auto"
                                                >
                                                    <FaArrowLeft className="text-sm" />
                                                    <span>Previous</span>
                                                </Link>
                                            ) : (
                                                <div className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed border border-gray-200 w-full sm:w-auto text-sm">
                                                    <FaArrowLeft className="text-sm" />
                                                    <span>Previous</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Mark as Complete/Incomplete Buttons - Separate Buttons */}
                                        <div className="flex items-center gap-2 flex-shrink-0 order-2 sm:order-none">
                                            {isCompleted ? (
                                                <button 
                                                    onClick={markLessonIncomplete}
                                                    type="button"
                                                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow border border-orange-600"
                                                >
                                                    <span>Mark Incomplete</span>
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={markLessonComplete}
                                                    type="button"
                                                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow border border-green-700"
                                                >
                                                    <FaCheckCircle className="text-sm" />
                                                    <span>Mark Complete</span>
                                                </button>
                                            )}
                                        </div>

                                        {/* Next Lesson */}
                                        <div className="flex-1 w-full sm:w-auto flex justify-end order-3 sm:order-none">
                                            {nextLesson ? (
                                                <Link 
                                                    to={`/courses/${id}/lesson/${nextLesson._id || nextLesson.id}`}
                                                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow border border-blue-700 w-full sm:w-auto"
                                                >
                                                    <span>Next</span>
                                                    <FaArrowRight className="text-sm" />
                                                </Link>
                                            ) : (
                                                <div className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed border border-gray-200 w-full sm:w-auto text-sm">
                                                    <span>Next</span>
                                                    <FaArrowRight className="text-sm" />
                                                </div>
                                            )}
                                        </div>
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

export default LessonPlayer;
