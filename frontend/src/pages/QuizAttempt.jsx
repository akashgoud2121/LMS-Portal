import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import StudentSidebar from '../components/StudentSidebar';
import { showToast } from '../utils/toast';
import ConfirmDialog from '../components/ConfirmDialog';
import { FaCheckCircle, FaTimesCircle, FaRedo, FaTrophy, FaClock } from 'react-icons/fa';
const QuizAttempt = () => {
    const { id, quizId } = useParams();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState(null);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [result, setResult] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'warning',
        onConfirm: () => {}
    });
    const [startTime] = useState(Date.now());
    useEffect(() => {
        fetchQuiz();
    }, [quizId]);
    
    // Refetch quiz when result is set to ensure we have questions for review
    useEffect(() => {
        if (result) {
            // Always refetch quiz when showing results to ensure questions are loaded
            const refetchQuiz = async () => {
                try {
                    const response = await axios.get(`/api/quizzes/${quizId}`);
                    const quizData = response.data;
                    
                    // Ensure questions array exists and is properly formatted
                    if (quizData.questions) {
                        quizData.questions = quizData.questions.map(q => ({
                            ...q,
                            _id: q._id || q.id,
                            id: q.id || q._id
                        }));
                    } else {
                        quizData.questions = [];
                    }
                    
                    console.log('Refetched quiz for results:', {
                        title: quizData.title,
                        questionsCount: quizData.questions?.length || 0,
                        questions: quizData.questions
                    });
                    
                    setQuiz(quizData);
                } catch (error) {
                    console.error('Error refetching quiz:', error);
                }
            };
            refetchQuiz();
        }
    }, [result, quizId]);
    useEffect(() => {
        if (quiz && quiz.timeLimit > 0) {
            setTimeRemaining(quiz.timeLimit * 60); // Convert to seconds
            const timer = setInterval(() => {
                setTimeRemaining((prev) => {
                    if (prev === null || prev <= 1) {
                        clearInterval(timer);
                        handleSubmit();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [quiz]);
    const fetchQuiz = async () => {
        try {
            const response = await axios.get(`/api/quizzes/${quizId}`);
            const quizData = response.data;
            
            // Ensure questions array exists and is properly formatted
            if (quizData.questions) {
                quizData.questions = quizData.questions.map(q => ({
                    ...q,
                    _id: q._id || q.id,
                    id: q.id || q._id
                }));
            } else {
                quizData.questions = [];
            }
            
            console.log('Quiz data loaded:', {
                title: quizData.title,
                questionsCount: quizData.questions?.length || 0,
                questions: quizData.questions
            });
            
            setQuiz(quizData);
        }
        catch (error) {
            console.error('Error fetching quiz:', error);
            showToast.error('Failed to load quiz');
        }
        finally {
            setLoading(false);
        }
    };
    const handleAnswerChange = (questionId, answer) => {
        setAnswers({
            ...answers,
            [questionId]: answer
        });
    };
    const submitQuiz = async () => {
        if (!quiz) return;
        
        setSubmitting(true);
        try {
            const answerArray = Object.entries(answers).map(([question, answer]) => ({
                question,
                answer
            }));
            const timeSpent = Math.round((Date.now() - startTime) / 60000); // in minutes
            const response = await axios.post(`/api/quizzes/${quizId}/attempt`, {
                answers: answerArray,
                timeSpent
            });
            setResult(response.data);
            showToast.success(`Quiz submitted! Your score: ${response.data.percentage}%`);
        }
        catch (error) {
            showToast.error(error.response?.data?.message || 'Error submitting quiz');
        }
        finally {
            setSubmitting(false);
        }
    };
    
    const handleSubmit = async () => {
        if (!quiz) return;
        
        const answerArray = Object.entries(answers).map(([question, answer]) => ({
            question,
            answer
        }));
        
        if (answerArray.length < quiz.questions.length) {
            setConfirmDialog({
                isOpen: true,
                title: 'Incomplete Quiz',
                message: `You have not answered all questions (${answerArray.length}/${quiz.questions.length}). Submit anyway?`,
                type: 'warning',
                onConfirm: () => {
                    submitQuiz();
                }
            });
            return;
        }
        submitQuiz();
    };
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    if (loading) {
        return (<div className="flex min-h-screen bg-gray-50">
        <StudentSidebar />
        <div className="flex-1 ml-64 flex items-center justify-center">
          <div className="loading-spinner"></div>
        </div>
      </div>);
    }
    if (!quiz) {
        return (<div className="flex min-h-screen bg-gray-50">
        <StudentSidebar />
        <div className="flex-1 ml-64 flex items-center justify-center">
          <p className="text-gray-500">Quiz not found</p>
        </div>
      </div>);
    }
    
    // Show results if quiz is completed
    if (result) {
        const gradedAnswersMap = {};
        if (result.answers && Array.isArray(result.answers)) {
            result.answers.forEach((ga) => {
                // Backend stores questionId as question.id (UUID)
                // Map it so we can find it by either question.id or question._id
                if (ga.questionId) {
                    gradedAnswersMap[ga.questionId] = ga;
                }
            });
        }
        
        // Ensure we have questions - if not, show loading or use answers to reconstruct
        const questionsToDisplay = (quiz?.questions && quiz.questions.length > 0) 
            ? quiz.questions 
            : [];
        
        // Get question count from result if questions aren't loaded yet
        const questionCount = questionsToDisplay.length || quiz?.questionCount || result.answers?.length || 0;
        
        // If still loading questions and we have a result, show results with available data
        // Don't block on loading if we have result data
        
        return (<div className="flex min-h-screen bg-gray-50">
        <StudentSidebar />
        <div className="flex-1 ml-64 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
              <div className={`text-center mb-8 p-6 rounded-2xl ${result.passed
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200'
                : 'bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200'}`}>
                <div className="flex justify-center mb-4">
                  {result.passed ? (<FaTrophy className="text-6xl text-green-600"/>) : (<FaTimesCircle className="text-6xl text-red-600"/>)}
                </div>
                <h2 className={`text-3xl font-bold mb-2 ${result.passed ? 'text-green-800' : 'text-red-800'}`}>
                  {result.passed ? 'Congratulations! You Passed!' : 'Quiz Completed'}
                </h2>
                <div className="text-4xl font-bold mb-2 text-gray-900">
                  {result.percentage}%
                </div>
                <p className="text-lg text-gray-700">
                  Score: {result.score} / {result.totalPoints} points
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Questions: {questionCount} | Passing Score: {quiz?.passingScore || 60}%
                </p>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Question Review {questionCount > 0 && `(${questionCount} questions)`}
                </h3>
                {questionsToDisplay.length === 0 ? (
                  <div className="text-center py-8 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-yellow-800 font-medium mb-2">Questions data not available for review.</p>
                    <p className="text-yellow-600 text-sm">Your score: {result.score}/{result.totalPoints} points ({result.percentage}%)</p>
                    <p className="text-yellow-600 text-xs mt-2">You answered {result.answers?.length || 0} question(s)</p>
                  </div>
                ) : (
                <div className="space-y-6">
                  {questionsToDisplay.map((question, index) => {
                    // Backend stores questionId as question.id, so match against both id and _id
                    const questionId = question.id || question._id;
                    const gradedAnswer = gradedAnswersMap[questionId];
                    const isCorrect = gradedAnswer?.isCorrect === true;
                    const pointsEarned = gradedAnswer?.pointsEarned || 0;
                    const userAnswer = gradedAnswer?.answer || 'Not answered';
                    
                    return (<div key={question._id || question.id} className={`border-2 rounded-lg p-5 ${isCorrect
                        ? 'border-green-300 bg-green-50'
                        : 'border-red-300 bg-red-50'}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {isCorrect ? (<FaCheckCircle className="text-green-600 text-xl flex-shrink-0"/>) : (<FaTimesCircle className="text-red-600 text-xl flex-shrink-0"/>)}
                            <div>
                              <span className="text-sm font-medium text-gray-500">Question {index + 1}</span>
                              <h4 className="text-lg font-semibold text-gray-900 mt-1">{question.question}</h4>
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${isCorrect
                            ? 'bg-green-200 text-green-800'
                            : 'bg-red-200 text-red-800'}`}>
                            {pointsEarned} / {question.points} pts
                          </div>
                        </div>
                        
                        <div className="space-y-2 mt-4">
                          <div>
                            <span className="text-sm font-medium text-gray-600">Your Answer: </span>
                            <span className={`font-semibold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                              {userAnswer}
                            </span>
                          </div>
                          {!isCorrect && (<div>
                              <span className="text-sm font-medium text-gray-600">Correct Answer: </span>
                              <span className="font-semibold text-green-700">
                                {question.correctAnswer}
                              </span>
                            </div>)}
                        </div>
                      </div>);
                  })}
                </div>
                )}
              </div>

              <div className="flex gap-4 justify-center pt-6 border-t border-gray-200">
                <button onClick={() => navigate(`/courses/${id}`)} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium">
                  Back to Course
                </button>
                <button onClick={() => {
                    setResult(null);
                    setAnswers({});
                    setTimeRemaining(quiz.timeLimit > 0 ? quiz.timeLimit * 60 : null);
                }} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition font-medium flex items-center gap-2">
                  <FaRedo />
                  Retake Quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>);
    }
    
    return (<div className="flex min-h-screen bg-gray-50">
      <StudentSidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 hover:shadow-md transition-shadow duration-300">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
              {quiz.description && (<p className="text-gray-600">{quiz.description}</p>)}
            </div>
            {timeRemaining !== null && (<div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-semibold shadow-sm hover:shadow-md transition-shadow duration-200">
                Time: {formatTime(timeRemaining)}
              </div>)}
          </div>

          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm">
            <p className="text-sm text-blue-700 font-medium">
              Total Questions: {quiz.questionCount || quiz.questions?.length || 0} | Total Points: {quiz.totalPoints || 0} | Passing Score: {quiz.passingScore || 60}%
            </p>
          </div>

          {(!quiz.questions || quiz.questions.length === 0) ? (
            <div className="text-center py-12 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-yellow-800 font-medium">No questions available for this quiz.</p>
              <p className="text-yellow-600 text-sm mt-2">Please contact the instructor.</p>
            </div>
          ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            <div className="space-y-8 mb-8">
              {quiz.questions.map((question, index) => {
                const questionId = question._id || question.id || `q-${index}`;
                return (
                <div key={questionId} className="border-b border-gray-200 pb-6">
                  <div className="mb-4">
                    <span className="text-sm font-medium text-gray-500">Question {index + 1} ({question.points} points)</span>
                    <h3 className="text-lg font-semibold text-gray-900 mt-1">{question.question}</h3>
                  </div>

                  {question.type === 'multiple-choice' && question.options && Array.isArray(question.options) && (<div className="space-y-2">
                      {question.options.map((option, optIndex) => {
                        const optionText = typeof option === 'string' ? option : (option.text || option);
                        return (
                        <label key={optIndex} className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all duration-200 hover:scale-[1.02]">
                          <input type="radio" name={questionId} value={optionText} checked={answers[questionId] === optionText} onChange={(e) => handleAnswerChange(questionId, e.target.value)} className="mr-3"/>
                          <span>{optionText}</span>
                        </label>
                      )})}
                    </div>)}

                  {question.type === 'true-false' && (<div className="space-y-2">
                      {['True', 'False'].map((option) => (<label key={option} className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all duration-200 hover:scale-[1.02]">
                          <input type="radio" name={questionId} value={option} checked={answers[questionId] === option} onChange={(e) => handleAnswerChange(questionId, e.target.value)} className="mr-3"/>
                          <span>{option}</span>
                        </label>))}
                    </div>)}

                  {(question.type === 'short-answer' || question.type === 'text') && (<textarea className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 hover:border-blue-300 transition-all duration-200" rows={4} value={answers[questionId] || ''} onChange={(e) => handleAnswerChange(questionId, e.target.value)} placeholder="Type your answer here..."/>)}
                </div>
              )})}
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <button type="button" onClick={() => navigate(`/courses/${id}`)} className="text-gray-600 hover:text-gray-700 transition-colors duration-200 hover:scale-105">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg font-medium">
                {submitting ? 'Submitting...' : 'Submit Quiz'}
              </button>
            </div>
          </form>
          )}
          </div>
        </div>
      </div>
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
      />
    </div>);
};
export default QuizAttempt;
