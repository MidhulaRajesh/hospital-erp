const express = require('express');
const router = express.Router();
const DeceasedDonor = require('../model/DeceasedDonor');
const Recipient = require('../model/Recipient');
const OrganTransplant = require('../model/OrganTransplant');
const { Op, Sequelize } = require('sequelize');
const sequelize = require('../db');

// Enhanced Blood group compatibility matrix for organ transplantation
const bloodCompatibility = {
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'O-': ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'],  // Universal donor
  'A+': ['A+', 'AB+'],
  'A-': ['A+', 'A-', 'AB+', 'AB-'],
  'B+': ['B+', 'AB+'],
  'B-': ['B+', 'B-', 'AB+', 'AB-'],
  'AB+': ['AB+'],
  'AB-': ['AB+', 'AB-']
};

// Organ-specific compatibility factors
const organSpecificFactors = {
  'Heart': { maxAge: 65, criticalTime: 4, sizeImportant: true },
  'Liver': { maxAge: 70, criticalTime: 12, sizeImportant: true },
  'Kidney': { maxAge: 75, criticalTime: 24, sizeImportant: false },
  'Lungs': { maxAge: 65, criticalTime: 6, sizeImportant: true },
  'Pancreas': { maxAge: 50, criticalTime: 12, sizeImportant: false },
  'Corneas': { maxAge: 80, criticalTime: 168, sizeImportant: false },
  'Skin': { maxAge: 75, criticalTime: 48, sizeImportant: false },
  'Bone': { maxAge: 70, criticalTime: 120, sizeImportant: false },
  'Small_Intestine': { maxAge: 60, criticalTime: 8, sizeImportant: true },
  'Heart_Valves': { maxAge: 65, criticalTime: 72, sizeImportant: false }
};

// Calculate distance between two coordinates (simplified)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Enhanced location-based distance calculation
const calculateLocationDistance = (location1, location2) => {
  if (!location1 || !location2) return 999; // Invalid locations get max distance
  
  // Exact location match
  if (location1.toLowerCase() === location2.toLowerCase()) return 0;
  
  // Same city/region matching (more sophisticated)
  const loc1 = location1.toLowerCase().split(/[\s,]+/);
  const loc2 = location2.toLowerCase().split(/[\s,]+/);
  
  // Check for city/state matches
  const commonWords = loc1.filter(word => loc2.includes(word));
  
  if (commonWords.length >= 2) return 15;  // Same city/state
  if (commonWords.length === 1) return 50; // Same state/region
  
  // Distance based on common location keywords
  const distances = {
    'mumbai': { 'pune': 150, 'delhi': 1400, 'bangalore': 980, 'chennai': 1340 },
    'delhi': { 'mumbai': 1400, 'bangalore': 2150, 'chennai': 2180, 'kolkata': 1470 },
    'bangalore': { 'mumbai': 980, 'delhi': 2150, 'chennai': 350, 'hyderabad': 560 },
    'chennai': { 'mumbai': 1340, 'delhi': 2180, 'bangalore': 350, 'hyderabad': 630 },
    'kolkata': { 'mumbai': 1950, 'delhi': 1470, 'bangalore': 1870, 'chennai': 1670 }
  };
  
  // Try to find distance between major cities
  for (const city1 in distances) {
    if (loc1.some(word => word.includes(city1))) {
      for (const city2 in distances[city1]) {
        if (loc2.some(word => word.includes(city2))) {
          return distances[city1][city2];
        }
      }
    }
  }
  
  return 300; // Default distance for unknown locations
};

// Enhanced compatibility score calculation with comprehensive parameters
const calculateCompatibilityScore = (donor, recipient, distance, organType = 'General') => {
  let score = 0;
  const factors = organSpecificFactors[organType] || { maxAge: 70, criticalTime: 24, sizeImportant: false };
  
  console.log(`\n=== Calculating compatibility for ${organType} ===`);
  console.log(`Donor: ${donor.full_name}, Age: ${donor.age_at_death}, Blood: ${donor.blood_group}`);
  console.log(`Recipient: ${recipient.full_name}, Age: ${recipient.age}, Blood: ${recipient.blood_group}`);
  
  // 1. Blood group compatibility (35% weight) - CRITICAL
  const donorBloodGroup = donor.blood_group;
  const compatibleGroups = bloodCompatibility[donorBloodGroup] || [];
  const bloodCompatible = compatibleGroups.includes(recipient.blood_group);
  const bloodScore = bloodCompatible ? 35 : 0;
  score += bloodScore;
  console.log(`Blood compatibility: ${bloodCompatible ? 'YES' : 'NO'} (+${bloodScore})`);
  
  if (!bloodCompatible) {
    console.log('❌ Blood incompatible - rejecting match');
    return 0; // Immediate disqualification for blood incompatibility
  }
  
  // 2. Organ-specific age limits (20% weight)
  const donorAge = donor.age_at_death || 0;
  const recipientAge = recipient.age || 0;
  let ageScore = 0;
  
  if (donorAge <= factors.maxAge) {
    const ageDiff = Math.abs(donorAge - recipientAge);
    if (ageDiff <= 5) ageScore = 20;
    else if (ageDiff <= 10) ageScore = 17;
    else if (ageDiff <= 20) ageScore = 12;
    else if (ageDiff <= 30) ageScore = 7;
    else ageScore = 3;
  }
  score += ageScore;
  console.log(`Age compatibility: Donor ${donorAge}, Recipient ${recipientAge}, Diff: ${Math.abs(donorAge - recipientAge)} (+${ageScore})`);
  
  // 3. Medical urgency level (25% weight)
  const urgencyScore = {
    'High': 25,    // Critical patients get priority
    'Medium': 18,  // Moderate urgency
    'Low': 10      // Stable patients
  };
  const urgencyPoints = urgencyScore[recipient.urgency_level] || 15;
  score += urgencyPoints;
  console.log(`Medical urgency: ${recipient.urgency_level} (+${urgencyPoints})`);
  
  // 4. Distance and transport time (15% weight)
  let distanceScore = 0;
  const criticalTimeHours = factors.criticalTime;
  
  if (distance <= 25) distanceScore = 15;        // Same city - excellent
  else if (distance <= 100) distanceScore = 12;  // Same state - good
  else if (distance <= 300) distanceScore = 8;   // Nearby states - acceptable
  else if (distance <= 500) distanceScore = 4;   // Far but possible
  else distanceScore = 1;                         // Very far - risky
  
  score += distanceScore;
  console.log(`Distance: ${distance}km (+${distanceScore}) [Critical time: ${criticalTimeHours}h]`);
  
  // 5. Additional medical factors (5% weight)
  let medicalScore = 0;
  
  // Check medical condition compatibility
  if (recipient.medical_condition) {
    const condition = recipient.medical_condition.toLowerCase();
    if (condition.includes('infection') || condition.includes('cancer')) {
      medicalScore = 1; // High risk conditions get lower score
    } else if (condition.includes('diabetes') || condition.includes('hypertension')) {
      medicalScore = 3; // Manageable conditions
    } else {
      medicalScore = 5; // Good medical condition
    }
  } else {
    medicalScore = 5; // No stated complications
  }
  
  score += medicalScore;
  console.log(`Medical condition: ${recipient.medical_condition || 'Not specified'} (+${medicalScore})`);
  
  // Bonus factors for perfect matches
  if (donorBloodGroup === recipient.blood_group) {
    score += 2; // Exact blood group match bonus
    console.log(`Exact blood match bonus (+2)`);
  }
  
  if (distance <= 50 && recipient.urgency_level === 'High') {
    score += 3; // Emergency local match bonus
    console.log(`Emergency local match bonus (+3)`);
  }
  
  const finalScore = Math.min(Math.max(score, 0), 100);
  console.log(`Final compatibility score: ${finalScore}/100`);
  console.log(`===============================\n`);
  
  return finalScore;
};

// GET: Find top 3 matching recipients for a deceased donor's organs
router.get('/find-matches/:donorId', async (req, res) => {
  try {
    const { donorId } = req.params;
    const { organType } = req.query;
    
    // Get donor details
    const donor = await DeceasedDonor.findByPk(donorId);
    if (!donor) {
      return res.status(404).json({ error: 'Donor not found' });
    }
    
    // Parse eligible organs
    const eligibleOrgans = donor.organs_eligible ? 
      donor.organs_eligible.split(',').map(organ => organ.trim()) : [];
    
    if (organType && !eligibleOrgans.includes(organType)) {
      return res.status(400).json({ error: 'Donor is not eligible for this organ type' });
    }
    
    // Find active recipients who need the available organs
    const organFilter = organType ? 
      { required_organ: organType, status: 'Active' } : 
      { required_organ: { [Op.in]: eligibleOrgans }, status: 'Active' };
    
    const recipients = await Recipient.findAll({
      where: organFilter,
      order: [['created_at', 'DESC']]
    });
    
    console.log(`\n🔍 Starting organ matching for donor: ${donor.full_name}`);
    console.log(`📍 Donor location: ${donor.hospital_location}`);
    console.log(`🩸 Donor blood group: ${donor.blood_group}`);
    console.log(`🫀 Eligible organs: ${eligibleOrgans.join(', ')}`);
    console.log(`👥 Found ${recipients.length} potential recipients`);
    
    // Calculate compatibility scores with enhanced parameters
    const matches = recipients.map((recipient, index) => {
      console.log(`\n--- Evaluating recipient ${index + 1}/${recipients.length} ---`);
      
      const distance = calculateLocationDistance(
        donor.hospital_location, 
        recipient.hospital_location
      );
      
      // Use organ-specific compatibility scoring
      const targetOrgan = organType || recipient.required_organ;
      const compatibilityScore = calculateCompatibilityScore(
        donor, 
        recipient, 
        distance, 
        targetOrgan
      );
      
      const bloodCompatible = bloodCompatibility[donor.blood_group]?.includes(recipient.blood_group) || false;
      
      // Additional organ-specific validation
      const organFactors = organSpecificFactors[targetOrgan] || {};
      const ageCompatible = donor.age_at_death <= (organFactors.maxAge || 70);
      const timeViable = distance <= 500; // Rough time estimation based on distance
      
      return {
        recipient,
        compatibilityScore,
        distance,
        bloodCompatible,
        ageCompatible,
        timeViable,
        urgencyLevel: recipient.urgency_level,
        organNeeded: recipient.required_organ,
        targetOrgan,
        organFactors
      };
    })
    .filter(match => {
      // Enhanced filtering criteria
      if (!match.bloodCompatible) {
        console.log(`❌ Rejected ${match.recipient.full_name}: Blood incompatible`);
        return false;
      }
      if (!match.ageCompatible) {
        console.log(`❌ Rejected ${match.recipient.full_name}: Age incompatible (${donor.age_at_death} > ${match.organFactors.maxAge})`);
        return false;
      }
      if (!match.timeViable) {
        console.log(`❌ Rejected ${match.recipient.full_name}: Distance too far (${match.distance}km)`);
        return false;
      }
      if (match.compatibilityScore < 40) {
        console.log(`❌ Rejected ${match.recipient.full_name}: Low compatibility score (${match.compatibilityScore})`);
        return false;
      }
      
      console.log(`✅ Accepted ${match.recipient.full_name}: Score ${match.compatibilityScore}`);
      return true;
    })
    .sort((a, b) => {
      // Enhanced sorting - prioritize urgent cases with good compatibility
      if (a.urgencyLevel === 'High' && b.urgencyLevel !== 'High') return -1;
      if (b.urgencyLevel === 'High' && a.urgencyLevel !== 'High') return 1;
      return b.compatibilityScore - a.compatibilityScore;
    })
    .slice(0, 3); // Top 3 matches
    
    console.log(`\n🎯 Final matches found: ${matches.length}`);
    matches.forEach((match, i) => {
      console.log(`${i + 1}. ${match.recipient.full_name} - Score: ${match.compatibilityScore}, Urgency: ${match.urgencyLevel}`);
    });
    
    res.json({
      success: true,
      totalRecipientsFound: recipients.length,
      compatibleMatches: matches.length,
      organType: organType || 'All eligible organs',
      matchingCriteria: {
        bloodCompatibility: 'Required',
        ageLimit: organType ? organSpecificFactors[organType]?.maxAge : 'Organ-specific',
        maxDistance: '500km',
        minCompatibilityScore: '40%'
      },
      donor: {
        id: donor.id,
        name: donor.full_name,
        age: donor.age_at_death,
        bloodGroup: donor.blood_group,
        location: donor.hospital_location,
        eligibleOrgans,
        hospitalName: donor.hospital_name
      },
      matches: matches.map((match, index) => ({
        rank: index + 1,
        recipientId: match.recipient.id,
        recipientName: match.recipient.full_name,
        age: match.recipient.age,
        bloodGroup: match.recipient.blood_group,
        requiredOrgan: match.recipient.required_organ,
        urgencyLevel: match.recipient.urgency_level,
        hospitalLocation: match.recipient.hospital_location,
        contactNumber: match.recipient.contact_number,
        compatibilityScore: Math.round(match.compatibilityScore),
        distance: Math.round(match.distance),
        medicalCondition: match.recipient.medical_condition,
        lastCheckup: match.recipient.last_checkup_date,
        matchQuality: match.compatibilityScore >= 80 ? 'Excellent' : 
                     match.compatibilityScore >= 65 ? 'Good' : 'Fair',
        bloodCompatible: match.bloodCompatible,
        ageCompatible: match.ageCompatible,
        timeViable: match.timeViable,
        organSpecificFactors: match.organFactors
      })),
      matchingSummary: {
        highUrgency: matches.filter(m => m.urgencyLevel === 'High').length,
        localMatches: matches.filter(m => m.distance <= 100).length,
        excellentScores: matches.filter(m => m.compatibilityScore >= 80).length
      }
    });
    
  } catch (error) {
    console.error('Error finding matches:', error);
    res.status(500).json({ error: 'Server error while finding matches' });
  }
});

// POST: Create organ transplant record with matching
router.post('/create-transplant', async (req, res) => {
  try {
    const { donorId, recipientId, organType, coordinatorNotes } = req.body;
    
    // Validate donor and recipient exist
    const donor = await DeceasedDonor.findByPk(donorId);
    const recipient = await Recipient.findByPk(recipientId);
    
    if (!donor || !recipient) {
      return res.status(404).json({ error: 'Donor or recipient not found' });
    }
    
    // Enhanced compatibility validation and scoring
    console.log(`\n🏥 Creating transplant match: ${organType}`);
    console.log(`Donor: ${donor.full_name} → Recipient: ${recipient.full_name}`);
    
    const distance = calculateLocationDistance(donor.hospital_location, recipient.hospital_location);
    const compatibilityScore = calculateCompatibilityScore(donor, recipient, distance, organType);
    const bloodCompatible = bloodCompatibility[donor.blood_group]?.includes(recipient.blood_group) || false;
    
    // Validate match quality before creating transplant
    if (!bloodCompatible) {
      return res.status(400).json({ error: 'Blood group incompatibility - transplant cannot proceed' });
    }
    
    if (compatibilityScore < 40) {
      return res.status(400).json({ error: 'Compatibility score too low - transplant not recommended' });
    }
    
    const organFactors = organSpecificFactors[organType] || {};
    if (donor.age_at_death > (organFactors.maxAge || 70)) {
      return res.status(400).json({ 
        error: `Donor age (${donor.age_at_death}) exceeds maximum for ${organType} (${organFactors.maxAge})` 
      });
    }
    
    // Create transplant record
    const transplant = await OrganTransplant.create({
      donor_id: donorId,
      recipient_id: recipientId,
      organ_type: organType,
      transplant_status: 'Matched',
      compatibility_score: compatibilityScore,
      match_date: new Date(),
      distance_km: distance,
      blood_group_compatibility: bloodCompatible,
      rejection_risk: compatibilityScore >= 80 ? 'Low' : (compatibilityScore >= 60 ? 'Medium' : 'High'),
      coordinator_notes: coordinatorNotes || '',
      hospital_contact_info: `${donor.hospital_name} - ${recipient.hospital_location}`
    });
    
    res.json({
      success: true,
      message: 'Transplant match created successfully',
      transplant: {
        id: transplant.id,
        donorName: donor.full_name,
        recipientName: recipient.full_name,
        organType: transplant.organ_type,
        compatibilityScore: Math.round(transplant.compatibility_score),
        matchDate: transplant.match_date,
        status: transplant.transplant_status
      }
    });
    
  } catch (error) {
    console.error('Error creating transplant:', error);
    res.status(500).json({ error: 'Server error while creating transplant' });
  }
});

// GET: Get all organ transplant records with details
router.get('/transplants', async (req, res) => {
  try {
    const transplants = await OrganTransplant.findAll({
      include: [
        {
          model: DeceasedDonor,
          as: 'donor',
          attributes: ['full_name', 'blood_group', 'hospital_location', 'organs_eligible']
        },
        {
          model: Recipient,
          as: 'recipient',
          attributes: ['full_name', 'blood_group', 'urgency_level', 'hospital_location', 'contact_number']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      success: true,
      transplants
    });
    
  } catch (error) {
    console.error('Error fetching transplants:', error);
    res.status(500).json({ error: 'Server error while fetching transplants' });
  }
});

// GET: Get available organs from deceased donors (excluding already transplanted)
router.get('/available-organs', async (req, res) => {
  try {
    const donors = await DeceasedDonor.findAll({
      where: {
        organs_eligible: {
          [Op.ne]: null
        }
      },
      attributes: ['id', 'full_name', 'blood_group', 'organs_eligible', 'hospital_location', 'date_of_death'],
      order: [['date_of_death', 'DESC']]
    });

    // Get all transplanted organ records to filter out
    const transplantedRecords = await OrganTransplant.findAll({
      where: {
        transplant_status: ['Matched', 'Transplanted']
      },
      attributes: ['donor_id', 'organ_type']
    });

    // Create a map of donor_id -> [transplanted organ types]
    const transplantedOrgansMap = {};
    transplantedRecords.forEach(record => {
      if (!transplantedOrgansMap[record.donor_id]) {
        transplantedOrgansMap[record.donor_id] = [];
      }
      transplantedOrgansMap[record.donor_id].push(record.organ_type);
    });
    
    const availableOrgans = donors.map(donor => {
      const allOrgans = donor.organs_eligible ? 
        donor.organs_eligible.split(',').map(organ => organ.trim()) : [];
      
      // Filter out organs that have already been transplanted
      const transplantedForThisDonor = transplantedOrgansMap[donor.id] || [];
      const availableOrgansList = allOrgans.filter(organ => 
        !transplantedForThisDonor.includes(organ)
      );
      
      return {
        donorId: donor.id,
        donorName: donor.full_name,
        bloodGroup: donor.blood_group,
        location: donor.hospital_location,
        dateOfDeath: donor.date_of_death,
        availableOrgans: availableOrgansList,
        hasAvailableOrgans: availableOrgansList.length > 0
      };
    }).filter(donor => donor.hasAvailableOrgans); // Only return donors with available organs
    
    res.json({
      success: true,
      availableOrgans
    });
    
  } catch (error) {
    console.error('Error fetching available organs:', error);
    res.status(500).json({ error: 'Server error while fetching available organs' });
  }
});

// PUT: Update transplant status
router.put('/update-status/:transplantId', async (req, res) => {
  try {
    const { transplantId } = req.params;
    const { status, transplantDate, notes } = req.body;
    
    const transplant = await OrganTransplant.findByPk(transplantId, {
      include: [
        { model: Recipient, as: 'recipient' },
        { model: DeceasedDonor, as: 'donor' }
      ]
    });
    
    if (!transplant) {
      return res.status(404).json({ error: 'Transplant record not found' });
    }
    
    const updateData = { transplant_status: status };
    if (transplantDate) updateData.transplant_date = transplantDate;
    if (notes) updateData.coordinator_notes = notes;
    
    await transplant.update(updateData);
    
    // If transplant is completed successfully, update recipient status
    if (status === 'Transplanted' && transplant.recipient) {
      await transplant.recipient.update({
        status: 'Transplant_Completed',
        completion_date: new Date(),
        completion_notes: `Successfully received ${transplant.organ_type} from deceased donor ${transplant.donor?.full_name || 'Unknown'}`
      });
      
      console.log(`✅ Recipient ${transplant.recipient.full_name} marked as Transplant_Completed`);
    }
    
    res.json({
      success: true,
      message: 'Transplant status updated successfully',
      transplant
    });
    
  } catch (error) {
    console.error('Error updating transplant status:', error);
    res.status(500).json({ error: 'Server error while updating transplant status' });
  }
});

// POST: Complete deceased donor organ transplant
router.post('/complete-deceased-transplant', async (req, res) => {
  try {
    const { 
      transplantId, 
      surgeryDate, 
      surgeonName, 
      hospitalName, 
      operationNotes, 
      postOpCondition 
    } = req.body;
    
    const transplant = await OrganTransplant.findByPk(transplantId, {
      include: [
        { model: Recipient, as: 'recipient' },
        { model: DeceasedDonor, as: 'donor' }
      ]
    });
    
    if (!transplant) {
      return res.status(404).json({ error: 'Transplant record not found' });
    }
    
    if (transplant.transplant_status === 'Transplanted') {
      return res.status(400).json({ error: 'Transplant already completed' });
    }
    
    // Update transplant record with completion details
    await transplant.update({
      transplant_status: 'Transplanted',
      transplant_date: surgeryDate || new Date(),
      coordinator_notes: `${transplant.coordinator_notes || ''}\n\nTransplant Completed:\n- Surgeon: ${surgeonName}\n- Hospital: ${hospitalName}\n- Post-op condition: ${postOpCondition}\n- Operation notes: ${operationNotes}`
    });
    
    // Update recipient status to completed
    if (transplant.recipient) {
      await transplant.recipient.update({
        status: 'Transplant_Completed',
        completion_date: surgeryDate || new Date(),
        completion_notes: `Successfully received ${transplant.organ_type} from deceased donor ${transplant.donor?.full_name}. Surgeon: ${surgeonName}, Hospital: ${hospitalName}. Post-operative condition: ${postOpCondition}`
      });
    }
    
    console.log(`🏥 Completed deceased donor transplant: ${transplant.organ_type} from ${transplant.donor?.full_name} to ${transplant.recipient?.full_name}`);
    
    res.json({
      success: true,
      message: `${transplant.organ_type} transplant from deceased donor successfully completed`,
      transplant: {
        id: transplant.id,
        donorName: transplant.donor?.full_name,
        recipientName: transplant.recipient?.full_name,
        organType: transplant.organ_type,
        surgeryDate: surgeryDate || new Date(),
        surgeon: surgeonName,
        hospital: hospitalName,
        status: 'Transplanted'
      }
    });
    
  } catch (error) {
    console.error('Error completing deceased donor transplant:', error);
    res.status(500).json({ error: 'Server error while completing transplant' });
  }
});

// POST: Mark organ as available for transplant with expiry tracking
router.post('/mark-organ-available', async (req, res) => {
  try {
    const { donorId, organType } = req.body;
    
    // Get donor information
    const donor = await DeceasedDonor.findByPk(donorId);
    if (!donor) {
      return res.status(404).json({ error: 'Donor not found' });
    }
    
    // Calculate organ expiry time based on organ-specific viability
    const organViabilityHours = {
      'Heart': 4, 'Liver': 12, 'Kidney': 24, 'Lungs': 6, 
      'Pancreas': 12, 'Corneas': 168, 'Skin': 48, 'Bone': 120,
      'Small_Intestine': 8, 'Heart_Valves': 72
    };
    
    const viabilityHours = organViabilityHours[organType] || 24;
    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() + viabilityHours);
    
    // Create organ tracking record
    const organRecord = await OrganTransplant.create({
      donor_id: donorId,
      organ_type: organType,
      transplant_status: 'Available',
      organ_viability_hours: viabilityHours,
      expiry_time: expiryTime,
      allocation_attempts: 0
    });
    
    console.log(`📝 Created organ availability record: ${organType} from donor ${donor.full_name}, expires at ${expiryTime}`);
    
    res.json({
      success: true,
      message: `${organType} marked as available for transplant`,
      organ: {
        id: organRecord.id,
        organType: organRecord.organ_type,
        donorName: donor.full_name,
        viabilityHours: viabilityHours,
        expiryTime: expiryTime,
        status: 'Available'
      }
    });
    
  } catch (error) {
    console.error('Error marking organ as available:', error);
    res.status(500).json({ error: 'Server error while marking organ as available' });
  }
});

// PUT: Mark organ as wasted/expired
router.put('/mark-organ-wasted/:organId', async (req, res) => {
  try {
    const { organId } = req.params;
    const { reason, wasteType } = req.body; // wasteType: 'Expired' or 'Wasted'
    
    const organRecord = await OrganTransplant.findByPk(organId, {
      include: [{ model: DeceasedDonor, as: 'donor' }]
    });
    
    if (!organRecord) {
      return res.status(404).json({ error: 'Organ record not found' });
    }
    
    if (organRecord.transplant_status === 'Transplanted') {
      return res.status(400).json({ error: 'Cannot mark transplanted organ as wasted' });
    }
    
    await organRecord.update({
      transplant_status: wasteType || 'Wasted',
      waste_reason: reason || 'No compatible recipients found',
      transplant_date: null // Clear any previous transplant date
    });
    
    console.log(`❌ Organ marked as ${wasteType}: ${organRecord.organ_type} from ${organRecord.donor?.full_name}`);
    console.log(`Reason: ${reason}`);
    
    res.json({
      success: true,
      message: `${organRecord.organ_type} marked as ${wasteType.toLowerCase()}`,
      organ: {
        id: organRecord.id,
        organType: organRecord.organ_type,
        donorName: organRecord.donor?.full_name,
        status: wasteType,
        reason: reason
      }
    });
    
  } catch (error) {
    console.error('Error marking organ as wasted:', error);
    res.status(500).json({ error: 'Server error while marking organ as wasted' });
  }
});

// GET: Check for expiring organs (organs approaching expiry without matches)
router.get('/expiring-organs', async (req, res) => {
  try {
    const now = new Date();
    const warningTime = new Date();
    warningTime.setHours(warningTime.getHours() + 2); // 2 hours warning
    
    const expiringOrgans = await OrganTransplant.findAll({
      where: {
        transplant_status: 'Available',
        expiry_time: {
          [Op.between]: [now, warningTime]
        }
      },
      include: [
        {
          model: DeceasedDonor,
          as: 'donor',
          attributes: ['full_name', 'blood_group', 'hospital_location']
        }
      ],
      order: [['expiry_time', 'ASC']]
    });
    
    const criticalOrgans = expiringOrgans.map(organ => {
      const hoursRemaining = Math.max(0, (organ.expiry_time - now) / (1000 * 60 * 60));
      return {
        id: organ.id,
        organType: organ.organ_type,
        donorName: organ.donor?.full_name,
        donorBloodGroup: organ.donor?.blood_group,
        location: organ.donor?.hospital_location,
        hoursRemaining: Math.round(hoursRemaining * 10) / 10,
        expiryTime: organ.expiry_time,
        allocationAttempts: organ.allocation_attempts,
        urgency: hoursRemaining <= 1 ? 'Critical' : hoursRemaining <= 2 ? 'High' : 'Medium'
      };
    });
    
    res.json({
      success: true,
      expiringOrgans: criticalOrgans,
      totalCount: criticalOrgans.length,
      criticalCount: criticalOrgans.filter(o => o.urgency === 'Critical').length
    });
    
  } catch (error) {
    console.error('Error checking expiring organs:', error);
    res.status(500).json({ error: 'Server error while checking expiring organs' });
  }
});

// GET: Organ utilization statistics
router.get('/utilization-stats', async (req, res) => {
  try {
    const stats = await sequelize.query(`
      SELECT 
        organ_type,
        COUNT(*) as total_organs,
        SUM(CASE WHEN transplant_status = 'Transplanted' THEN 1 ELSE 0 END) as transplanted,
        SUM(CASE WHEN transplant_status IN ('Wasted', 'Expired') THEN 1 ELSE 0 END) as wasted,
        SUM(CASE WHEN transplant_status = 'Available' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN transplant_status = 'Matched' THEN 1 ELSE 0 END) as matched,
        ROUND(
          (SUM(CASE WHEN transplant_status = 'Transplanted' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 
          2
        ) as utilization_rate
      FROM OrganTransplants 
      GROUP BY organ_type
      ORDER BY utilization_rate DESC
    `, {
      type: sequelize.QueryTypes.SELECT
    });
    
    // Overall statistics
    const overallStats = await sequelize.query(`
      SELECT 
        COUNT(*) as total_organs,
        SUM(CASE WHEN transplant_status = 'Transplanted' THEN 1 ELSE 0 END) as total_transplanted,
        SUM(CASE WHEN transplant_status IN ('Wasted', 'Expired') THEN 1 ELSE 0 END) as total_wasted,
        ROUND(
          (SUM(CASE WHEN transplant_status = 'Transplanted' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 
          2
        ) as overall_utilization_rate
      FROM OrganTransplants
    `, {
      type: sequelize.QueryTypes.SELECT
    });
    
    res.json({
      success: true,
      byOrganType: stats,
      overall: overallStats[0],
      wastageAnalysis: {
        totalWasted: overallStats[0].total_wasted,
        wastePercentage: (100 - overallStats[0].overall_utilization_rate).toFixed(2),
        organsAtRisk: stats.filter(s => s.utilization_rate < 70).length
      }
    });
    
  } catch (error) {
    console.error('Error getting utilization stats:', error);
    res.status(500).json({ error: 'Server error while getting utilization statistics' });
  }
});

module.exports = router;