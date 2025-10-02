import React, { useState, useEffect } from 'react';
import './TransplantHistory.css';

const TransplantHistory = () => {
  const [completedTransplants, setCompletedTransplants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTransplantHistory();
  }, []);

  const fetchTransplantHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/recipient/history/completed');
      if (!response.ok) {
        throw new Error('HTTP error! status: ' + response.status);
      }
      const data = await response.json();
      if (data.success) {
        setCompletedTransplants(data.completed_transplants || []);
      } else {
        setCompletedTransplants([]);
      }
    } catch (error) {
      console.error('Error fetching transplant history:', error);
      setCompletedTransplants([]);
    }
    setLoading(false);
  };

  const filteredTransplants = completedTransplants.filter(transplant =>
    transplant.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (transplant.transplants[0]?.donor?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="loading-spinner">Loading transplant history...</div>;
  }

  return (
    <div className="transplant-history-container">
      <div className="history-header">
        <h1>Transplant History</h1>
        <p>Completed organ transplant records</p>
        <div className="stats-summary">
          <div className="stat-card">
            <span className="stat-number">{completedTransplants.length}</span>
            <span className="stat-label">Completed Transplants</span>
          </div>
        </div>
      </div>

      <div className="history-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by recipient or donor name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="history-list-container">
        {filteredTransplants.length === 0 ? (
          <div className="no-history">
            <p>No completed transplants found.</p>
          </div>
        ) : (
          <div className="history-wrapper">
            <div className="history-list">
              {filteredTransplants.map((transplant) => (
                <div key={transplant.id} className="history-card">
                  <div className="card-header">
                    <h3 className="recipient-name">{transplant.full_name}</h3>
                    <span className="completion-date">
                      Completed: {formatDate(transplant.transplant_completion_date)}
                    </span>
                  </div>
                  
                  <div className="transplant-details">
                    <div className="detail-section">
                      <div className="detail-item">
                        <span className="label">Organ:</span>
                        <span className="value">{transplant.required_organ}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Blood Type:</span>
                        <span className="value">{transplant.blood_group}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Hospital:</span>
                        <span className="value">{transplant.hospital_name}</span>
                      </div>
                    </div>
                    
                    {transplant.transplants && transplant.transplants[0] && (
                      <div className="donor-section">
                        <h4>Donor Information</h4>
                        <div className="detail-item">
                          <span className="label">Donor:</span>
                          <span className="value">
                            {transplant.transplants[0].donor?.full_name || 'Information not available'}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Donor Blood Type:</span>
                          <span className="value">
                            {transplant.transplants[0].donor?.blood_group || 'N/A'}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Transplant Date:</span>
                          <span className="value">
                            {formatDate(transplant.transplants[0].transplant_date)}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {transplant.completion_notes && (
                      <div className="notes-section">
                        <span className="notes-label">Notes:</span>
                        <p className="notes-text">{transplant.completion_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="history-footer">
        <p>Showing {filteredTransplants.length} of {completedTransplants.length} completed transplants</p>
      </div>
    </div>
  );
};

export default TransplantHistory;