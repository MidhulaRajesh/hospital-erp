const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Pharmacist = require('../model/Pharmacist');
const { Op } = require('sequelize');

// POST: Pharmacist registration (backend only - no public access)
router.post('/register', async (req, res) => {
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
      if (existingPharmacist.email === email) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      if (existingPharmacist.license_number === license_number) {
        return res.status(400).json({ error: 'License number already registered' });
      }
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

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

    console.log(`💊 New pharmacist registered: ${full_name} - License: ${license_number}`);

    res.status(201).json({
      success: true,
      message: 'Pharmacist registered successfully',
      pharmacist: {
        id: pharmacist.id,
        full_name: pharmacist.full_name,
        email: pharmacist.email,
        license_number: pharmacist.license_number,
        phone: pharmacist.phone,
        status: pharmacist.status
      }
    });

  } catch (error) {
    console.error('Pharmacist registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST: Pharmacist login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find pharmacist by email
    const pharmacist = await Pharmacist.findOne({
      where: { email: email }
    });

    if (!pharmacist) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if pharmacist account is active
    if (pharmacist.status !== 'Active') {
      return res.status(401).json({ error: 'Account is inactive or suspended' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, pharmacist.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    console.log(`💊 Pharmacist login: ${pharmacist.full_name} - License: ${pharmacist.license_number}`);

    res.json({
      success: true,
      message: 'Login successful',
      pharmacist: {
        id: pharmacist.id,
        full_name: pharmacist.full_name,
        email: pharmacist.email,
        license_number: pharmacist.license_number,
        phone: pharmacist.phone,
        qualification: pharmacist.qualification,
        experience_years: pharmacist.experience_years,
        specialization: pharmacist.specialization,
        shift_timings: pharmacist.shift_timings,
        status: pharmacist.status
      }
    });

  } catch (error) {
    console.error('Pharmacist login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET: Get all pharmacists (admin only)
router.get('/list', async (req, res) => {
  try {
    const pharmacists = await Pharmacist.findAll({
      attributes: { exclude: ['password'] },
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      pharmacists: pharmacists
    });

  } catch (error) {
    console.error('Error fetching pharmacists:', error);
    res.status(500).json({ error: 'Failed to fetch pharmacists' });
  }
});

// PUT: Update pharmacist status (admin only)
router.put('/status/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Active', 'Inactive', 'Suspended'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Use: Active, Inactive, or Suspended' });
    }

    const pharmacist = await Pharmacist.findByPk(id);
    if (!pharmacist) {
      return res.status(404).json({ error: 'Pharmacist not found' });
    }

    await pharmacist.update({ status });

    res.json({
      success: true,
      message: `Pharmacist status updated to ${status}`,
      pharmacist: {
        id: pharmacist.id,
        full_name: pharmacist.full_name,
        status: pharmacist.status
      }
    });

  } catch (error) {
    console.error('Error updating pharmacist status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;