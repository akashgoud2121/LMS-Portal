import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import StudentSidebar from '../components/StudentSidebar';
import { showToast } from '../utils/toast';

interface Option {
  text: string;
  isCorrect?: boolean;
}

interface Question {
  _id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  options: Option[];
  points: number;
  order: number;
}

interface Quiz {
  _id: string;
  title: string;
  description: string;
  questions: Question[];
  timeLimit: number;
  passingScore: number;
  totalPoints: number;
}

const QuizAttempt: React.FC = () => {
  const { id, quizId } = useParams<{ id: string; quizId: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

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
      setQuiz(response.data);
    } catch (error) {
      console.error('Error fetching quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers({
      ...answers,
      [questionId]: answer
    });
  };

  const handleSubmit = async () => {
    if (!quiz) return;

    const answerArray = Object.entries(answers).map(([question, answer]) => ({
      question,
      answer
    }));

    if (answerArray.length < quiz.questions.length) {
      if (!confirm('You have not answered all questions. Submit anyway?')) {
        return;
      }
    }

    setSubmitting(true);
    try {
      const startTime = quiz.startedAt ? new Date(quiz.startedAt).getTime() : Date.now();
      const timeSpent = Math.round((Date.now() - startTime) / 60000); // in minutes
      
      const response = await axios.post(`/api/quizzes/${quizId}/attempt`, {
        answers: answerArray,
        timeSpent
      });
      
      showToast.success(`Quiz submitted! Your score: ${response.data.percentage}% (${response.data.score}/${response.data.totalPoints} points)`);
      navigate(`/courses/${id}`);
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Error submitting quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  if (!quiz) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <StudentSidebar />
        <div className="flex-1 ml-64 flex items-center justify-center">
          <p className="text-gray-500">Quiz not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <StudentSidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 hover:shadow-md transition-shadow duration-300">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
              {quiz.description && (
                <p className="text-gray-600">{quiz.description}</p>
              )}
            </div>
            {timeRemaining !== null && (
              <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-semibold shadow-sm hover:shadow-md transition-shadow duration-200">
                Time: {formatTime(timeRemaining)}
              </div>
            )}
          </div>

          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm">
            <p className="text-sm text-blue-700 font-medium">
              Total Questions: {quiz.questions.length} | Total Points: {quiz.totalPoints} | Passing Score: {quiz.passingScore}%
            </p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            <div className="space-y-8 mb-8">
              {quiz.questions.map((question, index) => (
                <div key={question._id} className="border-b border-gray-200 pb-6">
                  <div className="mb-4">
                    <span className="text-sm font-medium text-gray-500">Question {index + 1} ({question.points} points)</span>
                    <h3 className="text-lg font-semibold text-gray-900 mt-1">{question.question}</h3>
                  </div>

                  {question.type === 'multiple-choice' && (
                    <div className="space-y-2">
                      {question.options.map((option, optIndex) => (
                        <label
                          key={optIndex}
                          className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                        >
                          <input
                            type="radio"
                            name={question._id}
                            value={option.text}
                            checked={answers[question._id] === option.text}
                            onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                            className="mr-3"
                          />
                          <span>{option.text}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {question.type === 'true-false' && (
                    <div className="space-y-2">
                      {['True', 'False'].map((option) => (
                        <label
                          key={option}
                          className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                        >
                          <input
                            type="radio"
                            name={question._id}
                            value={option}
                            checked={answers[question._id] === option}
                            onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                            className="mr-3"
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {question.type === 'short-answer' && (
                    <textarea
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 hover:border-blue-300 transition-all duration-200"
                      rows={4}
                      value={answers[question._id] || ''}
                      onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                      placeholder="Type your answer here..."
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate(`/courses/${id}`)}
                className="text-gray-600 hover:text-gray-700 transition-colors duration-200 hover:scale-105"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg font-medium"
              >
                {submitting ? 'Submitting...' : 'Submit Quiz'}
              </button>
            </div>
          </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizAttempt;


