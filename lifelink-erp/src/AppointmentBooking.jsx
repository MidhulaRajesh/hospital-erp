import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './AppointmentBooking.css';

// Fallback doctor image
import fallbackDoctorImage from './assets/doc1.jpg';

const AppointmentBooking = () => {
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [appointmentType, setAppointmentType] = useState('consultation');
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [patient, setPatient] = useState(null);
  const [showLogin, setShowLogin] = useState(true);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    full_name: '',
    email: '',
    password: '',
    contact_number: '',
    dob: '',
    gender: '',
    blood_group: '',
    address: ''
  });
  const [authMessage, setAuthMessage] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [reasonForVisit, setReasonForVisit] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  // Fetch doctors from database on component mount
  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoadingDoctors(true);
    console.log(' Fetching doctors from API...');
    
    try {
      const response = await axios.get('http://localhost:5000/api/doctors/available');
      console.log('API Response:', response);
      console.log(' Doctors data:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        setDoctors(response.data);
        console.log(` Found ${response.data.length} doctors in database`);
      } else {
        console.warn(' API returned non-array data:', response.data);
        setDoctors([]);
      }
    } catch (error) {
      console.error(' Error fetching doctors:', error);
      console.error(' Error details:', error.response?.data || error.message);
      setDoctors([]);
    } finally {
      setLoadingDoctors(false);
    }
  };

  // Only use doctors from database now

  // Generate default availability slots (9 AM to 5 PM with 30-minute intervals)
  const generateDefaultAvailability = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute of ['00', '30']) {
        if (hour === 17 && minute === '30') break; // Stop at 5:00 PM
        const timeSlot = `${hour.toString().padStart(2, '0')}:${minute}`;
        slots.push(timeSlot);
      }
    }
    console.log('🕐 Generated default availability slots:', slots);
    return slots;
  };

  // Helper function to normalize doctor data structure
  const normalizeDoctor = (doctor) => {
    console.log(`🔍 Normalizing doctor: ${doctor.full_name}`);
    console.log('📅 Raw availability data:', doctor.availability);
    
    const normalized = {
      id: doctor.id,
      name: doctor.full_name || doctor.name,
      specialty: doctor.specialization || doctor.specialty,
      experience: doctor.experience_years ? `${doctor.experience_years} years` : doctor.experience,
      qualifications: doctor.qualifications,
      department: doctor.department || 'General',
      consultationFee: doctor.consultation_fee || doctor.consultationFee,
      image: doctor.profile_image ? `http://localhost:5000${doctor.profile_image}` : fallbackDoctorImage,
      availability: doctor.availability && doctor.availability.length > 0 
        ? doctor.availability 
        : generateDefaultAvailability(), // Generate default slots if none exist
      bio: doctor.bio
    };
    
    console.log('✅ Normalized availability:', normalized.availability);
    console.log('📊 Availability count:', normalized.availability.length);
    
    return normalized;
  };

  // Generate next 7 days for appointment booking
  const getNext7Days = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push({
        date: date.toISOString().split('T')[0],
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
        month: date.toLocaleDateString('en-US', { month: 'short' })
      });
    }
    return days;
  };

  const availableDays = getNext7Days();

  const handleDoctorSelect = (doctor) => {
    console.log('🏥 Doctor selected:', doctor);
    console.log('🕐 Doctor availability:', doctor.availability);
    setSelectedDoctor(doctor);
    setCurrentStep(2);
  };

  const handleDateSelect = (date) => {
    console.log('🗓️ Date selected:', date);
    console.log('👨‍⚕️ Selected doctor:', selectedDoctor);
    setSelectedDate(date);
    setSelectedTime(''); // Reset time when date changes
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
  };

  // These functions are now replaced by the new authentication and booking flow

  const canProceed = () => {
    if (currentStep === 1) return selectedDoctor;
    if (currentStep === 2) return selectedDate && selectedTime;
    if (currentStep === 3) return patient; // Patient must be logged in
    return false;
  };

  // Fetch booked slots for selected doctor and date
  const fetchBookedSlots = async (doctorId, date) => {
    if (!doctorId || !date) return;
    
    setLoadingSlots(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/appointments/booked-slots`, {
        params: { doctor_id: doctorId, appointment_date: date }
      });
      setBookedSlots(response.data.bookedSlots || []);
    } catch (error) {
      console.error('Error fetching booked slots:', error);
      setBookedSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Fetch booked slots when doctor and date are selected
  useEffect(() => {
    console.log('🔄 useEffect triggered - Doctor:', selectedDoctor?.name, 'Date:', selectedDate);
    if (selectedDoctor && selectedDate) {
      console.log('✅ Fetching booked slots for:', selectedDoctor.name, 'on', selectedDate);
      fetchBookedSlots(selectedDoctor.id, selectedDate);
      
      // Set up periodic refresh of booked slots every 30 seconds
      const refreshInterval = setInterval(() => {
        if (selectedDoctor && selectedDate) {
          fetchBookedSlots(selectedDoctor.id, selectedDate);
        }
      }, 30000); // Refresh every 30 seconds
      
      return () => clearInterval(refreshInterval);
    }
  }, [selectedDoctor, selectedDate]);

  // Handle patient login
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthMessage('');
    
    try {
      const response = await axios.post('http://localhost:5000/api/patients/login', loginData);
      setPatient(response.data);
      setAuthMessage('✅ Login successful!');
    } catch (error) {
      if (error.response?.status === 404) {
        setAuthMessage('❌ Account not found. Please register or check your email.');
      } else if (error.response?.status === 401) {
        setAuthMessage('❌ Invalid password. Please try again.');
      } else {
        setAuthMessage('❌ Login failed. Please try again.');
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Handle patient registration
  const handleRegister = async (e) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthMessage('');
    
    try {
      const response = await axios.post('http://localhost:5000/api/patients/register', registerData);
      setAuthMessage('✅ Registration successful! Please login.');
      setShowLogin(true);
      setRegisterData({
        full_name: '',
        email: '',
        password: '',
        contact_number: '',
        dob: '',
        gender: '',
        blood_group: '',
        address: ''
      });
    } catch (error) {
      setAuthMessage('❌ ' + (error.response?.data?.error || 'Registration failed. Please try again.'));
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Handle final appointment booking
  const handleFinalBooking = async () => {
    if (!patient) {
      setAuthMessage('❌ Please login first');
      return;
    }

    try {
      setIsAuthLoading(true);
      const appointmentData = {
        patient_id: patient.id,
        doctor_id: selectedDoctor.id,
        doctor_name: selectedDoctor.name,
        doctor_specialty: selectedDoctor.specialty,
        doctor_hospital: selectedDoctor.department || selectedDoctor.hospital || 'General',
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        appointment_type: appointmentType,
        consultation_fee: selectedDoctor.consultationFee,
        reason: reasonForVisit
      };

      const response = await axios.post('http://localhost:5000/api/appointments/book', appointmentData);
      
      // Show success message
      alert(`🎉 Appointment booked successfully!\n\nBooking Details:\n• Booking ID: ${response.data.appointment.id}\n• Doctor: ${selectedDoctor.name}\n• Date: ${new Date(selectedDate).toLocaleDateString()}\n• Time: ${selectedTime}\n• Fee: ₹${selectedDoctor.consultationFee}`);
      
      // Refresh booked slots to show the newly booked slot as unavailable
      await fetchBookedSlots(selectedDoctor.id, selectedDate);
      
      // Reset form after a short delay to show the updated slots
      setTimeout(() => {
        setCurrentStep(1);
        setSelectedDoctor(null);
        setSelectedDate('');
        setSelectedTime('');
        setPatient(null);
        setReasonForVisit('');
        setShowLogin(true);
      }, 2000);
      
    } catch (error) {
      if (error.response?.status === 409) {
        alert('❌ This time slot is no longer available. Please select another time.');
        fetchBookedSlots(selectedDoctor.id, selectedDate); // Refresh slots
      } else {
        alert('❌ Failed to book appointment. Please try again.');
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  return (
    <div className="appointment-booking">
      <div className="booking-container">
        
        {/* Header */}
        <div className="booking-header">
          <h1 className="booking-title">Book Your Appointment</h1>
          <p className="booking-subtitle">Choose your preferred doctor and schedule a consultation</p>
          
          {/* Progress Steps */}
          <div className="progress-steps">
            <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
              <div className="step-number">1</div>
              <span>Select Doctor</span>
            </div>
            <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
              <div className="step-number">2</div>
              <span>Choose Date & Time</span>
            </div>
            <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
              <div className="step-number">3</div>
              <span>Login/Register</span>
            </div>
            <div className={`step ${currentStep >= 4 ? 'active' : ''}`}>
              <div className="step-number">4</div>
              <span>Confirmation</span>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="booking-content">
          
          {/* Step 1: Select Doctor */}
          {currentStep === 1 && (
            <div className="step-content">
              <h2 className="step-title">Select a Doctor</h2>
              <div className="doctors-grid">
                {loadingDoctors ? (
                  <div className="loading-doctors">
                    <div className="loading-spinner">⏳</div>
                    <p>Loading available doctors...</p>
                  </div>
                ) : doctors.length === 0 ? (
                  <div className="no-doctors">
                    <div className="empty-icon">👩‍⚕️👨‍⚕️</div>
                    <p>No doctors available at the moment.</p>
                    <p>Please contact admin to register doctors.</p>
                    <button onClick={fetchDoctors} className="retry-btn">
                      🔄 Retry
                    </button>
                  </div>
                ) : doctors.map(doctor => {
                  const normalizedDoctor = normalizeDoctor(doctor);
                  return (
                    <div 
                      key={normalizedDoctor.id} 
                      className={`doctor-card ${selectedDoctor?.id === normalizedDoctor.id ? 'selected' : ''}`}
                      onClick={() => handleDoctorSelect(normalizedDoctor)}
                    >
                      <div className="doctor-image-section">
                        <div className="doctor-image">
                          <img 
                            src={normalizedDoctor.image} 
                            alt={normalizedDoctor.name}
                            onError={(e) => {
                              e.target.src = fallbackDoctorImage; // Fallback image if profile image fails
                            }}
                          />
                        </div>
                      </div>
                      
                      <div className="doctor-info-section">
                        <div className="doctor-header">
                          <h3 className="doctor-name">
                            {normalizedDoctor.name.startsWith('Dr.') ? normalizedDoctor.name : `Dr. ${normalizedDoctor.name}`}
                          </h3>
                          <p className="doctor-specialty">{normalizedDoctor.specialty}</p>
                          <p className="doctor-qualifications">{normalizedDoctor.qualifications}</p>
                        </div>
                        
                        <div className="doctor-details">
                          <div className="detail-row">
                            <span className="detail-label">Experience:</span>
                            <div>
                              <span className="detail-value experience-value">
                                {normalizedDoctor.experience.split(' ')[0]}
                              </span>
                              <span className="experience-label"> years</span>
                            </div>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Department:</span>
                            <span className="detail-value hospital-value">{normalizedDoctor.department}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Consultation Fee:</span>
                            <span className="detail-value fee-value">{normalizedDoctor.consultationFee}</span>
                          </div>
                        </div>
                        
                        <button className="select-doctor-btn">
                          {selectedDoctor?.id === normalizedDoctor.id ? 'SELECTED' : 'SELECT'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Select Date & Time */}
          {currentStep === 2 && selectedDoctor && (
            <div className="step-content">
              <div className="selected-doctor-info">
                <img src={selectedDoctor.image} alt={selectedDoctor.name} className="mini-doctor-img" />
                <div>
                  <h3>{selectedDoctor.name}</h3>
                  <p>{selectedDoctor.specialty}</p>
                </div>
                <button className="change-doctor-btn" onClick={() => setCurrentStep(1)}>
                  Change Doctor
                </button>
              </div>

              <h2 className="step-title">Select Date & Time</h2>
              
              {/* Appointment Type */}
              <div className="appointment-type-section">
                <h3>Appointment Type</h3>
                <div className="appointment-types">
                  <button 
                    className={`type-btn ${appointmentType === 'consultation' ? 'active' : ''}`}
                    onClick={() => setAppointmentType('consultation')}
                  >
                    🏥 In-Person Consultation
                  </button>
                  <button 
                    className={`type-btn ${appointmentType === 'video' ? 'active' : ''}`}
                    onClick={() => setAppointmentType('video')}
                  >
                    📹 Video Consultation
                  </button>
                </div>
              </div>

              {/* Date Selection */}
              <div className="date-selection">
                <h3>Available Dates</h3>
                <div className="dates-grid">
                  {availableDays.map(day => (
                    <div 
                      key={day.date}
                      className={`date-card ${selectedDate === day.date ? 'selected' : ''}`}
                      onClick={() => handleDateSelect(day.date)}
                    >
                      <div className="date-day">{day.day}</div>
                      <div className="date-number">{day.dayNumber}</div>
                      <div className="date-month">{day.month}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Time Selection */}
              {selectedDate && (
                <div className="time-selection">
                  <div className="slots-header">
                    <h3>Available Time Slots (IST)</h3>
                    <div className="slots-info">
                      <span className="total-slots">
                        {selectedDoctor.availability ? selectedDoctor.availability.length : 0} Total Slots
                      </span>
                      <span className="booked-count">
                        {bookedSlots.length} Booked
                      </span>
                      <span className="available-count">
                        {(selectedDoctor.availability ? selectedDoctor.availability.length : 0) - bookedSlots.length} Available
                      </span>
                    </div>
                  </div>
                  <div className="time-periods">
                    {/* Morning Slots */}
                    {selectedDoctor.availability && selectedDoctor.availability.filter(time => {
                      const hour = parseInt(time.split(':')[0]);
                      return hour >= 6 && hour < 12;
                    }).length > 0 && (
                      <div className="time-period">
                        <div className="time-period-label">
                          <span className="period-icon"></span>
                          Morning (6:00 AM - 12:00 PM)
                        </div>
                        <div className="times-grid">
                          {selectedDoctor.availability
                            .filter(time => {
                              const hour = parseInt(time.split(':')[0]);
                              return hour >= 6 && hour < 12;
                            })
                            .map(time => {
                              const isBooked = bookedSlots.includes(time);
                              const isSelected = selectedTime === time;
                              return (
                                <button
                                  key={time}
                                  className={`time-slot ${isSelected ? 'selected' : ''} ${isBooked ? 'booked' : ''}`}
                                  onClick={() => !isBooked && handleTimeSelect(time)}
                                  disabled={isBooked}
                                  title={isBooked ? 'This slot is already booked' : `Book appointment at ${time}`}
                                >
                                  {time}
                                  {isBooked && <span className="booked-indicator">❌</span>}
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* Afternoon Slots */}
                    {selectedDoctor.availability && selectedDoctor.availability.filter(time => {
                      const hour = parseInt(time.split(':')[0]);
                      return hour >= 12 && hour < 17;
                    }).length > 0 && (
                      <div className="time-period">
                        <div className="time-period-label">
                          <span className="period-icon"></span>
                          Afternoon (12:00 PM - 5:00 PM)
                        </div>
                        <div className="times-grid">
                          {selectedDoctor.availability && selectedDoctor.availability
                            .filter(time => {
                              const hour = parseInt(time.split(':')[0]);
                              return hour >= 12 && hour < 17;
                            })
                            .map(time => {
                              const isBooked = bookedSlots.includes(time);
                              const isSelected = selectedTime === time;
                              return (
                                <button
                                  key={time}
                                  className={`time-slot ${isSelected ? 'selected' : ''} ${isBooked ? 'booked' : ''}`}
                                  onClick={() => !isBooked && handleTimeSelect(time)}
                                  disabled={isBooked}
                                  title={isBooked ? 'This slot is already booked' : `Book appointment at ${time}`}
                                >
                                  {time}
                                  {isBooked && <span className="booked-indicator">❌</span>}
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* Evening Slots */}
                    {selectedDoctor.availability && selectedDoctor.availability.filter(time => {
                      const hour = parseInt(time.split(':')[0]);
                      return hour >= 17 && hour <= 23;
                    }).length > 0 && (
                      <div className="time-period">
                        <div className="time-period-label">
                          <span className="period-icon"></span>
                          Evening (5:00 PM - 11:00 PM)
                        </div>
                        <div className="times-grid">
                          {selectedDoctor.availability && selectedDoctor.availability
                            .filter(time => {
                              const hour = parseInt(time.split(':')[0]);
                              return hour >= 17 && hour <= 23;
                            })
                            .map(time => {
                              const isBooked = bookedSlots.includes(time);
                              const isSelected = selectedTime === time;
                              return (
                                <button
                                  key={time}
                                  className={`time-slot ${isSelected ? 'selected' : ''} ${isBooked ? 'booked' : ''}`}
                                  onClick={() => !isBooked && handleTimeSelect(time)}
                                  disabled={isBooked}
                                  title={isBooked ? 'This slot is already booked' : `Book appointment at ${time}`}
                                >
                                  {time}
                                  {isBooked && <span className="booked-indicator">❌</span>}
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                  {loadingSlots && (
                    <div className="loading-slots">
                      <div className="loading-spinner">⏳</div>
                      <p>Updating slot availability...</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Login/Register */}
          {currentStep === 3 && (
            <div className="step-content">
              {!patient ? (
                <>
                  <div className="auth-toggle">
                    <button 
                      className={`auth-toggle-btn ${showLogin ? 'active' : ''}`}
                      onClick={() => setShowLogin(true)}
                    >
                      Login
                    </button>
                    <button 
                      className={`auth-toggle-btn ${!showLogin ? 'active' : ''}`}
                      onClick={() => setShowLogin(false)}
                    >
                      Register
                    </button>
                  </div>

                  {showLogin ? (
                    <div className="login-section">
                      <h2 className="step-title">Patient Login</h2>
                      <p className="auth-subtitle">Login to your account to book the appointment</p>
                      
                      <form onSubmit={handleLogin} className="auth-form">
                        <div className="form-group">
                          <label>Email Address *</label>
                          <input
                            type="email"
                            value={loginData.email}
                            onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                            placeholder="Enter your email address"
                            required
                          />
                        </div>
                        
                        <div className="form-group">
                          <label>Password *</label>
                          <input
                            type="password"
                            value={loginData.password}
                            onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                            placeholder="Enter your password"
                            required
                          />
                        </div>
                        
                        <button 
                          type="submit" 
                          className="auth-btn"
                          disabled={isAuthLoading}
                        >
                          {isAuthLoading ? 'Logging in...' : 'Login'}
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div className="register-section">
                      <h2 className="step-title">Patient Registration</h2>
                      <p className="auth-subtitle">Create a new account to book your appointment</p>
                      
                      <form onSubmit={handleRegister} className="auth-form">
                        <div className="form-row">
                          <div className="form-group">
                            <label>Full Name *</label>
                            <input
                              type="text"
                              value={registerData.full_name}
                              onChange={(e) => setRegisterData({...registerData, full_name: e.target.value})}
                              placeholder="Enter your full name"
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Contact Number *</label>
                            <input
                              type="tel"
                              value={registerData.contact_number}
                              onChange={(e) => setRegisterData({...registerData, contact_number: e.target.value})}
                              placeholder="Enter your phone number"
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="form-row">
                          <div className="form-group">
                            <label>Email Address *</label>
                            <input
                              type="email"
                              value={registerData.email}
                              onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                              placeholder="Enter your email address"
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Password *</label>
                            <input
                              type="password"
                              value={registerData.password}
                              onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                              placeholder="Create a password"
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="form-row">
                          <div className="form-group">
                            <label>Date of Birth *</label>
                            <input
                              type="date"
                              value={registerData.dob}
                              onChange={(e) => setRegisterData({...registerData, dob: e.target.value})}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Gender *</label>
                            <select
                              value={registerData.gender}
                              onChange={(e) => setRegisterData({...registerData, gender: e.target.value})}
                              required
                            >
                              <option value="">Select Gender</option>
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                        </div>
                        
                        <div className="form-row">
                          <div className="form-group">
                            <label>Blood Group</label>
                            <select
                              value={registerData.blood_group}
                              onChange={(e) => setRegisterData({...registerData, blood_group: e.target.value})}
                            >
                              <option value="">Select Blood Group</option>
                              <option value="A+">A+</option>
                              <option value="A-">A-</option>
                              <option value="B+">B+</option>
                              <option value="B-">B-</option>
                              <option value="AB+">AB+</option>
                              <option value="AB-">AB-</option>
                              <option value="O+">O+</option>
                              <option value="O-">O-</option>
                            </select>
                          </div>
                        </div>
                        
                        <div className="form-group">
                          <label>Address</label>
                          <textarea
                            value={registerData.address}
                            onChange={(e) => setRegisterData({...registerData, address: e.target.value})}
                            placeholder="Enter your address"
                            rows="3"
                          />
                        </div>
                        
                        <button 
                          type="submit" 
                          className="auth-btn"
                          disabled={isAuthLoading}
                        >
                          {isAuthLoading ? 'Registering...' : 'Register'}
                        </button>
                      </form>
                    </div>
                  )}
                  
                  {authMessage && (
                    <div className={`auth-message ${authMessage.includes('✅') ? 'success' : 'error'}`}>
                      {authMessage}
                    </div>
                  )}
                </>
              ) : (
                <div className="logged-in-section">
                  <h2 className="step-title">Welcome, {patient.full_name}!</h2>
                  <p className="auth-subtitle">Please provide additional information for your appointment</p>
                  
                  <div className="patient-summary">
                    <div className="patient-info-card">
                      <h4>Your Information</h4>
                      <div className="info-grid">
                        <div className="info-item">
                          <span className="label">Name:</span>
                          <span className="value">{patient.full_name}</span>
                        </div>
                        <div className="info-item">
                          <span className="label">Email:</span>
                          <span className="value">{patient.email}</span>
                        </div>
                        <div className="info-item">
                          <span className="label">Phone:</span>
                          <span className="value">{patient.contact_number}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Reason for Visit (Optional)</label>
                    <textarea
                      value={reasonForVisit}
                      onChange={(e) => setReasonForVisit(e.target.value)}
                      placeholder="Briefly describe your symptoms or reason for consultation"
                      rows="4"
                    />
                  </div>
                  
                  <button 
                    className="logout-btn" 
                    onClick={() => {
                      setPatient(null);
                      setShowLogin(true);
                      setAuthMessage('');
                    }}
                  >
                    Use Different Account
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Confirmation */}
          {currentStep === 4 && (
            <div className="step-content">
              <h2 className="step-title">Confirm Your Appointment</h2>
              
              <div className="appointment-summary">
                <div className="summary-card">
                  <h3>Appointment Details</h3>
                  
                  <div className="summary-section">
                    <h4>Doctor Information</h4>
                    <div className="summary-doctor">
                      <img src={selectedDoctor.image} alt={selectedDoctor.name} />
                      <div>
                        <p className="doctor-name">{selectedDoctor.name}</p>
                        <p className="doctor-specialty">{selectedDoctor.specialty}</p>
                        <p className="doctor-hospital">{selectedDoctor.department || selectedDoctor.hospital || 'General Department'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="summary-section">
                    <h4>Appointment Details</h4>
                    <div className="summary-details">
                      <div className="detail">
                        <span className="label">Date:</span>
                        <span className="value">{new Date(selectedDate).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</span>
                      </div>
                      <div className="detail">
                        <span className="label">Time:</span>
                        <span className="value">{selectedTime}</span>
                      </div>
                      <div className="detail">
                        <span className="label">Type:</span>
                        <span className="value">{appointmentType === 'consultation' ? 'In-Person Consultation' : 'Video Consultation'}</span>
                      </div>
                      <div className="detail">
                        <span className="label">Fee:</span>
                        <span className="value fee">₹{selectedDoctor.consultationFee}</span>
                      </div>
                    </div>
                  </div>

                  <div className="summary-section">
                    <h4>Patient Information</h4>
                    <div className="summary-details">
                      <div className="detail">
                        <span className="label">Name:</span>
                        <span className="value">{patient?.full_name}</span>
                      </div>
                      <div className="detail">
                        <span className="label">Phone:</span>
                        <span className="value">{patient?.contact_number}</span>
                      </div>
                      <div className="detail">
                        <span className="label">Email:</span>
                        <span className="value">{patient?.email}</span>
                      </div>
                      {reasonForVisit && (
                        <div className="detail">
                          <span className="label">Reason:</span>
                          <span className="value">{reasonForVisit}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="booking-navigation">
          {currentStep > 1 && (
            <button 
              className="nav-btn prev-btn"
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              ← Previous
            </button>
          )}
          
          {currentStep < 4 ? (
            <button 
              className="nav-btn next-btn"
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceed()}
            >
              Next →
            </button>
          ) : (
            <button 
              className="nav-btn book-btn"
              onClick={handleFinalBooking}
              disabled={isAuthLoading}
            >
              {isAuthLoading ? 'Booking...' : 'Confirm & Book Appointment'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentBooking;