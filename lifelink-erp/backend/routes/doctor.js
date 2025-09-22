const express = require('express');
const router = express.Router();
const Doctor = require('../model/Doctor');
const Patient = require('../model/Patient');
const LabReport = require('../model/LabReport');
const { Op } = require('sequelize');

// Doctor Registration (Backend only)
router.post('/register', async (req, res) => {
  try {
    const { full_name, email, password, specialization, license_number, phone, department } = req.body;

    // Check if doctor already exists
    const existingDoctor = await Doctor.findOne({ where: { email } });
    if (existingDoctor) {
      return res.status(400).json({ error: 'Doctor with this email already exists' });
    }

    // Create new doctor
    const doctor = await Doctor.create({
      full_name,
      email,
      password, // Note: In production, hash this password
      specialization,
      license_number,
      phone,
      department
    });

    res.status(201).json({ 
      message: 'Doctor registered successfully', 
      doctor: {
        id: doctor.id,
        full_name: doctor.full_name,
        email: doctor.email,
        specialization: doctor.specialization,
        department: doctor.department
      }
    });
  } catch (error) {
    console.error('Error registering doctor:', error);
    res.status(500).json({ error: 'Failed to register doctor' });
  }
});

// Doctor Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find doctor by email
    const doctor = await Doctor.findOne({ where: { email } });
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Check password (Note: In production, use proper password hashing)
    if (doctor.password !== password) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    res.json({ 
      message: 'Login successful', 
      doctor: {
        id: doctor.id,
        full_name: doctor.full_name,
        email: doctor.email,
        specialization: doctor.specialization,
        license_number: doctor.license_number,
        phone: doctor.phone,
        department: doctor.department
      }
    });
  } catch (error) {
    console.error('Error during doctor login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Search patients by ID or name (for doctors)
router.get('/patients/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim().length < 1) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    let whereCondition;
    
    // Check if query is a number (patient ID search)
    if (!isNaN(query)) {
      whereCondition = { id: parseInt(query) };
    } else {
      // Search by name or email
      whereCondition = {
        [Op.or]: [
          { full_name: { [Op.like]: `%${query}%` } },
          { email: { [Op.like]: `%${query}%` } }
        ]
      };
    }

    const patients = await Patient.findAll({
      where: whereCondition,
      attributes: ['id', 'full_name', 'email', 'dob', 'gender', 'contact_number', 'blood_group'],
      limit: 10
    });

    res.json(patients);
  } catch (error) {
    console.error('Error searching patients:', error);
    res.status(500).json({ error: 'Failed to search patients' });
  }
});

// Get patient details with lab reports (for doctors)
router.get('/patients/:id/details', async (req, res) => {
  try {
    const { id } = req.params;

    // Get patient details
    const patient = await Patient.findByPk(id, {
      attributes: ['id', 'full_name', 'email', 'dob', 'gender', 'contact_number', 'address', 'blood_group', 'created_at']
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Get patient's lab reports
    const labReports = await LabReport.findAll({
      where: { patientId: id },
      order: [['test_date', 'DESC']],
      limit: 20
    });

    res.json({
      patient: patient.toJSON(),
      labReports
    });
  } catch (error) {
    console.error('Error fetching patient details:', error);
    res.status(500).json({ error: 'Failed to fetch patient details' });
  }
});

// Get all doctors (for admin purposes)
router.get('/', async (req, res) => {
  try {
    const doctors = await Doctor.findAll({
      attributes: ['id', 'full_name', 'email', 'specialization', 'license_number', 'department', 'created_at']
    });
    res.json(doctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
});

module.exports = router;