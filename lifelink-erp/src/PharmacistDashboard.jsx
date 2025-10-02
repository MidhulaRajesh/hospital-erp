import React, { useState, useEffect } from 'react';
import './PharmacistDashboard.css';

const PharmacistDashboard = ({ pharmacistData, onLogout }) => {
  const pharmacist = pharmacistData; // For backward compatibility
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [recentPrescriptions, setRecentPrescriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  useEffect(() => {
    fetchRecentPrescriptions();
  }, []);

  const fetchRecentPrescriptions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/prescriptions/pharmacy/recent?limit=10');
      const data = await response.json();
      if (data.success) {
        setRecentPrescriptions(data.prescriptions);
      }
    } catch (error) {
      console.error('Error fetching recent prescriptions:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/prescriptions/pharmacy/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/prescriptions/pharmacy/search?query=${encodeURIComponent(searchQuery.trim())}`);
      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.prescriptions);
      } else {
        setSearchResults([]);
        alert('No prescriptions found for: ' + searchQuery);
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Error searching prescriptions');
    }
    setLoading(false);
  };

  const dispensePrescription = async (prescriptionId) => {
    const notes = prompt('Enter dispensing notes (optional):') || '';
    
    try {
      const response = await fetch(`http://localhost:5000/api/prescriptions/pharmacy/dispense/${prescriptionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pharmacist_id: pharmacist.id,
          notes: notes
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('✅ Prescription dispensed successfully!');
        // Refresh data
        if (activeTab === 'search' && searchResults.length > 0) {
          handleSearch({ preventDefault: () => {} });
        }
        fetchRecentPrescriptions();
        setSelectedPrescription(null);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Dispensing error:', error);
      alert('Error dispensing prescription');
    }
  };

  const renderPrescriptionCard = (prescription) => (
    <div key={prescription.id} className="prescription-card">
      <div className="prescription-header">
        <div className="patient-info">
          <h3>👤 {prescription.patient?.full_name}</h3>
          <p>📞 {prescription.patient?.contact_number}</p>
          <p>🩸 {prescription.patient?.blood_group}</p>
        </div>
        <div className="prescription-status">
          <span className={`status-badge ${prescription.status.toLowerCase()}`}>
            {prescription.status}
          </span>
          <p className="prescription-id">ID: #{prescription.id}</p>
        </div>
      </div>

      <div className="doctor-info">
        <p><strong>👨‍⚕️ Doctor:</strong> {prescription.doctor?.full_name}</p>
        <p><strong>🏥 Specialization:</strong> {prescription.doctor?.specialization}</p>
        <p><strong>📅 Prescribed:</strong> {new Date(prescription.prescribed_date).toLocaleDateString()}</p>
      </div>

      {prescription.diagnosis && (
        <div className="diagnosis-info">
          <p><strong>🔍 Diagnosis:</strong> {prescription.diagnosis}</p>
        </div>
      )}

      <div className="medicines-section">
        <h4>💊 Prescribed Medicines:</h4>
        <div className="medicines-list">
          {Array.isArray(prescription.medicines) ? (
            prescription.medicines.map((medicine, index) => (
              <div key={index} className="medicine-item">
                <div className="medicine-name">{medicine.name}</div>
                <div className="medicine-details">
                  <span>Dosage: {medicine.dosage}</span>
                  <span>Frequency: {medicine.frequency}</span>
                  <span>Duration: {medicine.duration}</span>
                </div>
              </div>
            ))
          ) : (
            <p>{prescription.medicines}</p>
          )}
        </div>
      </div>

      {prescription.instructions && (
        <div className="instructions-section">
          <p><strong>📝 Instructions:</strong> {prescription.instructions}</p>
        </div>
      )}

      <div className="prescription-actions">
        <button 
          className="view-details-btn"
          onClick={() => setSelectedPrescription(prescription)}
        >
          👁️ View Details
        </button>
        
        {prescription.status === 'Active' && (
          <button 
            className="dispense-btn"
            onClick={() => dispensePrescription(prescription.id)}
          >
            ✅ Mark as Dispensed
          </button>
        )}
        
        {prescription.status === 'Completed' && prescription.dispensed_date && (
          <div className="dispensed-info">
            <small>✅ Dispensed on {new Date(prescription.dispensed_date).toLocaleDateString()}</small>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="pharmacist-dashboard">
      <div className="dashboard-header">
        <div className="pharmacist-info">
          <h1>💊 Pharmacy Portal</h1>
          <div className="pharmacist-details">
            <p><strong>👨‍💼 {pharmacist.full_name}</strong></p>
            <p>🏥 Hospital Pharmacist</p>
            <p>📋 License: {pharmacist.license_number}</p>
            <p>📞 {pharmacist.phone}</p>
          </div>
        </div>
        <button className="logout-btn" onClick={onLogout}>
          🚪 Logout
        </button>
      </div>

      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          🔍 Search Prescriptions
        </button>
        <button 
          className={`tab-btn ${activeTab === 'recent' ? 'active' : ''}`}
          onClick={() => setActiveTab('recent')}
        >
          📋 Recent Prescriptions
        </button>
      </div>

      {activeTab === 'search' && (
        <div className="search-section">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-group">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter patient name or ID..."
                className="search-input"
              />
              <button type="submit" className="search-btn" disabled={loading}>
                {loading ? '🔄' : '🔍'} Search
              </button>
            </div>
          </form>

          <div className="search-results">
            {searchResults.length > 0 ? (
              <>
                <h3>Search Results ({searchResults.length} found)</h3>
                <div className="prescriptions-grid">
                  {searchResults.map(renderPrescriptionCard)}
                </div>
              </>
            ) : searchQuery && !loading ? (
              <div className="no-results">
                <p>No prescriptions found for "{searchQuery}"</p>
                <p>Try searching with patient ID or full name</p>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {activeTab === 'recent' && (
        <div className="recent-section">
          <h3>Recent Prescriptions</h3>
          {recentPrescriptions.length > 0 ? (
            <div className="prescriptions-grid">
              {recentPrescriptions.map(renderPrescriptionCard)}
            </div>
          ) : (
            <p className="no-data">No recent prescriptions available</p>
          )}
        </div>
      )}



      {selectedPrescription && (
        <div className="prescription-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Prescription Details</h3>
              <button 
                className="close-btn"
                onClick={() => setSelectedPrescription(null)}
              >
                ❌
              </button>
            </div>
            <div className="modal-body">
              {renderPrescriptionCard(selectedPrescription)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacistDashboard;