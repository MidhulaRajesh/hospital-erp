const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Patient = require('./Patient');
const Doctor = require('./Doctor');

const Prescription = sequelize.define('Prescription', {
  patient_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Patient,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  doctor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Doctor, // Now using Doctor model
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  medicines: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'JSON string containing medicine details'
  },
  instructions: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Additional instructions for the patient'
  },
  diagnosis: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Diagnosis details'
  },
  prescribed_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.ENUM('Active', 'Completed', 'Cancelled'),
    allowNull: false,
    defaultValue: 'Active'
  },
  dispensed_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date when prescription was dispensed by pharmacist'
  },
  pharmacist_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID of pharmacist who dispensed the prescription'
  },
  dispensing_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notes added by pharmacist during dispensing'
  },
  dispensed_medicines: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON string of actually dispensed medicines (may differ from prescribed)'
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Associations
Prescription.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });
Prescription.belongsTo(Doctor, { foreignKey: 'doctor_id', as: 'doctor' });

Patient.hasMany(Prescription, { foreignKey: 'patient_id', as: 'prescriptions' });
Doctor.hasMany(Prescription, { foreignKey: 'doctor_id', as: 'prescriptions' });

module.exports = Prescription;