import React, { useState } from "react";
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import "./PatientRegisterForm.css";

const PatientRegisterForm = () => {
  const [formData, setFormData] = useState({
    full_name: "",
    dob: "",
    gender: "",
    contact_number: "",
    email: "",
    password: "",
    address: "",
    blood_group: ""
  });

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("Submitting...");

    try {
      const response = await axios.post("http://localhost:5000/api/patients/register", formData, {
        headers: {
          "Content-Type": "application/json"
        }
      });

  setMessage(<span style={{color: 'green'}}><FaCheckCircle /> Registered successfully! Redirecting to login...</span>);
      setFormData({
        full_name: "",
        dob: "",
        gender: "",
        contact_number: "",
        email: "",
        password: "",
        address: "",
        blood_group: ""
      });
      
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (err) {
      if (err.response) {
        // Server responded with error status
        if (err.response.status === 400 && err.response.data.error?.includes('email')) {
          setMessage(<span style={{color: 'red'}}><FaTimesCircle /> Email already registered. Please use a different email or try logging in.</span>);
        } else {
          setMessage(<span style={{color: 'red'}}><FaTimesCircle /> {(err.response.data.error || err.response.data.message || "Registration failed")}</span>);
        }
      } else if (err.request) {
        // Request was made but no response received
  setMessage(<span style={{color: 'red'}}><FaTimesCircle /> No response from server. Please check your connection.</span>);
      } else {
        // Something else happened
  setMessage(<span style={{color: 'red'}}><FaTimesCircle /> Error: {err.message}</span>);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      <form className="register-form" onSubmit={handleSubmit}>
        <h2>Patient Registration</h2>
        <p className="register-subtitle">Join LifeLink ERP today</p>
        
        <div className="form-group">
          <label htmlFor="full_name">Full Name</label>
          <input
            type="text"
            id="full_name"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            required
            placeholder="Enter your full name"
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="dob">Date of Birth</label>
          <input
            type="date"
            id="dob"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="gender">Gender</label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            required
            disabled={isLoading}
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="contact_number">Contact Number</label>
          <input
            type="tel"
            id="contact_number"
            name="contact_number"
            value={formData.contact_number}
            onChange={handleChange}
            required
            placeholder="Enter your phone number"
            disabled={isLoading}
          />
        </div>

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
            placeholder="Create a password"
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="address">Address</label>
          <textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
            placeholder="Enter your complete address"
            rows="3"
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="blood_group">Blood Group</label>
          <select
            id="blood_group"
            name="blood_group"
            value={formData.blood_group}
            onChange={handleChange}
            required
            disabled={isLoading}
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

        <button 
          type="submit" 
          className={`submit-btn ${isLoading ? 'loading' : ''}`}
          disabled={isLoading}
        >
          {isLoading ? 'Registering...' : 'Register Patient'}
        </button>
        
        {message && <p className="message">{message}</p>}
        
        <div className="register-footer">
          <p>
            Already have an account? 
            <Link to="/login" className="login-link">
              Login here
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default PatientRegisterForm;
