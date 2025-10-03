import React, { useState, useEffect } from "react";
import { FaUser, FaHeart, FaHospital, FaClipboardList, FaSearch, FaChartBar, FaArrowLeft, FaArrowRight, FaTimes, FaRegEdit, FaFileMedical, FaCheckCircle, FaSyncAlt } from 'react-icons/fa';
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./DeceasedEnhanced.css";

const DeceasedDonorEnhanced = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    // Basic Information
    full_name: "",
    age_at_death: "",
    gender: "",
    date_of_death: "",
    time_of_death: "",
    cause_of_death: "",
    address: "",
    national_id: "",
    
    // Medical Information
    blood_group: "",
    height_cm: "",
    weight_kg: "",
    medical_history: "",
    medications_current: "",
    smoking_history: "Never",
    alcohol_history: "None",
    infection_status: "Pending_Tests",
    hla_typing: "",
    
    // Organ Information
    organs_eligible: [],
    organ_procurement_time: "",
    organ_preservation_method: "Cold_Storage",
    crossmatch_required: true,
    
    // Hospital Information
    hospital_name: "",
    hospital_location: "",
    procurement_hospital_contact: "",
    donor_coordinates_lat: "",
    donor_coordinates_lng: "",
    
    // Family/Legal Information
    next_of_kin_name: "",
    next_of_kin_relation: "",
    next_of_kin_contact: "",
    donor_authorization_number: ""
  });

  const [files, setFiles] = useState({
    medical_reports: null,
    death_certificate: null,
    brain_death_form: null,
    family_consent_form: null
  });

  const [errors, setErrors] = useState({});
  const [bmi, setBmi] = useState("");

  // Calculate BMI when height or weight changes
  useEffect(() => {
    if (formData.height_cm && formData.weight_kg) {
      const heightInM = formData.height_cm / 100;
      const calculatedBmi = (formData.weight_kg / (heightInM * heightInM)).toFixed(1);
      setBmi(calculatedBmi);
      setFormData(prev => ({ ...prev, bmi: calculatedBmi }));
    }
  }, [formData.height_cm, formData.weight_kg]);

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const organOptions = [
    'Heart', 'Liver', 'Kidney', 'Lungs', 'Pancreas', 
    'Corneas', 'Skin', 'Bone', 'Small_Intestine', 'Heart_Valves'
  ];
  
  const smokingOptions = ['Never', 'Former', 'Current'];
  const alcoholOptions = ['None', 'Occasional', 'Regular', 'Heavy'];
  const infectionStatusOptions = ['Tested_Negative', 'Pending_Tests', 'Has_Infection'];
  const preservationMethods = ['Cold_Storage', 'Machine_Perfusion', 'Normothermic_Perfusion'];
  const relationOptions = [
    'Spouse', 'Parent', 'Child', 'Sibling', 'Grandparent', 
    'Grandchild', 'Uncle/Aunt', 'Cousin', 'Friend', 'Other'
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear field-specific errors
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleOrganChange = (organ) => {
    const updatedOrgans = formData.organs_eligible.includes(organ)
      ? formData.organs_eligible.filter(o => o !== organ)
      : [...formData.organs_eligible, organ];
    
    setFormData(prev => ({ ...prev, organs_eligible: updatedOrgans }));
    
    if (errors.organs_eligible) {
      setErrors(prev => ({ ...prev, organs_eligible: '' }));
    }
  };

  const handleFileChange = (e) => {
    const { name } = e.target;
    const file = e.target.files[0];
    setFiles(prev => ({ ...prev, [name]: file }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (!formData.full_name.trim()) newErrors.full_name = "Full name is required";
      if (!formData.age_at_death) newErrors.age_at_death = "Age at death is required";
      if (!formData.gender) newErrors.gender = "Gender is required";
      if (!formData.date_of_death) newErrors.date_of_death = "Date of death is required";
      if (!formData.time_of_death) newErrors.time_of_death = "Time of death is required";
      if (!formData.cause_of_death.trim()) newErrors.cause_of_death = "Cause of death is required";
      if (!formData.national_id.trim()) newErrors.national_id = "National ID is required";
    } else if (step === 2) {
      if (!formData.blood_group) newErrors.blood_group = "Blood group is required";
      if (!formData.height_cm) newErrors.height_cm = "Height is required for organ size matching";
      if (!formData.weight_kg) newErrors.weight_kg = "Weight is required for organ size matching";
      if (formData.organs_eligible.length === 0) newErrors.organs_eligible = "At least one organ must be selected";
    } else if (step === 3) {
      if (!formData.hospital_name.trim()) newErrors.hospital_name = "Hospital name is required";
      if (!formData.hospital_location.trim()) newErrors.hospital_location = "Hospital location is required";
      if (!formData.next_of_kin_name.trim()) newErrors.next_of_kin_name = "Next of kin name is required";
      if (!formData.next_of_kin_contact.trim()) newErrors.next_of_kin_contact = "Next of kin contact is required";
    } else if (step === 4) {
      if (!files.death_certificate) newErrors.death_certificate = "Death certificate is required";
      if (!files.brain_death_form) newErrors.brain_death_form = "Brain death form is required";
      if (!files.family_consent_form) newErrors.family_consent_form = "Family consent form is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(4)) return;
    
    setLoading(true);

    const data = new FormData();
    
    // Add form data
    Object.keys(formData).forEach((key) => {
      if (key === 'organs_eligible') {
        data.append(key, formData[key].join(', '));
      } else {
        data.append(key, formData[key]);
      }
    });
    
    // Add files
    Object.keys(files).forEach((key) => {
      if (files[key]) data.append(key, files[key]);
    });

    try {
      const res = await axios.post("http://localhost:5000/api/deceased-donor", data, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      setLoading(false);
      
      if (res.data && res.data.success) {
  alert("Enhanced Deceased Donor Registration Successful! Redirecting to organ matching...");
        
        if (res.data.donor && res.data.donor.id) {
          navigate(`/organ-matching?donorId=${res.data.donor.id}&autoMatch=true`);
        } else {
          navigate('/organ-matching');
        }
      } else {
        alert("Registration completed, but there was an issue with the response.");
        navigate('/organ-matching');
      }
    } catch (err) {
      setLoading(false);
      console.error(err);
      
      if (err.response && err.response.data && err.response.data.error) {
        alert("Error registering donor: " + err.response.data.error);
      } else {
        alert("Network error. Please check if the server is running and try again.");
      }
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <h3><FaUser /> Basic Information & Legal Details</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className={errors.full_name ? 'error' : ''}
                  placeholder="Enter full name"
                />
                {errors.full_name && <span className="error-text">{errors.full_name}</span>}
              </div>

              <div className="form-group">
                <label>Age at Death *</label>
                <input
                  type="number"
                  name="age_at_death"
                  value={formData.age_at_death}
                  onChange={handleChange}
                  className={errors.age_at_death ? 'error' : ''}
                  min="0"
                  max="120"
                  placeholder="Age"
                />
                {errors.age_at_death && <span className="error-text">{errors.age_at_death}</span>}
              </div>

              <div className="form-group">
                <label>Gender *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={errors.gender ? 'error' : ''}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && <span className="error-text">{errors.gender}</span>}
              </div>

              <div className="form-group">
                <label>Date of Death *</label>
                <input
                  type="date"
                  name="date_of_death"
                  value={formData.date_of_death}
                  onChange={handleChange}
                  className={errors.date_of_death ? 'error' : ''}
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.date_of_death && <span className="error-text">{errors.date_of_death}</span>}
              </div>

              <div className="form-group">
                <label>Time of Death *</label>
                <input
                  type="time"
                  name="time_of_death"
                  value={formData.time_of_death}
                  onChange={handleChange}
                  className={errors.time_of_death ? 'error' : ''}
                />
                {errors.time_of_death && <span className="error-text">{errors.time_of_death}</span>}
              </div>

              <div className="form-group">
                <label>National ID *</label>
                <input
                  type="text"
                  name="national_id"
                  value={formData.national_id}
                  onChange={handleChange}
                  className={errors.national_id ? 'error' : ''}
                  placeholder="National identification number"
                />
                {errors.national_id && <span className="error-text">{errors.national_id}</span>}
              </div>

              <div className="form-group full-width">
                <label>Cause of Death *</label>
                <input
                  type="text"
                  name="cause_of_death"
                  value={formData.cause_of_death}
                  onChange={handleChange}
                  className={errors.cause_of_death ? 'error' : ''}
                  placeholder="e.g., Brain hemorrhage, Car accident, etc."
                />
                {errors.cause_of_death && <span className="error-text">{errors.cause_of_death}</span>}
              </div>

              <div className="form-group full-width">
                <label>Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Full address"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <h3><FaHeart /> Medical Information & Organ Details</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Blood Group *</label>
                <select
                  name="blood_group"
                  value={formData.blood_group}
                  onChange={handleChange}
                  className={errors.blood_group ? 'error' : ''}
                >
                  <option value="">Select Blood Group</option>
                  {bloodGroups.map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
                {errors.blood_group && <span className="error-text">{errors.blood_group}</span>}
              </div>

              <div className="form-group">
                <label>Height (cm) *</label>
                <input
                  type="number"
                  name="height_cm"
                  value={formData.height_cm}
                  onChange={handleChange}
                  className={errors.height_cm ? 'error' : ''}
                  min="50"
                  max="250"
                  placeholder="Height in centimeters"
                />
                {errors.height_cm && <span className="error-text">{errors.height_cm}</span>}
              </div>

              <div className="form-group">
                <label>Weight (kg) *</label>
                <input
                  type="number"
                  name="weight_kg"
                  value={formData.weight_kg}
                  onChange={handleChange}
                  className={errors.weight_kg ? 'error' : ''}
                  min="1"
                  max="300"
                  step="0.1"
                  placeholder="Weight in kilograms"
                />
                {errors.weight_kg && <span className="error-text">{errors.weight_kg}</span>}
              </div>

              {bmi && (
                <div className="form-group">
                  <label>BMI (calculated)</label>
                  <input
                    type="text"
                    value={`${bmi} kg/m²`}
                    disabled
                    className="calculated-field"
                  />
                </div>
              )}

              <div className="form-group">
                <label>Smoking History</label>
                <select
                  name="smoking_history"
                  value={formData.smoking_history}
                  onChange={handleChange}
                >
                  {smokingOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Alcohol History</label>
                <select
                  name="alcohol_history"
                  value={formData.alcohol_history}
                  onChange={handleChange}
                >
                  {alcoholOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Infection Screening Status</label>
                <select
                  name="infection_status"
                  value={formData.infection_status}
                  onChange={handleChange}
                >
                  {infectionStatusOptions.map(option => (
                    <option key={option} value={option}>{option.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Organ Preservation Method</label>
                <select
                  name="organ_preservation_method"
                  value={formData.organ_preservation_method}
                  onChange={handleChange}
                >
                  {preservationMethods.map(method => (
                    <option key={method} value={method}>{method.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              <div className="form-group full-width">
                <label>Medical History</label>
                <textarea
                  name="medical_history"
                  value={formData.medical_history}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Previous medical conditions, surgeries, allergies, etc."
                />
              </div>

              <div className="form-group full-width">
                <label>Current Medications</label>
                <textarea
                  name="medications_current"
                  value={formData.medications_current}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Medications taken at time of death"
                />
              </div>

              <div className="form-group full-width">
                <label>HLA Typing Information</label>
                <input
                  type="text"
                  name="hla_typing"
                  value={formData.hla_typing}
                  onChange={handleChange}
                  placeholder="HLA typing results (if available)"
                />
              </div>

              <div className="form-group full-width">
                <label>Organs Eligible for Donation * <span className="organs-count">({formData.organs_eligible.length} selected)</span></label>
                <div className="organs-grid">
                  {organOptions.map(organ => (
                    <div key={organ} className="organ-checkbox">
                      <input
                        type="checkbox"
                        id={organ}
                        checked={formData.organs_eligible.includes(organ)}
                        onChange={() => handleOrganChange(organ)}
                      />
                      <label htmlFor={organ} className="organ-label">
                        <span className="organ-icon"><FaHeart /></span>
                        {organ}
                      </label>
                    </div>
                  ))}
                </div>
                {errors.organs_eligible && <span className="error-text">{errors.organs_eligible}</span>}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="step-content">
            <h3><FaHospital /> Hospital & Contact Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Hospital Name *</label>
                <input
                  type="text"
                  name="hospital_name"
                  value={formData.hospital_name}
                  onChange={handleChange}
                  className={errors.hospital_name ? 'error' : ''}
                  placeholder="Name of the hospital"
                />
                {errors.hospital_name && <span className="error-text">{errors.hospital_name}</span>}
              </div>

              <div className="form-group">
                <label>Hospital Location *</label>
                <input
                  type="text"
                  name="hospital_location"
                  value={formData.hospital_location}
                  onChange={handleChange}
                  className={errors.hospital_location ? 'error' : ''}
                  placeholder="City, State"
                />
                {errors.hospital_location && <span className="error-text">{errors.hospital_location}</span>}
              </div>

              <div className="form-group">
                <label>Procurement Team Contact</label>
                <input
                  type="tel"
                  name="procurement_hospital_contact"
                  value={formData.procurement_hospital_contact}
                  onChange={handleChange}
                  placeholder="Direct contact for organ procurement team"
                />
              </div>

              <div className="form-group">
                <label>Donor Authorization Number</label>
                <input
                  type="text"
                  name="donor_authorization_number"
                  value={formData.donor_authorization_number}
                  onChange={handleChange}
                  placeholder="Official authorization number"
                />
              </div>

              <div className="form-group">
                <label>Organ Procurement Time</label>
                <input
                  type="datetime-local"
                  name="organ_procurement_time"
                  value={formData.organ_procurement_time}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Crossmatch Required</label>
                <select
                  name="crossmatch_required"
                  value={formData.crossmatch_required}
                  onChange={handleChange}
                >
                  <option value={true}>Yes</option>
                  <option value={false}>No</option>
                </select>
              </div>

              <div className="form-group">
                <label>Next of Kin Name *</label>
                <input
                  type="text"
                  name="next_of_kin_name"
                  value={formData.next_of_kin_name}
                  onChange={handleChange}
                  className={errors.next_of_kin_name ? 'error' : ''}
                  placeholder="Full name of next of kin"
                />
                {errors.next_of_kin_name && <span className="error-text">{errors.next_of_kin_name}</span>}
              </div>

              <div className="form-group">
                <label>Relationship</label>
                <select
                  name="next_of_kin_relation"
                  value={formData.next_of_kin_relation}
                  onChange={handleChange}
                >
                  <option value="">Select Relationship</option>
                  {relationOptions.map(relation => (
                    <option key={relation} value={relation}>{relation}</option>
                  ))}
                </select>
              </div>

              <div className="form-group full-width">
                <label>Next of Kin Contact *</label>
                <input
                  type="tel"
                  name="next_of_kin_contact"
                  value={formData.next_of_kin_contact}
                  onChange={handleChange}
                  className={errors.next_of_kin_contact ? 'error' : ''}
                  placeholder="Phone number"
                />
                {errors.next_of_kin_contact && <span className="error-text">{errors.next_of_kin_contact}</span>}
              </div>

              <div className="form-group">
                <label>Hospital Latitude (Optional)</label>
                <input
                  type="number"
                  name="donor_coordinates_lat"
                  value={formData.donor_coordinates_lat}
                  onChange={handleChange}
                  step="0.000001"
                  placeholder="Latitude for precise distance calculation"
                />
              </div>

              <div className="form-group">
                <label>Hospital Longitude (Optional)</label>
                <input
                  type="number"
                  name="donor_coordinates_lng"
                  value={formData.donor_coordinates_lng}
                  onChange={handleChange}
                  step="0.000001"
                  placeholder="Longitude for precise distance calculation"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="step-content">
            <h3><FaClipboardList /> Required Documents</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Medical Reports</label>
                <input
                  type="file"
                  name="medical_reports"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.png"
                  className="file-input"
                />
                <small>Medical reports, lab results, and test results</small>
              </div>

              <div className="form-group">
                <label>Death Certificate *</label>
                <input
                  type="file"
                  name="death_certificate"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.png"
                  className={`file-input ${errors.death_certificate ? 'error' : ''}`}
                />
                <small>Required - Official death certificate</small>
                {errors.death_certificate && <span className="error-text">{errors.death_certificate}</span>}
              </div>

              <div className="form-group">
                <label>Brain Death Form *</label>
                <input
                  type="file"
                  name="brain_death_form"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.png"
                  className={`file-input ${errors.brain_death_form ? 'error' : ''}`}
                />
                <small>Required - Brain death declaration form</small>
                {errors.brain_death_form && <span className="error-text">{errors.brain_death_form}</span>}
              </div>

              <div className="form-group">
                <label>Family Consent Form *</label>
                <input
                  type="file"
                  name="family_consent_form"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.png"
                  className={`file-input ${errors.family_consent_form ? 'error' : ''}`}
                />
                <small>Required - Signed family consent for organ donation</small>
                {errors.family_consent_form && <span className="error-text">{errors.family_consent_form}</span>}
              </div>
            </div>

            <div className="enhanced-summary">
              <h4><FaSearch /> Enhanced Matching Summary</h4>
              <div className="summary-grid">
                <div className="summary-item">
                  <strong>Physical Profile:</strong>
                  <span>{formData.height_cm ? `${formData.height_cm} cm` : 'Not specified'} / {formData.weight_kg ? `${formData.weight_kg} kg` : 'Not specified'} {bmi && `(BMI: ${bmi})`}</span>
                </div>
                <div className="summary-item">
                  <strong>Blood Group:</strong>
                  <span>{formData.blood_group || 'Not specified'}</span>
                </div>
                <div className="summary-item">
                  <strong>Eligible Organs:</strong>
                  <span>{formData.organs_eligible.length > 0 ? formData.organs_eligible.join(', ') : 'None selected'}</span>
                </div>
                <div className="summary-item">
                  <strong>Lifestyle Factors:</strong>
                  <span>Smoking: {formData.smoking_history}, Alcohol: {formData.alcohol_history}</span>
                </div>
                <div className="summary-item">
                  <strong>Infection Status:</strong>
                  <span>{formData.infection_status.replace('_', ' ')}</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="deceased-donor-container">
      <div className="registration-header">
  <h1><FaHeart /> Enhanced Deceased Donor Registration</h1>
        <p>Comprehensive organ donation registration for optimal matching</p>
        
        <div className="progress-bar">
          <div className="progress-steps">
            {[1, 2, 3, 4].map(step => (
              <div 
                key={step} 
                className={`progress-step ${currentStep >= step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}
              >
                <div className="step-number">{step}</div>
                <div className="step-label">
                  {step === 1 && 'Basic & Legal'}
                  {step === 2 && 'Medical & Organs'}
                  {step === 3 && 'Hospital & Contact'}
                  {step === 4 && 'Documents'}
                </div>
              </div>
            ))}
          </div>
          <div 
            className="progress-fill" 
            style={{ width: `${(currentStep - 1) * 33.33}%` }}
          ></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="registration-form">
        {renderStep()}

        <div className="form-actions">
          {currentStep > 1 && (
            <button type="button" onClick={prevStep} className="prev-btn">
              <FaArrowLeft /> Previous
            </button>
          )}
          
          <div className="action-buttons">
            <button 
              type="button" 
              onClick={() => navigate('/')} 
              className="cancel-btn"
            >
              <FaTimes /> Cancel
            </button>
            
            {currentStep < 4 ? (
              <button type="button" onClick={nextStep} className="next-btn">
                Next <FaArrowRight />
              </button>
            ) : (
              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? <><FaSyncAlt /> Processing...</> : <><FaHeart /> Complete Registration & Find Matches</>}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default DeceasedDonorEnhanced;