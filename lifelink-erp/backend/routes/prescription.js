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

module.exports = router;