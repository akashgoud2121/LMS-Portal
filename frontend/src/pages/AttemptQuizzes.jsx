import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import StudentSidebar from '../components/StudentSidebar';
import { FaQuestionCircle, FaClock, FaTrophy, FaBook } from 'react-icons/fa';
const AttemptQuizzes = () => {
    const [quizzes, setQuizzes] = useState([]);
    const [attempts, setAttempts] = useState({});
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        fetchQuizzes();
    }, []);
    const fetchQuizzes = async () => {
        try {
            const response = await axios.get('/api/quizzes/student/available');
            const allQuizzes = response.data || [];
            setQuizzes(allQuizzes);
            // Fetch attempts for these quizzes (if API exists)
            const attemptPromises = allQuizzes.map(async (quiz) => {
                try {
                    // Try to get attempts - API might not exist, so we'll handle gracefully
                    const response = await axios.get(`/api/quizzes/${quiz._id}/attempts`);
                    if (response.data && response.data.length > 0) {
                        // Backend returns attempts ordered by submittedAt DESC, so first is latest
                        const latestAttempt = response.data[0];
                        return { quizId: quiz._id, attempt: latestAttempt };
                    }
                }
                catch (error) {
                    // API might not exist or no attempts yet - that's okay
                    if (error.response?.status !== 404) {
                        console.log('Attempts API not available or error:', error);
                    }
                }
                return null;
            });
            try {
                const attemptResults = await Promise.all(attemptPromises);
                const attemptsMap = {};
                attemptResults.forEach(result => {
                    if (result) {
                        attemptsMap[result.quizId] = result.attempt;
                    }
                });
                setAttempts(attemptsMap);
            }
            catch (error) {
                // If attempts fetching fails, continue without attempts data
                console.log('Could not fetch attempts:', error);
            }
        }
        catch (error) {
            console.error('Error fetching quizzes:', error);
        }
        finally {
            setLoading(false);
        }
    };
    if (loading) {
        return (<div className="flex min-h-screen bg-gray-50">
        <StudentSidebar />
        <div className="flex-1 ml-64 flex items-center justify-center">
          <div className="loading-spinner"></div>
        </div>
      </div>);
    }
    return (<div className="flex min-h-screen bg-gray-50">
      <StudentSidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Attempt Quizzes</h1>
            <p className="text-gray-600">Test your knowledge with quizzes from your courses</p>
          </div>

          {quizzes.length === 0 ? (<div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 mb-4">
                  <FaQuestionCircle className="text-3xl text-blue-600"/>
                </div>
              </div>
              <p className="text-gray-600 text-lg mb-6 font-medium">No quizzes available yet.</p>
              <p className="text-gray-500 text-sm mb-6">Enroll in courses to access quizzes.</p>
              <Link to="/student/courses" className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl font-medium">
                <FaBook className="text-sm"/>
                Browse Courses
              </Link>
            </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quizzes.map((quiz) => {
                const attempt = attempts[quiz._id];
                const hasAttempted = !!attempt;
                return (<div key={quiz._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 overflow-hidden group">
                    <div className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                          <FaQuestionCircle className="text-white text-xl"/>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                            {quiz.title}
                          </h3>
                          <p className="text-sm text-gray-500 mb-2">{quiz.course?.title}</p>
                        </div>
                      </div>

                      {quiz.description && (<p className="text-sm text-gray-600 mb-4 line-clamp-2">{quiz.description}</p>)}

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <FaClock className="text-xs"/>
                            <span className="font-medium">Time Limit</span>
                          </div>
                          <p className="text-lg font-bold text-gray-900">{quiz.timeLimit || 'No limit'}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-sm text-gray-600 mb-1 font-medium">Questions</div>
                          <p className="text-lg font-bold text-gray-900">{quiz.questionCount || quiz.questions?.length || 0}</p>
                        </div>
                      </div>

                      {hasAttempted && (<div className={`mb-4 p-3 rounded-lg ${attempt.passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FaTrophy className={attempt.passed ? 'text-green-600' : 'text-red-600'}/>
                              <span className={`text-sm font-semibold ${attempt.passed ? 'text-green-700' : 'text-red-700'}`}>
                                {attempt.passed ? 'Passed' : 'Failed'}
                              </span>
                            </div>
                            <span className={`text-lg font-bold ${attempt.passed ? 'text-green-600' : 'text-red-600'}`}>
                              {attempt.percentage}%
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            Score: {attempt.score}/{quiz.totalPoints} points
                          </p>
                        </div>)}

                      <Link to={`/courses/${quiz.course?._id}/quiz/${quiz._id}`} className={`block w-full text-center py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg ${hasAttempted
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'}`}>
                        {hasAttempted ? 'Retake Quiz' : 'Start Quiz'}
                      </Link>
                    </div>
                  </div>);
            })}
            </div>)}
        </div>
      </div>
    </div>);
};
export default AttemptQuizzes;
