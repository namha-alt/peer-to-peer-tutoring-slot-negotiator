const Slot = require('../model/Slot');
const Booking = require('../model/Booking');
const User = require('../model/User');

// @desc    Get all available slots for student calendar view
// @route   GET /api/slots/available
// @access  Public
exports.getAvailableSlots = async (req, res, next) => {
  try {
    const slots = await Slot.find({ status: 'available' }).populate('tutorId', 'name subjects maxCapacity');

    const formattedSlots = await Promise.all(
      slots.map(async (slot) => {
        const tutor = slot.tutorId;
        const maxCapacity = tutor ? (tutor.maxCapacity || 1) : 1;
        
        // Count active bookings for this slot
        const activeBookings = await Booking.find({
          slotId: slot._id,
          status: { $in: ['pending', 'confirmed'] }
        }).select('studentId status');

        const displaySubjects = tutor && tutor.subjects && tutor.subjects.length > 0
          ? tutor.subjects.join(', ')
          : 'General';

        return {
          id: slot._id,
          _id: slot._id,
          tutorId: tutor ? tutor._id : null,
          tutorName: tutor ? tutor.name : 'Unknown Tutor',
          tutorSubject: displaySubjects,
          tutorMaxCapacity: maxCapacity,
          day: slot.day,
          date: slot.date,
          startHour: slot.startHour,
          endHour: slot.endHour,
          status: slot.status,
          bookedCount: activeBookings.length,
          isFull: activeBookings.length >= maxCapacity,
          activeBookings: activeBookings.map(b => ({ studentId: b.studentId, status: b.status }))
        };
      })
    );

    res.status(200).json({
      success: true,
      count: formattedSlots.length,
      data: formattedSlots
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get slots created by current tutor
// @route   GET /api/slots/my
// @access  Private (Tutor only)
exports.getMySlots = async (req, res, next) => {
  try {
    const slots = await Slot.find({ tutorId: req.user._id, status: 'available' });

    const slotsWithBookings = await Promise.all(
      slots.map(async (slot) => {
        const activeBookings = await Booking.find({
          slotId: slot._id,
          status: { $in: ['pending', 'confirmed'] }
        }).populate('studentId', 'name email');

        return {
          id: slot._id,
          _id: slot._id,
          tutorId: slot.tutorId,
          day: slot.day,
          date: slot.date,
          startHour: slot.startHour,
          endHour: slot.endHour,
          status: slot.status,
          bookings: activeBookings
        };
      })
    );

    res.status(200).json({
      success: true,
      count: slotsWithBookings.length,
      data: slotsWithBookings
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle availability slot (create or remove)
// @route   POST /api/slots/toggle
// @access  Private (Tutor only)
exports.toggleSlot = async (req, res, next) => {
  try {
    const { date, startHour } = req.body;
    const hourNum = parseInt(startHour, 10);

    if (!date || isNaN(hourNum)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid date (YYYY-MM-DD) and startHour'
      });
    }

    // Only reject dates that are strictly before today's date
    const todayStr = new Date().toISOString().split('T')[0];
    if (date < todayStr) {
      return res.status(400).json({
        success: false,
        message: 'Cannot set availability for past dates'
      });
    }

    // Check if slot already exists for this tutor
    const existingSlot = await Slot.findOne({
      tutorId: req.user._id,
      date,
      startHour: hourNum
    });

    if (existingSlot) {
      // Check if slot has active bookings
      const activeBookings = await Booking.find({
        slotId: existingSlot._id,
        status: { $in: ['pending', 'confirmed'] }
      });

      if (activeBookings.length > 0) {
        return res.status(400).json({
          success: false,
          code: 'HAS_ACTIVE_BOOKINGS',
          message: 'Cannot remove this slot because students have active bookings or requests for it. Please cancel individual bookings first.'
        });
      }

      await Slot.findByIdAndDelete(existingSlot._id);
      return res.status(200).json({
        success: true,
        action: 'removed',
        message: 'Slot removed successfully'
      });
    } else {
      // Create new slot
      const dayName = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' });
      const newSlot = await Slot.create({
        tutorId: req.user._id,
        day: dayName,
        date,
        startHour: hourNum,
        endHour: hourNum + 1,
        status: 'available'
      });

      return res.status(201).json({
        success: true,
        action: 'created',
        message: 'Slot marked available',
        data: {
          id: newSlot._id,
          _id: newSlot._id,
          tutorId: newSlot.tutorId,
          day: newSlot.day,
          date: newSlot.date,
          startHour: newSlot.startHour,
          endHour: newSlot.endHour,
          status: newSlot.status
        }
      });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Cancel slot and notify/cancel all active bookings
// @route   DELETE /api/slots/:id
// @access  Private (Tutor only)
exports.deleteSlot = async (req, res, next) => {
  try {
    const slot = await Slot.findOne({ _id: req.params.id, tutorId: req.user._id });

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Slot not found or unauthorized'
      });
    }

    const cancelReason = req.body.cancelReason || 'Slot removed by tutor';
    const now = new Date();

    await Booking.updateMany(
      {
        slotId: slot._id,
        status: { $in: ['pending', 'confirmed'] }
      },
      {
        $set: {
          status: 'cancelled',
          cancelledBy: 'tutor',
          cancelledAt: now,
          cancelReason
        }
      }
    );

    await Slot.findByIdAndDelete(slot._id);

    res.status(200).json({
      success: true,
      message: 'Slot and associated bookings cancelled successfully'
    });
  } catch (err) {
    next(err);
  }
};
