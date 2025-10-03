const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Doctor = sequelize.define('Doctor', {
  full_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  password: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  specialization: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  license_number: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  department: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  qualifications: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: 'e.g., MBBS, MD, MS, etc.'
  },
  experience_years: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  consultation_fee: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 500
  },
  profile_image: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'URL or path to doctor profile image'
  },
  availability_schedule: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'JSON object containing weekly schedule'
  },
  consultation_types: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: '["consultation", "video"]',
    comment: 'Types of consultations offered'
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Doctor biography/description'
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Doctor;