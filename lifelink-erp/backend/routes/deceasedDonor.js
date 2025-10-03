
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const DeceasedDonor = require('../model/DeceasedDonor');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });


// Deceased Donor Registration (robust, accepts any file field)
router.post('/', upload.any(), async (req, res) => {
  try {
    const data = req.body;
    // Map files by fieldname for easy access
    const files = {};
    (req.files || []).forEach(file => {
      files[file.fieldname] = files[file.fieldname] || [];
      files[file.fieldname].push(file);
    });
    // Calculate BMI if height and weight are provided
    let bmi = null;
    if (data.height_cm && data.weight_kg) {
      const heightInM = data.height_cm / 100;
      bmi = (data.weight_kg / (heightInM * heightInM));
    }

    const deceasedDonor = await DeceasedDonor.create({
      // Basic information
      full_name: data.full_name,
      age_at_death: data.age_at_death,
      gender: data.gender,
      date_of_death: data.date_of_death,
      time_of_death: data.time_of_death,
      cause_of_death: data.cause_of_death,
      address: data.address,
      blood_group: data.blood_group,
      organs_eligible: data.organs_eligible,
      hospital_name: data.hospital_name,
      hospital_location: data.hospital_location,
      national_id: data.national_id,
      next_of_kin_name: data.next_of_kin_name,
      next_of_kin_relation: data.next_of_kin_relation,
      next_of_kin_contact: data.next_of_kin_contact,
      
      // Enhanced medical information
      height_cm: data.height_cm || null,
      weight_kg: data.weight_kg || null,
      bmi: bmi,
      medical_history: data.medical_history || null,
      medications_current: data.medications_current || null,
      smoking_history: data.smoking_history || 'Never',
      alcohol_history: data.alcohol_history || 'None',
      infection_status: data.infection_status || 'Pending_Tests',
      hla_typing: data.hla_typing || null,
      
      // Organ procurement details
      organ_procurement_time: data.organ_procurement_time || null,
      organ_preservation_method: data.organ_preservation_method || 'Cold_Storage',
      crossmatch_required: data.crossmatch_required !== 'false',
      donor_authorization_number: data.donor_authorization_number || null,
      procurement_hospital_contact: data.procurement_hospital_contact || null,
      
      // Coordinates for precise distance calculation
      donor_coordinates_lat: data.donor_coordinates_lat || null,
      donor_coordinates_lng: data.donor_coordinates_lng || null,
      
      // File paths
      medical_reports_path: files.medical_reports ? files.medical_reports[0].path : null,
      death_certificate_path: files.death_certificate ? files.death_certificate[0].path : null,
      brain_death_form_path: files.brain_death_form ? files.brain_death_form[0].path : null,
      family_consent_form_path: files.family_consent_form ? files.family_consent_form[0].path : null,
      
      // Default status
      donor_status: 'Pending_Assessment'
    });
    res.status(201).json({ 
      success: true,
      message: 'Deceased donor registered', 
      donor: deceasedDonor 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// GET deceased donor by ID
router.get('/:id', async (req, res) => {
  try {
    const donor = await DeceasedDonor.findByPk(req.params.id);
    if (!donor) {
      return res.status(404).json({
        success: false,
        error: 'Donor not found'
      });
    }
    res.json({
      success: true,
      donor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
