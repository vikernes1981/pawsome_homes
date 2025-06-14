import { useState, useEffect } from "react";
import Select from "react-select";
import {
  getAllAdoptions as getAllAdoptionRequests,
  updateAdoption as updateAdoptionRequestStatus,
} from "../services/PostServicesAdoption";

const ManageAdoptionRequests = () => {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const res = await getAllAdoptionRequests();
    setRequests(Array.isArray(res) ? res : []);
  };

  const handleUpdateStatus = async () => {
    if (!selectedRequest || !selectedStatus) return;
    setSubmitting(true);
    try {
      await updateAdoptionRequestStatus(selectedRequest._id, {
        status: selectedStatus.value,
      });
      alert("Status updated successfully.");
      fetchRequests();
      setSelectedRequest(null);
      setSelectedStatus(null);
    } catch (err) {
      console.error("Update failed:", err);
      alert("Failed to update request status.");
    } finally {
      setSubmitting(false);
    }
  };

  const requestOptions = requests.map((request) => ({
    value: request._id,
    label: `${request.pet?.name} - ${request.status}`,
    request: request,
  }));

  const statusOptions = [
    { value: "Pending", label: "Pending" },
    { value: "Approved", label: "Approved" },
    { value: "Rejected", label: "Rejected" },
  ];

  const customStyles = {
    control: (base) => ({ ...base, backgroundColor: "#333", color: "#fff" }),
    menu: (base) => ({ ...base, backgroundColor: "#333" }),
    singleValue: (base) => ({ ...base, color: "#fff" }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? "#555" : "#333",
      color: "#fff",
      "&:hover": { backgroundColor: "#444" },
    }),
  };

  return (
    <div className="manage-requests p-4">
      <h2 className="text-2xl font-semibold text-black mb-6">Manage Adoption Requests</h2>

      <Select
        options={requestOptions}
        onChange={(opt) => setSelectedRequest(opt?.request)}
        placeholder="Select a request..."
        styles={customStyles}
        value={
          selectedRequest
            ? { value: selectedRequest._id, label: `${selectedRequest.pet.name} - ${selectedRequest.status}` }
            : null
        }
        className="mb-6"
      />

      {selectedRequest && (
        <div className="bg-gray-100 p-6 rounded shadow-md text-black space-y-4">
          <h3 className="text-xl font-semibold mb-2">Request Details</h3>
          <p><strong>User:</strong> {selectedRequest.user?.username || selectedRequest.user || 'Unknown user'}</p>
          <p><strong>Pet:</strong> {selectedRequest.pet.name}</p>
          <p><strong>Message:</strong> {selectedRequest.message}</p>
          <p><strong>Current Status:</strong> {selectedRequest.status}</p>

          <Select
            options={statusOptions}
            onChange={(opt) => setSelectedStatus(opt)}
            value={selectedStatus}
            styles={customStyles}
            placeholder="Select new status..."
          />

          <button
            onClick={handleUpdateStatus}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
            disabled={submitting}
          >
            {submitting ? "Updating..." : "Update Status"}
          </button>
        </div>
      )}
    </div>
  );
};

export default ManageAdoptionRequests;
