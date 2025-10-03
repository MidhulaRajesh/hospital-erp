const express = require('express');
const router = express.Router();
const Appointment = require('../model/Appointment');
const Patient = require('../model/Patient');
const Doctor = require('../model/Doctor');
const { Op } = require('sequelize');
const sequelize = require('../db');

// Get all booked slots for a specific date and doctor
router.get('/booked-slots', async (req, res) => {
  try {
    const { doctor_id, appointment_date } = req.query;
    
    if (!doctor_id || !appointment_date) {
      return res.status(400).json({ 
        error: 'Doctor ID and appointment date are required' 
      });
    }

    const bookedSlots = await Appointment.findAll({
      where: {
        doctor_id: doctor_id,
        appointment_date: appointment_date,
        status: {
          [Op.in]: ['scheduled', 'completed']
        }
      },
      attributes: ['appointment_time'],
      raw: true
    });

    const slots = bookedSlots.map(slot => slot.appointment_time);
    res.json({ bookedSlots: slots });
  } catch (error) {
    console.error('Error fetching booked slots:', error);
    res.status(500).json({ error: 'Failed to fetch booked slots' });
  }
});

// Create a new appointment
router.post('/book', async (req, res) => {
  try {
    const {
      patient_id,
      doctor_id,
      doctor_name,
      doctor_specialty,
      doctor_hospital,
      appointment_date,
      appointment_time,
      appointment_type,
      consultation_fee,
      reason
    } = req.body;

    // Validate required fields
    if (!patient_id || !doctor_id || !doctor_name || !appointment_date || !appointment_time) {
      return res.status(400).json({ 
        error: 'Missing required fields' 
      });
    }

    // Check if slot is already booked
    const existingAppointment = await Appointment.findOne({
      where: {
        doctor_id,
        appointment_date,
        appointment_time,
        status: {
          [Op.in]: ['scheduled', 'completed']
        }
      }
    });

    if (existingAppointment) {
      return res.status(409).json({ 
        error: 'This time slot is already booked' 
      });
    }

    // Create new appointment
    const appointment = await Appointment.create({
      patient_id,
      doctor_id,
      doctor_name,
      doctor_specialty,
      doctor_hospital,
      appointment_date,
      appointment_time,
      appointment_type: appointment_type || 'consultation',
      consultation_fee,
      reason: reason || null
    });

    // Fetch the created appointment with patient details
    const createdAppointment = await Appointment.findByPk(appointment.id, {
      include: [{
        model: Patient,
        as: 'patient',
        attributes: ['full_name', 'email', 'contact_number']
      }]
    });

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment: createdAppointment
    });
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ error: 'Failed to book appointment' });
  }
});

// Get patient's appointments
router.get('/patient/:patient_id', async (req, res) => {
  try {
    const { patient_id } = req.params;
    const { status, limit = 20, offset = 0 } = req.query;

    const whereCondition = { patient_id };
    if (status) {
      whereCondition.status = status;
    }

    const appointments = await Appointment.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['full_name', 'email', 'contact_number']
        }
      ],
      order: [['appointment_date', 'DESC'], ['appointment_time', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Fetch doctor information for each appointment
    const appointmentsWithDoctorInfo = await Promise.all(
      appointments.rows.map(async (appointment) => {
        try {
          const doctor = await Doctor.findByPk(appointment.doctor_id, {
            attributes: ['profile_image', 'full_name', 'specialization', 'department']
          });
          
          return {
            ...appointment.toJSON(),
            doctor_profile_image: doctor?.profile_image || null,
            doctor_department: doctor?.department || appointment.doctor_hospital
          };
        } catch (error) {
          console.error('Error fetching doctor info for appointment:', appointment.id, error);
          return appointment.toJSON();
        }
      })
    );

    res.json({
      appointments: appointmentsWithDoctorInfo,
      total: appointments.count,
      hasMore: appointments.count > parseInt(offset) + parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching patient appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Update appointment status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['scheduled', 'completed', 'cancelled', 'no-show'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status value' 
      });
    }

    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    await appointment.update({
      status,
      notes: notes || appointment.notes,
      updated_at: new Date()
    });

    res.json({
      message: 'Appointment status updated successfully',
      appointment
    });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({ error: 'Failed to update appointment status' });
  }
});

// Cancel appointment
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    await appointment.update({
      status: 'cancelled',
      notes: reason || 'Cancelled by patient',
      updated_at: new Date()
    });

    res.json({
      message: 'Appointment cancelled successfully',
      appointment
    });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

// Get appointment statistics
router.get('/stats', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    const whereCondition = {};
    if (start_date && end_date) {
      whereCondition.appointment_date = {
        [Op.between]: [start_date, end_date]
      };
    }

    const stats = await Appointment.findAll({
      where: whereCondition,
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('status')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching appointment stats:', error);
    res.status(500).json({ error: 'Failed to fetch appointment statistics' });
  }
});

module.exports = router;