const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Patient = require('./Patient');
const Doctor = require('./Doctor');

const Appointment = sequelize.define('Appointment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  patient_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Patient,
      key: 'id'
    }
  },
  doctor_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  doctor_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  doctor_specialty: {
    type: DataTypes.STRING,
    allowNull: false
  },
  doctor_hospital: {
    type: DataTypes.STRING,
    allowNull: false
  },
  appointment_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  appointment_time: {
    type: DataTypes.STRING,
    allowNull: false
  },
  appointment_type: {
    type: DataTypes.ENUM('consultation', 'video'),
    defaultValue: 'consultation'
  },
  consultation_fee: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'completed', 'cancelled', 'no-show'),
    defaultValue: 'scheduled'
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'paid', 'refunded'),
    defaultValue: 'pending'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

// Define associations
Appointment.belongsTo(Patient, { 
  foreignKey: 'patient_id',
  as: 'patient'
});

Patient.hasMany(Appointment, { 
  foreignKey: 'patient_id',
  as: 'appointments'
});

module.exports = Appointment;