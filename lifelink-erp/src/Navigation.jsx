import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navigation.css';

const Navigation = () => {
  const navigate = useNavigate();

  return (
    <nav className="main-navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <h2>🏥 LifeLink ERP</h2>
        </div>
        
        <div className="nav-links">
          <div className="nav-section">
            <h3>Patient Services</h3>
            <Link to="/login" className="nav-link">
              👤 Patient Login
            </Link>
            <Link to="/register" className="nav-link">
              📝 Patient Registration
            </Link>
            <Link to="/dashboard" className="nav-link">
              📊 Patient Dashboard
            </Link>
          </div>

          <div className="nav-section">
            <h3>Medical Staff</h3>
            <Link to="/doctor-login" className="nav-link">
              👨‍⚕️ Doctor Login
            </Link>
            <Link to="/lab-login" className="nav-link">
              🧪 Lab Technician Login
            </Link>
            <Link to="/pharmacist-login" className="nav-link">
              💊 Pharmacist Login
            </Link>
          </div>

          <div className="nav-section">
            <h3>Administration</h3>
            <Link to="/admin-login" className="nav-link admin-link">
              🛡️ Admin Login
            </Link>
          </div>

          <div className="nav-section">
            <h3>Organ Transplant System</h3>
            <Link to="/deceased-donor-registration" className="nav-link primary">
              🫀 Deceased Donor Registration
            </Link>
            <Link to="/recipient-registration" className="nav-link">
              📋 Recipient Registration
            </Link>
            <Link to="/organ-matching" className="nav-link">
              🔍 Organ Matching
            </Link>
            <Link to="/recipient-dashboard" className="nav-link">
              📊 Recipients Dashboard
            </Link>
            <Link to="/organ-transplant" className="nav-link">
              🫁 Transplant Coordination
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;