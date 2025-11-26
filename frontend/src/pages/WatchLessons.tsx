import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { getImageUrl } from '../utils/imageUtils';
import StudentSidebar from '../components/StudentSidebar';
import { FaPlay, FaCheckCircle, FaClock } from 'react-icons/fa';

interface Lesson {
  _id: string;
  title: string;
  description: string;
  order: number;
  duration: number;
}

interface Enrollment {
  _id: string;
  course: {
    _id: string;
    title: string;
    thumbnail: string;
    instructor: {
      name: string;
    };
    lessons: Lesson[];
  };
  progress: number;
  completedLessons: Array<{ lesson: string; completedAt: string }>;
}

const WatchLessons: React.FC = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      const response = await axios.get('/api/enrollments/my-enrollments');
      const enrollmentsWithLessons = await Promise.all(
        response.data.map(async (enrollment: any) => {
          try {
            const courseResponse = await axios.get(`/api/courses/${enrollment.course._id}`);
            return {
              ...enrollment,
              course: {
                ...enrollment.course,
                lessons: courseResponse.data.course.lessons || []
              }
            };
          } catch (error) {
            return {
              ...enrollment,
              course: {
                ...enrollment.course,
                lessons: []
              }
            };
          }
        })
      );
      setEnrollments(enrollmentsWithLessons);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCompletedLessonIds = (enrollment: Enrollment) => {
    return enrollment.completedLessons?.map(cl => 
      typeof cl === 'string' ? cl : cl.lesson?.toString() || cl.lessonId?.toString()
    ) || [];
  };

  const getNextLesson = (enrollment: Enrollment) => {
    const completedIds = getCompletedLessonIds(enrollment);
    return enrollment.course.lessons?.find(lesson => !completedIds.includes(lesson._id)) || enrollment.course.lessons?.[0];
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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <StudentSidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Watch Lessons</h1>
            <p className="text-gray-600">Continue learning from your enrolled courses</p>
          </div>

          {enrollments.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 mb-4">
                  <FaPlay className="text-3xl text-blue-600" />
                </div>
              </div>
              <p className="text-gray-600 text-lg mb-6 font-medium">You haven't enrolled in any courses yet.</p>
              <Link
                to="/student/courses"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl font-medium"
              >
                Browse Courses
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {enrollments.map((enrollment) => {
                const completedIds = getCompletedLessonIds(enrollment);
                const nextLesson = getNextLesson(enrollment);
                const totalLessons = enrollment.course.lessons?.length || 0;
                const completedCount = completedIds.length;

                return (
                  <div
                    key={enrollment._id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex items-start gap-6">
                        {enrollment.course.thumbnail && (
                          <div className="flex-shrink-0">
                            <img
                              src={getImageUrl(enrollment.course.thumbnail)}
                              alt={enrollment.course.title}
                              className="w-32 h-24 object-cover rounded-xl"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x250?text=Course+Image';
                              }}
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{enrollment.course.title}</h3>
                          <p className="text-sm text-gray-500 mb-4">Instructor: {enrollment.course.instructor.name}</p>
                          
                          <div className="mb-4">
                            <div className="flex justify-between text-sm text-gray-600 mb-2">
                              <span className="font-medium">Progress: {completedCount}/{totalLessons} lessons</span>
                              <span className="font-bold text-blue-600">{enrollment.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${enrollment.progress}%` }}
                              ></div>
                            </div>
                          </div>

                          {nextLesson && (
                            <Link
                              to={`/courses/${enrollment.course._id}/lesson/${nextLesson._id}`}
                              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg font-medium"
                            >
                              <FaPlay className="text-sm" />
                              {completedCount === 0 ? 'Start Learning' : 'Continue Learning'}
                            </Link>
                          )}
                        </div>
                      </div>

                      {enrollment.course.lessons && enrollment.course.lessons.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-gray-100">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">Course Lessons</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {enrollment.course.lessons.map((lesson) => {
                              const isCompleted = completedIds.includes(lesson._id);
                              return (
                                <Link
                                  key={lesson._id}
                                  to={`/courses/${enrollment.course._id}/lesson/${lesson._id}`}
                                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 hover:scale-[1.02] ${
                                    isCompleted
                                      ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                  }`}
                                >
                                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                                    isCompleted ? 'bg-blue-600' : 'bg-gray-300'
                                  }`}>
                                    {isCompleted ? (
                                      <FaCheckCircle className="text-white text-sm" />
                                    ) : (
                                      <FaPlay className="text-white text-xs" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium truncate ${
                                      isCompleted ? 'text-blue-700' : 'text-gray-700'
                                    }`}>
                                      {lesson.order}. {lesson.title}
                                    </p>
                                    {lesson.duration > 0 && (
                                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                        <FaClock className="text-xs" />
                                        {lesson.duration} min
                                      </p>
                                    )}
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      )}
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

export default WatchLessons;

