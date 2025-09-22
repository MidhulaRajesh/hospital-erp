const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');



const app = express();
const port = 5000;

// Enable CORS for all routes
app.use(cors());

// Use bodyParser.json() before all routes
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const sequelize = require('./db');
const Patient = require('./model/Patient');
const LabReport = require('./model/LabReport');
const LabTechnician = require('./model/LabTechnician');
const Doctor = require('./model/Doctor');
const Prescription = require('./model/Prescription');

sequelize.sync({ alter: true })
  .then(() => {
    console.log('All models were synchronized successfully.');
  })
  .catch((err) => {
    console.error('Error syncing models:', err);
  });

// Import your existing routes
const patientRouter = require('./routes/patient');
const labTechnicianRouter = require('./routes/labTechnician');
const labTechnicianUploadRouter = require('./routes/labTechnicianUpload');
const doctorRouter = require('./routes/doctor');
const prescriptionRouter = require('./routes/prescription');

// Patient routes for frontend integration
app.use('/api/patients', patientRouter);  // Main patient API routes
app.use('/patients', patientRouter);      // Alternative endpoint for compatibility

// Lab technician routes
app.use('/api/lab-technician', labTechnicianRouter);         // JSON routes
app.use('/api/lab-technician', labTechnicianUploadRouter);   // File upload routes

// Doctor routes
app.use('/api/doctors', doctorRouter);

// Prescription routes
app.use('/api/prescriptions', prescriptionRouter);

// Test route to verify backend is working
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'LifeLink ERP Backend API is working!',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /api/patients/register',
      'POST /api/patients/login', 
      'PUT /api/patients/:id',
      'PUT /api/patients/update',
      'GET /api/lab-technician/*',
      'POST /api/lab-technician/*'
    ]
  });
});

// Root test route
app.get('/', (req, res) => {
  res.send('LifeLink ERP Backend is running successfully!');
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`API endpoints available at http://localhost:${port}/api`);
});
