const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Admin = require('../model/Admin');
const Doctor = require('../model/Doctor');
const LabTechnician = require('../model/LabTechnician');
const Pharmacist = require('../model/Pharmacist');
const Patient = require('../model/Patient');
const Prescription = require('../model/Prescription');
const LabReport = require('../model/LabReport');
const DeceasedDonor = require('../model/DeceasedDonor');
const Recipient = require('../model/Recipient');
const OrganTransplant = require('../model/OrganTransplant');
const { Op } = require('sequelize');

// POST: Admin registration (super admin only)
router.post('/register', async (req, res) => {
  try {
    const {
      full_name,
      email,
      password,
      admin_id,
      phone,
      role,
      department,
      permissions,
      created_by
    } = req.body;

    // Validate required fields
    if (!full_name || !email || !password || !admin_id || !phone) {
      return res.status(400).json({
        error: 'Required fields: full_name, email, password, admin_id, phone'
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({
      where: {
        [Op.or]: [
          { email: email },
          { admin_id: admin_id }
        ]
      }
    });

    if (existingAdmin) {
      if (existingAdmin.email === email) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      if (existingAdmin.admin_id === admin_id) {
        return res.status(400).json({ error: 'Admin ID already exists' });
      }
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create admin
    const admin = await Admin.create({
      full_name,
      email,
      password: hashedPassword,
      admin_id,
      phone,
      role: role || 'System Admin',
      department: department || 'Administration',
      permissions: permissions || {
        manage_doctors: true,
        manage_lab_techs: true,
        manage_pharmacists: true,
        view_reports: true,
        system_settings: false
      },
      created_by
    });

    // Return admin data (excluding password)
    const { password: _, ...adminData } = admin.toJSON();
    
    res.status(201).json({
      message: 'Admin registered successfully',
      admin: adminData
    });

  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({
      error: 'Error registering admin',
      details: error.message
    });
  }
});

// POST: Admin login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Find admin by email
    const admin = await Admin.findOne({
      where: { email }
    });

    if (!admin) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Check if admin is active
    if (admin.status !== 'Active') {
      return res.status(403).json({
        error: 'Admin account is not active'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Update last login
    await admin.update({ last_login: new Date() });

    // Return admin data (excluding password)
    const { password: _, ...adminData } = admin.toJSON();
    
    res.status(200).json({
      message: 'Login successful',
      admin: adminData
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      error: 'Login failed',
      details: error.message
    });
  }
});

// GET: Get all staff (doctors, lab techs, pharmacists)
router.get('/staff', async (req, res) => {
  try {
    const { type } = req.query;

    let staffData = {};

    if (!type || type === 'doctors') {
      const doctors = await Doctor.findAll({
        attributes: { exclude: ['password'] },
        order: [['created_at', 'DESC']]
      });
      staffData.doctors = doctors;
    }

    if (!type || type === 'lab_technicians') {
      const labTechs = await LabTechnician.findAll({
        attributes: { exclude: ['password'] },
        order: [['created_at', 'DESC']]
      });
      staffData.lab_technicians = labTechs;
    }

    if (!type || type === 'pharmacists') {
      const pharmacists = await Pharmacist.findAll({
        attributes: { exclude: ['password'] },
        order: [['created_at', 'DESC']]
      });
      staffData.pharmacists = pharmacists;
    }

    res.status(200).json({
      success: true,
      staff: staffData
    });

  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({
      error: 'Error fetching staff data',
      details: error.message
    });
  }
});

// GET: Get staff statistics
router.get('/stats', async (req, res) => {
  try {
    const doctorCount = await Doctor.count();
    const labTechCount = await LabTechnician.count();
    const pharmacistCount = await Pharmacist.count();
    const adminCount = await Admin.count();

    const activeDoctors = await Doctor.count({ where: { status: 'Active' } });
    const activeLabTechs = await LabTechnician.count({ where: { status: 'Active' } });
    const activePharmacists = await Pharmacist.count({ where: { status: 'Active' } });

    res.status(200).json({
      success: true,
      stats: {
        total_staff: doctorCount + labTechCount + pharmacistCount,
        doctors: {
          total: doctorCount,
          active: activeDoctors
        },
        lab_technicians: {
          total: labTechCount,
          active: activeLabTechs
        },
        pharmacists: {
          total: pharmacistCount,
          active: activePharmacists
        },
        admins: {
          total: adminCount
        }
      }
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      error: 'Error fetching statistics',
      details: error.message
    });
  }
});

// GET: Test patients endpoint
router.get('/test-patients', async (req, res) => {
  try {
    console.log('Testing patient fetch...');
    const patientCount = await Patient.count();
    console.log('Patient count:', patientCount);
    
    const samplePatients = await Patient.findAll({ limit: 5 });
    console.log('Sample patients:', samplePatients.length);
    
    res.json({
      success: true,
      count: patientCount,
      sample: samplePatients
    });
  } catch (error) {
    console.error('Test error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET: Get all patients (admin only)
router.get('/patients', async (req, res) => {
  try {
    const { status, limit = 50, offset = 0, search } = req.query;
    
    let whereClause = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (search) {
      whereClause[Op.or] = [
        { full_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { contact_number: { [Op.like]: `%${search}%` } }
      ];
    }

    console.log('Admin patients query:', { whereClause, limit, offset });
    
    const patients = await Patient.findAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalPatients = await Patient.count({ where: whereClause });
    
    console.log('Patients found:', patients.length, 'Total:', totalPatients);

    res.status(200).json({
      success: true,
      patients,
      pagination: {
        total: totalPatients,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < totalPatients
      }
    });

  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching patients',
      details: error.message
    });
  }
});

// GET: Get all deceased donors (admin only)
router.get('/deceased-donors', async (req, res) => {
  try {
    const { status, limit = 50, offset = 0, search } = req.query;
    
    let whereClause = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (search) {
      whereClause[Op.or] = [
        { full_name: { [Op.like]: `%${search}%` } },
        { hospital_name: { [Op.like]: `%${search}%` } },
        { national_id: { [Op.like]: `%${search}%` } }
      ];
    }

    console.log('Admin deceased donors query:', { whereClause, limit, offset });
    
    const donors = await DeceasedDonor.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalDonors = await DeceasedDonor.count({ where: whereClause });
    
    console.log('Deceased donors found:', donors.length, 'Total:', totalDonors);

    res.status(200).json({
      success: true,
      donors,
      pagination: {
        total: totalDonors,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < totalDonors
      }
    });

  } catch (error) {
    console.error('Error fetching deceased donors:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching deceased donors',
      details: error.message
    });
  }
});

// GET: Get all recipients (admin only)
router.get('/recipients', async (req, res) => {
  try {
    const { status, limit = 50, offset = 0, search } = req.query;
    
    let whereClause = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (search) {
      whereClause[Op.or] = [
        { full_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { contact_number: { [Op.like]: `%${search}%` } }
      ];
    }

    console.log('Admin recipients query:', { whereClause, limit, offset });
    
    const recipients = await Recipient.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalRecipients = await Recipient.count({ where: whereClause });
    
    console.log('Recipients found:', recipients.length, 'Total:', totalRecipients);

    res.status(200).json({
      success: true,
      recipients,
      pagination: {
        total: totalRecipients,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < totalRecipients
      }
    });

  } catch (error) {
    console.error('Error fetching recipients:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching recipients',
      details: error.message
    });
  }
});

// GET: Get organ transplant records (admin only)
router.get('/organ-transplants', async (req, res) => {
  try {
    const { status, limit = 50, offset = 0, search } = req.query;
    
    let whereClause = {};
    
    if (status) {
      whereClause.transplant_status = status;
    }
    
    if (search) {
      whereClause[Op.or] = [
        { recipient_name: { [Op.like]: `%${search}%` } },
        { donor_name: { [Op.like]: `%${search}%` } },
        { organ_type: { [Op.like]: `%${search}%` } }
      ];
    }

    console.log('Admin organ transplants query:', { whereClause, limit, offset });
    
    const transplants = await OrganTransplant.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalTransplants = await OrganTransplant.count({ where: whereClause });
    
    console.log('Organ transplants found:', transplants.length, 'Total:', totalTransplants);

    res.status(200).json({
      success: true,
      transplants,
      pagination: {
        total: totalTransplants,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < totalTransplants
      }
    });

  } catch (error) {
    console.error('Error fetching organ transplants:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching organ transplants',
      details: error.message
    });
  }
});

// GET: Get comprehensive dashboard stats
router.get('/dashboard-stats', async (req, res) => {
  try {
    // Staff counts
    const doctorCount = await Doctor.count();
    const labTechCount = await LabTechnician.count();
    const pharmacistCount = await Pharmacist.count();
    const adminCount = await Admin.count();
    const patientCount = await Patient.count();

    // Organ transplant related counts
    const donorCount = await DeceasedDonor.count();
    const recipientCount = await Recipient.count();
    const transplantCount = await OrganTransplant.count();

    // Active staff counts
    const activeDoctors = await Doctor.count({ where: { status: 'Active' } });
    const activeLabTechs = await LabTechnician.count({ where: { status: 'Active' } });
    const activePharmacists = await Pharmacist.count({ where: { status: 'Active' } });

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentPatients = await Patient.count({
      where: { created_at: { [Op.gte]: thirtyDaysAgo } }
    });

    const recentPrescriptions = await Prescription.count({
      where: { created_at: { [Op.gte]: thirtyDaysAgo } }
    });

    const recentLabReports = await LabReport.count({
      where: { created_at: { [Op.gte]: thirtyDaysAgo } }
    });

    // Today's activity
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayPatients = await Patient.count({
      where: { 
        created_at: { 
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      }
    });

    res.status(200).json({
      success: true,
      stats: {
        // Overall counts
        total_users: patientCount + doctorCount + labTechCount + pharmacistCount + adminCount,
        total_patients: patientCount,
        total_staff: doctorCount + labTechCount + pharmacistCount,
        
        // Staff breakdown
        staff: {
          doctors: { total: doctorCount, active: activeDoctors },
          lab_technicians: { total: labTechCount, active: activeLabTechs },
          pharmacists: { total: pharmacistCount, active: activePharmacists },
          admins: { total: adminCount }
        },
        
        // Organ transplant statistics
        organ_transplants: {
          total_donors: donorCount,
          total_recipients: recipientCount,
          total_transplants: transplantCount
        },
        
        // Recent activity (30 days)
        recent_activity: {
          new_patients: recentPatients,
          new_prescriptions: recentPrescriptions,
          new_lab_reports: recentLabReports
        },
        
        // Today's activity
        today: {
          new_patients: todayPatients
        }
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      error: 'Error fetching dashboard statistics',
      details: error.message
    });
  }
});

// GET: System health and audit info
router.get('/system-info', async (req, res) => {
  try {
    const recentLogins = await Admin.findAll({
      attributes: ['full_name', 'email', 'role', 'last_login'],
      where: {
        last_login: { [Op.not]: null }
      },
      order: [['last_login', 'DESC']],
      limit: 10
    });

    const systemInfo = {
      server_status: 'Online',
      database_status: 'Connected',
      last_backup: null, // Would be implemented with actual backup system
      recent_admin_logins: recentLogins,
      system_version: '1.0.0'
    };

    res.status(200).json({
      success: true,
      system_info: systemInfo
    });

  } catch (error) {
    console.error('Error fetching system info:', error);
    res.status(500).json({
      error: 'Error fetching system information',
      details: error.message
    });
  }
});

// POST: Register doctor (admin only)
router.post('/register-doctor', async (req, res) => {
  try {
    const {
      full_name,
      email,
      password,
      doctor_id,
      phone,
      specialization,
      qualification,
      experience_years,
      department,
      shift_timing
    } = req.body;

    // Validate required fields
    if (!full_name || !email || !password || !doctor_id || !phone || !specialization) {
      return res.status(400).json({
        error: 'Required fields: full_name, email, password, doctor_id, phone, specialization'
      });
    }

    // Check if doctor already exists
    const existingDoctor = await Doctor.findOne({
      where: {
        [Op.or]: [
          { email: email },
          { doctor_id: doctor_id }
        ]
      }
    });

    if (existingDoctor) {
      return res.status(400).json({
        error: existingDoctor.email === email ? 'Email already registered' : 'Doctor ID already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create doctor
    const doctor = await Doctor.create({
      full_name,
      email,
      password: hashedPassword,
      doctor_id,
      phone,
      specialization,
      qualification,
      experience_years: experience_years || 0,
      department,
      shift_timing
    });

    const { password: _, ...doctorData } = doctor.toJSON();
    
    res.status(201).json({
      message: 'Doctor registered successfully',
      doctor: doctorData
    });

  } catch (error) {
    console.error('Doctor registration error:', error);
    res.status(500).json({
      error: 'Error registering doctor',
      details: error.message
    });
  }
});

// POST: Register lab technician (admin only)
router.post('/register-labtechnician', async (req, res) => {
  try {
    const {
      full_name,
      email,
      password,
      technician_id,
      phone,
      specialization,
      qualification,
      experience_years,
      shift_timing
    } = req.body;

    // Validate required fields
    if (!full_name || !email || !password || !technician_id || !phone) {
      return res.status(400).json({
        error: 'Required fields: full_name, email, password, technician_id, phone'
      });
    }

    // Check if lab tech already exists
    const existingLabTech = await LabTechnician.findOne({
      where: {
        [Op.or]: [
          { email: email },
          { technician_id: technician_id }
        ]
      }
    });

    if (existingLabTech) {
      return res.status(400).json({
        error: existingLabTech.email === email ? 'Email already registered' : 'Technician ID already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create lab technician
    const labTech = await LabTechnician.create({
      full_name,
      email,
      password: hashedPassword,
      technician_id,
      phone,
      specialization,
      qualification,
      experience_years: experience_years || 0,
      shift_timing
    });

    const { password: _, ...labTechData } = labTech.toJSON();
    
    res.status(201).json({
      message: 'Lab technician registered successfully',
      labTechnician: labTechData
    });

  } catch (error) {
    console.error('Lab technician registration error:', error);
    res.status(500).json({
      error: 'Error registering lab technician',
      details: error.message
    });
  }
});

// POST: Register pharmacist (admin only)
router.post('/register-pharmacist', async (req, res) => {
  try {
    const {
      full_name,
      email,
      password,
      license_number,
      phone,
      qualification,
      experience_years,
      specialization,
      shift_timings
    } = req.body;

    // Validate required fields
    if (!full_name || !email || !password || !license_number || !phone) {
      return res.status(400).json({
        error: 'Required fields: full_name, email, password, license_number, phone'
      });
    }

    // Check if pharmacist already exists
    const existingPharmacist = await Pharmacist.findOne({
      where: {
        [Op.or]: [
          { email: email },
          { license_number: license_number }
        ]
      }
    });

    if (existingPharmacist) {
      return res.status(400).json({
        error: existingPharmacist.email === email ? 'Email already registered' : 'License number already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create pharmacist
    const pharmacist = await Pharmacist.create({
      full_name,
      email,
      password: hashedPassword,
      license_number,
      phone,
      qualification,
      experience_years: experience_years || 0,
      specialization,
      shift_timings
    });

    const { password: _, ...pharmacistData } = pharmacist.toJSON();
    
    res.status(201).json({
      message: 'Pharmacist registered successfully',
      pharmacist: pharmacistData
    });

  } catch (error) {
    console.error('Pharmacist registration error:', error);
    res.status(500).json({
      error: 'Error registering pharmacist',
      details: error.message
    });
  }
});

module.exports = router;