const User = require('../model/User');
const Slot = require('../model/Slot');
const Booking = require('../model/Booking');

// @desc    Get all tutors with available slots and subject info
// @route   GET /api/users/tutors
// @access  Public
exports.getTutors = async (req, res, next) => {
  try {
    const tutors = await User.find({ role: 'tutor' }).select('name subjects maxCapacity rating');
    
    // For each tutor, count available slots
    const tutorData = await Promise.all(
      tutors.map(async (tutor) => {
        const slots = await Slot.find({ tutorId: tutor._id, status: 'available' });
        
        // Count slots that are not fully booked
        let openSlotsCount = 0;
        for (const slot of slots) {
          const activeBookings = await Booking.countDocuments({
            slotId: slot._id,
            status: { $in: ['pending', 'confirmed'] }
          });
          if (activeBookings < (tutor.maxCapacity || 1)) {
            openSlotsCount++;
          }
        }

        const displaySubjects = tutor.subjects && tutor.subjects.length > 0 
          ? tutor.subjects.join(', ') 
          : 'General';

        return {
          id: tutor._id,
          name: tutor.name,
          subjects: displaySubjects,
          subject: displaySubjects,
          maxCapacity: tutor.maxCapacity || 1,
          rating: tutor.rating || '4.9/5',
          openSlots: openSlotsCount
        };
      })
    );

    res.status(200).json({
      success: true,
      count: tutorData.length,
      data: tutorData
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update tutor max student capacity per slot
// @route   PUT /api/users/tutor/capacity
// @access  Private (Tutor only)
exports.updateTutorCapacity = async (req, res, next) => {
  try {
    const { maxCapacity } = req.body;
    const capacityNum = parseInt(maxCapacity, 10);

    if (isNaN(capacityNum) || capacityNum < 1 || capacityNum > 10) {
      return res.status(400).json({
        success: false,
        message: 'Capacity must be an integer between 1 and 10'
      });
    }

    req.user.maxCapacity = capacityNum;
    await req.user.save();

    res.status(200).json({
      success: true,
      message: 'Max student capacity updated successfully',
      maxCapacity: req.user.maxCapacity
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get dashboard metrics & stats for current user
// @route   GET /api/users/stats
// @access  Private
exports.getUserStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    if (req.user.role === 'tutor') {
      const confirmedBookingsCount = await Booking.countDocuments({
        tutorId: userId,
        status: 'confirmed'
      });
      const pendingCount = await Booking.countDocuments({
        tutorId: userId,
        status: 'pending'
      });
      const availableSlotsCount = await Slot.countDocuments({
        tutorId: userId,
        status: 'available'
      });

      return res.status(200).json({
        success: true,
        data: {
          hoursTaught: confirmedBookingsCount,
          rating: req.user.rating || '4.9/5',
          availableSlots: availableSlotsCount,
          pendingRequests: pendingCount,
          confirmedSessions: confirmedBookingsCount
        }
      });
    } else {
      const confirmedBookingsCount = await Booking.countDocuments({
        studentId: userId,
        status: 'confirmed'
      });
      const activeRequestsCount = await Booking.countDocuments({
        studentId: userId,
        status: { $in: ['pending', 'confirmed'] }
      });

      return res.status(200).json({
        success: true,
        data: {
          hoursLearned: confirmedBookingsCount,
          attendance: '100%',
          activeRequests: activeRequestsCount,
          weeklyLimit: 3
        }
      });
    }
  } catch (err) {
    next(err);
  }
};
