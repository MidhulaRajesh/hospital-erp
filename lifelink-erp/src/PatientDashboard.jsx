import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./PatientDashboard.css";

const PatientDashboard = ({ patientData, onLogout }) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(patientData || {});

  const handleInputChange = (e) => {
    setEditedData({
      ...editedData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    try {
      // Only send editable fields to backend
      const updateData = {
        phone: editedData.phone,
        address: editedData.address
      };
      
      const response = await axios.put(`http://localhost:5000/api/patients/${patientData.id}`, updateData);
      
      // Update local state with the response from backend
      if (response.data.patient) {
        setEditedData({
          ...editedData,
          ...response.data.patient
        });
      } else {
        // Fallback to local update
        setEditedData({
          ...editedData,
          phone: updateData.phone,
          address: updateData.address
        });
      }
      
      setIsEditing(false);
      alert("Profile updated successfully! ✅");
    } catch (error) {
      console.error("Error updating patient data:", error);
      alert("Failed to update profile. Please try again. ❌");
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate("/login");
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Patient Dashboard</h1>
          <button onClick={handleLogout} className="logout-btn">
            <span className="logout-icon">↗</span>
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="profile-card">
          <h2>Patient Information</h2>
          {isEditing && (
            <div className="edit-notice">
              <span className="edit-icon">ℹ️</span>
              <p>For security reasons, you can only edit your mobile number and address. Other details are read-only.</p>
            </div>
          )}
          {isEditing ? (
            <div className="edit-form">
              <div className="form-row">
                <div className="readonly-field">
                  <label>First Name (Read-only)</label>
                  <input
                    type="text"
                    value={editedData.firstName || ""}
                    disabled
                    className="readonly-input"
                  />
                </div>
                <div className="readonly-field">
                  <label>Last Name (Read-only)</label>
                  <input
                    type="text"
                    value={editedData.lastName || ""}
                    disabled
                    className="readonly-input"
                  />
                </div>
              </div>
              <div className="readonly-field">
                <label>Email (Read-only)</label>
                <input
                  type="email"
                  value={editedData.email || ""}
                  disabled
                  className="readonly-input"
                />
              </div>
              <div className="readonly-field">
                <label>Patient ID (Read-only)</label>
                <input
                  type="text"
                  value={editedData.patientId || ""}
                  disabled
                  className="readonly-input"
                />
              </div>
              <div className="readonly-field">
                <label>Date of Birth (Read-only)</label>
                <input
                  type="text"
                  value={editedData.dateOfBirth || "Not provided"}
                  disabled
                  className="readonly-input"
                />
              </div>
              <div className="readonly-field">
                <label>Blood Group (Read-only)</label>
                <input
                  type="text"
                  value={editedData.bloodGroup || "Not provided"}
                  disabled
                  className="readonly-input"
                />
              </div>
              <div className="editable-field">
                <label>Mobile Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={editedData.phone || ""}
                  onChange={handleInputChange}
                  placeholder="Enter your mobile number"
                  className="editable-input"
                />
              </div>
              <div className="editable-field">
                <label>Address *</label>
                <textarea
                  name="address"
                  value={editedData.address || ""}
                  onChange={handleInputChange}
                  placeholder="Enter your address"
                  className="editable-textarea"
                  rows="3"
                />
              </div>
              <div className="edit-actions">
                <button onClick={handleSave} className="save-btn">
                  Save Changes
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="profile-info">
              <div className="info-group">
                <label>Name:</label>
                <span>{editedData.firstName} {editedData.lastName}</span>
              </div>
              <div className="info-group">
                <label>Email:</label>
                <span>{editedData.email}</span>
              </div>
              <div className="info-group">
                <label>Patient ID:</label>
                <span>{editedData.patientId}</span>
              </div>
              <div className="info-group">
                <label>Date of Birth:</label>
                <span>{editedData.dateOfBirth || "Not provided"}</span>
              </div>
              <div className="info-group">
                <label>Blood Group:</label>
                <span>{editedData.bloodGroup || "Not provided"}</span>
              </div>
              <div className="info-group">
                <label>Mobile Number:</label>
                <span>{editedData.phone || "Not provided"}</span>
              </div>
              <div className="info-group">
                <label>Address:</label>
                <span>{editedData.address || "Not provided"}</span>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="edit-btn"
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>

        <div className="reports-card">
          <h2>Lab Reports</h2>
          <div className="reports-list">
            {patientData.labReports && patientData.labReports.length > 0 ? (
              patientData.labReports.map((report, index) => (
                <div key={index} className="report-item">
                  <div className="report-header">
                    <h3>{report.report_name}</h3>
                    <span className="report-date">
                      {new Date(report.test_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="report-details">
                    {report.remarks && (
                      <p className="report-remarks">
                        <strong>Remarks:</strong> {report.remarks}
                      </p>
                    )}
                    <div className="report-actions">
                      <a 
                        href={`http://localhost:5000/uploads/${report.report_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="view-report-btn"
                      >
                        📄 View Report
                      </a>
                      <a 
                        href={`http://localhost:5000/uploads/${report.report_path}`}
                        download={report.report_name}
                        className="download-report-btn"
                      >
                        📥 Download
                      </a>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-reports">
                <div className="no-reports-icon">📋</div>
                <h3>No Lab Reports Found</h3>
                <p>Your lab reports will appear here once they are uploaded by the lab technician.</p>
              </div>
            )}
          </div>
        </div>

        <div className="summary-card">
          <h2>Summary</h2>
          <div className="summary-stats">
            <div className="stat-item">
              <div className="stat-number">
                {patientData.labReports ? patientData.labReports.length : 0}
              </div>
              <div className="stat-label">Lab Reports</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">
                {patientData.labReports && patientData.labReports.length > 0 
                  ? new Date(Math.max(...patientData.labReports.map(r => new Date(r.test_date)))).toLocaleDateString()
                  : 'N/A'
                }
              </div>
              <div className="stat-label">Latest Report</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">
                {patientData.bloodGroup || 'Not Set'}
              </div>
              <div className="stat-label">Blood Group</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;