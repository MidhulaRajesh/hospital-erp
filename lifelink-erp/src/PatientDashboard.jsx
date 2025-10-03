import React, { useState, useEffect } from "react";
import { FaSignOutAlt, FaInfoCircle, FaClipboardList, FaDownload, FaFlask, FaCalendarAlt, FaUserMd, FaRegEdit, FaEye, FaSpinner, FaPills, FaSearch } from 'react-icons/fa';
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./PatientDashboard.css";

const PatientDashboard = ({ patientData, onLogout }) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(patientData || {});
  const [prescriptions, setPrescriptions] = useState([]);
  const [isLoadingPrescriptions, setIsLoadingPrescriptions] = useState(false);
  const [downloadingReports, setDownloadingReports] = useState(new Set());

  // Fetch prescriptions when component mounts
  useEffect(() => {
    if (patientData?.id) {
      fetchPrescriptions();
    }
  }, [patientData?.id]);

  const fetchPrescriptions = async () => {
    setIsLoadingPrescriptions(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/prescriptions/patient/${patientData.id}`);
      setPrescriptions(response.data);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    } finally {
      setIsLoadingPrescriptions(false);
    }
  };

  // Enhanced download function
  const downloadReport = async (report) => {
    setDownloadingReports(prev => new Set([...prev, report.id]));
    
    try {
      const response = await fetch(`http://localhost:5000/uploads/${report.report_path}`);
      
      if (!response.ok) {
        throw new Error('Failed to download report');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // Create a proper filename with patient name and date
      const date = new Date(report.test_date).toLocaleDateString().replace(/\//g, '-');
      const patientName = patientData.full_name?.replace(/\s+/g, '_') || 'Patient';
      const filename = `${patientName}_${report.report_name}_${date}${getFileExtension(report.report_path)}`;
      
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Show success message
      alert(`✅ Report "${report.report_name}" downloaded successfully!`);
      
    } catch (error) {
      console.error('Download error:', error);
      alert(`❌ Failed to download report: ${error.message}`);
    } finally {
      setDownloadingReports(prev => {
        const newSet = new Set(prev);
        newSet.delete(report.id);
        return newSet;
      });
    }
  };

  // Helper function to get file extension
  const getFileExtension = (filename) => {
    return filename.includes('.') ? filename.substring(filename.lastIndexOf('.')) : '.pdf';
  };

  // Download all reports function
  const downloadAllReports = async () => {
    if (!patientData.labReports || patientData.labReports.length === 0) {
      alert('No reports available to download');
      return;
    }

    const confirmed = window.confirm(`Download all ${patientData.labReports.length} reports?`);
    if (!confirmed) return;

    setDownloadingReports(prev => new Set([...prev, 'all']));

    try {
      for (const report of patientData.labReports) {
        await downloadReport(report);
        // Small delay between downloads to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      alert(`✅ All ${patientData.labReports.length} reports downloaded successfully!`);
    } catch (error) {
      alert(`❌ Error downloading reports: ${error.message}`);
    } finally {
      setDownloadingReports(prev => {
        const newSet = new Set(prev);
        newSet.delete('all');
        return newSet;
      });
    }
  };

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
            <FaSignOutAlt className="logout-icon" /> Logout
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="profile-card">
          <h2>Patient Information</h2>
          {isEditing && (
            <div className="edit-notice">
              <span className="edit-icon"><FaInfoCircle /></span>
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
          <div className="card-header">
            <div className="header-content">
              <div className="header-title">
                <div className="icon-wrapper">
                  <span className="reports-icon"><FaClipboardList /></span>
                </div>
                <div className="title-text">
                  <h2>Lab Reports</h2>
                  <p className="subtitle">Your medical test results and reports</p>
                </div>
              </div>
              {patientData.labReports && patientData.labReports.length > 0 && (
                <button 
                  className="download-all-btn"
                  onClick={downloadAllReports}
                  disabled={downloadingReports.has('all')}
                >
                  <span className="btn-icon"><FaDownload /></span>
                  {downloadingReports.has('all') ? 'Downloading All...' : 'Download All'}
                </button>
              )}
            </div>
          </div>
          
          <div className="reports-container">
            {patientData.labReports && patientData.labReports.length > 0 ? (
              <div className="reports-grid">
                {patientData.labReports.map((report, index) => (
                  <div key={index} className="report-card">
                    <div className="report-card-header">
                      <div className="report-icon">
                        <span><FaFlask /></span>
                      </div>
                      <div className="report-title-section">
                        <h3 className="report-title">{report.report_name}</h3>
                        <div className="report-meta">
                          <span className="report-date">
                            <span className="date-icon"><FaCalendarAlt /></span>
                            {new Date(report.test_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                      <div className={`status-badge ${report.status?.toLowerCase()}`}>
                        <span className="status-dot"></span>
                        {report.status}
                      </div>
                    </div>
                    
                    <div className="report-card-body">
                      <div className="report-info-grid">
                        <div className="info-item">
                          <span className="info-label">
                            <span className="label-icon"><FaUserMd /></span>
                            Technician
                          </span>
                          <span className="info-value">{report.technician_name}</span>
                        </div>
                        
                        {report.remarks && (
                          <div className="info-item remarks">
                            <span className="info-label">
                              <span className="label-icon"><FaRegEdit /></span>
                              Remarks
                            </span>
                            <span className="info-value">{report.remarks}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="report-actions">
                        <a 
                          href={`http://localhost:5000/uploads/${report.report_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="action-btn view-btn"
                        >
                          <span className="btn-icon"><FaEye /></span>
                          <span>View Report</span>
                        </a>
                        <button 
                          onClick={() => downloadReport(report)}
                          className="action-btn download-btn"
                          disabled={downloadingReports.has(report.id)}
                        >
                          <span className="btn-icon">
                            {downloadingReports.has(report.id) ? <FaSpinner className="icon-spin" /> : <FaDownload />}
                          </span>
                          <span>
                            {downloadingReports.has(report.id) ? 'Downloading...' : 'Download'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-reports-state">
                <div className="no-reports-illustration">
                  <div className="illustration-circle">
                      <span className="illustration-icon"><FaClipboardList /></span>
                    </div>
                </div>
                <div className="no-reports-content">
                  <h3>No Lab Reports Available</h3>
                  <p>Your lab reports will appear here once they are uploaded by the lab technician.</p>
                  <div className="no-reports-tips">
                    <p><FaInfoCircle /> <strong>Tip:</strong> Check back later or contact your healthcare provider for updates</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="prescriptions-card">
          <h2>My Prescriptions</h2>
          <div className="prescriptions-list">
            {isLoadingPrescriptions ? (
              <div className="loading-prescriptions">
                <div className="loading-spinner"></div>
                <p>Loading prescriptions...</p>
              </div>
            ) : prescriptions && prescriptions.length > 0 ? (
              prescriptions.map((prescription) => (
                <div key={prescription.id} className="prescription-item">
                  <div className="prescription-header">
                    <div className="prescription-info">
                      <h3>Prescription #{prescription.id}</h3>
                      <p className="doctor-name">
                        <FaUserMd /> Dr. {prescription.doctor?.full_name || 'Unknown Doctor'}
                      </p>
                      <span className="prescription-date">
                        <FaCalendarAlt /> {new Date(prescription.prescribed_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className={`prescription-status ${prescription.status.toLowerCase()}`}>
                      {prescription.status}
                    </div>
                  </div>
                  
                  <div className="prescription-content">
                    {prescription.diagnosis && (
                      <div className="diagnosis-section">
                        <strong><FaSearch /> Diagnosis:</strong>
                        <p>{prescription.diagnosis}</p>
                      </div>
                    )}
                    
                    <div className="medicines-section">
                      <strong><FaPills /> Medicines:</strong>
                      <div className="medicines-list">
                        {Array.isArray(prescription.medicines) ? (
                          prescription.medicines.map((medicine, index) => (
                            <div key={index} className="medicine-item">
                              <div className="medicine-name">{medicine.name}</div>
                              <div className="medicine-details">
                                <span>Dosage: {medicine.dosage}</span>
                                {medicine.frequency && <span>Frequency: {medicine.frequency}</span>}
                                {medicine.duration && <span>Duration: {medicine.duration}</span>}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p>Medicines information not available</p>
                        )}
                      </div>
                    </div>
                    
                    {prescription.instructions && (
                      <div className="instructions-section">
                        <strong>📋 Instructions:</strong>
                        <p>{prescription.instructions}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-prescriptions">
                <div className="no-prescriptions-icon"><FaPills /></div>
                <h3>No Prescriptions Found</h3>
                <p>Your prescriptions from doctors will appear here.</p>
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
                {prescriptions ? prescriptions.length : 0}
              </div>
              <div className="stat-label">Prescriptions</div>
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