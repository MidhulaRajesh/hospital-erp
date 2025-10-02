const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Admin = sequelize.define('Admin', {
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
  admin_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Unique admin identification number'
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('Super Admin', 'System Admin', 'HR Admin', 'Medical Admin', 'Finance Admin', 'Data Admin', 'Security Admin'),
    defaultValue: 'System Admin',
    allowNull: false
  },
  department: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'Administration'
  },
  permissions: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      // Staff Management
      manage_doctors: true,
      manage_lab_techs: true,
      manage_pharmacists: true,
      manage_admins: false,
      
      // Patient Management
      view_patients: true,
      manage_patients: true,
      view_medical_records: true,
      
      // Hospital Operations
      manage_prescriptions: true,
      manage_lab_reports: true,
      manage_organ_transplants: true,
      
      // Financial & Billing
      view_billing: false,
      manage_billing: false,
      financial_reports: false,
      
      // System Administration
      system_settings: false,
      backup_restore: false,
      audit_logs: true,
      user_management: true,
      
      // Reporting & Analytics
      view_reports: true,
      advanced_analytics: false,
      export_data: true,
      
      // Emergency & Security
      emergency_access: false,
      security_settings: false
    }
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive', 'Suspended'),
    defaultValue: 'Active'
  },
  created_by: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Admin ID of who created this admin'
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
      fields: ['admin_id']
    },
    {
      fields: ['status']
    }
  ]
});

module.exports = Admin;