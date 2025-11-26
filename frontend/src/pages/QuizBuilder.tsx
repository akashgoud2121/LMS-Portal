import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { showToast } from '../utils/toast';

interface Option {
  text: string;
  isCorrect: boolean;
}

interface Question {
  _id?: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  options: Option[];
  correctAnswer: string;
  points: number;
  order: number;
}

interface Quiz {
  title: string;
  description: string;
  course: string;
  questions: Question[];
  timeLimit: number;
  passingScore: number;
}

const QuizBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Array<{ _id: string; title: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quiz, setQuiz] = useState<Quiz>({
    title: '',
    description: '',
    course: '',
    questions: [],
    timeLimit: 0,
    passingScore: 60
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await axios.get('/api/courses/instructor/my-courses');
      setCourses(response.data);
      if (response.data.length > 0) {
        setQuiz({ ...quiz, course: response.data[0]._id });
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await axios.post('/api/quizzes', quiz);
      showToast.success('Quiz created successfully!');
      navigate('/instructor/dashboard');
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Error creating quiz');
    } finally {
      setSaving(false);
    }
  };

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      question: '',
      type: 'multiple-choice',
      options: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ],
      correctAnswer: '',
      points: 1,
      order: quiz.questions.length + 1
    };
    setQuiz({
      ...quiz,
      questions: [...quiz.questions, newQuestion]
    });
  };

  const handleQuestionChange = (index: number, field: keyof Question, value: any) => {
    const updatedQuestions = [...quiz.questions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value
    };
    setQuiz({ ...quiz, questions: updatedQuestions });
  };

  const handleOptionChange = (questionIndex: number, optionIndex: number, field: keyof Option, value: any) => {
    const updatedQuestions = [...quiz.questions];
    updatedQuestions[questionIndex].options[optionIndex] = {
      ...updatedQuestions[questionIndex].options[optionIndex],
      [field]: value
    };
    setQuiz({ ...quiz, questions: updatedQuestions });
  };

  const handleAddOption = (questionIndex: number) => {
    const updatedQuestions = [...quiz.questions];
    updatedQuestions[questionIndex].options.push({ text: '', isCorrect: false });
    setQuiz({ ...quiz, questions: updatedQuestions });
  };

  const handleDeleteQuestion = (index: number) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    const updatedQuestions = [...quiz.questions];
    updatedQuestions.splice(index, 1);
    updatedQuestions.forEach((q, idx) => {
      q.order = idx + 1;
    });
    setQuiz({ ...quiz, questions: updatedQuestions });
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Create Quiz</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quiz Title *
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                value={quiz.title}
                onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                value={quiz.description}
                onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course *
                </label>
                <select
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  value={quiz.course}
                  onChange={(e) => setQuiz({ ...quiz, course: e.target.value })}
                >
                  <option value="">Select a course</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Limit (minutes, 0 = no limit)
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  value={quiz.timeLimit}
                  onChange={(e) => setQuiz({ ...quiz, timeLimit: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Passing Score (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                value={quiz.passingScore}
                onChange={(e) => setQuiz({ ...quiz, passingScore: parseInt(e.target.value) || 60 })}
              />
            </div>

            {/* Questions Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Questions
                </label>
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                >
                  Add Question
                </button>
              </div>

              <div className="space-y-6">
                {quiz.questions.map((question, qIndex) => (
                  <div key={qIndex} className="border border-gray-300 rounded-md p-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-gray-700">
                        Question {question.order}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(qIndex)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </div>

                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Question text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        value={question.question}
                        onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                      />

                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        value={question.type}
                        onChange={(e) => {
                          const type = e.target.value as Question['type'];
                          let updatedQuestion = { ...question, type };
                          if (type === 'true-false') {
                            updatedQuestion.options = [
                              { text: 'True', isCorrect: false },
                              { text: 'False', isCorrect: false }
                            ];
                          }
                          handleQuestionChange(qIndex, 'type', type);
                          if (type === 'true-false') {
                            handleQuestionChange(qIndex, 'options', updatedQuestion.options);
                          }
                        }}
                      >
                        <option value="multiple-choice">Multiple Choice</option>
                        <option value="true-false">True/False</option>
                        <option value="short-answer">Short Answer</option>
                      </select>

                      {(question.type === 'multiple-choice' || question.type === 'true-false') && (
                        <div className="space-y-2">
                          {question.options.map((option, optIndex) => (
                            <div key={optIndex} className="flex items-center space-x-2">
                              <input
                                type="text"
                                placeholder="Option text"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                                value={option.text}
                                onChange={(e) => handleOptionChange(qIndex, optIndex, 'text', e.target.value)}
                              />
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name={`correct-${qIndex}`}
                                  checked={option.isCorrect}
                                  onChange={() => {
                                    const updatedOptions = question.options.map((opt, idx) => ({
                                      ...opt,
                                      isCorrect: idx === optIndex
                                    }));
                                    handleQuestionChange(qIndex, 'options', updatedOptions);
                                  }}
                                  className="mr-1"
                                />
                                <span className="text-sm text-gray-600">Correct</span>
                              </label>
                            </div>
                          ))}
                          {question.type === 'multiple-choice' && (
                            <button
                              type="button"
                              onClick={() => handleAddOption(qIndex)}
                              className="text-sm text-primary-600 hover:text-primary-700"
                            >
                              + Add Option
                            </button>
                          )}
                        </div>
                      )}

                      {question.type === 'short-answer' && (
                        <input
                          type="text"
                          placeholder="Correct answer"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          value={question.correctAnswer}
                          onChange={(e) => handleQuestionChange(qIndex, 'correctAnswer', e.target.value)}
                        />
                      )}

                      <div>
                        <label className="text-sm text-gray-600">Points:</label>
                        <input
                          type="number"
                          min="1"
                          className="ml-2 px-2 py-1 border border-gray-300 rounded text-sm w-20"
                          value={question.points}
                          onChange={(e) => handleQuestionChange(qIndex, 'points', parseInt(e.target.value) || 1)}
                        />
                      </div>
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
                disabled={saving || quiz.questions.length === 0}
                className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create Quiz'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuizBuilder;


