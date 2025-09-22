import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LabTechDashboard.css';

const LabTechDashboard = ({ labTechData, onLogout }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [reportFile, setReportFile] = useState(null);
  const [reportName, setReportName] = useState('');
  const [remarks, setRemarks] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Prescription state
  const [activeTab, setActiveTab] = useState('lab-report'); // 'lab-report' or 'prescription'
  const [medicines, setMedicines] = useState([{ name: '', dosage: '', frequency: '', duration: '' }]);
  const [instructions, setInstructions] = useState('');
  const [diagnosis, setDiagnosis] = useState('');

  const searchPatients = async () => {
    if (!searchQuery.trim()) {
      setMessage('❌ Please enter patient name or email to search');
      return;
    }

    setIsLoading(true);
    try {
      // Search for patients by name or email
      const response = await axios.get(`http://localhost:5000/api/patients/search?query=${searchQuery}`);
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

  const selectPatient = (patient) => {
    setSelectedPatient(patient);
    setSearchResults([]);
    setSearchQuery('');
    setMessage('');
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    
    if (!selectedPatient) {
      setMessage('❌ Please select a patient first');
      return;
    }
    
    if (!reportFile) {
      setMessage('❌ Please select a report file to upload');
      return;
    }

    if (!reportName.trim()) {
      setMessage('❌ Please enter a report name');
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('report', reportFile);
    formData.append('report_name', reportName);
    formData.append('remarks', remarks);

    try {
      await axios.post(
        `http://localhost:5000/api/lab-technician/patients/${selectedPatient.id}/upload-report`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setMessage('✅ Lab report uploaded successfully!');
      
      // Reset form
      setReportFile(null);
      setReportName('');
      setRemarks('');
      setSelectedPatient(null);
      
    } catch (error) {
      setMessage('❌ Error uploading report: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsLoading(false);
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
        doctor_id: labTechData.id,
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
    navigate('/lab-login');
  };

  return (
    <div className="lab-dashboard-container">
      <header className="lab-dashboard-header">
        <div className="header-content">
          <h1>Lab Technician Dashboard</h1>
          <div className="tech-info">
            <span>Welcome, {labTechData?.full_name || 'Lab Technician'}</span>
            <button onClick={handleLogout} className="logout-btn">
              <span className="logout-icon">↗</span>
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="lab-dashboard-content">
        {/* Patient Search Section */}
        <div className="search-section">
          <h2>Find Patient</h2>
          <div className="search-form">
            <div className="search-input-group">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter patient name or email"
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
                    <h4>{patient.full_name}</h4>
                    <p>Email: {patient.email}</p>
                    <p>Phone: {patient.contact_number}</p>
                    <p>Blood Group: {patient.blood_group}</p>
                  </div>
                  <button className="select-btn">Select</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Patient Section */}
        {selectedPatient && (
          <div className="selected-patient-section">
            <h2>Selected Patient</h2>
            <div className="patient-card">
              <div className="patient-details">
                <h3>{selectedPatient.full_name}</h3>
                <p><strong>Email:</strong> {selectedPatient.email}</p>
                <p><strong>Phone:</strong> {selectedPatient.contact_number}</p>
                <p><strong>Blood Group:</strong> {selectedPatient.blood_group}</p>
                <p><strong>DOB:</strong> {selectedPatient.dob}</p>
              </div>
              <button 
                className="change-patient-btn"
                onClick={() => setSelectedPatient(null)}
              >
                Change Patient
              </button>
            </div>
          </div>
        )}

        {/* Report Upload Section */}
        {selectedPatient && (
          <div className="upload-section">
            <h2>Upload Lab Report</h2>
            <form onSubmit={handleFileUpload} className="upload-form">
              <div className="form-group">
                <label htmlFor="reportName">Report Name *</label>
                <input
                  type="text"
                  id="reportName"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="e.g., Blood Test Report, X-Ray, MRI"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="reportFile">Select Report File *</label>
                <input
                  type="file"
                  id="reportFile"
                  onChange={(e) => setReportFile(e.target.files[0])}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  required
                  disabled={isLoading}
                />
                <small>Supported formats: PDF, JPG, PNG, DOC, DOCX</small>
              </div>

              <div className="form-group">
                <label htmlFor="remarks">Remarks (Optional)</label>
                <textarea
                  id="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Additional notes or observations"
                  rows="3"
                  disabled={isLoading}
                />
              </div>

              <button 
                type="submit" 
                className={`upload-btn ${isLoading ? 'loading' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? 'Uploading...' : 'Upload Report'}
              </button>
            </form>
          </div>
        )}

        {/* Message Display */}
        {message && <div className="message">{message}</div>}

        {/* Instructions */}
        {!selectedPatient && searchResults.length === 0 && (
          <div className="instructions">
            <h2>Instructions</h2>
            <div className="instruction-steps">
              <div className="step">
                <span className="step-number">1</span>
                <p>Search for a patient using their name or email address</p>
              </div>
              <div className="step">
                <span className="step-number">2</span>
                <p>Select the patient from the search results</p>
              </div>
              <div className="step">
                <span className="step-number">3</span>
                <p>Upload the lab report file with appropriate details</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LabTechDashboard;