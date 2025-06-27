import React, { useState, useEffect, useCallback } from 'react';
import {
  getAllAdoptionRequests,
  getAdoptionRequestById,
  updateAdoptionRequestStatus,
  addCommunicationLog,
  getAdoptionRequestStats
} from '../services/PostServicesAdoption';

const ManageAdoptionRequests = () => {
  // State management
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({});

  // Filter state
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    priority: ''
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('view');

  // Form state
  const [updateForm, setUpdateForm] = useState({
    status: '',
    adminNotes: '',
    rejectionReason: ''
  });

  const [communicationForm, setCommunicationForm] = useState({
    type: 'note_added',
    message: ''
  });

  // Constants
  const STATUS_OPTIONS = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending Review' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'interview_scheduled', label: 'Interview Scheduled' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'completed', label: 'Completed' },
    { value: 'withdrawn', label: 'Withdrawn' }
  ];

  const COMMUNICATION_TYPES = [
    { value: 'email_sent', label: 'Email Sent' },
    { value: 'phone_call', label: 'Phone Call' },
    { value: 'meeting_scheduled', label: 'Meeting Scheduled' },
    { value: 'meeting_completed', label: 'Meeting Completed' },
    { value: 'note_added', label: 'Note Added' }
  ];

  // Get available status transitions (matching backend validation)
  const getAvailableStatusOptions = (currentStatus) => {
    const validTransitions = {
      pending: ['under_review', 'approved', 'rejected'],
      under_review: ['interview_scheduled', 'approved', 'rejected'],
      interview_scheduled: ['approved', 'rejected'],
      approved: ['completed'],
      rejected: ['under_review', 'pending'], // Allow re-review
      completed: [],
      withdrawn: []
    };

    const available = validTransitions[currentStatus] || [];
    
    return STATUS_OPTIONS.filter(option => {
      if (!option.value) return false;
      return available.includes(option.value);
    });
  };
  // Fetch requests
  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getAllAdoptionRequests(filters);
      const requestsData = response.data || [];
      setRequests(requestsData);
      
    } catch (err) {
      setError(`Failed to load adoption requests: ${err.message}`);
      console.error('Error fetching adoption requests:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    try {
      const response = await getAdoptionRequestStats(30);
      setStats(response.data || {});
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  // Effects
  useEffect(() => {
    fetchRequests();
    fetchStats();
  }, [fetchRequests, fetchStats]);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Handlers
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSelectRequest = async (request) => {
    try {
      setLoading(true);
      const response = await getAdoptionRequestById(request._id);
      setSelectedRequest(response.data);
      setUpdateForm({
        status: '',
        adminNotes: '',
        rejectionReason: ''
      });
      setModalMode('view');
      setIsModalOpen(true);
    } catch (err) {
      setError(`Failed to load request details: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedRequest || !updateForm.status) {
      setError('Please select a status');
      return;
    }

    if (updateForm.status === 'rejected' && !updateForm.rejectionReason?.trim()) {
      setError('Rejection reason is required when rejecting an application');
      return;
    }

    setSubmitting(true);
    try {
      // Map frontend status to backend expected values
      const statusMapping = {
        'interview' : 'interview_scheduled'
      };
      
      const backendStatus = statusMapping[updateForm.status] || updateForm.status;
      
      const updatePayload = {
        status: backendStatus,
        ...(updateForm.adminNotes && { adminNotes: updateForm.adminNotes }),
        ...(updateForm.rejectionReason && { rejectionReason: updateForm.rejectionReason })
      };

      console.log('Sending status update:', updatePayload);

      await updateAdoptionRequestStatus(selectedRequest._id, updatePayload);
      
      setSuccess(`Adoption request status updated to ${updateForm.status}`);
      setIsModalOpen(false);
      setSelectedRequest(null);
      setUpdateForm({ status: '', adminNotes: '', rejectionReason: '' });
      fetchRequests();
    } catch (err) {
      console.error('Status update failed:', err);
      setError(`Failed to update status: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCommunication = async () => {
    if (!selectedRequest || !communicationForm.message?.trim()) {
      setError('Please enter a communication message');
      return;
    }

    setSubmitting(true);
    try {
      await addCommunicationLog(selectedRequest._id, communicationForm);
      setSuccess('Communication log added successfully');
      setCommunicationForm({ type: 'note_added', message: '' });
      
      // Refresh request details
      const response = await getAdoptionRequestById(selectedRequest._id);
      setSelectedRequest(response.data);
    } catch (err) {
      setError(`Failed to add communication: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Utility functions
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: 'bg-blue-100 text-blue-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      interview_scheduled: 'bg-purple-100 text-purple-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-emerald-100 text-emerald-800',
      withdrawn: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[status] || statusConfig.pending}`}>
        {status?.replace('_', ' ').toUpperCase() || 'PENDING'}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && requests.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading adoption requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Adoption Requests</h1>
          <p className="text-gray-600">Review and manage pet adoption applications</p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Requests</h3>
          <p className="text-2xl font-bold text-gray-900">{stats.totalApplications || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Pending Review</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {stats.statusDistribution?.find(s => s._id === 'pending')?.count || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Approved</h3>
          <p className="text-2xl font-bold text-green-600">
            {stats.statusDistribution?.find(s => s._id === 'approved')?.count || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Conversion Rate</h3>
          <p className="text-2xl font-bold text-blue-600">{stats.conversionRate || 0}%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search by name, email..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Applicant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pet
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Submitted
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.map((request) => (
              <tr key={request._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{request.applicantName}</div>
                    <div className="text-sm text-gray-500">{request.applicantEmail}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {request.pet?.name || 'Unknown Pet'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(request.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(request.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleSelectRequest(request)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {requests.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No adoption requests found</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">
                  Adoption Request - {selectedRequest.pet?.name || 'Unknown Pet'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ✕
                </button>
              </div>

              {/* Modal Tabs */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setModalMode('view')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      modalMode === 'view'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setModalMode('update')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      modalMode === 'update'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Update Status
                  </button>
                  <button
                    onClick={() => setModalMode('communicate')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      modalMode === 'communicate'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Communication
                  </button>
                </nav>
              </div>

              {/* Details Tab */}
              {modalMode === 'view' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Applicant Information</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Name</label>
                          <p className="text-sm text-gray-900">{selectedRequest.applicantName}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Email</label>
                          <p className="text-sm text-gray-900">{selectedRequest.applicantEmail}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Phone</label>
                          <p className="text-sm text-gray-900">{selectedRequest.applicantPhone}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Status</label>
                          <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Application Details</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Housing Type</label>
                          <p className="text-sm text-gray-900 capitalize">{selectedRequest.housingType}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Has Yard</label>
                          <p className="text-sm text-gray-900">{selectedRequest.hasYard ? 'Yes' : 'No'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Has Other Pets</label>
                          <p className="text-sm text-gray-900">{selectedRequest.hasPets ? 'Yes' : 'No'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Reason for Adoption</h4>
                    <p className="text-sm text-gray-900 bg-gray-50 p-4 rounded-lg">
                      {selectedRequest.reason || 'No reason provided'}
                    </p>
                  </div>
                </div>
              )}

              {/* Update Status Tab */}
              {modalMode === 'update' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>Current Status:</strong> {getStatusBadge(selectedRequest.status)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
                    <select
                      value={updateForm.status}
                      onChange={(e) => setUpdateForm(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select new status...</option>
                      {getAvailableStatusOptions(selectedRequest.status).map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes</label>
                    <textarea
                      value={updateForm.adminNotes}
                      onChange={(e) => setUpdateForm(prev => ({ ...prev, adminNotes: e.target.value }))}
                      placeholder="Add notes about this status change..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {updateForm.status === 'rejected' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason *</label>
                      <textarea
                        value={updateForm.rejectionReason}
                        onChange={(e) => setUpdateForm(prev => ({ ...prev, rejectionReason: e.target.value }))}
                        placeholder="Please provide a detailed reason for rejection..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleStatusUpdate}
                      disabled={submitting || !updateForm.status}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {submitting ? 'Updating...' : 'Update Status'}
                    </button>
                  </div>
                </div>
              )}

              {/* Communication Tab */}
              {modalMode === 'communicate' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Communication Type</label>
                    <select
                      value={communicationForm.type}
                      onChange={(e) => setCommunicationForm(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {COMMUNICATION_TYPES.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <textarea
                      value={communicationForm.message}
                      onChange={(e) => setCommunicationForm(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Enter communication details..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleStatusUpdate}
                      disabled={submitting || !updateForm.status || getAvailableStatusOptions(selectedRequest.status).length === 0}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Updating...' : 'Update Status'}
                    </button>
                  </div>
                </div>
              )}

              {modalMode === 'communicate' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Communication Type</label>
                    <select
                      value={communicationForm.type}
                      onChange={(e) => setCommunicationForm(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="email_sent">Email Sent</option>
                      <option value="phone_call">Phone Call</option>
                      <option value="meeting_scheduled">Meeting Scheduled</option>
                      <option value="meeting_completed">Meeting Completed</option>
                      <option value="note_added">Note Added</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <textarea
                      value={communicationForm.message}
                      onChange={(e) => setCommunicationForm(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Enter communication details..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddCommunication}
                      disabled={submitting || !communicationForm.message?.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {submitting ? 'Adding...' : 'Add Communication'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAdoptionRequests;