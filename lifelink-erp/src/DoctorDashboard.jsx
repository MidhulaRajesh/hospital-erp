import React, { useState } from 'react';
import { FaSearch, FaClipboardList, FaHistory, FaPills, FaSignOutAlt, FaEye, FaDownload, FaUserMd, FaCalendarAlt, FaNotesMedical, FaFileDownload, FaFileMedical, FaUser, FaClipboardCheck, FaPrescriptionBottle, FaSpinner } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './DoctorDashboard.css';

const DoctorDashboard = ({ doctorData, onLogout }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientDetails, setPatientDetails] = useState(null);
  const [patientPrescriptions, setPatientPrescriptions] = useState([]);
  const [isLoadingPrescriptions, setIsLoadingPrescriptions] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('search'); // 'search', 'details', 'prescription', 'history'
  const [downloadingReports, setDownloadingReports] = useState(new Set());
  
  // Prescription state
  const [medicines, setMedicines] = useState([{ name: '', dosage: '', frequency: '', duration: '' }]);
  const [instructions, setInstructions] = useState('');
  const [diagnosis, setDiagnosis] = useState('');

  const searchPatients = async () => {
    if (!searchQuery.trim()) {
      setMessage('❌ Please enter patient ID or name to search');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/doctors/patients/search?query=${searchQuery}`);
      setSearchResults(response.data);
      if (response.data.length === 0) {
        setMessage('❌ No patients found matching your search');
      } else {
        setMessage('');
      }
    } catch (error) {
      setMessage('❌ Error searching patients');
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectPatient = async (patient) => {
    setSelectedPatient(patient);
    setSearchResults([]);
    setSearchQuery('');
    setMessage('');
    setActiveTab('details');
    
    // Fetch detailed patient information
    setIsLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/doctors/patients/${patient.id}/details`);
      setPatientDetails(response.data);
    } catch (error) {
      setMessage('❌ Error fetching patient details');
      console.error('Patient details error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch patient's prescription history
  const fetchPatientPrescriptions = async (patientId) => {
    setIsLoadingPrescriptions(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/prescriptions/patient/${patientId}`);
      setPatientPrescriptions(response.data);
    } catch (error) {
      console.error('Error fetching patient prescriptions:', error);
      setMessage('❌ Error loading prescription history');
    } finally {
      setIsLoadingPrescriptions(false);
    }
  };

  // Medicine management functions
  const addMedicine = () => {
    setMedicines([...medicines, { name: '', dosage: '', frequency: '', duration: '' }]);
  };

  const removeMedicine = (index) => {
    const newMedicines = medicines.filter((_, i) => i !== index);
    setMedicines(newMedicines);
  };

  const updateMedicine = (index, field, value) => {
    const newMedicines = [...medicines];
    newMedicines[index][field] = value;
    setMedicines(newMedicines);
  };

  // Handle prescription creation
  const handlePrescriptionSubmit = async (e) => {
    e.preventDefault();

    if (!selectedPatient) {
      setMessage('❌ Please select a patient first');
      return;
    }

    if (!diagnosis.trim()) {
      setMessage('❌ Please provide a diagnosis');
      return;
    }

    const validMedicines = medicines.filter(med => med.name.trim() && med.dosage.trim());
    if (validMedicines.length === 0) {
      setMessage('❌ Please add at least one medicine');
      return;
    }

    setIsLoading(true);
    try {
      await axios.post('http://localhost:5000/api/prescriptions/create', {
        patient_id: selectedPatient.id,
        doctor_id: doctorData.id,
        medicines: validMedicines,
        instructions: instructions.trim(),
        diagnosis: diagnosis.trim()
      });

      setMessage('✅ Prescription created successfully!');
      
      // Reset prescription form
      setMedicines([{ name: '', dosage: '', frequency: '', duration: '' }]);
      setInstructions('');
      setDiagnosis('');
      
    } catch (error) {
      setMessage('❌ Error creating prescription: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate('/doctor-login');
  };

  // Enhanced download function for reports
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
      const patientName = selectedPatient?.full_name?.replace(/\s+/g, '_') || 'Patient';
      const filename = `${patientName}_${report.report_name}_${date}${getFileExtension(report.report_path)}`;
      
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setMessage(`✅ Report "${report.report_name}" downloaded successfully!`);
      
    } catch (error) {
      console.error('Download error:', error);
      setMessage(`❌ Failed to download report: ${error.message}`);
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
    if (!patientDetails?.labReports || patientDetails.labReports.length === 0) {
      setMessage('❌ No reports available to download');
      return;
    }

    const confirmed = window.confirm(`Download all ${patientDetails.labReports.length} reports for ${selectedPatient?.full_name}?`);
    if (!confirmed) return;

    setDownloadingReports(prev => new Set([...prev, 'all']));

    try {
      for (const report of patientDetails.labReports) {
        await downloadReport(report);
        // Small delay between downloads to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      setMessage(`✅ All ${patientDetails.labReports.length} reports downloaded successfully!`);
    } catch (error) {
      setMessage(`❌ Error downloading reports: ${error.message}`);
    } finally {
      setDownloadingReports(prev => {
        const newSet = new Set(prev);
        newSet.delete('all');
        return newSet;
      });
    }
  };

  return (
    <div className="doctor-dashboard-container">
      <header className="doctor-dashboard-header">
        <div className="header-content">
          <h1>Doctor Dashboard</h1>
          <div className="doctor-info">
            <span><FaUserMd /> Dr. {doctorData?.full_name || 'Doctor'}</span>
            {doctorData?.specialization && (
              <span className="specialization">{doctorData.specialization}</span>
            )}
            <button onClick={handleLogout} className="logout-btn">
              <FaSignOutAlt className="logout-icon" /> Logout
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="doctor-dashboard-content">
        {/* Navigation Tabs */}
        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            <FaSearch /> Search Patient
          </button>
          {selectedPatient && (
            <>
              <button 
                className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
                onClick={() => setActiveTab('details')}
              >
                <FaClipboardList /> Patient Details
              </button>
              <button 
                className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('history');
                  fetchPatientPrescriptions(selectedPatient.id);
                }}
              >
                <FaHistory /> Prescription History
              </button>
              <button 
                className={`tab-btn ${activeTab === 'prescription' ? 'active' : ''}`}
                onClick={() => setActiveTab('prescription')}
              >
                <FaPills /> Create Prescription
              </button>
            </>
          )}
        </div>

        {/* Patient Search Section */}
        {activeTab === 'search' && (
          <div className="search-section">
            <h2>Find Patient</h2>
            <div className="search-form">
              <div className="search-input-group">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter patient ID or name"
                  disabled={isLoading}
                />
                <button 
                  onClick={searchPatients} 
                  className="search-btn"
                  disabled={isLoading}
                >
                  {isLoading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="search-results">
                <h3>Search Results:</h3>
                {searchResults.map((patient) => (
                  <div 
                    key={patient.id} 
                    className="patient-result"
                    onClick={() => selectPatient(patient)}
                  >
                    <div className="patient-info">
                      <strong>{patient.full_name}</strong>
                      <span>ID: {patient.id}</span>
                      <span>{patient.email}</span>
                      <span>{patient.gender}, {patient.blood_group || 'N/A'}</span>
                    </div>
                    <button className="select-btn">Select</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Patient Details Section */}
        {activeTab === 'details' && selectedPatient && patientDetails && (
          <div className="patient-details-section">
            <h2>Patient Details</h2>
            <div className="patient-card">
              <div className="patient-header">
                <h3>{patientDetails.patient.full_name}</h3>
                <span className="patient-id">ID: {patientDetails.patient.id}</span>
              </div>
              <div className="patient-info-grid">
                <div className="info-item">
                  <label>Email:</label>
                  <span>{patientDetails.patient.email}</span>
                </div>
                <div className="info-item">
                  <label>Date of Birth:</label>
                  <span>{new Date(patientDetails.patient.dob).toLocaleDateString()}</span>
                </div>
                <div className="info-item">
                  <label>Gender:</label>
                  <span>{patientDetails.patient.gender}</span>
                </div>
                <div className="info-item">
                  <label>Blood Group:</label>
                  <span>{patientDetails.patient.blood_group || 'Not specified'}</span>
                </div>
                <div className="info-item">
                  <label>Contact:</label>
                  <span>{patientDetails.patient.contact_number || 'Not provided'}</span>
                </div>
                <div className="info-item full-width">
                  <label>Address:</label>
                  <span>{patientDetails.patient.address || 'Not provided'}</span>
                </div>
              </div>
            </div>

            {/* Lab Reports */}
            <div className="lab-reports-section">
              <div className="section-header">
                <h3>Lab Reports</h3>
                {patientDetails.labReports && patientDetails.labReports.length > 0 && (
                  <button 
                    className="download-all-btn"
                    onClick={downloadAllReports}
                    disabled={downloadingReports.has('all')}
                  >
                    {downloadingReports.has('all') ? <FaSpinner className="icon-spin" /> : <><FaDownload /> Download All Reports</>}
                  </button>
                )}
              </div>
              {patientDetails.labReports && patientDetails.labReports.length > 0 ? (
                <div className="reports-list">
                  {patientDetails.labReports.map((report) => (
                    <div key={report.id} className="report-item">
                      <div className="report-info">
                        <div className="report-header">
                          <strong>{report.report_name}</strong>
                          <span className="report-date">
                            {new Date(report.test_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="report-details">
                          <p className="technician-info">
                            <strong>Technician:</strong> {report.technician_name}
                          </p>
                          <p className="status-info">
                            <strong>Status:</strong> 
                            <span className={`status ${report.status?.toLowerCase()}`}>
                              {report.status}
                            </span>
                          </p>
                          {report.remarks && (
                            <p className="report-remarks">
                              <strong>Remarks:</strong> {report.remarks}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="report-actions">
                        <a 
                          href={`http://localhost:5000/uploads/${report.report_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="view-report-btn"
                        >
                          <FaEye /> View Report
                        </a>
                        <button 
                          onClick={() => downloadReport(report)}
                          className="download-report-btn"
                          disabled={downloadingReports.has(report.id)}
                        >
                          {downloadingReports.has(report.id) ? <FaSpinner className="icon-spin" /> : <><FaDownload /> Download</>}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-reports">No lab reports available for this patient.</p>
              )}
            </div>
          </div>
        )}

        {/* Prescription History Section */}
        {activeTab === 'history' && selectedPatient && (
          <div className="prescription-history-section">
            <h2>Prescription History for {selectedPatient.full_name}</h2>
            
            {isLoadingPrescriptions ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading prescription history...</p>
              </div>
            ) : patientPrescriptions && patientPrescriptions.length > 0 ? (
              <div className="prescriptions-list">
                {patientPrescriptions.map((prescription) => (
                  <div key={prescription.id} className="prescription-history-item">
                    <div className="prescription-header">
                      <div className="prescription-info">
                        <h3>Prescription #{prescription.id}</h3>
                        <p className="doctor-name">
                          <FaUserMd /> Dr. {prescription.doctor?.full_name || 'Unknown Doctor'}
                          {prescription.doctor?.specialization && (
                            <span className="specialization"> - {prescription.doctor.specialization}</span>
                          )}
                        </p>
                        <div className="prescription-meta">
                          <span className="prescription-date">
                            <FaCalendarAlt /> {new Date(prescription.prescribed_date).toLocaleDateString()}
                          </span>
                          <span className={`prescription-status ${prescription.status.toLowerCase()}`}>
                            {prescription.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="prescription-content">
                      <div className="diagnosis-section">
                        <h4><FaNotesMedical /> Diagnosis</h4>
                        <p>{prescription.diagnosis}</p>
                      </div>

                      <div className="medicines-section">
                        <h4><FaPills /> Medicines</h4>
                        <div className="medicines-grid">
                          {prescription.medicines.map((medicine, index) => (
                            <div key={index} className="medicine-card">
                              <div className="medicine-name">{medicine.name}</div>
                              <div className="medicine-details">
                                <span className="dosage"><FaClipboardCheck /> {medicine.dosage}</span>
                                <span className="frequency"><FaHistory /> {medicine.frequency}</span>
                                <span className="duration"><FaCalendarAlt /> {medicine.duration}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {prescription.instructions && (
                        <div className="instructions-section">
                          <h4><FaClipboardList /> Instructions</h4>
                          <p>{prescription.instructions}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-prescriptions">
                <div className="no-prescriptions-icon"><FaPills /></div>
                <h3>No Previous Prescriptions</h3>
                <p>This patient has no prescription history yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Prescription Creation Section */}
        {activeTab === 'prescription' && selectedPatient && (
          <div className="prescription-section">
            <h2>Create Prescription for {selectedPatient.full_name}</h2>
            <form onSubmit={handlePrescriptionSubmit} className="prescription-form">
              <div className="form-group">
                <label htmlFor="diagnosis">Diagnosis *</label>
                <textarea
                  id="diagnosis"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Enter diagnosis details"
                  rows="3"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="medicines-section">
                <div className="medicines-header">
                  <h3>Medicines</h3>
                  <button 
                    type="button" 
                    onClick={addMedicine}
                    className="add-medicine-btn"
                    disabled={isLoading}
                  >
                    + Add Medicine
                  </button>
                </div>

                {medicines.map((medicine, index) => (
                  <div key={index} className="medicine-row">
                    <input
                      type="text"
                      placeholder="Medicine name"
                      value={medicine.name}
                      onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                      disabled={isLoading}
                    />
                    <input
                      type="text"
                      placeholder="Dosage"
                      value={medicine.dosage}
                      onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                      disabled={isLoading}
                    />
                    <input
                      type="text"
                      placeholder="Frequency"
                      value={medicine.frequency}
                      onChange={(e) => updateMedicine(index, 'frequency', e.target.value)}
                      disabled={isLoading}
                    />
                    <input
                      type="text"
                      placeholder="Duration"
                      value={medicine.duration}
                      onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                      disabled={isLoading}
                    />
                    {medicines.length > 1 && (
                      <button 
                        type="button"
                        onClick={() => removeMedicine(index)}
                        className="remove-medicine-btn"
                        disabled={isLoading}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="form-group">
                <label htmlFor="instructions">Instructions (Optional)</label>
                <textarea
                  id="instructions"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Additional instructions for the patient"
                  rows="3"
                  disabled={isLoading}
                />
              </div>

              <button 
                type="submit" 
                className={`prescription-submit-btn ${isLoading ? 'loading' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? 'Creating Prescription...' : 'Create Prescription'}
              </button>
            </form>
          </div>
        )}

        {/* Message Display */}
        {message && <div className="message">{message}</div>}

        {/* Instructions */}
        {activeTab === 'search' && !selectedPatient && searchResults.length === 0 && (
          <div className="instructions">
            <h2>Instructions</h2>
            <div className="instruction-steps">
              <div className="step">
                <span className="step-number">1</span>
                <p>Search for a patient using their ID or name</p>
              </div>
              <div className="step">
                <span className="step-number">2</span>
                <p>Select the patient to view their details and lab reports</p>
              </div>
              <div className="step">
                <span className="step-number">3</span>
                <p>Create a prescription with medicines and instructions</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;