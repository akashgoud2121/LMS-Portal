import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { showToast } from '../utils/toast';
import ConfirmDialog from '../components/ConfirmDialog';
const QuizBuilder = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [quiz, setQuiz] = useState({
        title: '',
        description: '',
        course: '',
        questions: [],
        timeLimit: 0,
        passingScore: 60,
        isPublished: true
    });
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'danger',
        onConfirm: () => {}
    });
    useEffect(() => {
        fetchCourses();
        if (isEditMode) {
            fetchQuiz();
        }
    }, [id]);
    const fetchCourses = async () => {
        try {
            const response = await axios.get('/api/courses/instructor/my-courses');
            setCourses(response.data);
            if (response.data.length > 0 && !isEditMode) {
                setQuiz(prev => ({ ...prev, course: response.data[0]._id }));
            }
        }
        catch (error) {
            console.error('Error fetching courses:', error);
        }
        finally {
            if (!isEditMode) {
                setLoading(false);
            }
        }
    };
    const fetchQuiz = async () => {
        try {
            const response = await axios.get(`/api/quizzes/${id}`);
            const quizData = response.data;
            
            // Transform questions from backend format to form format
            const questions = (quizData.questions || []).map((q) => {
                let options = [];
                let correctAnswer = q.correctAnswer || '';
                
                if (q.type === 'multiple-choice' && q.options && Array.isArray(q.options)) {
                    // Check if options have isCorrect flag
                    const hasIsCorrect = q.options.some(opt => typeof opt === 'object' && opt.isCorrect !== undefined);
                    
                    if (hasIsCorrect) {
                        // Options already have isCorrect flags
                        options = q.options.map(opt => ({
                            text: typeof opt === 'string' ? opt : (opt.text || ''),
                            isCorrect: typeof opt === 'object' && opt.isCorrect === true
                        }));
                    } else {
                        // Options don't have isCorrect, use correctAnswer to set them
                        options = q.options.map(opt => {
                            const optText = typeof opt === 'string' ? opt : (opt.text || '');
                            return {
                                text: optText,
                                isCorrect: optText === correctAnswer
                            };
                        });
                    }
                } else if (q.type === 'true-false') {
                    options = [
                        { text: 'True', isCorrect: correctAnswer === 'True' || correctAnswer === 'true' },
                        { text: 'False', isCorrect: correctAnswer === 'False' || correctAnswer === 'false' }
                    ];
                } else if (q.type === 'short-answer') {
                    // Short answer doesn't need options
                    options = [];
                }
                
                return {
                    question: q.question || '',
                    type: q.type || 'multiple-choice',
                    options: options.length > 0 ? options : (q.type === 'multiple-choice' ? [{ text: '', isCorrect: false }, { text: '', isCorrect: false }] : []),
                    correctAnswer: correctAnswer,
                    points: q.points || 1,
                    order: q.order || 1
                };
            });
            
            setQuiz({
                title: quizData.title || '',
                description: quizData.description || '',
                course: quizData.course?._id || quizData.courseId || '',
                questions: questions,
                timeLimit: quizData.timeLimit || 0,
                passingScore: quizData.passingScore || 60,
                isPublished: quizData.isPublished !== undefined ? quizData.isPublished : true
            });
        }
        catch (error) {
            console.error('Error fetching quiz:', error);
            showToast.error('Failed to load quiz data');
            navigate('/instructor/quizzes');
        }
        finally {
            setLoading(false);
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Transform questions to backend format
            const questionsData = quiz.questions.map((q) => {
                let options = [];
                let correctAnswer = '';
                
                if (q.type === 'multiple-choice' || q.type === 'true-false') {
                    options = q.options.map(opt => ({
                        text: opt.text,
                        isCorrect: opt.isCorrect
                    }));
                    // Find the correct option
                    const correctOpt = q.options.find(opt => opt.isCorrect);
                    if (correctOpt) {
                        correctAnswer = correctOpt.text;
                    }
                } else {
                    correctAnswer = q.correctAnswer || '';
                }
                
                return {
                    question: q.question,
                    type: q.type,
                    options: options,
                    correctAnswer: correctAnswer,
                    points: q.points || 1
                };
            });
            
            const payload = {
                title: quiz.title,
                description: quiz.description,
                course: quiz.course,
                questions: questionsData,
                timeLimit: quiz.timeLimit,
                passingScore: quiz.passingScore,
                isPublished: quiz.isPublished
            };
            
            if (isEditMode) {
                await axios.put(`/api/quizzes/${id}`, payload);
                showToast.success('Quiz updated successfully!');
            } else {
                await axios.post('/api/quizzes', payload);
                showToast.success('Quiz created successfully!');
            }
            navigate('/instructor/quizzes');
        }
        catch (error) {
            showToast.error(error.response?.data?.message || `Error ${isEditMode ? 'updating' : 'creating'} quiz`);
        }
        finally {
            setSaving(false);
        }
    };
    const handleAddQuestion = () => {
        const newQuestion = {
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
    const handleQuestionChange = (index, field, value) => {
        const updatedQuestions = [...quiz.questions];
        updatedQuestions[index] = {
            ...updatedQuestions[index],
            [field]: value
        };
        setQuiz({ ...quiz, questions: updatedQuestions });
    };
    const handleOptionChange = (questionIndex, optionIndex, field, value) => {
        const updatedQuestions = [...quiz.questions];
        updatedQuestions[questionIndex].options[optionIndex] = {
            ...updatedQuestions[questionIndex].options[optionIndex],
            [field]: value
        };
        setQuiz({ ...quiz, questions: updatedQuestions });
    };
    const handleAddOption = (questionIndex) => {
        const updatedQuestions = [...quiz.questions];
        updatedQuestions[questionIndex].options.push({ text: '', isCorrect: false });
        setQuiz({ ...quiz, questions: updatedQuestions });
    };
    const handleDeleteQuestion = (index) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Delete Question',
            message: 'Are you sure you want to delete this question? This action cannot be undone.',
            type: 'danger',
            onConfirm: () => {
                const updatedQuestions = [...quiz.questions];
                updatedQuestions.splice(index, 1);
                updatedQuestions.forEach((q, idx) => {
                    q.order = idx + 1;
                });
                setQuiz({ ...quiz, questions: updatedQuestions });
                showToast.success('Question deleted');
            }
        });
    };
    if (loading) {
        return (<div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>);
    }
    return (<div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pr-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{isEditMode ? 'Edit Quiz' : 'Create Quiz'}</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quiz Title *
              </label>
              <input type="text" required className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" value={quiz.title} onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}/>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" value={quiz.description} onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}/>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course *
                </label>
                <select required className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" value={quiz.course} onChange={(e) => setQuiz({ ...quiz, course: e.target.value })}>
                  <option value="">Select a course</option>
                  {courses.map((course) => (<option key={course._id} value={course._id}>
                      {course.title}
                    </option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Limit (minutes, 0 = no limit)
                </label>
                <input type="number" min="0" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" value={quiz.timeLimit} onChange={(e) => setQuiz({ ...quiz, timeLimit: parseInt(e.target.value) || 0 })}/>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Passing Score (%)
              </label>
              <input type="number" min="0" max="100" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" value={quiz.passingScore} onChange={(e) => setQuiz({ ...quiz, passingScore: parseInt(e.target.value) || 60 })}/>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-semibold text-gray-800">Publish immediately</p>
                <p className="text-xs text-gray-500">Only published quizzes appear for students.</p>
              </div>
              <label className="inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only" checked={quiz.isPublished} onChange={(e) => setQuiz({ ...quiz, isPublished: e.target.checked })}/>
                <span className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${quiz.isPublished ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <span className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${quiz.isPublished ? 'translate-x-6' : 'translate-x-0'}`}></span>
                </span>
              </label>
            </div>

            {/* Questions Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Questions
                </label>
                <button type="button" onClick={handleAddQuestion} className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700">
                  Add Question
                </button>
              </div>

              <div className="space-y-6">
                {quiz.questions.map((question, qIndex) => (<div key={qIndex} className="border border-gray-300 rounded-md p-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-gray-700">
                        Question {question.order}
                      </span>
                      <button type="button" onClick={() => handleDeleteQuestion(qIndex)} className="text-red-600 hover:text-red-700 text-sm">
                        Delete
                      </button>
                    </div>

                    <div className="space-y-3">
                      <input type="text" placeholder="Question text" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" value={question.question} onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}/>

                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" value={question.type} onChange={(e) => {
                const type = e.target.value;
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
            }}>
                        <option value="multiple-choice">Multiple Choice</option>
                        <option value="true-false">True/False</option>
                        <option value="short-answer">Short Answer</option>
                      </select>

                      {(question.type === 'multiple-choice' || question.type === 'true-false') && (<div className="space-y-2">
                          {question.options.map((option, optIndex) => (<div key={optIndex} className="flex items-center space-x-2">
                              <input type="text" placeholder="Option text" className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm" value={option.text} onChange={(e) => handleOptionChange(qIndex, optIndex, 'text', e.target.value)}/>
                              <label className="flex items-center">
                                <input type="radio" name={`correct-${qIndex}`} checked={option.isCorrect} onChange={() => {
                        const updatedOptions = question.options.map((opt, idx) => ({
                            ...opt,
                            isCorrect: idx === optIndex
                        }));
                        handleQuestionChange(qIndex, 'options', updatedOptions);
                    }} className="mr-1"/>
                                <span className="text-sm text-gray-600">Correct</span>
                              </label>
                            </div>))}
                          {question.type === 'multiple-choice' && (<button type="button" onClick={() => handleAddOption(qIndex)} className="text-sm text-primary-600 hover:text-primary-700">
                              + Add Option
                            </button>)}
                        </div>)}

                      {question.type === 'short-answer' && (<input type="text" placeholder="Correct answer" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" value={question.correctAnswer} onChange={(e) => handleQuestionChange(qIndex, 'correctAnswer', e.target.value)}/>)}

                      <div>
                        <label className="text-sm text-gray-600">Points:</label>
                        <input type="number" min="1" className="ml-2 px-2 py-1 border border-gray-300 rounded text-sm w-20" value={question.points} onChange={(e) => handleQuestionChange(qIndex, 'points', parseInt(e.target.value) || 1)}/>
                      </div>
                    </div>
                  </div>))}
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button type="button" onClick={() => navigate('/instructor/quizzes')} className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={saving || quiz.questions.length === 0} className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50">
                {saving ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Quiz' : 'Create Quiz')}
              </button>
            </div>
          </div>
        </form>
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
export default QuizBuilder;
