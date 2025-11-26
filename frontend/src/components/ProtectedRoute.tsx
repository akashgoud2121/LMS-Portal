import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: ('student' | 'instructor' | 'admin')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect based on the route being accessed
    if (allowedRoles?.includes('admin')) {
      return <Navigate to="/admin/login" replace />;
    } else if (allowedRoles?.includes('instructor')) {
      return <Navigate to="/instructor/login" replace />;
    } else {
      return <Navigate to="/student/login" replace />;
    }
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};


