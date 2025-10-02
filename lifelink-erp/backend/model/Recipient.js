const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Recipient = sequelize.define('Recipient', {
  full_name: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  dob: { 
    type: DataTypes.DATE, 
    allowNull: false 
  },
  age: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  },
  gender: { 
    type: DataTypes.ENUM('Male', 'Female', 'Other'), 
    allowNull: false 
  },
  contact_number: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  email: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  address: { 
    type: DataTypes.TEXT, 
    allowNull: false 
  },
  blood_group: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  required_organ: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  medical_condition: { 
    type: DataTypes.TEXT 
  },
  urgency_level: { 
    type: DataTypes.ENUM('High', 'Medium', 'Low'), 
    defaultValue: 'Medium' 
  },
  last_checkup_date: { 
    type: DataTypes.DATE 
  },
  hospital_name: { 
    type: DataTypes.STRING 
  },
  hospital_location: { 
    type: DataTypes.STRING 
  },
  id_proof_path: { 
    type: DataTypes.STRING 
  },
  medical_reports_path: { 
    type: DataTypes.STRING 
  },
  emergency_contact_name: { 
    type: DataTypes.STRING 
  },
  emergency_contact_relation: { 
    type: DataTypes.STRING 
  },
  emergency_contact_number: { 
    type: DataTypes.STRING 
  },
  password: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  status: {
    type: DataTypes.ENUM('Active', 'Transplant_Completed', 'Inactive', 'Expired'),
    defaultValue: 'Active'
  },
  transplant_completion_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completion_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Recipient;

