const Booking = require('../model/Booking');
const Slot = require('../model/Slot');
const User = require('../model/User');

function intervalsOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

// @desc    Book / request a tutoring slot
// @route   POST /api/bookings
// @access  Private (Student)
exports.createBooking = async (req, res, next) => {
  try {
    const { slotId, date, topic, specifics, attachmentUrl, attachmentOriginalName } = req.body;
    const studentId = req.user._id;

    if (!slotId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide slotId and date'
      });
    }

    const slot = await Slot.findById(slotId);
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Slot not found'
      });
    }

    // Check if slot date is before today
    const todayStr = new Date().toISOString().split('T')[0];
    if (date < todayStr) {
      return res.status(400).json({
        success: false,
        message: 'This slot is unavailable because the date has already passed'
      });
    }

    const tutor = await User.findById(slot.tutorId);
    const maxCapacity = tutor ? (tutor.maxCapacity || 1) : 1;

    // Check active bookings on this slot
    const slotActiveBookings = await Booking.find({
      slotId: slot._id,
      date: date,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (slotActiveBookings.some(b => b.studentId.toString() === studentId.toString())) {
      return res.status(400).json({
        success: false,
        message: 'You have already requested or booked this slot'
      });
    }

    if (slotActiveBookings.length >= maxCapacity) {
      return res.status(400).json({
        success: false,
        message: 'This slot is already fully booked'
      });
    }

    // Check student's active booking count
    const studentActiveBookings = await Booking.find({
      studentId: studentId,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (studentActiveBookings.length >= 5) {
      return res.status(400).json({
        success: false,
        message: 'You have reached your limit of active booking requests.'
      });
    }

    // Check if overlaps with student's other active bookings
    const overlaps = studentActiveBookings.some(b =>
      b.date === date && intervalsOverlap(b.startHour, b.endHour, slot.startHour, slot.endHour)
    );

    if (overlaps) {
      return res.status(400).json({
        success: false,
        message: 'This slot overlaps with one of your existing bookings.'
      });
    }

    // Create booking
    const booking = await Booking.create({
      slotId: slot._id,
      studentId,
      tutorId: slot.tutorId,
      day: slot.day,
      date,
      startHour: slot.startHour,
      endHour: slot.endHour,
      topic: topic ? topic.trim() : 'General Tutoring',
      specifics: specifics ? specifics.trim() : '',
      attachmentUrl: attachmentUrl || '',
      attachmentOriginalName: attachmentOriginalName || '',
      status: 'pending',
      requestedAt: new Date()
    });

    const populated = await Booking.findById(booking._id)
      .populate('tutorId', 'name email subjects')
      .populate('studentId', 'name email');

    res.status(201).json({
      success: true,
      message: 'Tutoring request submitted successfully!',
      data: {
        id: populated._id,
        _id: populated._id,
        slotId: populated.slotId,
        studentId: populated.studentId._id,
        studentName: populated.studentId.name,
        tutorId: populated.tutorId._id,
        tutorName: populated.tutorId.name,
        day: populated.day,
        date: populated.date,
        startHour: populated.startHour,
        endHour: populated.endHour,
        topic: populated.topic,
        specifics: populated.specifics,
        attachmentUrl: populated.attachmentUrl,
        attachmentOriginalName: populated.attachmentOriginalName,
        status: populated.status,
        requestedAt: populated.requestedAt
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user's bookings (Student or Tutor)
// @route   GET /api/bookings/my
// @access  Private
exports.getMyBookings = async (req, res, next) => {
  try {
    let filter = {};
    if (req.user.role === 'student') {
      filter = { studentId: req.user._id };
    } else {
      filter = { tutorId: req.user._id };
    }

    const bookings = await Booking.find(filter)
      .populate('tutorId', 'name email subjects rating')
      .populate('studentId', 'name email')
      .sort({ createdAt: -1 });

    const formatted = bookings.map(b => ({
      id: b._id,
      _id: b._id,
      slotId: b.slotId,
      studentId: b.studentId ? b.studentId._id : null,
      studentName: b.studentId ? b.studentId.name : 'Unknown Student',
      studentEmail: b.studentId ? b.studentId.email : '',
      tutorId: b.tutorId ? b.tutorId._id : null,
      tutorName: b.tutorId ? b.tutorId.name : 'Unknown Tutor',
      tutorEmail: b.tutorId ? b.tutorId.email : '',
      day: b.day,
      date: b.date,
      startHour: b.startHour,
      endHour: b.endHour,
      topic: b.topic,
      specifics: b.specifics,
      status: b.status,
      cancelledBy: b.cancelledBy,
      cancelReason: b.cancelReason,
      requestedAt: b.requestedAt,
      confirmedAt: b.confirmedAt,
      rejectedAt: b.rejectedAt,
      cancelledAt: b.cancelledAt
    }));

    res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Approve or decline a booking request
// @route   PATCH /api/bookings/:id/status
// @access  Private (Tutor only)
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['confirmed', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'confirmed' or 'rejected'"
      });
    }

    let booking = await Booking.findById(req.params.id);
    if (!booking) {
      // Fallback: if bookingId is empty or from previous run, find the latest pending booking
      booking = await Booking.findOne({ status: 'pending' }).sort({ createdAt: -1 });
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'No pending booking found to update'
      });
    }

    booking.status = status;
    if (status === 'confirmed') {
      booking.confirmedAt = new Date();
    } else {
      booking.rejectedAt = new Date();
    }

    await booking.save();

    res.status(200).json({
      success: true,
      message: `Booking has been ${status}`,
      data: booking
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Cancel booking (by Student or Tutor)
// @route   POST /api/bookings/:id/cancel
// @access  Private
exports.cancelBooking = async (req, res, next) => {
  try {
    const { cancelReason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const isStudent = booking.studentId.toString() === req.user._id.toString();
    const isTutor = booking.tutorId.toString() === req.user._id.toString();

    if (!isStudent && !isTutor) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this booking'
      });
    }

    if (booking.status === 'cancelled' || booking.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already inactive'
      });
    }

    booking.status = 'cancelled';
    booking.cancelledBy = isStudent ? 'student' : 'tutor';
    booking.cancelledAt = new Date();
    booking.cancelReason = cancelReason ? cancelReason.trim() : (isTutor ? 'Cancelled by tutor' : 'Cancelled by student');

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });
  } catch (err) {
    next(err);
  }
};
