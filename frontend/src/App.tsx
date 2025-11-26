import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import LoginStudent from './pages/LoginStudent';
import LoginInstructor from './pages/LoginInstructor';
import LoginAdmin from './pages/LoginAdmin';
import RegisterStudent from './pages/RegisterStudent';
import RegisterInstructor from './pages/RegisterInstructor';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import LessonPlayer from './pages/LessonPlayer';
import Dashboard from './pages/Dashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import InstructorCourses from './pages/InstructorCourses';
import InstructorMaterials from './pages/InstructorMaterials';
import InstructorQuizzes from './pages/InstructorQuizzes';
import CourseBuilder from './pages/CourseBuilder';
import QuizBuilder from './pages/QuizBuilder';
import InstructorSidebar from './components/InstructorSidebar';
import AdminHome from './pages/AdminHome';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminCourses from './pages/AdminCourses';
import AdminApprovals from './pages/AdminApprovals';
import RegisterAdmin from './pages/RegisterAdmin';
import QuizAttempt from './pages/QuizAttempt';
import WatchLessons from './pages/WatchLessons';
import AttemptQuizzes from './pages/AttemptQuizzes';
import TrackProgress from './pages/TrackProgress';
import StudentCourses from './pages/StudentCourses';
import './App.css';

const AppContent = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isInstructorRoute = location.pathname.startsWith('/instructor');
  const isStudentRoute = location.pathname === '/dashboard' || 
                         location.pathname.startsWith('/student/') ||
                         location.pathname.includes('/lesson/') || 
                         location.pathname.includes('/quiz/');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hide navbar on admin, instructor, and student routes - sidebars replace it */}
      {!isAdminRoute && !isInstructorRoute && !isStudentRoute && <Navbar />}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Routes>
        <Route path="/" element={<Home />} />
        
        {/* Separate Login Routes */}
        <Route path="/student/login" element={<LoginStudent />} />
        <Route path="/instructor/login" element={<LoginInstructor />} />
        <Route path="/admin/login" element={<LoginAdmin />} />
        
        {/* Separate Signup Routes */}
        <Route path="/student/register" element={<RegisterStudent />} />
        <Route path="/instructor/register" element={<RegisterInstructor />} />
        <Route path="/admin/register" element={<RegisterAdmin />} />
        
        {/* Public Routes */}
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        
        {/* Student Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/courses"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentCourses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/watch-lessons"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <WatchLessons />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/attempt-quizzes"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <AttemptQuizzes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/track-progress"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <TrackProgress />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:id/lesson/:lessonId"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <LessonPlayer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:id/quiz/:quizId"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <QuizAttempt />
            </ProtectedRoute>
          }
        />
        
        {/* Instructor Routes */}
        <Route
          path="/instructor/dashboard"
          element={
            <ProtectedRoute allowedRoles={['instructor', 'admin']}>
              <InstructorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor/courses"
          element={
            <ProtectedRoute allowedRoles={['instructor', 'admin']}>
              <InstructorCourses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor/courses/create"
          element={
            <ProtectedRoute allowedRoles={['instructor', 'admin']}>
              <div className="flex min-h-screen bg-gray-50">
                <InstructorSidebar />
                <div className="flex-1 ml-64">
                  <CourseBuilder />
                </div>
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor/courses/:id/edit"
          element={
            <ProtectedRoute allowedRoles={['instructor', 'admin']}>
              <div className="flex min-h-screen bg-gray-50">
                <InstructorSidebar />
                <div className="flex-1 ml-64">
                  <CourseBuilder />
                </div>
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor/materials"
          element={
            <ProtectedRoute allowedRoles={['instructor', 'admin']}>
              <InstructorMaterials />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor/quizzes"
          element={
            <ProtectedRoute allowedRoles={['instructor', 'admin']}>
              <InstructorQuizzes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor/quizzes/create"
          element={
            <ProtectedRoute allowedRoles={['instructor', 'admin']}>
              <div className="flex min-h-screen bg-gray-50">
                <InstructorSidebar />
                <div className="flex-1 ml-64">
                  <QuizBuilder />
                </div>
              </div>
            </ProtectedRoute>
          }
        />
        
        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/courses"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminCourses />
            </ProtectedRoute>
          }
        />
            <Route
              path="/admin/approvals"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminApprovals />
                </ProtectedRoute>
              }
            />
            
            <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
