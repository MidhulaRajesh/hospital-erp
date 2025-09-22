import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PatientLogin from './PatientLogin';
import PatientRegisterForm from './PatientReg';
import PatientDashboard from './PatientDashboard';
import LabTechLogin from './LabTechLogin';
import LabTechDashboard from './LabTechDashboard';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [patientData, setPatientData] = useState(null);
  const [isLabTechAuthenticated, setIsLabTechAuthenticated] = useState(false);
  const [labTechData, setLabTechData] = useState(null);
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
      } catch (error) {
        console.error('Error checking authentication:', error);
        // Clear invalid data
        localStorage.removeItem('patientData');
        localStorage.removeItem('authToken');
        localStorage.removeItem('labTechData');
        localStorage.removeItem('labTechToken');
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
          
          {/* Default Route - Redirect to patient login */}
          <Route 
            path="/" 
            element={<Navigate to="/login" replace />} 
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
