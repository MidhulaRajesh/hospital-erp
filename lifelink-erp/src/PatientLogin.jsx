
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PatientLogin.css';

const PatientLogin = ({ setPatientData }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('Logging in...');
    
    try {
      const res = await axios.post('http://localhost:5000/api/patients/login', formData);
      setMessage('✅ Login successful!');
      
      // Pass the patient data to parent component
      setPatientData(res.data);
      
      // Navigate to dashboard will be handled by the App component
      // due to the authentication state change
    } catch (err) {
      if (err.response?.status === 404) {
        setMessage('❌ Account not found. Please check your email or register for a new account.');
      } else if (err.response?.status === 401) {
        setMessage('❌ Invalid password. Please try again.');
      } else {
        setMessage('❌ ' + (err.response?.data?.error || 'Login failed. Please try again.'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Patient Login</h2>
        <p className="login-subtitle">Access your LifeLink account</p>

        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input 
            type="email" 
            id="email"
            name="email" 
            value={formData.email} 
            onChange={handleChange} 
            required 
            placeholder="Enter your email"
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input 
            type="password" 
            id="password"
            name="password" 
            value={formData.password} 
            onChange={handleChange} 
            required 
            placeholder="Enter your password"
            disabled={isLoading}
          />
        </div>

        <button 
          type="submit" 
          className={`submit-btn ${isLoading ? 'loading' : ''}`}
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
        
        {message && <p className="message">{message}</p>}
        
        <div className="login-footer">
          <p>
            Don't have an account? 
            <Link to="/register" className="register-link">
              Register here
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default PatientLogin;
