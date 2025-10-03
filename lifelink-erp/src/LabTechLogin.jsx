import React, { useState } from 'react';
import { FaUserNurse, FaEnvelope, FaLock, FaSignInAlt, FaSpinner } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LabTechLogin.css';

const LabTechLogin = ({ setLabTechData }) => {
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
      const res = await axios.post('http://localhost:5000/api/lab-technician/login', formData);
      setMessage('✅ Login successful!');
      
      // Pass the lab tech data to parent component
      setLabTechData(res.data.technician);
      
      // Navigate to lab tech dashboard
      navigate('/lab-dashboard');
    } catch (err) {
      if (err.response?.status === 401) {
        setMessage('❌ Invalid email or password. Please try again.');
      } else {
        setMessage('❌ ' + (err.response?.data?.error || 'Login failed. Please try again.'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="lab-login-container">
      <form className="lab-login-form" onSubmit={handleSubmit}>
  <h2><FaUserNurse /> Lab Technician Login</h2>
  <p className="lab-login-subtitle">Access Lab Management System</p>

        <div className="form-group">
          <label htmlFor="email"><FaEnvelope /> Email Address</label>
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
          <label htmlFor="password"><FaLock /> Password</label>
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
          {isLoading ? <span><FaSpinner className="icon-spin" /> Logging in...</span> : <span><FaSignInAlt /> Login</span>}
        </button>
        
        {message && <p className="message">{message}</p>}
        
        <div className="lab-login-footer">
          <p>
            Need an account? Contact administrator
          </p>
        </div>
      </form>
    </div>
  );
};

export default LabTechLogin;