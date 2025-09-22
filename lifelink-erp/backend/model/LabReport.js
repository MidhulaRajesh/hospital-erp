const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Patient = require('./Patient');

const LabReport = sequelize.define('LabReport', {
  report_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'unknown', // prevents null issue
  },
  report_path: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'no-file', // avoids null issue
  },
  test_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW, // sets current timestamp
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true, // optional field
  },
  patientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Patient, // links to Patient table
      key: 'id'
    },
    onDelete: 'CASCADE' // delete lab reports if patient is deleted
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

// Association: Each LabReport belongs to a Patient
LabReport.belongsTo(Patient, { foreignKey: 'patientId' });
Patient.hasMany(LabReport, { foreignKey: 'patientId' });

module.exports = LabReport;
