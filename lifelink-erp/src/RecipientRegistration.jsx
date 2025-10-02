import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RecipientRegistration.css';

const RecipientRegistration = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    dob: '',
    age: '',
    gender: '',
    contact_number: '',
    email: '',
    address: '',
    blood_group: '',
    required_organ: '',
    medical_condition: '',
    urgency_level: 'Medium',
    last_checkup_date: '',
    hospital_name: '',
    hospital_location: '',
    emergency_contact_name: '',
    emergency_contact_relation: '',
    emergency_contact_number: '',
    password: '',
    confirmPassword: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const organTypes = [
    'Heart', 'Liver', 'Kidney', 'Lungs', 'Pancreas', 
    'Corneas', 'Skin', 'Bone', 'Small_Intestine', 'Heart_Valves'
  ];

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-calculate age if DOB is entered
    if (name === 'dob' && value) {
      const today = new Date();
      const birthDate = new Date(value);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      setFormData(prev => ({
        ...prev,
        age: age
      }));
    }

    // Clear field-specific errors
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required field validations
    const requiredFields = [
      'full_name', 'dob', 'gender', 'contact_number', 'email', 
      'address', 'blood_group', 'required_organ', 'urgency_level', 
      'hospital_name', 'hospital_location', 'emergency_contact_name',
      'emergency_contact_relation', 'emergency_contact_number', 'password'
    ];

    requiredFields.forEach(field => {
      if (!formData[field].trim()) {
        newErrors[field] = `${field.replace('_', ' ')} is required`;
      }
    });

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone number validation
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (formData.contact_number && !phoneRegex.test(formData.contact_number.replace(/\s/g, ''))) {
      newErrors.contact_number = 'Please enter a valid phone number';
    }

    // Password validation
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Age validation
    if (formData.age && (formData.age < 1 || formData.age > 120)) {
      newErrors.age = 'Please enter a valid age';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Remove confirmPassword before sending
      const { confirmPassword, ...submitData } = formData;
      
      const response = await fetch('http://localhost:5000/api/recipient/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      });

      const data = await response.json();

      if (data.success) {
        alert('Registration successful! You have been registered as an organ recipient.');
        navigate('/recipient-dashboard');
      } else {
        alert('Registration failed: ' + data.error);
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Network error during registration. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="recipient-registration-container">
      <div className="registration-header">
        <h1>🫀 Organ Recipient Registration</h1>
        <p>Register to join the organ transplant waiting list</p>
      </div>

      <form className="registration-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Personal Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="full_name">Full Name *</label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                className={errors.full_name ? 'error' : ''}
              />
              {errors.full_name && <span className="error-text">{errors.full_name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="dob">Date of Birth *</label>
              <input
                type="date"
                id="dob"
                name="dob"
                value={formData.dob}
                onChange={handleInputChange}
                className={errors.dob ? 'error' : ''}
              />
              {errors.dob && <span className="error-text">{errors.dob}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="age">Age</label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                readOnly
                className="readonly-field"
              />
            </div>

            <div className="form-group">
              <label htmlFor="gender">Gender *</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className={errors.gender ? 'error' : ''}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && <span className="error-text">{errors.gender}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="contact_number">Contact Number *</label>
              <input
                type="tel"
                id="contact_number"
                name="contact_number"
                value={formData.contact_number}
                onChange={handleInputChange}
                className={errors.contact_number ? 'error' : ''}
              />
              {errors.contact_number && <span className="error-text">{errors.contact_number}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>
          </div>

          <div className="form-group full-width">
            <label htmlFor="address">Address *</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows="3"
              className={errors.address ? 'error' : ''}
            ></textarea>
            {errors.address && <span className="error-text">{errors.address}</span>}
          </div>
        </div>

        <div className="form-section">
          <h3>Medical Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="blood_group">Blood Group *</label>
              <select
                id="blood_group"
                name="blood_group"
                value={formData.blood_group}
                onChange={handleInputChange}
                className={errors.blood_group ? 'error' : ''}
              >
                <option value="">Select Blood Group</option>
                {bloodGroups.map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
              {errors.blood_group && <span className="error-text">{errors.blood_group}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="required_organ">Required Organ *</label>
              <select
                id="required_organ"
                name="required_organ"
                value={formData.required_organ}
                onChange={handleInputChange}
                className={errors.required_organ ? 'error' : ''}
              >
                <option value="">Select Required Organ</option>
                {organTypes.map(organ => (
                  <option key={organ} value={organ}>{organ}</option>
                ))}
              </select>
              {errors.required_organ && <span className="error-text">{errors.required_organ}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="urgency_level">Urgency Level *</label>
              <select
                id="urgency_level"
                name="urgency_level"
                value={formData.urgency_level}
                onChange={handleInputChange}
                className={errors.urgency_level ? 'error' : ''}
              >
                <option value="High">High - Critical</option>
                <option value="Medium">Medium - Moderate</option>
                <option value="Low">Low - Stable</option>
              </select>
              {errors.urgency_level && <span className="error-text">{errors.urgency_level}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="last_checkup_date">Last Checkup Date</label>
              <input
                type="date"
                id="last_checkup_date"
                name="last_checkup_date"
                value={formData.last_checkup_date}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-group full-width">
            <label htmlFor="medical_condition">Medical Condition Details</label>
            <textarea
              id="medical_condition"
              name="medical_condition"
              value={formData.medical_condition}
              onChange={handleInputChange}
              rows="4"
              placeholder="Please describe your medical condition, current treatment, and any relevant medical history..."
            ></textarea>
          </div>
        </div>

        <div className="form-section">
          <h3>Hospital Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="hospital_name">Current Hospital *</label>
              <input
                type="text"
                id="hospital_name"
                name="hospital_name"
                value={formData.hospital_name}
                onChange={handleInputChange}
                className={errors.hospital_name ? 'error' : ''}
              />
              {errors.hospital_name && <span className="error-text">{errors.hospital_name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="hospital_location">Hospital Location *</label>
              <input
                type="text"
                id="hospital_location"
                name="hospital_location"
                value={formData.hospital_location}
                onChange={handleInputChange}
                className={errors.hospital_location ? 'error' : ''}
              />
              {errors.hospital_location && <span className="error-text">{errors.hospital_location}</span>}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Emergency Contact</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="emergency_contact_name">Emergency Contact Name *</label>
              <input
                type="text"
                id="emergency_contact_name"
                name="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={handleInputChange}
                className={errors.emergency_contact_name ? 'error' : ''}
              />
              {errors.emergency_contact_name && <span className="error-text">{errors.emergency_contact_name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="emergency_contact_relation">Relationship *</label>
              <input
                type="text"
                id="emergency_contact_relation"
                name="emergency_contact_relation"
                value={formData.emergency_contact_relation}
                onChange={handleInputChange}
                placeholder="e.g., Spouse, Parent, Sibling"
                className={errors.emergency_contact_relation ? 'error' : ''}
              />
              {errors.emergency_contact_relation && <span className="error-text">{errors.emergency_contact_relation}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="emergency_contact_number">Emergency Contact Number *</label>
              <input
                type="tel"
                id="emergency_contact_number"
                name="emergency_contact_number"
                value={formData.emergency_contact_number}
                onChange={handleInputChange}
                className={errors.emergency_contact_number ? 'error' : ''}
              />
              {errors.emergency_contact_number && <span className="error-text">{errors.emergency_contact_number}</span>}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Account Security</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={errors.password ? 'error' : ''}
              />
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={errors.confirmPassword ? 'error' : ''}
              />
              {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="cancel-btn"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="submit-btn"
          >
            {loading ? 'Registering...' : 'Register as Recipient'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RecipientRegistration;