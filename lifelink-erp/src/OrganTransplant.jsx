import React, { useState, useEffect } from 'react';
import { FaHeart, FaSearch, FaClipboardList, FaExclamationTriangle, FaChartBar, FaHospital, FaCheckCircle, FaSyncAlt, FaTrashAlt, FaArrowLeft, FaArrowRight, FaRegEdit, FaBolt, FaTint, FaTimes, FaThumbsUp, FaThumbsDown } from 'react-icons/fa';
import './OrganTransplant.css';

const OrganTransplant = () => {
  const [availableOrgans, setAvailableOrgans] = useState([]);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [matches, setMatches] = useState([]);
  const [selectedOrgans, setSelectedOrgans] = useState({}); // Object to store selected organ per donor
  const [loadingStates, setLoadingStates] = useState({}); // Object to store loading state per donor
  const [transplantRecords, setTransplantRecords] = useState([]);
  const [activeTab, setActiveTab] = useState('matching');
  const [transplantedOrgans, setTransplantedOrgans] = useState({});
  const [searchStats, setSearchStats] = useState(null);
  const [expiringOrgans, setExpiringOrgans] = useState([]);
  const [utilizationStats, setUtilizationStats] = useState(null);

  // Fetch available organs on component mount
  useEffect(() => {
    fetchAvailableOrgans();
    fetchTransplantRecords();
    fetchExpiringOrgans();
    fetchUtilizationStats();
    
    // Set up interval to check for expiring organs every 5 minutes
    const interval = setInterval(() => {
      fetchExpiringOrgans();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchAvailableOrgans = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/organ-transplant/available-organs');
      const data = await response.json();
      if (data.success) {
        setAvailableOrgans(data.availableOrgans);
      }
    } catch (error) {
      console.error('Error fetching available organs:', error);
    }
  };

  const fetchTransplantRecords = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/organ-transplant/transplants');
      const data = await response.json();
      if (data.success) {
        setTransplantRecords(data.transplants);
        
        // Create a map of transplanted organs for quick lookup
        const transplantMap = {};
        data.transplants.forEach(transplant => {
          if (transplant.transplant_status === 'Matched' || transplant.transplant_status === 'Transplanted') {
            const key = `${transplant.donor_id}-${transplant.organ_type}`;
            transplantMap[key] = {
              status: transplant.transplant_status,
              recipientName: transplant.recipient?.full_name || 'Unknown',
              date: transplant.transplant_date || transplant.match_date
            };
          }
        });
        setTransplantedOrgans(transplantMap);
      }
    } catch (error) {
      console.error('Error fetching transplant records:', error);
    }
  };

  const findMatches = async (donorId, organType = '') => {
    // Set loading state for specific donor
    setLoadingStates(prev => ({ ...prev, [donorId]: true }));
    
    try {
      const url = organType ? 
        `http://localhost:5000/api/organ-transplant/find-matches/${donorId}?organType=${organType}` :
        `http://localhost:5000/api/organ-transplant/find-matches/${donorId}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setMatches(data.matches || []);
        setSelectedDonor(data.donor);
        setSearchStats({
          totalRecipientsFound: data.totalRecipientsFound || 0,
          compatibleMatches: data.compatibleMatches || 0,
          organType: organType || 'all available organs',
          searchTime: new Date().toLocaleTimeString()
        });
        
        // Show feedback message based on matches found
        if (data.matches && data.matches.length === 0) {
          console.log(`No matches found for donor ${data.donor.name} - ${organType || 'all organs'}`);
          console.log(`Total recipients checked: ${data.totalRecipientsFound || 0}`);
          console.log(`Compatible matches found: ${data.compatibleMatches || 0}`);
        } else if (data.matches && data.matches.length > 0) {
          console.log(`Found ${data.matches.length} compatible recipients for ${data.donor.name}`);
        }
      } else {
        alert('Error finding matches: ' + data.error);
        setSelectedDonor(null);
        setMatches([]);
        setSearchStats(null);
      }
    } catch (error) {
      console.error('Error finding matches:', error);
      alert('Network error while finding matches');
    }
    
    // Clear loading state for specific donor
    setLoadingStates(prev => ({ ...prev, [donorId]: false }));
  };

  const isOrganTransplanted = (donorId, organType) => {
    const key = `${donorId}-${organType}`;
    return transplantedOrgans[key] || null;
  };

  const handleOrganSelection = (donorId, organType) => {
    setSelectedOrgans(prev => ({ ...prev, [donorId]: organType }));
  };

  const getSelectedOrganForDonor = (donorId) => {
    return selectedOrgans[donorId] || '';
  };

  const isLoadingForDonor = (donorId) => {
    return loadingStates[donorId] || false;
  };

  const fetchExpiringOrgans = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/organ-transplant/expiring-organs');
      const data = await response.json();
      if (data.success) {
        setExpiringOrgans(data.expiringOrgans);
      }
    } catch (error) {
      console.error('Error fetching expiring organs:', error);
    }
  };

  const fetchUtilizationStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/organ-transplant/utilization-stats');
      const data = await response.json();
      if (data.success) {
        setUtilizationStats(data);
      }
    } catch (error) {
      console.error('Error fetching utilization stats:', error);
    }
  };

  const markOrganAsWasted = async (organId, reason, wasteType = 'Wasted') => {
    try {
      const response = await fetch(`http://localhost:5000/api/organ-transplant/mark-organ-wasted/${organId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: reason,
          wasteType: wasteType
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`${data.organ.organType} marked as ${wasteType.toLowerCase()}: ${reason}`);
        fetchAvailableOrgans();
        fetchTransplantRecords();
        fetchExpiringOrgans();
        fetchUtilizationStats();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error marking organ as wasted:', error);
      alert('Network error while marking organ as wasted');
    }
  };

  const createTransplant = async (recipientId, organType) => {
    try {
      const response = await fetch('http://localhost:5000/api/organ-transplant/create-transplant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          donorId: selectedDonor.id,
          recipientId: recipientId,
          organType: organType,
          coordinatorNotes: `Match created for ${organType} transplant`
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Transplant match created successfully!');
        fetchTransplantRecords();
        fetchAvailableOrgans(); // Refresh available organs to update transplant status
        setMatches([]);
        setSelectedDonor(null);
        // Clear the selected organ for this donor
        setSelectedOrgans(prev => ({ ...prev, [selectedDonor.id]: '' }));
      } else {
        alert('Error creating transplant: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating transplant:', error);
      alert('Network error while creating transplant');
    }
  };

  const updateTransplantStatus = async (transplantId, status) => {
    try {
      const response = await fetch(`http://localhost:5000/api/organ-transplant/update-status/${transplantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: status,
          transplantDate: status === 'Transplanted' ? new Date().toISOString() : null
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Status updated successfully!');
        fetchTransplantRecords();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const completeDeceasedDonorTransplant = async (transplant) => {
    const surgeonName = prompt('Enter surgeon name:');
    if (!surgeonName) return;
    
    const hospitalName = prompt('Enter hospital name:');
    if (!hospitalName) return;
    
    const postOpCondition = prompt('Enter post-operative condition (Stable/Critical/Good):');
    if (!postOpCondition) return;
    
    const operationNotes = prompt('Enter any operation notes (optional):') || '';
    
    try {
      const response = await fetch('http://localhost:5000/api/organ-transplant/complete-deceased-transplant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transplantId: transplant.id,
          surgeryDate: new Date().toISOString(),
          surgeonName,
          hospitalName,
          operationNotes,
          postOpCondition
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`🎉 ${data.message}\n\nDetails:\n- Donor: ${data.transplant.donorName}\n- Recipient: ${data.transplant.recipientName}\n- Organ: ${data.transplant.organType}\n- Surgeon: ${data.transplant.surgeon}`);
        fetchTransplantRecords();
        fetchAvailableOrgans(); // Refresh available organs list
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error completing deceased donor transplant:', error);
      alert('Network error while completing transplant');
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'High': return '#ff4757';
      case 'Medium': return '#ffa502';
      case 'Low': return '#26de81';
      default: return '#747d8c';
    }
  };

  const getCompatibilityColor = (score) => {
    if (score >= 80) return '#26de81';
    if (score >= 60) return '#ffa502';
    return '#ff4757';
  };

  return (
    <div className="organ-transplant-container">
      <div className="transplant-header">
  <h1><FaHeart /> Organ Transplant Coordination System</h1>
        <p>Preventing organ wastage through intelligent matching</p>
      </div>

      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'matching' ? 'active' : ''}`}
          onClick={() => setActiveTab('matching')}
        >
          <FaSearch /> Organ Matching
        </button>
        <button 
          className={`tab-btn ${activeTab === 'records' ? 'active' : ''}`}
          onClick={() => setActiveTab('records')}
        >
          <FaClipboardList /> Transplant Records
        </button>
        <button 
          className={`tab-btn ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          <FaExclamationTriangle /> Organ Alerts {expiringOrgans.length > 0 && <span className="alert-badge">{expiringOrgans.length}</span>}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <FaChartBar /> Analytics
        </button>
      </div>

      {activeTab === 'matching' && (
        <div className="matching-section">
          <div className="available-organs-section">
            <h2>Available Organs from Deceased Donors</h2>
            {availableOrgans.length === 0 ? (
              <p className="no-data">No organs available for transplant currently.</p>
            ) : (
              <div className="organs-grid">
                {availableOrgans.map(donor => {
                  const availableForMatching = donor.availableOrgans.filter(organ => !isOrganTransplanted(donor.donorId, organ));
                  return (
                  <div key={donor.donorId} className={`donor-card ${availableForMatching.length === 0 ? 'all-transplanted' : ''}`}>
                    <div className="deceased-donor-indicator"><FaHeart /> Deceased Donor</div>
                    {availableForMatching.length === 0 && (
                      <div className="transplant-success-indicator">
                        All organs successfully transplanted
                      </div>
                    )}
                    <div className="donor-info">
                      <h3>{donor.donorName}</h3>
                      <p><strong>Blood Group:</strong> {donor.bloodGroup}</p>
                      <p><strong>Location:</strong> {donor.location}</p>
                      <p><strong>Date of Death:</strong> {new Date(donor.dateOfDeath).toLocaleDateString()}</p>
                    </div>
                    <div className="organs-list">
                      <strong>Available Organs:</strong>
                      <div className="organ-tags">
                        {donor.availableOrgans.map(organ => {
                          const transplantInfo = isOrganTransplanted(donor.donorId, organ);
                          return (
                            <div key={organ} className="organ-tag-container">
                              <span 
                                className={`organ-tag ${transplantInfo ? 'transplanted' : 'available'}`}
                                title={transplantInfo ? `${transplantInfo.status} - ${transplantInfo.recipientName}` : 'Available for matching'}
                              >
                                {organ}
                                {transplantInfo && (
                                  <span className="transplant-status">
                                    {transplantInfo.status === 'Transplanted' ? <FaCheckCircle /> : <FaSyncAlt />}
                                  </span>
                                )}
                              </span>
                              {transplantInfo && (
                                <div className="transplant-info">
                                  <small>
                                    {transplantInfo.status} to {transplantInfo.recipientName}
                                    {transplantInfo.date && ` on ${new Date(transplantInfo.date).toLocaleDateString()}`}
                                  </small>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="organ-actions">
                      <select 
                        value={getSelectedOrganForDonor(donor.donorId)}
                        onChange={(e) => handleOrganSelection(donor.donorId, e.target.value)}
                        className="organ-select"
                      >
                        <option value="">Select organ to match</option>
                        {donor.availableOrgans.filter(organ => !isOrganTransplanted(donor.donorId, organ)).map(organ => (
                          <option key={organ} value={organ}>{organ}</option>
                        ))}
                      </select>
                      <button 
                        className="find-matches-btn"
                        onClick={() => findMatches(donor.donorId, getSelectedOrganForDonor(donor.donorId))}
                        disabled={isLoadingForDonor(donor.donorId) || !getSelectedOrganForDonor(donor.donorId) || isOrganTransplanted(donor.donorId, getSelectedOrganForDonor(donor.donorId))}
                      >
                        {isLoadingForDonor(donor.donorId) ? 'Finding...' : 
                         donor.availableOrgans.filter(organ => !isOrganTransplanted(donor.donorId, organ)).length === 0 ? 
                         'All Organs Transplanted' : 'Find Recipients'}
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>

          {selectedDonor && (
            <div className="matches-section">
              {matches.length > 0 ? (
                <>
                  <h2>Top 3 Matching Recipients</h2>
                  <div className="donor-summary">
                    <strong>Donor:</strong> {selectedDonor.name} | 
                    <strong> Blood Group:</strong> {selectedDonor.bloodGroup} |
                    <strong> Location:</strong> {selectedDonor.location}
                  </div>
                </>
              ) : (
                <>
                  <h2>No Compatible Recipients Found</h2>
                  <div className="donor-summary">
                    <strong>Searched for Donor:</strong> {selectedDonor.name} | 
                    <strong> Blood Group:</strong> {selectedDonor.bloodGroup} |
                    <strong> Location:</strong> {selectedDonor.location}
                  </div>
                  <div className="no-matches-message">
                    <div className="no-matches-icon"><FaSearch /></div>
                    <h3>No Compatible Recipients Available</h3>
                    {searchStats && (
                      <div className="search-stats">
                        <p><strong>Search Results:</strong></p>
                        <ul>
                          <li><FaChartBar /> Total recipients checked: <strong>{searchStats.totalRecipientsFound}</strong></li>
                          <li><FaHeart /> Organ type searched: <strong>{searchStats.organType}</strong></li>
                          <li><FaCheckCircle /> Compatible matches found: <strong>{searchStats.compatibleMatches}</strong></li>
                          <li><FaSyncAlt /> Search performed at: <strong>{searchStats.searchTime}</strong></li>
                        </ul>
                      </div>
                    )}
                    <p>No recipients were found who are compatible with this donor's organs based on the following criteria:</p>
                    <ul className="criteria-list">
                      <li>✓ Blood group compatibility</li>
                      <li>✓ Age compatibility (organ-specific limits)</li>
                      <li>✓ Geographic distance (within 500km)</li>
                      <li>✓ Minimum compatibility score (40%)</li>
                      <li>✓ Active recipient status</li>
                    </ul>
                    <div className="suggestions">
                      <h4>Possible reasons:</h4>
                      <ul>
                        <li>No active recipients need this organ type</li>
                        <li>Blood group incompatibility</li>
                        <li>Recipients are too far from donor location</li>
                        <li>Donor age exceeds organ-specific limits</li>
                        <li>All compatible recipients already have matches</li>
                      </ul>
                    </div>
                    <button 
                      className="clear-search-btn"
                      onClick={() => {
                        setSelectedDonor(null);
                        setMatches([]);
                        setSearchStats(null);
                      }}
                    >
                      Clear Search
                    </button>
                  </div>
                </>
              )}
              
              {matches.length > 0 && (
                <div className="matches-grid">
                  {matches.map((match, index) => (
                    <div key={match.recipientId} className="recipient-match-card">
                      <div className="rank-badge">#{index + 1}</div>
                      <div className="compatibility-score" style={{backgroundColor: getCompatibilityColor(match.compatibilityScore)}}>
                        {match.compatibilityScore}%
                      </div>
                      
                      <div className="recipient-details">
                        <h3>{match.recipientName}</h3>
                        <div className="detail-grid">
                          <div className="detail-item">
                            <span className="label">Blood Group:</span>
                            <span className="value">{match.bloodGroup}</span>
                          </div>
                          <div className="detail-item">
                            <span className="label">Required Organ:</span>
                            <span className="value">{match.requiredOrgan}</span>
                          </div>
                          <div className="detail-item">
                            <span className="label">Urgency:</span>
                            <span className="value urgency-badge" style={{backgroundColor: getUrgencyColor(match.urgencyLevel)}}>
                              {match.urgencyLevel}
                            </span>
                          </div>
                          <div className="detail-item">
                            <span className="label">Distance:</span>
                            <span className="value">{match.distance} km</span>
                          </div>
                          <div className="detail-item">
                            <span className="label">Location:</span>
                            <span className="value">{match.hospitalLocation}</span>
                          </div>
                          <div className="detail-item">
                            <span className="label">Contact:</span>
                            <span className="value">{match.contactNumber}</span>
                          </div>
                        </div>
                        
                        {match.medicalCondition && (
                          <div className="medical-condition">
                            <strong>Medical Condition:</strong>
                            <p>{match.medicalCondition}</p>
                          </div>
                        )}
                        
                        <button 
                          className="create-transplant-btn"
                          onClick={() => createTransplant(match.recipientId, match.requiredOrgan)}
                        >
                          Create Transplant Match
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'records' && (
        <div className="records-section">
          <h2>Transplant Records & Status</h2>
          {transplantRecords.length === 0 ? (
            <p className="no-data">No transplant records found.</p>
          ) : (
            <div className="records-table">
              <table>
                <thead>
                  <tr>
                    <th>Transplant ID</th>
                    <th>Donor</th>
                    <th>Recipient</th>
                    <th>Organ</th>
                    <th>Compatibility</th>
                    <th>Status</th>
                    <th>Match Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transplantRecords.map(record => (
                    <tr key={record.id}>
                      <td>#{record.id}</td>
                      <td>{record.donor?.full_name}</td>
                      <td>{record.recipient?.full_name}</td>
                      <td>{record.organ_type}</td>
                      <td>
                        <span className="compatibility-badge" style={{backgroundColor: getCompatibilityColor(record.compatibility_score)}}>
                          {Math.round(record.compatibility_score)}%
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge status-${record.transplant_status.toLowerCase()}`}>
                          {record.transplant_status}
                        </span>
                      </td>
                      <td>{new Date(record.match_date).toLocaleDateString()}</td>
                      <td>
                        <div className="action-buttons">
                          <select 
                            value={record.transplant_status}
                            onChange={(e) => updateTransplantStatus(record.id, e.target.value)}
                            className="status-select"
                          >
                            <option value="Matched">Matched</option>
                            <option value="Transplanted">Transplanted</option>
                            <option value="Expired">Expired</option>
                          </select>
                          {record.transplant_status === 'Matched' && (
                            <button 
                              className="complete-transplant-btn"
                              onClick={() => completeDeceasedDonorTransplant(record)}
                              title="Complete deceased donor transplant"
                            >
                              <FaHospital /> Complete Surgery
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="alerts-section">
          <h2><FaExclamationTriangle /> Organ Waste Prevention Alerts</h2>
          {expiringOrgans.length === 0 ? (
            <div className="no-alerts">
              <div className="no-alerts-icon"><FaCheckCircle /></div>
              <h3>No Critical Alerts</h3>
              <p>All available organs have sufficient time remaining or are properly allocated.</p>
            </div>
          ) : (
            <>
              <div className="alert-summary">
                <div className="alert-stat critical">
                  <span className="number">{expiringOrgans.filter(o => o.urgency === 'Critical').length}</span>
                  <span className="label">Critical (≤1hr)</span>
                </div>
                <div className="alert-stat high">
                  <span className="number">{expiringOrgans.filter(o => o.urgency === 'High').length}</span>
                  <span className="label">High (≤2hrs)</span>
                </div>
                <div className="alert-stat medium">
                  <span className="number">{expiringOrgans.filter(o => o.urgency === 'Medium').length}</span>
                  <span className="label">Medium ({'>'}2hrs)</span>
                </div>
              </div>
              
              <div className="expiring-organs-grid">
                {expiringOrgans.map(organ => (
                  <div key={organ.id} className={`organ-alert-card urgency-${organ.urgency.toLowerCase()}`}>
                    <div className="alert-header">
                      <span className="organ-type">{organ.organType}</span>
                      <span className={`urgency-badge urgency-${organ.urgency.toLowerCase()}`}>
                        {organ.urgency}
                      </span>
                    </div>
                    
                    <div className="donor-info">
                      <p><strong>Donor:</strong> {organ.donorName}</p>
                      <p><strong>Blood Group:</strong> {organ.donorBloodGroup}</p>
                      <p><strong>Location:</strong> {organ.location}</p>
                    </div>
                    
                    <div className="expiry-info">
                      <p><strong>Time Remaining:</strong> 
                        <span className={`time-remaining ${organ.urgency.toLowerCase()}`}>
                          {organ.hoursRemaining < 1 ? 
                            `${Math.round(organ.hoursRemaining * 60)} minutes` : 
                            `${organ.hoursRemaining} hours`
                          }
                        </span>
                      </p>
                      <p><strong>Expires:</strong> {new Date(organ.expiryTime).toLocaleString()}</p>
                      <p><strong>Allocation Attempts:</strong> {organ.allocationAttempts}</p>
                    </div>
                    
                    <div className="alert-actions">
                      <button 
                        className="urgent-match-btn"
                        onClick={() => findMatches(organ.donorId, organ.organType)}
                      >
                        <FaExclamationTriangle /> Urgent Match
                      </button>
                      <button 
                        className="mark-wasted-btn"
                        onClick={() => {
                          const reason = prompt('Enter reason for marking as wasted:');
                          if (reason) {
                            markOrganAsWasted(organ.id, reason, 'Expired');
                          }
                        }}
                      >
                        <FaTrashAlt /> Mark Expired
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="analytics-section">
          <h2><FaChartBar /> Organ Utilization Analytics</h2>
          {utilizationStats && (
            <>
              <div className="overall-stats">
                <div className="stat-card total">
                  <div className="stat-number">{utilizationStats.overall.total_organs}</div>
                  <div className="stat-label">Total Organs</div>
                </div>
                <div className="stat-card success">
                  <div className="stat-number">{utilizationStats.overall.total_transplanted}</div>
                  <div className="stat-label">Successfully Transplanted</div>
                </div>
                <div className="stat-card waste">
                  <div className="stat-number">{utilizationStats.overall.total_wasted}</div>
                  <div className="stat-label">Wasted/Expired</div>
                </div>
                <div className="stat-card rate">
                  <div className="stat-number">{utilizationStats.overall.overall_utilization_rate}%</div>
                  <div className="stat-label">Utilization Rate</div>
                </div>
              </div>
              
              <div className="organ-breakdown">
                <h3>By Organ Type</h3>
                <div className="breakdown-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Organ Type</th>
                        <th>Total</th>
                        <th>Transplanted</th>
                        <th>Wasted</th>
                        <th>Available</th>
                        <th>Utilization Rate</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {utilizationStats.byOrganType.map(organ => (
                        <tr key={organ.organ_type}>
                          <td className="organ-name">{organ.organ_type}</td>
                          <td>{organ.total_organs}</td>
                          <td className="success-count">{organ.transplanted}</td>
                          <td className="waste-count">{organ.wasted}</td>
                          <td className="available-count">{organ.available}</td>
                          <td>
                            <div className="utilization-bar">
                              <div 
                                className="utilization-fill"
                                style={{
                                  width: `${organ.utilization_rate}%`,
                                  backgroundColor: organ.utilization_rate >= 80 ? '#27ae60' :
                                                  organ.utilization_rate >= 60 ? '#f39c12' : '#e74c3c'
                                }}
                              ></div>
                              <span className="utilization-text">{organ.utilization_rate}%</span>
                            </div>
                          </td>
                          <td>
                            <span className={`status-indicator ${
                              organ.utilization_rate >= 80 ? 'excellent' :
                              organ.utilization_rate >= 60 ? 'good' : 'needs-improvement'
                            }`}>
                              {organ.utilization_rate >= 80 ? 'Excellent' :
                               organ.utilization_rate >= 60 ? 'Good' : 'Needs Improvement'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="wastage-analysis">
                <h3><FaTrashAlt /> Waste Analysis</h3>
                <div className="waste-stats">
                  <div className="waste-card">
                    <div className="waste-icon"><FaThumbsDown /></div>
                    <div className="waste-content">
                      <div className="waste-number">{utilizationStats.wastageAnalysis.wastePercentage}%</div>
                      <div className="waste-label">Overall Waste Rate</div>
                    </div>
                  </div>
                  <div className="waste-card">
                    <div className="waste-icon"><FaExclamationTriangle /></div>
                    <div className="waste-content">
                      <div className="waste-number">{utilizationStats.wastageAnalysis.organsAtRisk}</div>
                      <div className="waste-label">Organ Types at Risk</div>
                      <div className="waste-sublabel">({'<'}70% utilization)</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default OrganTransplant;