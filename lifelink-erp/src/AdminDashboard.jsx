import React, { useState, useEffect } from 'react';
import { FaShieldAlt, FaUser, FaBullseye, FaHospital, FaEnvelope, FaSignOutAlt, FaChartBar, FaUsers, FaUserMd, FaFlask, FaPills, FaHeart, FaCog, FaClipboardList, FaRocket, FaExclamationCircle, FaTimes, FaCheckCircle, FaRegEdit, FaSearch, FaLungs, FaListAlt, FaChartLine, FaClipboardCheck } from 'react-icons/fa';
import './AdminDashboard.css';

const AdminDashboard = ({ adminData, onLogout }) => {
  const admin = adminData;
  const [activeTab, setActiveTab] = useState('overview');
  const [staffData, setStaffData] = useState({});
  const [stats, setStats] = useState(null);
  const [patients, setPatients] = useState([]);
  const [donors, setDonors] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [systemInfo, setSystemInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(null);
  const [formData, setFormData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStaffData();
    fetchDashboardStats();
    fetchSystemInfo();
  }, []);

  useEffect(() => {
    if (activeTab === 'patients') {
      fetchPatients();
    } else if (activeTab === 'donors') {
      fetchDonors();
    } else if (activeTab === 'recipients') {
      fetchRecipients();
    }
  }, [activeTab]);

  const fetchStaffData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/staff');
      const data = await response.json();
      if (data.success) {
        setStaffData(data.staff);
      }
    } catch (error) {
      console.error('Error fetching staff data:', error);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/dashboard-stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchPatients = async () => {
    setLoading(true);
    try {
      console.log('Fetching patients...', { searchTerm });
      const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';
      const url = `http://localhost:5000/api/admin/patients?limit=100${searchParam}`;
      console.log('URL:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('Response:', response.status, data);
      
      if (response.ok && data.success) {
        setPatients(data.patients || []);
        console.log('Patients set:', data.patients?.length || 0);
      } else {
        console.error('Failed to fetch patients:', data.error || 'Unknown error');
        setPatients([]);
        alert(`Error fetching patients: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      setPatients([]);
      alert(`Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchDonors = async () => {
    setLoading(true);
    try {
      console.log('Fetching donors...', { searchTerm });
      const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';
      const url = `http://localhost:5000/api/admin/deceased-donors?limit=100${searchParam}`;
      console.log('Donors API URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Donors API Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Donors API Response data:', data);
      
      if (data.success) {
        setDonors(data.donors || []);
        console.log('Donors set successfully:', data.donors?.length || 0, 'donors');
      } else {
        console.error('API returned error:', data.error);
        setDonors([]);
        alert(`Error fetching donors: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Network error fetching donors:', error);
      setDonors([]);
      alert(`Network error: ${error.message}. Please check if backend is running on port 5000.`);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecipients = async () => {
    setLoading(true);
    try {
      console.log('Fetching recipients...', { searchTerm });
      const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';
      const url = `http://localhost:5000/api/admin/recipients?limit=100${searchParam}`;
      console.log('Recipients API URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Recipients API Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Recipients API Response data:', data);
      
      if (data.success) {
        setRecipients(data.recipients || []);
        console.log('Recipients set successfully:', data.recipients?.length || 0, 'recipients');
      } else {
        console.error('API returned error:', data.error);
        setRecipients([]);
        alert(`Error fetching recipients: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Network error fetching recipients:', error);
      setRecipients([]);
      alert(`Network error: ${error.message}. Please check if backend is running on port 5000.`);
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemInfo = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/system-info');
      const data = await response.json();
      if (data.success) {
        setSystemInfo(data.system_info);
      }
    } catch (error) {
      console.error('Error fetching system info:', error);
    }
  };

  const handleRegisterStaff = async (staffType) => {
    setLoading(true);
    try {
      const endpoint = {
        doctor: '/api/admin/register-doctor',
        labtechnician: '/api/admin/register-labtechnician',
        pharmacist: '/api/admin/register-pharmacist'
      }[staffType];

      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ ${staffType.charAt(0).toUpperCase() + staffType.slice(1)} registered successfully!`);
        setShowRegisterForm(null);
        setFormData({});
        fetchStaffData();
        fetchDashboardStats();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Error registering staff member');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const renderRegisterForm = (staffType) => {
    const fields = {
      doctor: [
        { name: 'full_name', label: 'Full Name', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'password', label: 'Password', type: 'password', required: true },
        { name: 'doctor_id', label: 'Doctor ID', type: 'text', required: true },
        { name: 'phone', label: 'Phone', type: 'tel', required: true },
        { name: 'specialization', label: 'Specialization', type: 'text', required: true },
        { name: 'qualification', label: 'Qualification', type: 'text', required: false },
        { name: 'experience_years', label: 'Experience (Years)', type: 'number', required: false },
        { name: 'department', label: 'Department', type: 'text', required: false },
        { name: 'shift_timing', label: 'Shift Timing', type: 'text', required: false }
      ],
      labtechnician: [
        { name: 'full_name', label: 'Full Name', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'password', label: 'Password', type: 'password', required: true },
        { name: 'technician_id', label: 'Technician ID', type: 'text', required: true },
        { name: 'phone', label: 'Phone', type: 'tel', required: true },
        { name: 'specialization', label: 'Specialization', type: 'text', required: false },
        { name: 'qualification', label: 'Qualification', type: 'text', required: false },
        { name: 'experience_years', label: 'Experience (Years)', type: 'number', required: false },
        { name: 'shift_timing', label: 'Shift Timing', type: 'text', required: false }
      ],
      pharmacist: [
        { name: 'full_name', label: 'Full Name', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'password', label: 'Password', type: 'password', required: true },
        { name: 'license_number', label: 'License Number', type: 'text', required: true },
        { name: 'phone', label: 'Phone', type: 'tel', required: true },
        { name: 'qualification', label: 'Qualification', type: 'text', required: false },
        { name: 'experience_years', label: 'Experience (Years)', type: 'number', required: false },
        { name: 'specialization', label: 'Specialization', type: 'text', required: false },
        { name: 'shift_timings', label: 'Shift Timings', type: 'text', required: false }
      ]
    };

    return (
      <div className="register-form-modal">
        <div className="register-form-content">
          <div className="register-form-header">
            <h3>Register New {staffType.charAt(0).toUpperCase() + staffType.slice(1)}</h3>
            <button 
              className="close-btn"
              onClick={() => {
                setShowRegisterForm(null);
                setFormData({});
              }}
            >
              ✕
            </button>
          </div>

          <form className="register-form" onSubmit={(e) => {
            e.preventDefault();
            handleRegisterStaff(staffType);
          }}>
            <div className="form-grid">
              {fields[staffType].map((field) => (
                <div key={field.name} className="form-group">
                  <label htmlFor={field.name}>
                    {field.label} {field.required && <span className="required">*</span>}
                  </label>
                  <input
                    type={field.type}
                    id={field.name}
                    name={field.name}
                    value={formData[field.name] || ''}
                    onChange={handleInputChange}
                    required={field.required}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                  />
                </div>
              ))}
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => {
                  setShowRegisterForm(null);
                  setFormData({});
                }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="register-btn"
                disabled={loading}
              >
                {loading ? 'Registering...' : `Register ${staffType.charAt(0).toUpperCase() + staffType.slice(1)}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-info">
          <h2><FaShieldAlt /> Admin Dashboard</h2>
          <div className="admin-details">
            <p><strong><FaUser /> {admin.full_name}</strong></p>
            <p><FaBullseye /> {admin.role}</p>
            <p><FaHospital /> {admin.department}</p>
            <p><FaEnvelope /> {admin.email}</p>
          </div>
        </div>
        <button onClick={onLogout} className="logout-btn">
          <FaSignOutAlt /> Logout
        </button>
      </div>

      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <FaChartBar /> Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'patients' ? 'active' : ''}`}
          onClick={() => setActiveTab('patients')}
        >
          <FaUsers /> Patients
        </button>
        <button 
          className={`tab-btn ${activeTab === 'doctors' ? 'active' : ''}`}
          onClick={() => setActiveTab('doctors')}
        >
          <FaUserMd /> Doctors
        </button>
        <button 
          className={`tab-btn ${activeTab === 'labtechs' ? 'active' : ''}`}
          onClick={() => setActiveTab('labtechs')}
        >
          <FaFlask /> Lab Technicians
        </button>
        <button 
          className={`tab-btn ${activeTab === 'pharmacists' ? 'active' : ''}`}
          onClick={() => setActiveTab('pharmacists')}
        >
          <FaPills /> Pharmacists
        </button>
        <button 
          className={`tab-btn ${activeTab === 'donors' ? 'active' : ''}`}
          onClick={() => setActiveTab('donors')}
        >
          <FaHeart /> Donors
        </button>
        <button 
          className={`tab-btn ${activeTab === 'recipients' ? 'active' : ''}`}
          onClick={() => setActiveTab('recipients')}
        >
          <FaHospital /> Recipients
        </button>
        <button 
          className={`tab-btn ${activeTab === 'system' ? 'active' : ''}`}
          onClick={() => setActiveTab('system')}
        >
          <FaCog /> System
        </button>
      </div>

      {activeTab === 'overview' && stats && (
        <div className="overview-section">
          <h3><FaChartLine /> Hospital Management Overview</h3>
          
          <div className="stats-grid">
            <div className="stat-card total">
              <h4><FaUsers /> Total Users</h4>
              <span className="number">{stats.total_users}</span>
              <small>All system users</small>
            </div>
            
            <div className="stat-card patients">
              <h4><FaHospital /> Patients</h4>
              <span className="number">{stats.total_patients}</span>
              <small>{stats.today?.new_patients || 0} today</small>
            </div>
            
            <div className="stat-card staff">
              <h4><FaUserMd /> Staff</h4>
              <span className="number">{stats.total_staff}</span>
              <small>Medical professionals</small>
            </div>
            
            <div className="stat-card activity">
              <h4><FaClipboardList /> Recent Activity</h4>
              <div className="activity-stats">
                <small><FaCheckCircle /> {stats.recent_activity?.new_patients || 0} new patients</small>
                <small><FaPills /> {stats.recent_activity?.new_prescriptions || 0} prescriptions</small>
                <small><FaFlask /> {stats.recent_activity?.new_lab_reports || 0} lab reports</small>
              </div>
            </div>
          </div>

          <div className="detailed-stats">
            <div className="staff-breakdown">
              <h4><FaUserMd /> Staff Breakdown</h4>
              <div className="breakdown-grid">
                <div className="breakdown-item">
                  <span className="role">Doctors</span>
                  <span className="count">{stats.staff?.doctors?.total || 0}</span>
                  <span className="active">({stats.staff?.doctors?.active || 0} active)</span>
                </div>
                <div className="breakdown-item">
                  <span className="role">Lab Technicians</span>
                  <span className="count">{stats.staff?.lab_technicians?.total || 0}</span>
                  <span className="active">({stats.staff?.lab_technicians?.active || 0} active)</span>
                </div>
                <div className="breakdown-item">
                  <span className="role">Pharmacists</span>
                  <span className="count">{stats.staff?.pharmacists?.total || 0}</span>
                  <span className="active">({stats.staff?.pharmacists?.active || 0} active)</span>
                </div>
                <div className="breakdown-item">
                  <span className="role">Administrators</span>
                  <span className="count">{stats.staff?.admins?.total || 0}</span>
                  <span className="active">(system users)</span>
                </div>
              </div>
            </div>

            <div className="stat-card organ-transplants">
              <h4><FaHeart /> Organ Transplant System</h4>
              <div className="breakdown">
                <div className="breakdown-item">
                  <span className="role">Deceased Donors</span>
                  <span className="count">{stats.organ_transplants?.total_donors || 0}</span>
                  <span className="active">(registered)</span>
                </div>
                <div className="breakdown-item">
                  <span className="role">Recipients</span>
                  <span className="count">{stats.organ_transplants?.total_recipients || 0}</span>
                  <span className="active">(waiting)</span>
                </div>
                <div className="breakdown-item">
                  <span className="role">Transplants</span>
                  <span className="count">{stats.organ_transplants?.total_transplants || 0}</span>
                  <span className="active">(completed)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'patients' && (
        <div className="staff-section">
          <div className="section-header">
            <h3><FaUsers /> Patient Management</h3>
            <div className="search-controls">
              <input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    fetchPatients();
                  }
                }}
              />
              <button 
                className="search-btn"
                onClick={() => {
                  console.log('Search button clicked with term:', searchTerm);
                  fetchPatients();
                }}
                disabled={loading}
              >
                <FaSearch /> {loading ? 'Loading...' : 'Search'}
              </button>
              <button 
                className="clear-btn"
                onClick={() => {
                  setSearchTerm('');
                  fetchPatients();
                }}
              >
                <FaRocket /> Clear
              </button>
            </div>
          </div>
          
          {loading ? (
            <div className="loading-state">
              <p>Loading patients...</p>
            </div>
          ) : (
            <div className="staff-table">
              <div className="patient-count">
                <p><FaChartBar /> Total patients: {patients.length}</p>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Age</th>
                    <th>Gender</th>
                    <th>Blood Group</th>
                    <th>Registration Date</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient) => (
                    <tr key={patient.id}>
                      <td>{patient.full_name || 'N/A'}</td>
                      <td>{patient.email || 'N/A'}</td>
                      <td>{patient.phone || 'N/A'}</td>
                      <td>{patient.age || 'N/A'}</td>
                      <td>{patient.gender || 'N/A'}</td>
                      <td>{patient.blood_group || 'N/A'}</td>
                      <td>{patient.created_at ? new Date(patient.created_at).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  ))}
                  {patients.length === 0 && !loading && (
                    <tr>
                      <td colSpan="7" className="no-data">
                        No patients found. {searchTerm ? 'Try a different search term.' : 'No patients registered yet.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'system' && systemInfo && (
        <div className="system-section">
          <h3><FaCog /> System Management</h3>
          
          <div className="system-grid">
            <div className="system-card status">
              <h4><FaCheckCircle /> System Status</h4>
              <div className="status-items">
                <div className="status-item">
                  <span>Server:</span>
                  <span className="status-green">{systemInfo.server_status}</span>
                </div>
                <div className="status-item">
                  <span>Database:</span>
                  <span className="status-green">{systemInfo.database_status}</span>
                </div>
                <div className="status-item">
                  <span>Version:</span>
                  <span>{systemInfo.system_version}</span>
                </div>
              </div>
            </div>
            
            <div className="system-card logins">
              <h4><FaUser /> Recent Admin Logins</h4>
              <div className="login-list">
                {systemInfo.recent_admin_logins?.slice(0, 5).map((login, index) => (
                  <div key={index} className="login-item">
                    <span className="name">{login.full_name}</span>
                    <span className="role">{login.role}</span>
                    <span className="time">
                      {login.last_login ? new Date(login.last_login).toLocaleString() : 'Never'}
                    </span>
                  </div>
                )) || (
                  <div className="no-data">No recent logins</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'doctors' && (
        <div className="staff-section">
          <div className="section-header">
            <h3><FaUserMd /> Doctors Management</h3>
            <button 
              className="add-btn"
              onClick={() => setShowRegisterForm('doctor')}
            >
              <FaRegEdit /> Add New Doctor
            </button>
          </div>
          
          <div className="staff-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>License Number</th>
                  <th>Email</th>
                  <th>Specialization</th>
                  <th>Phone</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {staffData.doctors?.map((doctor) => (
                  <tr key={doctor.id}>
                    <td>{doctor.full_name}</td>
                    <td>{doctor.license_number || 'Not assigned'}</td>
                    <td>{doctor.email}</td>
                    <td>{doctor.specialization || 'General'}</td>
                    <td>{doctor.phone || 'Not provided'}</td>
                    <td>
                      <span className={`status ${doctor.status?.toLowerCase() || 'active'}`}>
                        {doctor.status || 'Active'}
                      </span>
                    </td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan="6" className="no-data">No doctors found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'labtechs' && (
        <div className="staff-section">
          <div className="section-header">
            <h3><FaFlask /> Lab Technicians Management</h3>
            <button 
              className="add-btn"
              onClick={() => setShowRegisterForm('labtechnician')}
            >
              <FaRegEdit /> Add New Lab Technician
            </button>
          </div>
          
          <div className="staff-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Technician ID</th>
                  <th>Email</th>
                  <th>Specialization</th>
                  <th>Phone</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {staffData.lab_technicians?.map((labtech) => (
                  <tr key={labtech.id}>
                    <td>{labtech.full_name}</td>
                    <td>LT-{String(labtech.id).padStart(4, '0')}</td>
                    <td>{labtech.email}</td>
                    <td>{'Laboratory'}</td>
                    <td>{'Not provided'}</td>
                    <td>
                      <span className={`status ${labtech.status?.toLowerCase() || 'active'}`}>
                        {labtech.status || 'Active'}
                      </span>
                    </td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan="6" className="no-data">No lab technicians found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'pharmacists' && (
        <div className="staff-section">
          <div className="section-header">
            <h3><FaPills /> Pharmacists Management</h3>
            <button 
              className="add-btn"
              onClick={() => setShowRegisterForm('pharmacist')}
            >
              <FaRegEdit /> Add New Pharmacist
            </button>
          </div>
          
          <div className="staff-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>License Number</th>
                  <th>Email</th>
                  <th>Specialization</th>
                  <th>Phone</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {staffData.pharmacists?.map((pharmacist) => (
                  <tr key={pharmacist.id}>
                    <td>{pharmacist.full_name}</td>
                    <td>{pharmacist.license_number}</td>
                    <td>{pharmacist.email}</td>
                    <td>{pharmacist.specialization || 'General'}</td>
                    <td>{pharmacist.phone}</td>
                    <td>
                      <span className={`status ${pharmacist.status?.toLowerCase()}`}>
                        {pharmacist.status}
                      </span>
                    </td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan="6" className="no-data">No pharmacists found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'donors' && (
        <div className="staff-section">
          <div className="section-header">
            <h3><FaHeart /> Deceased Donors Management</h3>
            <div className="search-controls">
              <input
                type="text"
                placeholder="Search donors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    fetchDonors();
                  }
                }}
              />
              <button onClick={fetchDonors} className="search-btn"><FaSearch /></button>
            </div>
          </div>
          
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading donors...</p>
            </div>
          ) : (
            <div className="professional-table-container">
              <div className="table-wrapper">
                <table className="professional-table">
                  <thead>
                    <tr>
                      <th>Donor Information</th>
                      <th>Medical Details</th>
                      <th>Available Organs</th>
                      <th>Hospital</th>
                      <th>Date of Death</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donors.length > 0 ? donors.map((donor) => (
                      <tr key={donor.id} className="table-row">
                        <td className="donor-info-cell">
                          <div className="donor-primary">
                            <strong className="donor-name">{donor.full_name}</strong>
                            <span className="donor-id">ID: {donor.national_id}</span>
                          </div>
                        </td>
                        <td className="medical-details-cell">
                          <div className="medical-info">
                            <span className="age-info">Age: {donor.age_at_death}</span>
                            <span className={`blood-group-badge ${donor.blood_group}`}>
                              {donor.blood_group}
                            </span>
                          </div>
                        </td>
                        <td className="organs-cell">
                          <div className="organs-list-compact">
                            {donor.organs_eligible ? (
                              donor.organs_eligible.split(',').map((organ, idx) => (
                                <span key={idx} className="organ-badge">
                                  {organ.trim()}
                                </span>
                              ))
                            ) : (
                              <span className="no-organs-text">Not specified</span>
                            )}
                          </div>
                        </td>
                        <td className="hospital-cell">
                          <div className="hospital-compact">
                            <strong>{donor.hospital_name || 'Not specified'}</strong>
                            {donor.hospital_location && (
                              <small>{donor.hospital_location}</small>
                            )}
                          </div>
                        </td>
                        <td className="date-cell">
                          <span className="death-date">
                            {new Date(donor.date_of_death).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </td>
                        <td className="status-cell">
                          <span className={`status-badge ${donor.donor_status?.toLowerCase().replace('_', '-')}`}>
                            {donor.donor_status?.replace('_', ' ') || 'Unknown'}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="6" className="no-data-row">
                          <div className="no-data-content">
                            <div className="no-data-icon"><FaHeart /></div>
                            <h4>No Deceased Donors Found</h4>
                            <p>No donors match your search criteria or no donors are registered.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'recipients' && (
        <div className="staff-section">
          <div className="section-header">
            <h3><FaHospital /> Recipients Management</h3>
            <div className="search-controls">
              <input
                type="text"
                placeholder="Search recipients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    fetchRecipients();
                  }
                }}
              />
              <button onClick={fetchRecipients} className="search-btn"><FaSearch /></button>
            </div>
          </div>
          
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading recipients...</p>
            </div>
          ) : (
            <div className="professional-table-container">
              <div className="table-wrapper">
                <table className="professional-table">
                  <thead>
                    <tr>
                      <th>Patient Information</th>
                      <th>Medical Details</th>
                      <th>Organ Required</th>
                      <th>Urgency Level</th>
                      <th>Hospital</th>
                      <th>Contact</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recipients.length > 0 ? recipients.map((recipient) => (
                      <tr key={recipient.id} className="table-row">
                        <td className="patient-info-cell">
                          <div className="patient-primary">
                            <strong className="patient-name">{recipient.full_name}</strong>
                            <span className="patient-email">{recipient.email}</span>
                          </div>
                        </td>
                        <td className="medical-details-cell">
                          <div className="medical-info">
                            <span className="age-info">Age: {recipient.age}</span>
                            <span className={`blood-group-badge ${recipient.blood_group}`}>
                              {recipient.blood_group}
                            </span>
                            {recipient.medical_condition && (
                              <small className="condition-text">
                                {recipient.medical_condition.length > 40 
                                  ? recipient.medical_condition.substring(0, 40) + '...'
                                  : recipient.medical_condition
                                }
                              </small>
                            )}
                          </div>
                        </td>
                        <td className="organ-required-cell">
                          <span className="organ-badge required-organ">
                            {recipient.required_organ}
                          </span>
                        </td>
                        <td className="urgency-cell">
                          <span className={`priority-badge ${recipient.urgency_level?.toLowerCase()}`}>
                            {recipient.urgency_level}
                          </span>
                        </td>
                        <td className="hospital-cell">
                          <div className="hospital-compact">
                            <strong>{recipient.hospital_name || 'Not specified'}</strong>
                            {recipient.hospital_location && (
                              <small>{recipient.hospital_location}</small>
                            )}
                          </div>
                        </td>
                        <td className="contact-cell">
                          <span className="contact-number">{recipient.contact_number}</span>
                        </td>
                        <td className="status-cell">
                          <span className={`status-badge ${recipient.status?.toLowerCase().replace('_', '-')}`}>
                            {recipient.status?.replace('_', ' ') || 'Active'}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="7" className="no-data-row">
                          <div className="no-data-content">
                            <div className="no-data-icon"><FaHospital /></div>
                            <h4>No Recipients Found</h4>
                            <p>No recipients match your search criteria or no recipients are registered.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {showRegisterForm && renderRegisterForm(showRegisterForm)}
    </div>
  );
};

export default AdminDashboard;