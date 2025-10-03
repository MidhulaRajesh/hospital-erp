import React from 'react';
import { FaHospital, FaUser, FaRegEdit, FaChartBar, FaUserMd, FaFlask, FaPills, FaShieldAlt, FaHeart, FaClipboardList, FaSearch, FaLungs } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import './Navigation.css';

const Navigation = () => {
  const navigate = useNavigate();

  return (
    <nav className="main-navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <h2><FaHospital /> LifeLink ERP</h2>
        </div>
        
        <div className="nav-links">
          <div className="nav-section">
            <h3>Patient Services</h3>
            <Link to="/login" className="nav-link">
              <FaUser /> Patient Login
            </Link>
            <Link to="/register" className="nav-link">
              <FaRegEdit /> Patient Registration
            </Link>
            <Link to="/dashboard" className="nav-link">
              <FaChartBar /> Patient Dashboard
            </Link>
            <Link to="/book-appointment" className="nav-link">
              📅 Book Appointment
            </Link>
          </div>

          <div className="nav-section">
            <h3>Medical Staff</h3>
            <Link to="/doctor-login" className="nav-link">
              <FaUserMd /> Doctor Login
            </Link>
            <Link to="/lab-login" className="nav-link">
              <FaFlask /> Lab Technician Login
            </Link>
            <Link to="/pharmacist-login" className="nav-link">
              <FaPills /> Pharmacist Login
            </Link>
          </div>

          <div className="nav-section">
            <h3>Administration</h3>
            <Link to="/admin-login" className="nav-link admin-link">
              <FaShieldAlt /> Admin Login
            </Link>
          </div>

          <div className="nav-section">
            <h3>Organ Transplant System</h3>
            <Link to="/deceased-donor-registration" className="nav-link primary">
              <FaHeart /> Deceased Donor Registration
            </Link>
            <Link to="/recipient-registration" className="nav-link">
              <FaClipboardList /> Recipient Registration
            </Link>
            <Link to="/organ-matching" className="nav-link">
              <FaSearch /> Organ Matching
            </Link>
            <Link to="/recipient-dashboard" className="nav-link">
              <FaChartBar /> Recipients Dashboard
            </Link>
            <Link to="/organ-transplant" className="nav-link">
              <FaLungs /> Transplant Coordination
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;