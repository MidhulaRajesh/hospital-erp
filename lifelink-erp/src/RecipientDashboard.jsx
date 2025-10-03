import React, { useState, useEffect } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import './RecipientDashboard.css';

const RecipientDashboard = () => {
  const [recipients, setRecipients] = useState([]);
  const [filteredRecipients, setFilteredRecipients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    bloodGroup: '',
    urgencyLevel: '',
    organType: '',
    location: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [compatibleDonors, setCompatibleDonors] = useState([]);
  const [loadingDonors, setLoadingDonors] = useState(false);
  const [completionData, setCompletionData] = useState({
    donor_type: '', // 'deceased' or 'living'
    donor_id: '', // For deceased donors from our system
    donor_name: '', // For living donors or external donors
    organ_type: '',
    transplant_date: '',
    completion_notes: '',
    hospital_name: '',
    surgeon_name: ''
  });

  useEffect(() => {
    fetchRecipients();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [recipients, filters, searchTerm]);

  const fetchRecipients = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/recipient');
      if (!response.ok) {
        throw new Error('HTTP error! status: ' + response.status);
      }
      const data = await response.json();
      if (data.success) {
        setRecipients(data.recipients || []);
      } else {
        setRecipients([]);
      }
    } catch (error) {
      console.error('Error fetching recipients:', error);
      setRecipients([]);
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = recipients.filter(recipient => {
      const matchesSearch = recipient.full_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBloodGroup = !filters.bloodGroup || recipient.blood_group === filters.bloodGroup;
      const matchesUrgency = !filters.urgencyLevel || recipient.urgency_level === filters.urgencyLevel;
      const matchesOrgan = !filters.organType || recipient.required_organ === filters.organType;
      const matchesLocation = !filters.location || 
                             recipient.hospital_location?.toLowerCase().includes(filters.location.toLowerCase());

      return matchesSearch && matchesBloodGroup && matchesUrgency && matchesOrgan && matchesLocation;
    });

    filtered.sort((a, b) => {
      const urgencyOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
      if (urgencyOrder[a.urgency_level] !== urgencyOrder[b.urgency_level]) {
        return urgencyOrder[b.urgency_level] - urgencyOrder[a.urgency_level];
      }
      return new Date(b.created_at) - new Date(a.created_at);
    });

    setFilteredRecipients(filtered);
  };

  const calculateAge = (dob) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      bloodGroup: '',
      urgencyLevel: '',
      organType: '',
      location: ''
    });
    setSearchTerm('');
  };

  const getUniqueValues = (field) => {
    const values = recipients.map(recipient => recipient[field]).filter(Boolean);
    return [...new Set(values)].sort();
  };

  const handleViewDetails = (recipient) => {
    setSelectedRecipient(recipient);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedRecipient(null);
  };

  const handleMarkExpired = async (recipientId) => {
    if (!window.confirm('Are you sure you want to mark this recipient as expired?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/recipient/${recipientId}/mark-expired`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Recipient marked as expired successfully');
        setShowDetailsModal(false);
        fetchRecipients(); // Refresh the list
      } else {
        alert('Error marking recipient as expired: ' + data.error);
      }
    } catch (error) {
      console.error('Error marking recipient as expired:', error);
      alert('Error marking recipient as expired');
    }
  };

  const handleCompleteTransplant = async (recipient) => {
    setSelectedRecipient(recipient);
    setCompletionData({
      donor_type: '',
      donor_id: '',
      donor_name: '',
      organ_type: recipient.required_organ,
      transplant_date: new Date().toISOString().split('T')[0],
      completion_notes: '',
      hospital_name: recipient.hospital_name || '',
      surgeon_name: ''
    });
    
    // Fetch compatible deceased donors from our system
    setLoadingDonors(true);
    try {
      const response = await fetch(`http://localhost:5000/api/recipient/${recipient.id}/compatible-donors`);
      const data = await response.json();
      
      if (data.success) {
        setCompatibleDonors(data.compatible_donors || []);
      } else {
        setCompatibleDonors([]);
        console.error('Error fetching compatible donors:', data.error);
      }
    } catch (error) {
      console.error('Error fetching compatible donors:', error);
      setCompatibleDonors([]);
    }
    setLoadingDonors(false);
    
    setShowCompletionModal(true);
  };

  const submitTransplantCompletion = async () => {
    if (!selectedRecipient) {
      alert('No recipient selected');
      return;
    }
    
    if (!completionData.donor_type) {
      alert('Please select donor type (Deceased from our system or Living/External donor)');
      return;
    }
    
    if (completionData.donor_type === 'deceased' && !completionData.donor_id) {
      alert('Please select a deceased donor from the list');
      return;
    }
    
    if (completionData.donor_type === 'living' && !completionData.donor_name.trim()) {
      alert('Please provide the living donor name');
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/recipient/${selectedRecipient.id}/complete-transplant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(completionData)
        }
      );

      const data = await response.json();
      
      if (data.success) {
        const selectedDonor = compatibleDonors.find(d => d.id == completionData.donor_id);
        const donorName = selectedDonor ? selectedDonor.full_name : 'Unknown';
        alert(`Transplant completed successfully!\nRecipient: ${selectedRecipient.full_name}\nDonor: ${donorName}\nOrgan: ${completionData.organ_type}`);
        setShowCompletionModal(false);
        setSelectedRecipient(null);
        setCompatibleDonors([]);
        fetchRecipients(); // Refresh the list
      } else {
        alert('Error completing transplant: ' + data.error);
      }
    } catch (error) {
      console.error('Error completing transplant:', error);
      alert('Error completing transplant. Please try again.');
    }
  };

  const cancelCompletion = () => {
    setShowCompletionModal(false);
    setSelectedRecipient(null);
    setCompatibleDonors([]);
    setCompletionData({
      donor_type: '',
      donor_id: '',
      donor_name: '',
      organ_type: '',
      transplant_date: '',
      completion_notes: '',
      hospital_name: '',
      surgeon_name: ''
    });
  };

  if (loading) {
    return <div className="loading-spinner">Loading patients...</div>;
  }

  return (
    <div className="recipient-dashboard-container">
      <div className="dashboard-header">
        <h1>Organ Recipient Management</h1>
        <p>Patient priority management system</p>
        <div className="stats-summary">
          <div className="stat-card">
            <span className="stat-number">{recipients.length}</span>
            <span className="stat-label">Total Patients</span>
          </div>
          <div className="stat-card urgent">
            <span className="stat-number">
              {recipients.filter(r => r.urgency_level === 'High').length}
            </span>
            <span className="stat-label">Critical Cases</span>
          </div>
          <div className="stat-card medium">
            <span className="stat-number">
              {recipients.filter(r => r.urgency_level === 'Medium').length}
            </span>
            <span className="stat-label">Moderate Cases</span>
          </div>
        </div>
      </div>

      <div className="dashboard-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filters-section">
          <select
            value={filters.bloodGroup}
            onChange={(e) => handleFilterChange('bloodGroup', e.target.value)}
            className="filter-select"
          >
            <option value="">All Blood Groups</option>
            {getUniqueValues('blood_group').map(bg => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>

          <select
            value={filters.urgencyLevel}
            onChange={(e) => handleFilterChange('urgencyLevel', e.target.value)}
            className="filter-select"
          >
            <option value="">All Urgency Levels</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={filters.organType}
            onChange={(e) => handleFilterChange('organType', e.target.value)}
            className="filter-select"
          >
            <option value="">All Organ Types</option>
            {getUniqueValues('required_organ').map(organ => (
              <option key={organ} value={organ}>{organ}</option>
            ))}
          </select>

          <button onClick={clearFilters} className="clear-filters-btn">
            Clear Filters
          </button>
        </div>
      </div>

      <div className="recipients-list-container">
        {filteredRecipients.length === 0 ? (
          <div className="no-recipients">
            <p>No patients found matching your criteria.</p>
          </div>
        ) : (
          <div className="patients-wrapper">
            <div className="patients-header">
              <h3>Patient List</h3>
              <p>Ordered by priority and registration date</p>
            </div>
            
            <div className="recipients-list">
              {filteredRecipients.map((recipient) => (
                <div key={recipient.id} className={`patient-card ${recipient.urgency_level.toLowerCase()}-priority`}>
                  <div className="priority-indicator">
                    <span className="priority-level">{recipient.urgency_level}</span>
                  </div>
                  
                  <div className="patient-main-info">
                    <div className="patient-header">
                      <div className="patient-identity">
                        <h4 className="patient-name">{recipient.full_name}</h4>
                        <span className="patient-id">Patient ID: {recipient.id}</span>
                      </div>
                    </div>
                    
                    <div className="patient-details">
                      <div className="detail-row">
                        <div className="detail-item">
                          <span className="label">Required Organ:</span>
                          <span className="value">{recipient.required_organ}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Blood Type:</span>
                          <span className="value">{recipient.blood_group}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Age:</span>
                          <span className="value">{calculateAge(recipient.dob)} years</span>
                        </div>
                      </div>
                      
                      <div className="detail-row">
                        <div className="detail-item">
                          <span className="label">Contact:</span>
                          <span className="value">{recipient.contact_number}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Hospital:</span>
                          <span className="value">{recipient.hospital_name}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Registered:</span>
                          <span className="value">{new Date(recipient.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="patient-actions">
                    <button 
                      className="action-btn primary"
                      onClick={() => handleViewDetails(recipient)}
                    >
                      View Details
                    </button>
                    <button 
                      className="action-btn success"
                      onClick={() => handleCompleteTransplant(recipient)}
                    >
                      Complete Transplant
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="dashboard-footer">
        <p>Showing {filteredRecipients.length} of {recipients.length} patients</p>
      </div>

      {/* Transplant Completion Modal */}
      {showCompletionModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Complete Transplant for {selectedRecipient?.full_name}</h3>
            <div className="completion-form">
              <div className="form-group">
                <label>Donor Type *</label>
                <select
                  value={completionData.donor_type}
                  onChange={(e) => setCompletionData({
                    ...completionData, 
                    donor_type: e.target.value,
                    donor_id: '',
                    donor_name: ''
                  })}
                  required
                  className="donor-type-select"
                >
                  <option value="">-- Select donor type --</option>
                  <option value="deceased">Deceased Donor (from our system)</option>
                  <option value="living">Living/External Donor</option>
                </select>
              </div>

              {completionData.donor_type === 'deceased' && (
                <div className="form-group">
                  <label>Select Deceased Donor *</label>
                  {loadingDonors ? (
                    <div className="loading-donors">Loading compatible donors...</div>
                  ) : compatibleDonors.length > 0 ? (
                    <select
                      value={completionData.donor_id}
                      onChange={(e) => setCompletionData({...completionData, donor_id: e.target.value})}
                      required
                      className="donor-select"
                    >
                      <option value="">-- Select a deceased donor --</option>
                      {compatibleDonors.map(donor => (
                        <option key={donor.id} value={donor.id}>
                          {donor.full_name} | Blood: {donor.blood_group} | Age: {donor.age_at_death} | Location: {donor.hospital_location}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="no-donors-message">
                      <p><FaExclamationTriangle /> No compatible deceased donors available in our system.</p>
                      <p>Blood Type: {selectedRecipient?.blood_group} | Required Organ: {selectedRecipient?.required_organ}</p>
                      <p><small>Try selecting "Living/External Donor" if transplant is from outside source.</small></p>
                    </div>
                  )}
                </div>
              )}

              {completionData.donor_type === 'living' && (
                <div className="form-group">
                  <label>Living Donor Name *</label>
                  <input
                    type="text"
                    value={completionData.donor_name}
                    onChange={(e) => setCompletionData({...completionData, donor_name: e.target.value})}
                    placeholder="Enter living donor name (e.g., family member, local donor)"
                    required
                  />
                  <small className="form-help">This can be a family member, local donor, or donor from another hospital</small>
                </div>
              )}
              
              <div className="form-group">
                <label>Organ Type</label>
                <input
                  type="text"
                  value={completionData.organ_type}
                  onChange={(e) => setCompletionData({...completionData, organ_type: e.target.value})}
                  placeholder="Organ Type"
                />
              </div>
              
              <div className="form-group">
                <label>Transplant Date</label>
                <input
                  type="date"
                  value={completionData.transplant_date}
                  onChange={(e) => setCompletionData({...completionData, transplant_date: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label>Hospital Name</label>
                <input
                  type="text"
                  value={completionData.hospital_name}
                  onChange={(e) => setCompletionData({...completionData, hospital_name: e.target.value})}
                  placeholder="Hospital Name"
                />
              </div>
              
              <div className="form-group">
                <label>Surgeon Name</label>
                <input
                  type="text"
                  value={completionData.surgeon_name}
                  onChange={(e) => setCompletionData({...completionData, surgeon_name: e.target.value})}
                  placeholder="Surgeon Name"
                />
              </div>
              
              <div className="form-group">
                <label>Completion Notes</label>
                <textarea
                  value={completionData.completion_notes}
                  onChange={(e) => setCompletionData({...completionData, completion_notes: e.target.value})}
                  placeholder="Additional notes about the transplant completion..."
                  rows="3"
                />
              </div>
              
              <div className="modal-actions">
                <button className="action-btn success" onClick={submitTransplantCompletion}>
                  Complete Transplant
                </button>
                <button className="action-btn secondary" onClick={cancelCompletion}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recipient Details Modal */}
      {showDetailsModal && selectedRecipient && (
        <div className="modal-overlay">
          <div className="modal-content details-modal">
            <h3>Patient Details - {selectedRecipient.full_name}</h3>
            
            <div className="details-content">
              {/* Priority Ranking Section */}
              <div className="ranking-section">
                <h4>Priority Ranking</h4>
                <div className="rank-info">
                  <span className="rank-number">
                    #{filteredRecipients.findIndex(r => r.id === selectedRecipient.id) + 1}
                  </span>
                  <span className="rank-total">of {filteredRecipients.length} patients</span>
                  <span className={`urgency-badge ${selectedRecipient.urgency_level.toLowerCase()}`}>
                    {selectedRecipient.urgency_level} Priority
                  </span>
                </div>
              </div>

              {/* Personal Information */}
              <div className="info-section">
                <h4>Personal Information</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Full Name:</label>
                    <span>{selectedRecipient.full_name}</span>
                  </div>
                  <div className="info-item">
                    <label>Age:</label>
                    <span>{calculateAge(selectedRecipient.dob)} years</span>
                  </div>
                  <div className="info-item">
                    <label>Gender:</label>
                    <span>{selectedRecipient.gender}</span>
                  </div>
                  <div className="info-item">
                    <label>Blood Group:</label>
                    <span className="blood-group">{selectedRecipient.blood_group}</span>
                  </div>
                  <div className="info-item">
                    <label>Contact:</label>
                    <span>{selectedRecipient.contact_number}</span>
                  </div>
                  <div className="info-item">
                    <label>Email:</label>
                    <span>{selectedRecipient.email}</span>
                  </div>
                </div>
              </div>

              {/* Medical Information */}
              <div className="info-section">
                <h4>Medical Information</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Required Organ:</label>
                    <span className="organ-type">{selectedRecipient.required_organ}</span>
                  </div>
                  <div className="info-item">
                    <label>Medical Condition:</label>
                    <span>{selectedRecipient.medical_condition || 'Not specified'}</span>
                  </div>
                  <div className="info-item">
                    <label>Last Checkup:</label>
                    <span>{selectedRecipient.last_checkup_date ? new Date(selectedRecipient.last_checkup_date).toLocaleDateString() : 'Not recorded'}</span>
                  </div>
                </div>
              </div>

              {/* Hospital Information */}
              <div className="info-section">
                <h4>Hospital Information</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Hospital:</label>
                    <span>{selectedRecipient.hospital_name}</span>
                  </div>
                  <div className="info-item">
                    <label>Location:</label>
                    <span>{selectedRecipient.hospital_location}</span>
                  </div>
                  <div className="info-item">
                    <label>Registered:</label>
                    <span>{new Date(selectedRecipient.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="info-section">
                <h4>Emergency Contact</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Contact Name:</label>
                    <span>{selectedRecipient.emergency_contact_name}</span>
                  </div>
                  <div className="info-item">
                    <label>Relation:</label>
                    <span>{selectedRecipient.emergency_contact_relation}</span>
                  </div>
                  <div className="info-item">
                    <label>Phone Number:</label>
                    <span>{selectedRecipient.emergency_contact_number}</span>
                  </div>
                </div>
              </div>

              {/* Waiting Period Information */}
              <div className="info-section waiting-info">
                <h4>Waiting Period Status</h4>
                <div className="waiting-stats">
                  <div className="stat-item">
                    <label>Days Waiting:</label>
                    <span>{Math.floor((new Date() - new Date(selectedRecipient.created_at)) / (1000 * 60 * 60 * 24))} days</span>
                  </div>
                  <div className="stat-item">
                    <label>Status:</label>
                    <span className="status-active">Active</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-actions details-modal-actions">
              <button className="action-btn secondary" onClick={closeDetailsModal}>
                Close
              </button>
              <button 
                className="action-btn danger"
                onClick={() => handleMarkExpired(selectedRecipient.id)}
              >
                Mark as Expired
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipientDashboard;
