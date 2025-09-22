const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const LabReport = require('../model/LabReport');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Upload lab report for a patient
router.post('/patients/:id/upload-report', upload.single('report'), async (req, res) => {
  const patientId = req.params.id;
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  try {
    const report = await LabReport.create({
      patientId: patientId,
      report_name: req.file.originalname,
      report_path: req.file.filename,
      test_date: new Date(),
      remarks: req.body.remarks || null
    });
    res.status(201).json({ message: 'Lab report uploaded successfully', report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
