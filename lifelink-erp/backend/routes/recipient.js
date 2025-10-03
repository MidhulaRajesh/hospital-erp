const express = require('express');
const router = express.Router();
const Recipient = require('../model/Recipient');
const { Op } = require('sequelize');

// GET all recipients (only active ones)
router.get('/', async (req, res) => {
  try {
    const recipients = await Recipient.findAll({
      where: {
        status: 'Active'
      },
      order: [
        ['urgency_level', 'DESC'], // High urgency first
        ['created_at', 'DESC']
      ]
    });
    
    res.json({
      success: true,
      recipients
    });
  } catch (error) {
    console.error('Error fetching recipients:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error while fetching recipients' 
    });
  }
});

// GET recipient by ID
router.get('/:id', async (req, res) => {
  try {
    const recipient = await Recipient.findByPk(req.params.id);
    
    if (!recipient) {
      return res.status(404).json({
        success: false,
        error: 'Recipient not found'
      });
    }
    
    res.json({
      success: true,
      recipient
    });
  } catch (error) {
    console.error('Error fetching recipient:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching recipient'
    });
  }
});

// GET recipients by organ type
router.get('/organ/:organType', async (req, res) => {
  try {
    const { organType } = req.params;
    
    const recipients = await Recipient.findAll({
      where: {
        required_organ: organType
      },
      order: [
        ['urgency_level', 'DESC'],
        ['created_at', 'DESC']
      ]
    });
    
    res.json({
      success: true,
      recipients
    });
  } catch (error) {
    console.error('Error fetching recipients by organ:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching recipients'
    });
  }
});

// GET recipients by urgency level
router.get('/urgency/:level', async (req, res) => {
  try {
    const { level } = req.params;
    
    const recipients = await Recipient.findAll({
      where: {
        urgency_level: level
      },
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      success: true,
      recipients
    });
  } catch (error) {
    console.error('Error fetching recipients by urgency:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching recipients'
    });
  }
});

// POST login for recipient
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }
    
    const recipient = await Recipient.findOne({
      where: { email: email.toLowerCase() }
    });
    
    if (!recipient) {
      return res.status(404).json({
        success: false,
        error: 'Recipient not found'
      });
    }
    
    // In production, use proper password hashing
    if (recipient.password !== password) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // Remove password from response
    const recipientData = { ...recipient.toJSON() };
    delete recipientData.password;
    
    res.json({
      success: true,
      message: 'Login successful',
      recipient: recipientData
    });
    
  } catch (error) {
    console.error('Error during recipient login:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during login'
    });
  }
});

// POST create new recipient
router.post('/register', async (req, res) => {
  try {
    const recipientData = req.body;
    
    // Check if email already exists
    const existingRecipient = await Recipient.findOne({
      where: { email: recipientData.email.toLowerCase() }
    });
    
    if (existingRecipient) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered'
      });
    }
    
    // Create new recipient
    const recipient = await Recipient.create({
      ...recipientData,
      email: recipientData.email.toLowerCase()
    });
    
    // Remove password from response
    const responseData = { ...recipient.toJSON() };
    delete responseData.password;
    
    res.status(201).json({
      success: true,
      message: 'Recipient registered successfully',
      recipient: responseData
    });
    
  } catch (error) {
    console.error('Error creating recipient:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while creating recipient'
    });
  }
});

// POST create sample recipients for testing
router.post('/create-samples', async (req, res) => {
  try {
    const sampleRecipients = [
      {
        full_name: "John Smith",
        dob: "1985-03-15",
        age: 39,
        gender: "Male",
        contact_number: "555-0101",
        email: "john.smith@email.com",
        address: "123 Main St, Cityville, State 12345",
        blood_group: "A+",
        required_organ: "Kidney",
        medical_condition: "Chronic kidney disease stage 5",
        urgency_level: "High",
        last_checkup_date: "2024-09-15",
        hospital_name: "City General Hospital",
        hospital_location: "Downtown Medical District",
        emergency_contact_name: "Jane Smith",
        emergency_contact_relation: "Spouse",
        emergency_contact_number: "555-0102",
        password: "password123"
      },
      {
        full_name: "Sarah Johnson",
        dob: "1992-07-22",
        age: 32,
        gender: "Female",
        contact_number: "555-0201",
        email: "sarah.johnson@email.com",
        address: "456 Oak Ave, Townburg, State 12345",
        blood_group: "O-",
        required_organ: "Heart",
        medical_condition: "Dilated cardiomyopathy",
        urgency_level: "High",
        last_checkup_date: "2024-09-20",
        hospital_name: "Metro Heart Center",
        hospital_location: "Medical Plaza",
        emergency_contact_name: "Robert Johnson",
        emergency_contact_relation: "Father",
        emergency_contact_number: "555-0202",
        password: "password123"
      },
      {
        full_name: "Michael Davis",
        dob: "1978-11-08",
        age: 46,
        gender: "Male",
        contact_number: "555-0301",
        email: "michael.davis@email.com",
        address: "789 Pine St, Riverside, State 12345",
        blood_group: "B+",
        required_organ: "Liver",
        medical_condition: "End-stage liver disease",
        urgency_level: "Medium",
        last_checkup_date: "2024-09-10",
        hospital_name: "University Medical Center",
        hospital_location: "University District",
        emergency_contact_name: "Lisa Davis",
        emergency_contact_relation: "Wife",
        emergency_contact_number: "555-0302",
        password: "password123"
      },
      {
        full_name: "Emily Chen",
        dob: "1995-02-14",
        age: 29,
        gender: "Female",
        contact_number: "555-0401",
        email: "emily.chen@email.com",
        address: "321 Elm Dr, Hillside, State 12345",
        blood_group: "AB+",
        required_organ: "Lung",
        medical_condition: "Pulmonary fibrosis",
        urgency_level: "Medium",
        last_checkup_date: "2024-09-25",
        hospital_name: "Respiratory Specialty Hospital",
        hospital_location: "North Campus",
        emergency_contact_name: "David Chen",
        emergency_contact_relation: "Brother",
        emergency_contact_number: "555-0402",
        password: "password123"
      },
      {
        full_name: "Robert Martinez",
        dob: "1989-09-03",
        age: 35,
        gender: "Male",
        contact_number: "555-0501",
        email: "robert.martinez@email.com",
        address: "654 Maple Ln, Westside, State 12345",
        blood_group: "O+",
        required_organ: "Kidney",
        medical_condition: "Polycystic kidney disease",
        urgency_level: "Low",
        last_checkup_date: "2024-08-30",
        hospital_name: "West Regional Hospital",
        hospital_location: "West Medical Campus",
        emergency_contact_name: "Maria Martinez",
        emergency_contact_relation: "Mother",
        emergency_contact_number: "555-0502",
        password: "password123"
      }
    ];

    // Delete existing sample data first (optional)
    await Recipient.destroy({
      where: {
        email: {
          [Op.in]: sampleRecipients.map(r => r.email.toLowerCase())
        }
      }
    });

    // Create sample recipients
    const createdRecipients = await Recipient.bulkCreate(
      sampleRecipients.map(r => ({
        ...r,
        email: r.email.toLowerCase()
      })),
      { returning: true }
    );

    res.json({
      success: true,
      message: `Created ${createdRecipients.length} sample recipients`,
      recipients: createdRecipients.map(r => {
        const data = r.toJSON();
        delete data.password;
        return data;
      })
    });

  } catch (error) {
    console.error('Error creating sample recipients:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while creating sample recipients'
    });
  }
});

// PUT update recipient
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const recipient = await Recipient.findByPk(id);
    
    if (!recipient) {
      return res.status(404).json({
        success: false,
        error: 'Recipient not found'
      });
    }
    
    await recipient.update(updateData);
    
    // Remove password from response
    const responseData = { ...recipient.toJSON() };
    delete responseData.password;
    
    res.json({
      success: true,
      message: 'Recipient updated successfully',
      recipient: responseData
    });
    
  } catch (error) {
    console.error('Error updating recipient:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while updating recipient'
    });
  }
});

// DELETE recipient
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const recipient = await Recipient.findByPk(id);
    
    if (!recipient) {
      return res.status(404).json({
        success: false,
        error: 'Recipient not found'
      });
    }
    
    await recipient.destroy();
    
    res.json({
      success: true,
      message: 'Recipient deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting recipient:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while deleting recipient'
    });
  }
});

// GET - Get compatible donors for a recipient
router.get('/:id/compatible-donors', async (req, res) => {
  try {
    const { id } = req.params;
    
    const recipient = await Recipient.findByPk(id);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        error: 'Recipient not found'
      });
    }

    const DeceasedDonor = require('../model/DeceasedDonor');
    
    // Define blood compatibility matrix
    const bloodCompatibility = {
      'A+': ['A+', 'A-', 'O+', 'O-'],
      'A-': ['A-', 'O-'],
      'B+': ['B+', 'B-', 'O+', 'O-'],
      'B-': ['B-', 'O-'],
      'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      'AB-': ['A-', 'B-', 'AB-', 'O-'],
      'O+': ['O+', 'O-'],
      'O-': ['O-']
    };

    const compatibleBloodTypes = bloodCompatibility[recipient.blood_group] || [];
    
    const compatibleDonors = await DeceasedDonor.findAll({
      where: {
        blood_group: {
          [Op.in]: compatibleBloodTypes
        },
        organs_eligible: {
          [Op.like]: `%${recipient.required_organ}%`
        },
        donor_status: {
          [Op.in]: ['Pending_Assessment', 'Approved']
        }
      },
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      compatible_donors: compatibleDonors,
      recipient_info: {
        name: recipient.full_name,
        blood_group: recipient.blood_group,
        required_organ: recipient.required_organ
      }
    });

  } catch (error) {
    console.error('Error fetching compatible donors:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching compatible donors'
    });
  }
});

router.post('/:id/complete-transplant', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      donor_type,    
      donor_id,      
      donor_name,   
      organ_type, 
      transplant_date, 
      completion_notes, 
      hospital_name,
      surgeon_name 
    } = req.body;

    const recipient = await Recipient.findByPk(id);
    
    if (!recipient) {
      return res.status(404).json({
        success: false,
        error: 'Recipient not found'
      });
    }

    if (recipient.status === 'Transplant_Completed') {
      return res.status(400).json({
        success: false,
        error: 'Transplant already completed for this recipient'
      });
    }

    // Validate donor information based on type
    if (!donor_type || !['deceased', 'living'].includes(donor_type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid donor type. Must be "deceased" or "living"'
      });
    }

    if (donor_type === 'deceased' && !donor_id) {
      return res.status(400).json({
        success: false,
        error: 'Donor ID required for deceased donor transplant'
      });
    }

    if (donor_type === 'living' && !donor_name) {
      return res.status(400).json({
        success: false,
        error: 'Donor name required for living donor transplant'
      });
    }

    // Update recipient status
    const completionNote = donor_type === 'deceased' 
      ? `Transplant completed - ${organ_type} transplant from deceased donor (ID: ${donor_id}). ${completion_notes || ''}`
      : `Transplant completed - ${organ_type} transplant from living donor: ${donor_name}. ${completion_notes || ''}`;

    await recipient.update({
      status: 'Transplant_Completed',
      transplant_completion_date: transplant_date || new Date(),
      completion_notes: completionNote
    });

    // Create transplant record
    const OrganTransplant = require('../model/OrganTransplant');
    const transplantRecord = await OrganTransplant.create({
      donor_id: donor_type === 'deceased' ? donor_id : null, // Only set donor_id for deceased donors
      recipient_id: id,
      organ_type: organ_type,
      transplant_status: 'Transplanted',
      transplant_date: transplant_date || new Date(),
      coordinator_notes: `Transplant completed successfully. 
        Donor Type: ${donor_type === 'deceased' ? 'Deceased (System ID: ' + donor_id + ')' : 'Living (' + donor_name + ')'}.
        Hospital: ${hospital_name || recipient.hospital_name}. 
        Surgeon: ${surgeon_name || 'Not specified'}. 
        ${completion_notes || ''}`
    });

    res.json({
      success: true,
      message: 'Transplant marked as completed successfully',
      recipient: recipient,
      transplant_record: transplantRecord
    });

  } catch (error) {
    console.error('Error completing transplant:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while completing transplant'
    });
  }
});

// GET - Get transplant history (completed transplants)
router.get('/history/completed', async (req, res) => {
  try {
    const OrganTransplant = require('../model/OrganTransplant');
    const DeceasedDonor = require('../model/DeceasedDonor');
    
    const completedTransplants = await Recipient.findAll({
      where: {
        status: 'Transplant_Completed'
      },
      include: [
        {
          model: OrganTransplant,
          as: 'transplants',
          where: {
            transplant_status: 'Transplanted'
          },
          include: [
            {
              model: DeceasedDonor,
              as: 'donor',
              attributes: ['full_name', 'blood_group', 'hospital_name']
            }
          ]
        }
      ],
      order: [['transplant_completion_date', 'DESC']]
    });

    res.json({
      success: true,
      completed_transplants: completedTransplants
    });

  } catch (error) {
    console.error('Error fetching transplant history:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching transplant history'
    });
  }
});

// POST - Mark recipient as expired during waiting period
router.post('/:id/mark-expired', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      expiry_reason = 'Patient expired during waiting period',
      expiry_date = new Date()
    } = req.body;

    const recipient = await Recipient.findByPk(id);
    
    if (!recipient) {
      return res.status(404).json({
        success: false,
        error: 'Recipient not found'
      });
    }

    if (recipient.status !== 'Active') {
      return res.status(400).json({
        success: false,
        error: 'Can only mark active recipients as expired'
      });
    }

    // Update recipient status to expired
    await recipient.update({
      status: 'Expired',
      completion_notes: expiry_reason,
      transplant_completion_date: expiry_date
    });

    res.json({
      success: true,
      message: 'Recipient marked as expired successfully',
      recipient: recipient
    });

  } catch (error) {
    console.error('Error marking recipient as expired:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while marking recipient as expired'
    });
  }
});

module.exports = router;