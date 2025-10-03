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
const DeceasedDonor = require('./model/DeceasedDonor');
const Recipient = require('./model/Recipient');
const OrganTransplant = require('./model/OrganTransplant');
const Pharmacist = require('./model/Pharmacist');
const Admin = require('./model/Admin');
const Appointment = require('./model/Appointment');

// Setup model associations
if (OrganTransplant.defineAssociations) {
  OrganTransplant.defineAssociations();
}

// Use { alter: true } to modify tables without losing data, or remove force entirely
sequelize.sync({ alter: true })  // This will update table structure without dropping data
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
const deceasedDonorRouter = require('./routes/deceasedDonor');
const recipientRouter = require('./routes/recipient');
const organTransplantRouter = require('./routes/organTransplant');
const pharmacistRouter = require('./routes/pharmacist');
const adminRouter = require('./routes/admin');
const appointmentRouter = require('./routes/appointment');

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

// Deceased Donor routes
app.use('/api/deceased-donor', deceasedDonorRouter);

// Recipient routes
app.use('/api/recipient', recipientRouter);

// Organ Transplant routes
app.use('/api/organ-transplant', organTransplantRouter);

// Pharmacist routes
app.use('/api/pharmacist', pharmacistRouter);

// Admin routes
app.use('/api/admin', adminRouter);

// Appointment routes
app.use('/api/appointments', appointmentRouter);

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
