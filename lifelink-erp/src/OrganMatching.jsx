import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import './OrganMatching.css';

const OrganMatching = () => {
  const [searchParams] = useSearchParams();
  const [donor, setDonor] = useState(null);
  const [organMatches, setOrganMatches] = useState({});
  const [loading, setLoading] = useState(false);
  const [allRecipients, setAllRecipients] = useState([]);
  const [selectedOrgan, setSelectedOrgan] = useState('');
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');

  const donorId = searchParams.get('donorId');
  const autoMatch = searchParams.get('autoMatch') === 'true';

  const organTypes = [
    'Heart', 'Liver', 'Kidney', 'Lungs', 'Pancreas', 
    'Corneas', 'Skin', 'Bone', 'Small_Intestine', 'Heart_Valves'
  ];

  useEffect(() => {
    console.log('OrganMatching mounted with:', { donorId, autoMatch });
    if (donorId) {
      fetchDonorDetails();
      if (autoMatch) {
        findAllOrganMatches();
      }
    }
    fetchAllRecipients();
  }, [donorId, autoMatch]);

  const fetchDonorDetails = async () => {
    try {
      console.log('Fetching donor details for ID:', donorId);
      const response = await fetch(`http://localhost:5000/api/deceased-donor/${donorId}`);
      const data = await response.json();
      console.log('Donor details response:', data);
      
      if (data.success) {
        setDonor(data.donor);
        setDebugInfo(prev => prev + `\\nDonor loaded: ${data.donor.full_name}`);
      } else {
        setError('Failed to load donor details: ' + data.error);
      }
    } catch (error) {
      console.error('Error fetching donor details:', error);
      setError('Network error while fetching donor details');
      setDebugInfo(prev => prev + `\\nError fetching donor: ${error.message}`);
    }
  };

  const fetchAllRecipients = async () => {
    try {
      console.log('Fetching all recipients...');
      const response = await fetch('http://localhost:5000/api/recipient');
      const data = await response.json();
      console.log('All recipients response:', data);
      
      if (data.success) {
        setAllRecipients(data.recipients);
        setDebugInfo(prev => prev + `\\nRecipients loaded: ${data.recipients.length}`);
      } else {
        setError('Failed to load recipients: ' + data.error);
      }
    } catch (error) {
      console.error('Error fetching recipients:', error);
      setDebugInfo(prev => prev + `\\nError fetching recipients: ${error.message}`);
    }
  };

  const findAllOrganMatches = async () => {
    if (!donorId) return;
    
    setLoading(true);
    setError('');
    const matches = {};

    try {
      console.log('Finding all organ matches for donor:', donorId);
      
      // Get donor details to find eligible organs
      const donorResponse = await fetch(`http://localhost:5000/api/deceased-donor/${donorId}`);
      const donorData = await donorResponse.json();
      console.log('Donor data for organ matching:', donorData);
      
      if (donorData.success && donorData.donor) {
        const eligibleOrgans = donorData.donor.organs_eligible ? 
          donorData.donor.organs_eligible.split(',').map(organ => organ.trim()) : [];
        
        console.log('Eligible organs:', eligibleOrgans);
        setDebugInfo(prev => prev + `\\nEligible organs: ${eligibleOrgans.join(', ')}`);

        // Find matches for each eligible organ
        for (const organ of eligibleOrgans) {
          console.log(`Finding matches for organ: ${organ}`);
          try {
            const response = await fetch(`http://localhost:5000/api/organ-transplant/find-matches/${donorId}?organType=${encodeURIComponent(organ)}`);
            const data = await response.json();
            console.log(`Matches for ${organ}:`, data);
            
            if (data.success) {
              matches[organ] = data.matches || [];
              setDebugInfo(prev => prev + `\\n${organ}: ${data.matches ? data.matches.length : 0} matches`);
            } else {
              console.error(`Error finding matches for ${organ}:`, data.error);
              setDebugInfo(prev => prev + `\\n${organ}: Error - ${data.error}`);
            }
          } catch (err) {
            console.error(`Network error for ${organ}:`, err);
            setDebugInfo(prev => prev + `\\n${organ}: Network error - ${err.message}`);
          }
        }
        
        console.log('Final organ matches:', matches);
        setOrganMatches(matches);
      } else {
        setError('Unable to get donor information for matching');
      }
    } catch (error) {
      console.error('Error finding organ matches:', error);
      setError('Network error while finding matches');
      setDebugInfo(prev => prev + `\\nGeneral error: ${error.message}`);
    }
    
    setLoading(false);
  };

  const findMatchesForOrgan = async (organType) => {
    if (!donorId) return;
    
    setLoading(true);
    try {
      console.log(`Finding matches for specific organ: ${organType}`);
      const response = await fetch(`http://localhost:5000/api/organ-transplant/find-matches/${donorId}?organType=${encodeURIComponent(organType)}`);
      const data = await response.json();
      console.log(`Single organ matches for ${organType}:`, data);
      
      if (data.success) {
        setOrganMatches(prev => ({
          ...prev,
          [organType]: data.matches || []
        }));
        setDebugInfo(prev => prev + `\\n${organType} refreshed: ${data.matches ? data.matches.length : 0} matches`);
      } else {
        alert('Error finding matches: ' + data.error);
      }
    } catch (error) {
      console.error('Error finding matches:', error);
      alert('Network error while finding matches');
    }
    setLoading(false);
  };

  const createTransplant = async (recipientId, organType) => {
    try {
      const response = await fetch('http://localhost:5000/api/organ-transplant/create-transplant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          donorId: donorId,
          recipientId: recipientId,
          organType: organType,
          coordinatorNotes: `Match created for ${organType} transplant - Rank #${getRecipientRank(recipientId, organType)}`
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`Transplant match created successfully for ${organType}!`);
        // Refresh matches to show updated status
        findAllOrganMatches();
      } else {
        alert('Error creating transplant: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating transplant:', error);
      alert('Network error while creating transplant');
    }
  };

  const getRecipientRank = (recipientId, organType) => {
    const matches = organMatches[organType] || [];
    const index = matches.findIndex(match => match.recipientId === recipientId);
    return index + 1;
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

  const getOrganIcon = (organ) => {
    const icons = {
      'Heart': '❤️',
      'Liver': '🫀',
      'Kidney': '🫘',
      'Lungs': '🫁',
      'Pancreas': '🩻',
      'Corneas': '👁️',
      'Skin': '🤲',
      'Bone': '🦴',
      'Small_Intestine': '🔄',
      'Heart_Valves': '💝'
    };
    return icons[organ] || '🧬';
  };

  const getRankBadgeColor = (rank) => {
    switch (rank) {
      case 1: return '#FFD700'; // Gold
      case 2: return '#C0C0C0'; // Silver
      case 3: return '#CD7F32'; // Bronze
      default: return '#747d8c';
    }
  };

  if (!donorId) {
    return (
      <div className="organ-matching-container">
        <div className="no-donor-message">
          <h2>No Donor Selected</h2>
          <p>Please select a deceased donor to find organ matches.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="organ-matching-container">
      <div className="matching-header">
        <h1>🫀 Organ Matching System</h1>
        <p>Find the best recipients for each available organ</p>
        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      {/* Debug Information (only in development) */}
      {(process.env.NODE_ENV === 'development' || debugInfo) && (
        <div className="debug-info">
          <details>
            <summary>Debug Information (Click to expand)</summary>
            <pre style={{ background: '#f5f5f5', padding: '10px', fontSize: '12px', overflow: 'auto' }}>
              <strong>Donor ID:</strong> {donorId}
              <br />
              <strong>Auto Match:</strong> {autoMatch ? 'Yes' : 'No'}
              <br />
              <strong>Donor Loaded:</strong> {donor ? 'Yes' : 'No'}
              <br />
              <strong>Organ Matches Count:</strong> {Object.keys(organMatches).length}
              <br />
              <strong>All Recipients Count:</strong> {allRecipients.length}
              <br />
              <strong>Debug Log:</strong>{debugInfo}
              <br />
              <strong>Organ Matches Data:</strong>
              {JSON.stringify(organMatches, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {donor && (
        <div className="donor-info-card">
          <h2>Donor Information</h2>
          <div className="donor-details">
            <div className="detail-item">
              <span className="label">Name:</span>
              <span className="value">{donor.full_name}</span>
            </div>
            <div className="detail-item">
              <span className="label">Blood Group:</span>
              <span className="value blood-group">{donor.blood_group}</span>
            </div>
            <div className="detail-item">
              <span className="label">Age:</span>
              <span className="value">{donor.age_at_death} years</span>
            </div>
            <div className="detail-item">
              <span className="label">Hospital:</span>
              <span className="value">{donor.hospital_location}</span>
            </div>
            <div className="detail-item full-width">
              <span className="label">Available Organs:</span>
              <div className="organs-list">
                {donor.organs_eligible ? 
                  donor.organs_eligible.split(',').map(organ => organ.trim()).map(organ => (
                    <span key={organ} className="organ-badge">
                      {getOrganIcon(organ)} {organ}
                    </span>
                  )) : 
                  <span>No organs specified</span>
                }
              </div>
            </div>
          </div>
          
          {!autoMatch && (
            <div className="action-buttons">
              <button 
                onClick={findAllOrganMatches}
                disabled={loading}
                className="find-all-matches-btn"
              >
                {loading ? 'Finding Matches...' : 'Find All Matches'}
              </button>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="loading-message">
          <div className="spinner"></div>
          <p>Finding organ matches...</p>
        </div>
      )}

      {Object.keys(organMatches).length > 0 && (
        <div className="organ-matches-section">
          <h2>Organ-Specific Recipient Rankings</h2>
          
          <div className="organ-tabs">
            {Object.keys(organMatches).map(organ => (
              <button
                key={organ}
                className={`organ-tab ${selectedOrgan === organ ? 'active' : ''}`}
                onClick={() => setSelectedOrgan(selectedOrgan === organ ? '' : organ)}
              >
                {getOrganIcon(organ)} {organ} ({organMatches[organ].length})
              </button>
            ))}
          </div>

          <div className="organ-matches-grid">
            {Object.entries(organMatches).map(([organ, matches]) => (
              <div 
                key={organ} 
                className={`organ-section ${selectedOrgan && selectedOrgan !== organ ? 'collapsed' : ''}`}
              >
                <div className="organ-header">
                  <h3>
                    {getOrganIcon(organ)} {organ} Recipients
                    <span className="match-count">({matches.length} matches)</span>
                  </h3>
                </div>

                {matches.length === 0 ? (
                  <div className="no-matches">
                    <p>No compatible recipients found for {organ}</p>
                    <button 
                      onClick={() => findMatchesForOrgan(organ)}
                      className="retry-btn"
                      disabled={loading}
                    >
                      {loading ? 'Searching...' : 'Retry Search'}
                    </button>
                  </div>
                ) : (
                  <div className="recipients-ranking">
                    {matches.slice(0, 3).map((match, index) => (
                      <div key={match.recipientId || index} className="recipient-rank-card">
                        <div className="rank-header">
                          <div 
                            className="rank-badge"
                            style={{ backgroundColor: getRankBadgeColor(index + 1) }}
                          >
                            #{index + 1}
                          </div>
                          <div 
                            className="compatibility-score"
                            style={{ backgroundColor: getCompatibilityColor(match.compatibilityScore) }}
                          >
                            {match.compatibilityScore}%
                          </div>
                        </div>

                        <div className="recipient-info">
                          <h4>{match.recipientName}</h4>
                          
                          <div className="recipient-details-grid">
                            <div className="detail">
                              <span className="label">🩸 Blood:</span>
                              <span className="value">{match.bloodGroup}</span>
                            </div>
                            <div className="detail">
                              <span className="label">⚡ Urgency:</span>
                              <span 
                                className="value urgency-badge"
                                style={{ backgroundColor: getUrgencyColor(match.urgencyLevel) }}
                              >
                                {match.urgencyLevel}
                              </span>
                            </div>
                            <div className="detail">
                              <span className="label">📍 Distance:</span>
                              <span className="value">{match.distance} km</span>
                            </div>
                            <div className="detail">
                              <span className="label">🏥 Location:</span>
                              <span className="value">{match.hospitalLocation}</span>
                            </div>
                            <div className="detail">
                              <span className="label">📞 Contact:</span>
                              <span className="value">{match.contactNumber}</span>
                            </div>
                          </div>

                          {match.medicalCondition && (
                            <div className="medical-condition">
                              <strong>Medical Condition:</strong>
                              <p>{match.medicalCondition}</p>
                            </div>
                          )}

                          <div className="match-actions">
                            <button 
                              onClick={() => createTransplant(match.recipientId, organ)}
                              className="create-match-btn"
                            >
                              Create Match
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Recipients Overview */}
      <div className="all-recipients-section">
        <h2>All Recipients Overview</h2>
        {allRecipients.length === 0 ? (
          <p>No recipients found in the system.</p>
        ) : (
          <div className="recipients-by-organ">
            {organTypes.map(organ => {
              const organRecipients = allRecipients.filter(r => r.required_organ === organ);
              if (organRecipients.length === 0) return null;

              return (
                <div key={organ} className="organ-recipients-overview">
                  <h3>{getOrganIcon(organ)} {organ} ({organRecipients.length})</h3>
                  <div className="recipients-mini-grid">
                    {organRecipients.slice(0, 5).map((recipient, index) => (
                      <div key={recipient.id} className="recipient-mini-card">
                        <div className="mini-rank">#{index + 1}</div>
                        <div className="mini-info">
                          <strong>{recipient.full_name}</strong>
                          <span className="mini-blood">{recipient.blood_group}</span>
                          <span 
                            className="mini-urgency"
                            style={{ backgroundColor: getUrgencyColor(recipient.urgency_level) }}
                          >
                            {recipient.urgency_level}
                          </span>
                        </div>
                      </div>
                    ))}
                    {organRecipients.length > 5 && (
                      <div className="more-recipients">
                        +{organRecipients.length - 5} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganMatching;