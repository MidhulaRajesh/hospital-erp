import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './PatientAppointments.css';

const PatientAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [filter, setFilter] = useState('scheduled'); // scheduled, completed, cancelled, all
  const [cancellingAppointment, setCancellingAppointment] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  // Get patient data from localStorage (no login prompt needed since they're already logged in)
  useEffect(() => {
    const savedPatientData = localStorage.getItem('patientData');
    
    if (savedPatientData) {
      const patientData = JSON.parse(savedPatientData);
      setPatient(patientData);
      fetchAppointments(patientData.id);
    } else {
      // If no patient data, redirect to login
      window.location.href = '/login';
    }
  }, []);

  const fetchAppointments = async (patientId) => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/appointments/patient/${patientId}`);
      console.log('Appointments data received:', response.data.appointments);
      setAppointments(response.data.appointments || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (appointment) => {
    setCancellingAppointment(appointment);
    setCancellationReason('');
  };

  const cancelAppointment = async () => {
    if (!cancellationReason.trim()) {
      alert('Please provide a reason for cancellation');
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/appointments/${cancellingAppointment.id}`, {
        data: { reason: cancellationReason }
      });
      
      // Refresh appointments
      fetchAppointments(patient.id);
      setCancellingAppointment(null);
      setCancellationReason('');
      alert('Appointment cancelled successfully');
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert('Failed to cancel appointment. Please try again.');
    }
  };

  const closeCancelModal = () => {
    setCancellingAppointment(null);
    setCancellationReason('');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return '#1a73e8';
      case 'completed': return '#137333';
      case 'cancelled': return '#d32f2f';
      case 'no-show': return '#f57c00';
      default: return '#5f6368';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled': return '📅';
      case 'completed': return '✅';
      case 'cancelled': return '❌';
      case 'no-show': return '⚠️';
      default: return '📋';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const filteredAppointments = appointments.filter(appointment => {
    if (filter === 'all') return true;
    return appointment.status === filter;
  });

  return (
    <div className="appointments-container">
      <div className="appointments-header">
        <div className="header-content">
          <h1 className="page-title">My Appointments</h1>
          <p className="page-subtitle">View and manage your healthcare appointments</p>
          
          <div className="patient-info">
            <div className="patient-avatar">
              {patient?.full_name?.charAt(0) || 'P'}
            </div>
            <div className="patient-details">
              <h3>{patient?.full_name}</h3>
              <p>{patient?.email}</p>
            </div>
          </div>
        </div>

        <div className="header-actions">
          <Link to="/book-appointment" className="book-new-btn">
            Book New Appointment
          </Link>
          <button 
            onClick={() => fetchAppointments(patient.id)} 
            className="refresh-btn"
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="appointments-content">
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filter === 'scheduled' ? 'active' : ''}`}
            onClick={() => setFilter('scheduled')}
          >
            Upcoming ({appointments.filter(a => a.status === 'scheduled').length})
          </button>
          <button 
            className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed ({appointments.filter(a => a.status === 'completed').length})
          </button>
          <button 
            className={`filter-tab ${filter === 'cancelled' ? 'active' : ''}`}
            onClick={() => setFilter('cancelled')}
          >
            Cancelled ({appointments.filter(a => a.status === 'cancelled').length})
          </button>
          <button 
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({appointments.length})
          </button>
        </div>

        {loading ? (
          <div className="loading-appointments">
            <div className="loading-spinner">⏳</div>
            <p>Loading your appointments...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="no-appointments">
            <div className="empty-icon">📅</div>
            <h3>No {filter === 'all' ? '' : filter} appointments found</h3>
            <p>
              {filter === 'all' 
                ? "You haven't booked any appointments yet." 
                : `You have no ${filter} appointments.`
              }
            </p>
            <Link to="/book-appointment" className="book-first-btn">
              📅 Book Your First Appointment
            </Link>
          </div>
        ) : (
          <div className="appointments-list">
            {filteredAppointments.map(appointment => (
              <div key={appointment.id} className={`appointment-card ${appointment.status}`}>
                <div className="appointment-header">
                  <div className="appointment-status">
                    <span className="status-icon">{getStatusIcon(appointment.status)}</span>
                    <span 
                      className="status-text"
                      style={{ color: getStatusColor(appointment.status) }}
                    >
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </span>
                  </div>
                  <div className="appointment-id">
                    #{appointment.id}
                  </div>
                </div>

                <div className="appointment-body">
                  <div className="doctor-info">
                    <div className="doctor-avatar">
                      {appointment.doctor_profile_image ? (
                        <img 
                          src={`http://localhost:5000/uploads/${appointment.doctor_profile_image}`}
                          alt={appointment.doctor_name}
                          className="doctor-profile-image"
                          onError={(e) => {
                            console.log('Image failed to load:', appointment.doctor_profile_image);
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="doctor-placeholder"
                        style={{ display: appointment.doctor_profile_image ? 'none' : 'flex' }}
                      >
                        {appointment.doctor_name?.charAt(0) || 'D'}
                      </div>
                    </div>
                    <div className="doctor-details">
                      <h3 className="doctor-name">{appointment.doctor_name}</h3>
                      <p className="doctor-specialty">{appointment.doctor_specialty}</p>
                      <p className="doctor-hospital">{appointment.doctor_hospital}</p>
                    </div>
                  </div>

                  <div className="appointment-details">
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Date</span>
                        <span className="detail-value">{formatDate(appointment.appointment_date)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Time</span>
                        <span className="detail-value">{formatTime(appointment.appointment_time)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Fee</span>
                        <span className="detail-value">₹{appointment.consultation_fee}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Type</span>
                        <span className="detail-value">
                          {appointment.appointment_type === 'consultation' ? 'In-Person' : 'Video Call'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {appointment.reason && (
                    <div className="appointment-reason">
                      <span className="reason-label">Reason for visit:</span>
                      <p className="reason-text">{appointment.reason}</p>
                    </div>
                  )}

                  {appointment.notes && (
                    <div className="appointment-notes">
                      <span className="notes-label">Notes:</span>
                      <p className="notes-text">{appointment.notes}</p>
                    </div>
                  )}
                </div>

                <div className="appointment-actions">
                  <div className="appointment-date">
                    Booked on {new Date(appointment.created_at).toLocaleDateString()}
                  </div>
                  
                  {appointment.status === 'scheduled' && (
                    <div className="action-buttons">
                      <button 
                        onClick={() => handleCancelClick(appointment)}
                        className="cancel-btn"
                      >
                        ❌ Cancel Appointment
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancellation Modal */}
      {cancellingAppointment && (
        <div className="modal-overlay">
          <div className="cancel-modal">
            <div className="modal-header">
              <h3>Cancel Appointment</h3>
              <button onClick={closeCancelModal} className="close-btn">×</button>
            </div>
            
            <div className="modal-body">
              <div className="appointment-summary">
                <h4>Appointment Details</h4>
                <div className="summary-row">
                  <span>Doctor:</span>
                  <span>{cancellingAppointment.doctor_name}</span>
                </div>
                <div className="summary-row">
                  <span>Date:</span>
                  <span>{formatDate(cancellingAppointment.appointment_date)}</span>
                </div>
                <div className="summary-row">
                  <span>Time:</span>
                  <span>{formatTime(cancellingAppointment.appointment_time)}</span>
                </div>
              </div>

              <div className="reason-input">
                <label htmlFor="cancellation-reason">Reason for cancellation *</label>
                <textarea
                  id="cancellation-reason"
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Please provide a reason for cancelling this appointment..."
                  rows={4}
                  maxLength={500}
                />
                <div className="character-count">
                  {cancellationReason.length}/500
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={closeCancelModal} className="secondary-btn">
                Keep Appointment
              </button>
              <button 
                onClick={cancelAppointment} 
                className="danger-btn"
                disabled={!cancellationReason.trim()}
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientAppointments;