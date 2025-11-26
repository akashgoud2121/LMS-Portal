import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import InstructorSidebar from '../components/InstructorSidebar';
import { showToast } from '../utils/toast';
import ConfirmDialog from '../components/ConfirmDialog';
import { FaQuestionCircle, FaPlusCircle, FaEdit, FaTrash } from 'react-icons/fa';
const InstructorQuizzes = () => {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'danger',
        onConfirm: () => {}
    });
    useEffect(() => {
        fetchQuizzes();
    }, []);
    const fetchQuizzes = async () => {
        try {
            const response = await axios.get('/api/quizzes/instructor/my-quizzes');
            setQuizzes(response.data);
        }
        catch (error) {
            console.error('Error fetching quizzes:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleDeleteQuiz = async (quizId, quizTitle) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Delete Quiz',
            message: `Are you sure you want to delete "${quizTitle}"? This action cannot be undone.`,
            type: 'danger',
            onConfirm: async () => {
                try {
                    await axios.delete(`/api/quizzes/${quizId}`);
                    showToast.success('Quiz deleted successfully!');
                    fetchQuizzes();
                }
                catch (error) {
                    console.error('Error deleting quiz:', error);
                    showToast.error(error.response?.data?.message || 'Failed to delete quiz');
                }
            }
        });
    };
    const handleTogglePublish = async (quiz) => {
        try {
            await axios.patch(`/api/quizzes/${quiz._id}/publish`, { isPublished: !quiz.isPublished });
            showToast.success(`Quiz ${quiz.isPublished ? 'unpublished' : 'published'} successfully`);
            fetchQuizzes();
        }
        catch (error) {
            console.error('Error updating publish status:', error);
            showToast.error(error.response?.data?.message || 'Failed to update status');
        }
    };
    if (loading) {
        return (<div className="flex min-h-screen bg-gray-50">
        <InstructorSidebar />
        <div className="flex-1 ml-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600"></div>
        </div>
      </div>);
    }
    return (<div className="flex min-h-screen bg-gray-50">
      <InstructorSidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Quizzes</h1>
              <p className="text-gray-600">Create and manage quizzes for your courses</p>
            </div>
            <Link to="/instructor/quizzes/create" className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2">
              <FaPlusCircle />
              Create Quiz
            </Link>
          </div>

          {quizzes.length === 0 ? (<div className="bg-white rounded-2xl shadow-lg p-16 text-center">
              <FaQuestionCircle className="text-6xl text-gray-300 mx-auto mb-4"/>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No Quizzes Yet</h3>
              <p className="text-gray-600 mb-8">
                Create your first quiz to test your students' knowledge.
              </p>
              <Link to="/instructor/quizzes/create" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-indigo-700 transition-all duration-300">
                <FaPlusCircle />
                Create Your First Quiz
              </Link>
            </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz) => (<div key={quiz._id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-purple-100 p-3 rounded-xl">
                      <FaQuestionCircle className="text-purple-600 text-xl"/>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${quiz.isPublished
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'}`}>
                      {quiz.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                    {quiz.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {quiz.description || 'No description'}
                  </p>
                  
                  <div className="mb-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Course:</span>
                      <span className="font-medium text-indigo-600">{quiz.course?.title || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Total Points:</span>
                      <span className="font-medium text-gray-900">{quiz.totalPoints}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button onClick={() => handleTogglePublish(quiz)} className={`w-full px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${quiz.isPublished
                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                      {quiz.isPublished ? 'Unpublish' : 'Publish'}
                    </button>
                    <div className="flex gap-2">
                      <Link to={`/instructor/quizzes/${quiz._id}/edit`} className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-indigo-700 transition-all duration-300 text-center flex items-center justify-center gap-2">
                        <FaEdit className="text-sm"/>
                        Edit
                      </Link>
                    </div>
                    <button onClick={() => handleDeleteQuiz(quiz._id, quiz.title)} className="w-full bg-red-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-red-700 transition-all duration-300 flex items-center justify-center gap-2">
                      <FaTrash className="text-sm"/>
                      Delete Quiz
                    </button>
                  </div>
                </div>))}
            </div>)}
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
export default InstructorQuizzes;
