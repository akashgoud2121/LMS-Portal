import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';
import { showToast } from '../utils/toast';
import { FaCheckCircle, FaUserGraduate, FaChalkboardTeacher, FaUser, FaClock, FaShieldAlt, FaTimesCircle } from 'react-icons/fa';

interface PendingUser {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
}

interface ApprovalStats {
  pending: number;
  approved: number;
  rejected: number;
}

const AdminApprovals: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [approvalStats, setApprovalStats] = useState<ApprovalStats>({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'student' | 'instructor' | 'admin'>('all');
  const [rejectionReason, setRejectionReason] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingUsers();
    fetchApprovalStats();
  }, [filter]);

  const fetchPendingUsers = async () => {
    try {
      const params = filter !== 'all' ? { role: filter } : {};
      const response = await axios.get('/api/admin/users/pending', { params });
      setPendingUsers(response.data);
    } catch (error) {
      console.error('Error fetching pending users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovalStats = async () => {
    try {
      const response = await axios.get('/api/admin/users/approval-stats');
      setApprovalStats(response.data);
    } catch (error) {
      console.error('Error fetching approval stats:', error);
    }
  };

  const handleApprove = async (userId: string) => {
    setProcessing(userId);
    try {
      await axios.post(`/api/admin/users/${userId}/approve`);
      fetchPendingUsers();
      fetchApprovalStats();
      showToast.success('User approved successfully');
    } catch (error) {
      showToast.error('Failed to approve user');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (userId: string) => {
    if (!rejectionReason[userId] || rejectionReason[userId].trim() === '') {
      showToast.warning('Please provide a rejection reason');
      return;
    }

    setProcessing(userId);
    try {
      await axios.post(`/api/admin/users/${userId}/reject`, {
        rejectionReason: rejectionReason[userId]
      });
      setRejectionReason({ ...rejectionReason, [userId]: '' });
      fetchPendingUsers();
      fetchApprovalStats();
      showToast.success('User rejected successfully');
    } catch (error) {
      showToast.error('Failed to reject user');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  const studentCount = pendingUsers.filter(u => u.role === 'student').length;
  const instructorCount = pendingUsers.filter(u => u.role === 'instructor').length;
  const adminCount = pendingUsers.filter(u => u.role === 'admin').length;

  return (
    <AdminLayout>
      {/* Approval Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-700 mb-1">Pending</p>
              <p className="text-3xl font-bold text-yellow-900">{approvalStats.pending}</p>
            </div>
            <FaClock className="text-3xl text-yellow-600 opacity-80" />
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700 mb-1">Approved</p>
              <p className="text-3xl font-bold text-green-900">{approvalStats.approved}</p>
            </div>
            <FaCheckCircle className="text-3xl text-green-600 opacity-80" />
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-700 mb-1">Rejected</p>
              <p className="text-3xl font-bold text-red-900">{approvalStats.rejected}</p>
            </div>
            <FaTimesCircle className="text-3xl text-red-600 opacity-80" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 bg-white border rounded-lg p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({pendingUsers.length})
          </button>
          <button
            onClick={() => setFilter('student')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'student'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FaUserGraduate className="inline mr-2" />
            Students ({studentCount})
          </button>
          <button
            onClick={() => setFilter('instructor')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'instructor'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FaChalkboardTeacher className="inline mr-2" />
            Instructors ({instructorCount})
          </button>
          <button
            onClick={() => setFilter('admin')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'admin'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FaShieldAlt className="inline mr-2" />
            Admins ({adminCount})
          </button>
        </div>
      </div>

      {/* Pending Users List */}
      {pendingUsers.length === 0 ? (
        <div className="bg-white border rounded-lg p-12 text-center">
          <FaCheckCircle className="text-5xl text-green-500 mb-4 mx-auto" />
          <p className="text-gray-700 text-lg mb-1 font-medium">No pending approvals</p>
          <p className="text-gray-400 text-sm">All users have been reviewed</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingUsers.map((user) => (
            <div
              key={user.id}
              className="bg-white border rounded-lg p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white flex-shrink-0 ${
                  user.role === 'admin'
                    ? 'bg-red-500'
                    : user.role === 'instructor'
                    ? 'bg-green-500'
                    : 'bg-blue-500'
                }`}>
                  {user.role === 'admin' ? (
                    <FaShieldAlt className="text-xl" />
                  ) : (
                    <FaUser className="text-xl" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                      user.role === 'admin'
                        ? 'bg-red-100 text-red-700'
                        : user.role === 'instructor'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {user.role === 'admin' ? 'Admin' : user.role === 'instructor' ? 'Instructor' : 'Student'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{user.email}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <FaClock />
                    Registered: {new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason (if rejecting):
                  </label>
                  <textarea
                    placeholder="Enter reason for rejection..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                    value={rejectionReason[user.id] || ''}
                    onChange={(e) =>
                      setRejectionReason({ ...rejectionReason, [user.id]: e.target.value })
                    }
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(user.id)}
                    disabled={processing === user.id}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <FaCheckCircle />
                    {processing === user.id ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleReject(user.id)}
                    disabled={processing === user.id}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminApprovals;
