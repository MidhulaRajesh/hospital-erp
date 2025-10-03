import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PatientLogin from './PatientLogin';
import PatientRegisterForm from './PatientReg';
import PatientDashboard from './PatientDashboard';
import LabTechLogin from './LabTechLogin';
import LabTechDashboard from './LabTechDashboard';
import DoctorLogin from './DoctorLogin';
import DoctorDashboard from './DoctorDashboard';
import PharmacistLogin from './PharmacistLogin';
import PharmacistDashboard from './PharmacistDashboard';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import DeceasedDonorEnhanced from './DeceasedDonorEnhanced';
import OrganTransplant from './OrganTransplant';
import OrganMatching from './OrganMatching';
import RecipientDashboard from './RecipientDashboard';
import RecipientRegistration from './RecipientRegistration';
import Navigation from './Navigation';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [patientData, setPatientData] = useState(null);
  const [isLabTechAuthenticated, setIsLabTechAuthenticated] = useState(false);
  const [labTechData, setLabTechData] = useState(null);
  const [isDoctorAuthenticated, setIsDoctorAuthenticated] = useState(false);
  const [doctorData, setDoctorData] = useState(null);
  const [isPharmacistAuthenticated, setIsPharmacistAuthenticated] = useState(false);
  const [pharmacistData, setPharmacistData] = useState(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing authentication on app load
  useEffect(() => {
    const checkAuth = () => {
      try {
        // Check patient authentication
        const savedPatientData = localStorage.getItem('patientData');
        const authToken = localStorage.getItem('authToken');
        
        if (savedPatientData && authToken) {
          const parsedData = JSON.parse(savedPatientData);
          setPatientData(parsedData);
          setIsAuthenticated(true);
        }

        // Check lab tech authentication
        const savedLabTechData = localStorage.getItem('labTechData');
        const labTechToken = localStorage.getItem('labTechToken');
        
        if (savedLabTechData && labTechToken) {
          const parsedLabTechData = JSON.parse(savedLabTechData);
          setLabTechData(parsedLabTechData);
          setIsLabTechAuthenticated(true);
        }

        // Check doctor authentication
        const savedDoctorData = localStorage.getItem('doctorData');
        const doctorToken = localStorage.getItem('doctorToken');
        
        if (savedDoctorData && doctorToken) {
          const parsedDoctorData = JSON.parse(savedDoctorData);
          setDoctorData(parsedDoctorData);
          setIsDoctorAuthenticated(true);
        }

        // Check pharmacist authentication
        const savedPharmacistData = localStorage.getItem('pharmacistData');
        const pharmacistToken = localStorage.getItem('pharmacistToken');
        
        if (savedPharmacistData && pharmacistToken) {
          const parsedPharmacistData = JSON.parse(savedPharmacistData);
          setPharmacistData(parsedPharmacistData);
          setIsPharmacistAuthenticated(true);
        }

        // Check admin authentication
        const savedAdminData = localStorage.getItem('adminData');
        const adminToken = localStorage.getItem('adminToken');
        
        if (savedAdminData && adminToken) {
          const parsedAdminData = JSON.parse(savedAdminData);
          setAdminData(parsedAdminData);
          setIsAdminAuthenticated(true);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        // Clear invalid data
        localStorage.removeItem('patientData');
        localStorage.removeItem('authToken');
        localStorage.removeItem('labTechData');
        localStorage.removeItem('labTechToken');
        localStorage.removeItem('doctorData');
        localStorage.removeItem('doctorToken');
        localStorage.removeItem('pharmacistData');
        localStorage.removeItem('pharmacistToken');
        localStorage.removeItem('adminData');
        localStorage.removeItem('adminToken');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Handle successful patient login
  const handlePatientLoginSuccess = (data) => {
    setPatientData(data);
    setIsAuthenticated(true);
    
    // Save to localStorage for persistence
    localStorage.setItem('patientData', JSON.stringify(data));
    localStorage.setItem('authToken', data.token || 'authenticated');
  };

  // Handle successful lab tech login
  const handleLabTechLoginSuccess = (data) => {
    setLabTechData(data);
    setIsLabTechAuthenticated(true);
    
    // Save to localStorage for persistence
    localStorage.setItem('labTechData', JSON.stringify(data));
    localStorage.setItem('labTechToken', 'lab-tech-authenticated');
  };

  // Handle successful doctor login
  const handleDoctorLoginSuccess = (data) => {
    setDoctorData(data);
    setIsDoctorAuthenticated(true);
    
    // Save to localStorage for persistence
    localStorage.setItem('doctorData', JSON.stringify(data));
    localStorage.setItem('doctorToken', 'doctor-authenticated');
  };

  // Handle successful pharmacist login
  const handlePharmacistLoginSuccess = (data) => {
    setPharmacistData(data);
    setIsPharmacistAuthenticated(true);
    
    // Save to localStorage for persistence
    localStorage.setItem('pharmacistData', JSON.stringify(data));
    localStorage.setItem('pharmacistToken', 'pharmacist-authenticated');
  };

  // Handle successful admin login
  const handleAdminLoginSuccess = (data) => {
    setAdminData(data);
    setIsAdminAuthenticated(true);
    
    // Save to localStorage for persistence
    localStorage.setItem('adminData', JSON.stringify(data));
    localStorage.setItem('adminToken', 'admin-authenticated');
  };

  // Handle patient logout
  const handlePatientLogout = () => {
    setIsAuthenticated(false);
    setPatientData(null);
    
    // Clear localStorage
    localStorage.removeItem('patientData');
    localStorage.removeItem('authToken');
  };

  // Handle lab tech logout
  const handleLabTechLogout = () => {
    setIsLabTechAuthenticated(false);
    setLabTechData(null);
    
    // Clear localStorage
    localStorage.removeItem('labTechData');
    localStorage.removeItem('labTechToken');
  };

  // Handle doctor logout
  const handleDoctorLogout = () => {
    setIsDoctorAuthenticated(false);
    setDoctorData(null);
    
    // Clear localStorage
    localStorage.removeItem('doctorData');
    localStorage.removeItem('doctorToken');
  };

  // Handle pharmacist logout
  const handlePharmacistLogout = () => {
    setIsPharmacistAuthenticated(false);
    setPharmacistData(null);
    
    // Clear localStorage
    localStorage.removeItem('pharmacistData');
    localStorage.removeItem('pharmacistToken');
  };

  // Handle admin logout
  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setAdminData(null);
    
    // Clear localStorage
    localStorage.removeItem('adminData');
    localStorage.removeItem('adminToken');
  };

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading LifeLink ERP...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Patient Login Route */}
          <Route 
            path="/login" 
            element={
              isAuthenticated ? 
                <Navigate to="/dashboard" replace /> : 
                <PatientLogin setPatientData={handlePatientLoginSuccess} />
            } 
          />
          
          {/* Patient Registration Route */}
          <Route 
            path="/register" 
            element={
              isAuthenticated ? 
                <Navigate to="/dashboard" replace /> : 
                <PatientRegisterForm />
            } 
          />
          
          {/* Patient Dashboard Route - Protected */}
          <Route 
            path="/dashboard" 
            element={
              isAuthenticated && patientData ? 
                <PatientDashboard 
                  patientData={patientData} 
                  onLogout={handlePatientLogout}
                /> : 
                <Navigate to="/login" replace />
            } 
          />

          {/* Lab Technician Login Route */}
          <Route 
            path="/lab-login" 
            element={
              isLabTechAuthenticated ? 
                <Navigate to="/lab-dashboard" replace /> : 
                <LabTechLogin setLabTechData={handleLabTechLoginSuccess} />
            } 
          />

          {/* Lab Technician Dashboard Route - Protected */}
          <Route 
            path="/lab-dashboard" 
            element={
              isLabTechAuthenticated && labTechData ? 
                <LabTechDashboard 
                  labTechData={labTechData} 
                  onLogout={handleLabTechLogout}
                /> : 
                <Navigate to="/lab-login" replace />
            } 
          />

          {/* Doctor Login Route */}
          <Route 
            path="/doctor-login" 
            element={
              isDoctorAuthenticated ? 
                <Navigate to="/doctor-dashboard" replace /> : 
                <DoctorLogin onLogin={handleDoctorLoginSuccess} />
            } 
          />

          {/* Doctor Dashboard Route - Protected */}
          <Route 
            path="/doctor-dashboard" 
            element={
              isDoctorAuthenticated && doctorData ? 
                <DoctorDashboard 
                  doctorData={doctorData} 
                  onLogout={handleDoctorLogout}
                /> : 
                <Navigate to="/doctor-login" replace />
            } 
          />

          {/* Pharmacist Login Route */}
          <Route 
            path="/pharmacist-login" 
            element={
              isPharmacistAuthenticated ? 
                <Navigate to="/pharmacist-dashboard" replace /> : 
                <PharmacistLogin onLogin={handlePharmacistLoginSuccess} />
            } 
          />

          {/* Pharmacist Dashboard Route - Protected */}
          <Route 
            path="/pharmacist-dashboard" 
            element={
              isPharmacistAuthenticated && pharmacistData ? 
                <PharmacistDashboard 
                  pharmacistData={pharmacistData} 
                  onLogout={handlePharmacistLogout}
                /> : 
                <Navigate to="/pharmacist-login" replace />
            } 
          />

          {/* Admin Login Route */}
          <Route 
            path="/admin-login" 
            element={
              isAdminAuthenticated ? 
                <Navigate to="/admin-dashboard" replace /> : 
                <AdminLogin onLogin={handleAdminLoginSuccess} />
            } 
          />

          {/* Admin Dashboard Route - Protected */}
          <Route 
            path="/admin-dashboard" 
            element={
              isAdminAuthenticated && adminData ? 
                <AdminDashboard 
                  adminData={adminData} 
                  onLogout={handleAdminLogout}
                /> : 
                <Navigate to="/admin-login" replace />
            } 
          />

          {/* Organ Transplant Module Routes */}
          <Route 
            path="/organ-transplant" 
            element={<OrganTransplant />} 
          />

          <Route 
            path="/organ-matching" 
            element={<OrganMatching />} 
          />

          <Route 
            path="/recipient-dashboard" 
            element={<RecipientDashboard />} 
          />

          <Route 
            path="/recipient-registration" 
            element={<RecipientRegistration />} 
          />

          {/* Deceased Donor Registration Route */}
          <Route 
            path="/deceased-donor-registration" 
            element={<DeceasedDonorEnhanced />} 
          />
          
          {/* Default Route - Show Navigation */}
          <Route 
            path="/" 
            element={<Navigation />} 
          />
          
          {/* Catch all route - Redirect to patient login */}
          <Route 
            path="*" 
            element={<Navigate to="/login" replace />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
