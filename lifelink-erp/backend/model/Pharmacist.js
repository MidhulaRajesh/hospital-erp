const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Pharmacist = sequelize.define('Pharmacist', {
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
  license_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Pharmacist license number'
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  qualification: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Pharmacist degree/qualification'
  },
  experience_years: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  specialization: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Clinical pharmacy, retail pharmacy, etc.'
  },
  registration_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive', 'Suspended'),
    defaultValue: 'Active'
  },
  shift_timings: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Working hours like 9AM-6PM'
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['email']
    },
    {
      fields: ['license_number']
    }
  ]
});

module.exports = Pharmacist;