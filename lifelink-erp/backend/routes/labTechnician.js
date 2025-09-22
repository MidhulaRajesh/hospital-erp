const express = require('express');
const router = express.Router();
const LabTechnician = require('../model/LabTechnician');

// Lab Technician Registration
router.post('/register', async (req, res) => {
  try {
    const technician = await LabTechnician.create(req.body);
    res.status(201).json({ message: 'Lab technician registered successfully', technician });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Lab Technician Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const technician = await LabTechnician.findOne({ where: { email, password } });
    if (!technician) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    res.json({ message: 'Login successful', technician });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
