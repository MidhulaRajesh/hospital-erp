const express = require('express');
const router = express.Router();
const Doctor = require('../model/Doctor');
const Patient = require('../model/Patient');
const LabReport = require('../model/LabReport');
const { Op } = require('sequelize');

// Doctor Registration (Backend only)
router.post('/register', async (req, res) => {
  try {
    const { 
      full_name, 
      email, 
      password, 
      specialization, 
      license_number, 
      phone, 
      department,
      qualifications,
      experience_years,
      consultation_fee,
      profile_image,
      availability_schedule,
      consultation_types,
      bio
    } = req.body;

    // Validate required fields
    if (!full_name || !email || !password || !specialization || !license_number || !phone || !qualifications || !experience_years) {
      return res.status(400).json({ 
        error: 'Missing required fields: full_name, email, password, specialization, license_number, phone, qualifications, experience_years are required' 
      });
    }

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
      department,
      qualifications,
      experience_years: parseInt(experience_years),
      consultation_fee: parseInt(consultation_fee) || 500,
      profile_image,
      availability_schedule: availability_schedule || {
        monday: ['09:00', '17:00'],
        tuesday: ['09:00', '17:00'],
        wednesday: ['09:00', '17:00'],
        thursday: ['09:00', '17:00'],
        friday: ['09:00', '17:00'],
        saturday: ['09:00', '13:00'],
        sunday: []
      },
      consultation_types: consultation_types || ['consultation', 'video'],
      bio: bio || null
    });

    res.status(201).json({ 
      message: 'Doctor registered successfully', 
      doctor: {
        id: doctor.id,
        full_name: doctor.full_name,
        email: doctor.email,
        specialization: doctor.specialization,
        department: doctor.department,
        qualifications: doctor.qualifications,
        experience_years: doctor.experience_years
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

// Get all active doctors for appointment booking
router.get('/available', async (req, res) => {
  try {
    console.log('🔄 GET /available - Fetching doctors for appointments');
    const { specialization, department } = req.query;
    
    let whereCondition = {};
    
    if (specialization) {
      whereCondition.specialization = { [Op.like]: `%${specialization}%` };
    }
    
    if (department) {
      whereCondition.department = { [Op.like]: `%${department}%` };
    }

    console.log('📋 Query conditions:', whereCondition);

    const doctors = await Doctor.findAll({
      where: whereCondition,
      attributes: [
        'id', 
        'full_name', 
        'specialization', 
        'qualifications',
        'experience_years',
        'department',
        'consultation_fee',
        'profile_image',
        'availability_schedule',
        'consultation_types',
        'bio'
      ],
      order: [['experience_years', 'DESC'], ['created_at', 'DESC']]
    });

    console.log(`🏥 Found ${doctors.length} doctors in database`);

    // Generate availability slots for each doctor
    const doctorsWithSlots = doctors.map(doctor => {
      const availability = generateTimeSlots(doctor.availability_schedule);
      console.log(`👩‍⚕️ Doctor: ${doctor.full_name}, Availability: ${availability.length} slots`);
      return {
        ...doctor.toJSON(),
        availability
      };
    });

    console.log('✅ Sending doctors with availability slots');
    res.json(doctorsWithSlots);
  } catch (error) {
    console.error('❌ Error fetching available doctors:', error);
    console.error('📝 Error details:', error.message);
    console.error('🔍 Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch doctors',
      details: error.message 
    });
  }
});

// Get doctor by ID with full details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const doctor = await Doctor.findByPk(id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    
    res.json(doctor);
  } catch (error) {
    console.error('Error fetching doctor:', error);
    res.status(500).json({ error: 'Failed to fetch doctor details' });
  }
});

// Helper function to generate time slots from schedule
function generateTimeSlots(schedule) {
  // If no schedule provided, return default comprehensive time slots
  if (!schedule) {
    return generateDefaultTimeSlots();
  }
  
  try {
    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const todaySchedule = schedule[dayName] || schedule['monday'] || [];
    
    // If no schedule for today or invalid schedule, return default slots
    if (!todaySchedule || todaySchedule.length < 2) {
      return generateDefaultTimeSlots();
    }
    
    const startTime = todaySchedule[0];
    const endTime = todaySchedule[1];
    const slots = [];
    
    // Generate 30-minute slots between start and end time
    let current = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    
    while (current < end) {
      const timeString = current.toTimeString().slice(0, 5);
      slots.push(timeString);
      current.setMinutes(current.getMinutes() + 30);
    }
    
    return slots.length > 0 ? slots : generateDefaultTimeSlots();
  } catch (error) {
    console.error('Error generating time slots:', error);
    return generateDefaultTimeSlots();
  }
}

// Generate default comprehensive time slots for doctors
function generateDefaultTimeSlots() {
  const slots = [];
  
  // Morning slots (7:00 AM - 12:00 PM)
  for (let hour = 7; hour < 12; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    slots.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  
  // Afternoon/Evening slots (2:00 PM - 7:00 PM)
  for (let hour = 14; hour < 19; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    slots.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  
  return slots;
}

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