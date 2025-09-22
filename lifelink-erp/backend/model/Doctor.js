const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Doctor = sequelize.define('Doctor', {
  full_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  specialization: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  license_number: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  department: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Doctor;