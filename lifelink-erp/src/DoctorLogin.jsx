import React, { useState } from 'react';
import { FaUserMd, FaEnvelope, FaLock, FaSignInAlt, FaUser, FaFlask } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './DoctorLogin.css';

const DoctorLogin = ({ onLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/api/doctors/login', formData);
      
      if (response.data.doctor) {
        // Call the onLogin function passed from parent component
        onLogin(response.data.doctor);
        navigate('/doctor-dashboard');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="doctor-login-container">
      <div className="doctor-login-card">
        <div className="doctor-login-header">
          <h1><FaUserMd /> Doctor Login</h1>
          <p>Access your patient management portal</p>
        </div>

        <form onSubmit={handleSubmit} className="doctor-login-form">
          <div className="form-group">
            <label htmlFor="email"><FaEnvelope /> Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password"><FaLock /> Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              required
              disabled={isLoading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            className={`doctor-login-btn ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? <span><FaSignInAlt /> Signing In...</span> : <span><FaSignInAlt /> Sign In</span>}
          </button>
        </form>

        <div className="doctor-login-footer">
          <p>Don't have access? Contact your administrator.</p>
          <div className="login-links">
            <button 
              onClick={() => navigate('/patient-login')}
              className="link-btn"
            >
              <FaUser /> Patient Login
            </button>
            <button 
              onClick={() => navigate('/lab-login')}
              className="link-btn"
            >
              <FaFlask /> Lab Tech Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorLogin;