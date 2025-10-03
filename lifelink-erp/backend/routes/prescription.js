const express = require('express');
const router = express.Router();
const Prescription = require('../model/Prescription');
const Patient = require('../model/Patient');
const Doctor = require('../model/Doctor');

// Create a new prescription
router.post('/create', async (req, res) => {
  try {
    const { patient_id, doctor_id, medicines, instructions, diagnosis } = req.body;

    // Validate required fields
    if (!patient_id || !doctor_id || !medicines) {
      return res.status(400).json({ error: 'Patient ID, Doctor ID, and medicines are required' });
    }

    // Verify patient exists
    const patient = await Patient.findByPk(patient_id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Verify doctor exists
    const doctor = await Doctor.findByPk(doctor_id);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Create prescription
    const prescription = await Prescription.create({
      patient_id,
      doctor_id,
      medicines: JSON.stringify(medicines), // Store as JSON string
      instructions,
      diagnosis
    });

    // Fetch the created prescription with associated data
    const createdPrescription = await Prescription.findByPk(prescription.id, {
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'full_name', 'email'] },
        { model: Doctor, as: 'doctor', attributes: ['id', 'full_name', 'email'] }
      ]
    });

    res.status(201).json({ 
      message: 'Prescription created successfully', 
      prescription: createdPrescription 
    });
  } catch (error) {
    console.error('Error creating prescription:', error);
    res.status(500).json({ error: 'Failed to create prescription' });
  }
});

// Get all prescriptions for a patient
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;

    const prescriptions = await Prescription.findAll({
      where: { patient_id: patientId },
      include: [
        { model: Doctor, as: 'doctor', attributes: ['id', 'full_name', 'email', 'specialization'] }
      ],
      order: [['prescribed_date', 'DESC']]
    });

    // Parse medicines JSON for each prescription
    const prescriptionsWithParsedMedicines = prescriptions.map(prescription => {
      const prescriptionData = prescription.toJSON();
      try {
        prescriptionData.medicines = JSON.parse(prescriptionData.medicines);
      } catch (e) {
        prescriptionData.medicines = prescriptionData.medicines; // Keep as string if parse fails
      }
      return prescriptionData;
    });

    res.json(prescriptionsWithParsedMedicines);
  } catch (error) {
    console.error('Error fetching patient prescriptions:', error);
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
});

// Get all prescriptions created by a doctor
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;

    const prescriptions = await Prescription.findAll({
      where: { doctor_id: doctorId },
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'full_name', 'email', 'contact_number'] }
      ],
      order: [['prescribed_date', 'DESC']]
    });

    // Parse medicines JSON for each prescription
    const prescriptionsWithParsedMedicines = prescriptions.map(prescription => {
      const prescriptionData = prescription.toJSON();
      try {
        prescriptionData.medicines = JSON.parse(prescriptionData.medicines);
      } catch (e) {
        prescriptionData.medicines = prescriptionData.medicines;
      }
      return prescriptionData;
    });

    res.json(prescriptionsWithParsedMedicines);
  } catch (error) {
    console.error('Error fetching doctor prescriptions:', error);
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
});

// Update prescription status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Active', 'Completed', 'Cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be Active, Completed, or Cancelled' });
    }

    const prescription = await Prescription.findByPk(id);
    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    await prescription.update({ status });

    res.json({ message: 'Prescription status updated successfully', prescription });
  } catch (error) {
    console.error('Error updating prescription status:', error);
    res.status(500).json({ error: 'Failed to update prescription status' });
  }
});

// Get prescription by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const prescription = await Prescription.findByPk(id, {
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'full_name', 'email', 'contact_number'] },
        { model: Doctor, as: 'doctor', attributes: ['id', 'full_name', 'email'] }
      ]
    });

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    // Parse medicines JSON
    const prescriptionData = prescription.toJSON();
    try {
      prescriptionData.medicines = JSON.parse(prescriptionData.medicines);
    } catch (e) {
      prescriptionData.medicines = prescriptionData.medicines;
    }

    res.json(prescriptionData);
  } catch (error) {
    console.error('Error fetching prescription:', error);
    res.status(500).json({ error: 'Failed to fetch prescription' });
  }
});

// Pharmacist Routes for Prescription Search and Management

// GET: Search prescriptions by patient name or ID (for pharmacists)
router.get('/pharmacy/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query (patient name or ID) is required' });
    }

    let prescriptions;
    
    // Check if query is a number (patient ID) or string (patient name)
    if (!isNaN(query)) {
      // Search by patient ID
      prescriptions = await Prescription.findAll({
        where: { patient_id: parseInt(query) },
        include: [
          {
            model: Patient,
            as: 'patient',
            attributes: ['id', 'full_name', 'date_of_birth', 'gender', 'contact_number', 'blood_group']
          },
          {
            model: Doctor,
            as: 'doctor',
            attributes: ['id', 'full_name', 'specialization', 'license_number', 'phone']
          }
        ],
        order: [['prescribed_date', 'DESC']]
      });
    } else {
      // Search by patient name (partial match)
      const { Op } = require('sequelize');
      prescriptions = await Prescription.findAll({
        include: [
          {
            model: Patient,
            as: 'patient',
            attributes: ['id', 'full_name', 'date_of_birth', 'gender', 'contact_number', 'blood_group'],
            where: {
              full_name: {
                [Op.like]: `%${query}%`
              }
            }
          },
          {
            model: Doctor,
            as: 'doctor',
            attributes: ['id', 'full_name', 'specialization', 'license_number', 'phone']
          }
        ],
        order: [['prescribed_date', 'DESC']]
      });
    }

    // Parse medicines JSON for each prescription
    const processedPrescriptions = prescriptions.map(prescription => {
      const prescriptionData = prescription.toJSON();
      try {
        prescriptionData.medicines = JSON.parse(prescriptionData.medicines);
      } catch (e) {
        prescriptionData.medicines = prescriptionData.medicines;
      }
      return prescriptionData;
    });

    console.log(`💊 Pharmacist search: Found ${prescriptions.length} prescriptions for query "${query}"`);

    res.json({
      success: true,
      query: query,
      prescriptions: processedPrescriptions,
      count: prescriptions.length
    });

  } catch (error) {
    console.error('Error searching prescriptions:', error);
    res.status(500).json({ error: 'Failed to search prescriptions' });
  }
});

// GET: Get all recent prescriptions (for pharmacy dashboard)
router.get('/pharmacy/recent', async (req, res) => {
  try {
    const { limit = 20, status = 'Active' } = req.query;

    const prescriptions = await Prescription.findAll({
      where: { status },
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'full_name', 'contact_number', 'blood_group']
        },
        {
          model: Doctor,
          as: 'doctor',
          attributes: ['id', 'full_name', 'specialization']
        }
      ],
      order: [['prescribed_date', 'DESC']],
      limit: parseInt(limit)
    });

    const processedPrescriptions = prescriptions.map(prescription => {
      const prescriptionData = prescription.toJSON();
      try {
        prescriptionData.medicines = JSON.parse(prescriptionData.medicines);
      } catch (e) {
        prescriptionData.medicines = prescriptionData.medicines;
      }
      return prescriptionData;
    });

    res.json({
      success: true,
      prescriptions: processedPrescriptions,
      count: prescriptions.length
    });

  } catch (error) {
    console.error('Error fetching recent prescriptions:', error);
    res.status(500).json({ error: 'Failed to fetch recent prescriptions' });
  }
});

// PUT: Mark prescription as dispensed (for pharmacists)
router.put('/pharmacy/dispense/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { pharmacist_id, notes, dispensed_medicines } = req.body;

    const prescription = await Prescription.findByPk(id, {
      include: [
        { model: Patient, as: 'patient', attributes: ['full_name'] },
        { model: Doctor, as: 'doctor', attributes: ['full_name'] }
      ]
    });

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    if (prescription.status === 'Completed') {
      return res.status(400).json({ error: 'Prescription already dispensed' });
    }

    // Update prescription status and add dispensing information
    await prescription.update({
      status: 'Completed',
      dispensed_date: new Date(),
      pharmacist_id: pharmacist_id,
      dispensing_notes: notes,
      dispensed_medicines: dispensed_medicines ? JSON.stringify(dispensed_medicines) : null
    });

    console.log(`💊 Prescription dispensed: ID ${id} for patient ${prescription.patient?.full_name}`);

    res.json({
      success: true,
      message: 'Prescription marked as dispensed',
      prescription: {
        id: prescription.id,
        patient_name: prescription.patient?.full_name,
        doctor_name: prescription.doctor?.full_name,
        status: prescription.status,
        dispensed_date: prescription.dispensed_date
      }
    });

  } catch (error) {
    console.error('Error dispensing prescription:', error);
    res.status(500).json({ error: 'Failed to dispense prescription' });
  }
});

// GET: Prescription statistics for pharmacy dashboard
router.get('/pharmacy/stats', async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);

    // Get various statistics
    const stats = {
      today: {
        total: await Prescription.count({
          where: {
            prescribed_date: {
              [Op.gte]: startOfDay
            }
          }
        }),
        dispensed: await Prescription.count({
          where: {
            prescribed_date: {
              [Op.gte]: startOfDay
            },
            status: 'Completed'
          }
        }),
        pending: await Prescription.count({
          where: {
            prescribed_date: {
              [Op.gte]: startOfDay
            },
            status: 'Active'
          }
        })
      },
      week: {
        total: await Prescription.count({
          where: {
            prescribed_date: {
              [Op.gte]: startOfWeek
            }
          }
        }),
        dispensed: await Prescription.count({
          where: {
            prescribed_date: {
              [Op.gte]: startOfWeek
            },
            status: 'Completed'
          }
        }),
        pending: await Prescription.count({
          where: {
            prescribed_date: {
              [Op.gte]: startOfWeek
            },
            status: 'Active'
          }
        })
      },
      overall: {
        total: await Prescription.count(),
        active: await Prescription.count({ where: { status: 'Active' } }),
        completed: await Prescription.count({ where: { status: 'Completed' } }),
        cancelled: await Prescription.count({ where: { status: 'Cancelled' } })
      }
    };

    res.json({
      success: true,
      stats: stats,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching pharmacy statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;