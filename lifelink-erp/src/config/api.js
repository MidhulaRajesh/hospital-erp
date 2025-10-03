// API Configuration
export const API_BASE_URL = 'http://localhost:5000';

// API Endpoints
export const API_ENDPOINTS = {
  // Patient endpoints
  PATIENT_LOGIN: '/api/patients/login',
  PATIENT_REGISTER: '/api/patients/register',
  
  // Doctor endpoints
  DOCTOR_LOGIN: '/api/doctors/login',
  DOCTOR_REGISTER: '/api/doctors/register',
  
  // Lab Technician endpoints
  LAB_TECH_LOGIN: '/api/lab-technician/login',
  LAB_TECH_REGISTER: '/api/lab-technician/register',
  
  // Recipient endpoints
  RECIPIENT_REGISTER: '/api/recipient/register',
  RECIPIENT_LIST: '/api/recipient',
  
  // Deceased Donor endpoints
  DECEASED_DONOR_REGISTER: '/api/deceased-donor',
  DECEASED_DONOR_GET: '/api/deceased-donor',
  
  // Organ Transplant endpoints
  ORGAN_TRANSPLANT_FIND_MATCHES: '/api/organ-transplant/find-matches',
  ORGAN_TRANSPLANT_CREATE: '/api/organ-transplant/create-transplant',
  ORGAN_TRANSPLANT_UPDATE_STATUS: '/api/organ-transplant/update-status',
  ORGAN_TRANSPLANT_LIST: '/api/organ-transplant/transplants',
  ORGAN_TRANSPLANT_AVAILABLE_ORGANS: '/api/organ-transplant/available-organs',
};

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};