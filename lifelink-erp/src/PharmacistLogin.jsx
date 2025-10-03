import React, { useState } from 'react';
import { FaPills, FaExclamationTriangle, FaEnvelope, FaLock, FaHospital } from 'react-icons/fa';
import './PharmacistLogin.css';

const PharmacistLogin = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/pharmacist/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        console.log('Pharmacist login successful:', data.pharmacist);
        onLogin(data.pharmacist);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please check your connection.');
    }

    setLoading(false);
  };

  return (
    <div className="pharmacist-login-container">
      <div className="login-background">
  <div className="pharmacy-icon"><FaPills /></div>
      </div>
      
      <div className="login-card">
        <div className="login-header">
          <h1>Pharmacist Portal</h1>
          <p>Access prescription management system</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              <span className="error-icon"><FaExclamationTriangle /></span>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-group">
              <span className="input-icon"><FaEnvelope /></span>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-group">
              <span className="input-icon"><FaLock /></span>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="login-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Signing In...
              </>
            ) : (
              'Sign In to Pharmacy'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p><FaHospital /> Secure pharmacy management system</p>
          <p>Licensed pharmacists only</p>
        </div>
      </div>
    </div>
  );
};

export default PharmacistLogin;