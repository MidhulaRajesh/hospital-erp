const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const DeceasedDonor = sequelize.define('DeceasedDonor', {
  full_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  age_at_death: {
    type: DataTypes.INTEGER
  },
  gender: {
    type: DataTypes.ENUM('Male', 'Female', 'Other'),
    allowNull: false
  },
  date_of_death: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  time_of_death: {
    type: DataTypes.TIME
  },
  cause_of_death: {
    type: DataTypes.STRING(255)
  },
  address: {
    type: DataTypes.TEXT
  },
  blood_group: {
    type: DataTypes.STRING(5),
    allowNull: false
  },
  organs_eligible: {
    type: DataTypes.STRING(255)
  },
  medical_reports_path: {
    type: DataTypes.STRING(255)
  },
  hospital_name: {
    type: DataTypes.STRING(100)
  },
  hospital_location: {
    type: DataTypes.STRING(100)
  },
  national_id: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  death_certificate_path: {
    type: DataTypes.STRING(255)
  },
  brain_death_form_path: {
    type: DataTypes.STRING(255)
  },
  family_consent_form_path: {
    type: DataTypes.STRING(255)
  },
  next_of_kin_name: {
    type: DataTypes.STRING(100)
  },
  next_of_kin_relation: {
    type: DataTypes.STRING(50)
  },
  next_of_kin_contact: {
    type: DataTypes.STRING(20)
  },
  // Enhanced fields for better organ matching
  height_cm: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Height in centimeters - important for organ size matching'
  },
  weight_kg: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Weight in kilograms - important for organ size matching'
  },
  bmi: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
    comment: 'Body Mass Index - calculated from height and weight'
  },
  medical_history: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Previous medical conditions that might affect organ viability'
  },
  medications_current: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Current medications at time of death'
  },
  smoking_history: {
    type: DataTypes.ENUM('Never', 'Former', 'Current'),
    allowNull: true,
    defaultValue: 'Never',
    comment: 'Smoking status - affects organ quality'
  },
  alcohol_history: {
    type: DataTypes.ENUM('None', 'Occasional', 'Regular', 'Heavy'),
    allowNull: true,
    defaultValue: 'None',
    comment: 'Alcohol consumption - affects liver and other organs'
  },
  infection_status: {
    type: DataTypes.ENUM('Tested_Negative', 'Pending_Tests', 'Has_Infection'),
    allowNull: true,
    defaultValue: 'Pending_Tests',
    comment: 'Infection screening status (HIV, Hepatitis, etc.)'
  },
  organ_procurement_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Time when organs were procured - critical for viability'
  },
  donor_coordinates_lat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
    comment: 'Latitude for precise distance calculations'
  },
  donor_coordinates_lng: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
    comment: 'Longitude for precise distance calculations'
  },
  organ_quality_assessment: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'JSON object storing quality assessment for each organ'
  },
  hla_typing: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'HLA typing information for tissue compatibility'
  },
  crossmatch_required: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: true,
    comment: 'Whether crossmatch testing is required'
  },
  donor_authorization_number: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Official authorization number for organ donation'
  },
  procurement_hospital_contact: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Direct contact number for organ procurement team'
  },
  organ_preservation_method: {
    type: DataTypes.ENUM('Cold_Storage', 'Machine_Perfusion', 'Normothermic_Perfusion'),
    allowNull: true,
    defaultValue: 'Cold_Storage',
    comment: 'Method used to preserve organs'
  },
  estimated_organ_viability: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Estimated viability hours for each organ type'
  },
  donor_status: {
    type: DataTypes.ENUM('Pending_Assessment', 'Approved', 'Organs_Allocated', 'Completed'),
    allowNull: true,
    defaultValue: 'Pending_Assessment',
    comment: 'Current status of the donor in the allocation process'
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['blood_group']
    },
    {
      fields: ['hospital_location']
    },
    {
      fields: ['donor_status']
    },
    {
      fields: ['date_of_death']
    },
    {
      fields: ['organs_eligible']
    }
  ]
});

module.exports = DeceasedDonor;
