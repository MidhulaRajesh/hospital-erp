const express = require('express');
const router = express.Router();
const Patient = require('../model/Patient');
const LabReport = require('../model/LabReport');
const { Op } = require('sequelize');

// Patient Registration
router.post('/register', async (req, res) => {
  try {
    const patient = await Patient.create(req.body);
    res.status(201).json({ message: 'Patient registered successfully', patient });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Search patients by name or email (for lab technicians)
router.get('/search', async (req, res) => {
  const { query } = req.query;
  try {
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters long' });
    }

    const patients = await Patient.findAll({
      where: {
        [Op.or]: [
          { full_name: { [Op.like]: `%${query}%` } },
          { email: { [Op.like]: `%${query}%` } }
        ]
      },
      attributes: ['id', 'full_name', 'email', 'contact_number', 'blood_group', 'dob'],
      limit: 10 // Limit results to 10 patients
    });

    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Patient Login and fetch all details + lab reports
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const patient = await Patient.findOne({ where: { email, password } });
    if (!patient) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Get lab reports
    const labReports = await LabReport.findAll({ where: { patientId: patient.id } });
    
    // Return patient data in the format expected by frontend
    const fullName = patient.full_name || '';
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const patientData = {
      id: patient.id,
      patientId: patient.patientId || `LL-${new Date().getFullYear()}-${String(patient.id).padStart(3, '0')}`,
      full_name: patient.full_name, // Keep original field name for appointment booking
      firstName: firstName,
      lastName: lastName,
      email: patient.email,
      contact_number: patient.contact_number, // Keep original field name for appointment booking
      phone: patient.contact_number || '', // Legacy field for compatibility
      dateOfBirth: patient.dob || '',
      bloodGroup: patient.blood_group || '',
      address: patient.address || '',
      emergencyContact: {
        name: patient.emergencyContactName || '',
        phone: patient.emergencyContactPhone || '',
        relationship: patient.emergencyContactRelationship || ''
      },
      token: 'jwt-token-' + Date.now() // Simple token for demo
    };
    
    if (labReports.length === 0) {
      res.json(patientData);
    } else {
      res.json({ ...patientData, labReports });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Patient can update only mobile number and address
router.put('/update', async (req, res) => {
  const { email, password, contact_number, address } = req.body;
  try {
    const patient = await Patient.findOne({ where: { email, password } });
    if (!patient) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    patient.contact_number = contact_number || patient.contact_number;
    patient.address = address || patient.address;
    await patient.save();
    res.json({ message: 'Patient details updated', patient });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update patient by ID (for frontend dashboard) - RESTRICTED to phone and address only
router.put('/:id', async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // SECURITY: Only allow updating phone and address
    const { phone, address } = req.body;

    // Validate that only allowed fields are being updated
    const allowedFields = ['phone', 'address'];
    const requestedFields = Object.keys(req.body);
    const unauthorizedFields = requestedFields.filter(field => !allowedFields.includes(field));
    
    if (unauthorizedFields.length > 0) {
      return res.status(403).json({ 
        error: `Unauthorized fields: ${unauthorizedFields.join(', ')}. Only phone and address can be updated.`
      });
    }

    // Update only allowed fields
    const updateData = {};
    if (phone !== undefined) {
      updateData.contact_number = phone;
      updateData.phone = phone; // Handle both field names for compatibility
    }
    if (address !== undefined) {
      updateData.address = address;
    }

    await patient.update(updateData);

    // Reload patient to get updated data
    await patient.reload();

    // Return updated data in format expected by frontend
    const fullName = patient.full_name || '';
    const nameParts = fullName.split(' ');
    const updatedPatientData = {
      id: patient.id,
      patientId: patient.patientId || `LL-${new Date().getFullYear()}-${String(patient.id).padStart(3, '0')}`,
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      email: patient.email,
      phone: patient.contact_number || '',
      dateOfBirth: patient.dob || '',
      bloodGroup: patient.blood_group || '',
      address: patient.address || ''
    };

    res.json({
      message: 'Patient contact information updated successfully',
      updatedFields: Object.keys(updateData),
      patient: updatedPatientData
    });

  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({ error: 'Failed to update patient contact information' });
  }
});

module.exports = router;
