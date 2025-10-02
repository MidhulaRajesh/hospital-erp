const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Patient = sequelize.define('Patient', {
  full_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  dob: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  gender: {
    type: DataTypes.ENUM('Male', 'Female', 'Other'),
    allowNull: false
  },
  contact_number: {
    type: DataTypes.STRING(20)
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  password: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  address: {
    type: DataTypes.TEXT
  },
  blood_group: {
    type: DataTypes.STRING(5)
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      unique: true,
      fields: ['email']
    }
  ]
});

module.exports = Patient;
