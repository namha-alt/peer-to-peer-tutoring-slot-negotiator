/**
 * data.js
 * Handles data persistence (localStorage), simple client-side hashing,
 * and core business logic like interval overlap detection.
 */

const STORAGE_KEY = 'SlotSync_data';

// Initial state shape
const defaultData = {
  users: [], // { id, name, email, passwordHash, role: 'tutor' | 'student' }
  slots: [], // { id, tutorId, day, startHour, endHour, status: 'available' | 'booked' }
  bookings: [] // { id, slotId, studentId, tutorId, day, startHour, endHour, requestedAt }
};

// Very simple hash function (for demonstration/Phase 1 only - NOT SECURE for real apps)
function hashString(str) {
  let hash = 0;
  if (str.length === 0) return hash.toString();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
}

// Data Access
const db = {
  get: () => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : defaultData;
  },
  
  save: (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },
  
  generateId: () => {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
};

// --- Users ---
const userApi = {
  createUser: (name, email, password, role, subjects = [], maxCapacity = 1) => {
    const data = db.get();
    
    // Check if email exists
    if (data.users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Email is already registered');
    }
    
    // Handle backwards compatibility if a single subject string was passed
    const subjectsArray = Array.isArray(subjects) ? subjects : (subjects ? [subjects] : []);
    
    const newUser = {
      id: db.generateId(),
      name,
      email: email.toLowerCase(),
      passwordHash: hashString(password),
      role,
      subjects: role === 'tutor' ? (subjectsArray.length ? subjectsArray : ['General']) : undefined,
      maxCapacity: role === 'tutor' ? maxCapacity : undefined
    };
    
    data.users.push(newUser);
    db.save(data);
    return newUser;
  },
  
  authenticate: (email, password) => {
    const data = db.get();
    const user = data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user || user.passwordHash !== hashString(password)) {
      throw new Error('Invalid email or password');
    }
    
    return user;
  },
  
  getTutors: () => {
    const data = db.get();
    const tutors = data.users.filter(u => u.role === 'tutor');
    
    return tutors.map(tutor => {
      // Count unbooked slots
      const unbookedCount = data.slots.filter(s => s.tutorId === tutor.id && s.status === 'available').length;
      const displaySubjects = tutor.subjects ? tutor.subjects.join(', ') : (tutor.subject || 'General');
      
      return {
        id: tutor.id,
        name: tutor.name,
        subjects: displaySubjects,
        subject: displaySubjects, // backwards compatibility
        maxCapacity: tutor.maxCapacity || 1,
        openSlots: unbookedCount // This is less meaningful now with date-specific slots, but left for compatibility
      };
    });
  },
  
  setSession: (user) => {
    localStorage.setItem('SlotSync_session', JSON.stringify({
      id: user.id,
      name: user.name,
      role: user.role
    }));
  },
  
  getSession: () => {
    const session = localStorage.getItem('SlotSync_session');
    return session ? JSON.parse(session) : null;
  },
  
  clearSession: () => {
    localStorage.removeItem('SlotSync_session');
  }
};

// --- Overlap Logic ---
/**
 * Checks if interval A [startA, endA) overlaps with interval B [startB, endB)
 */
function intervalsOverlap(startA, endA, startB, endB) {
  // Overlap occurs if one interval starts before the other ends, AND ends after the other starts.
  // Using < instead of <= for end times since slots are typically open intervals at the end (e.g. 9:00 - 10:00 does not overlap with 10:00 - 11:00)
  return startA < endB && endA > startB;
}

// --- Slots & Bookings ---
const slotApi = {
  // Tutor: Get their availability
  getSlotSyncs: (tutorId) => {
    return db.get().slots.filter(s => s.tutorId === tutorId);
  },
  
  // Student: Get all available template slots across all tutors
  getAllAvailableSlots: () => {
    const data = db.get();
    return data.slots.map(slot => {
      // Enrich with tutor name and subject for display
      const tutor = data.users.find(u => u.id === slot.tutorId);
      const displaySubjects = tutor ? (tutor.subjects ? tutor.subjects.join(', ') : (tutor.subject || 'General')) : 'General';
      
      return {
        ...slot,
        tutorName: tutor ? tutor.name : 'Unknown Tutor',
        tutorSubject: displaySubjects,
        tutorMaxCapacity: tutor ? (tutor.maxCapacity || 1) : 1
      };
    }); // we don't filter by slot.status anymore, since availability is per-date
  },
  
  // Tutor: Add or remove an available slot
  toggleAvailability: (tutorId, dateStr, startHour) => {
    const data = db.get();
    const endHour = startHour + 1; // 1-hour slots
    
    // Find slot for this specific date
    const existingIndex = data.slots.findIndex(s => 
      s.tutorId === tutorId && s.date === dateStr && s.startHour === startHour
    );
    
    if (existingIndex >= 0) {
      // Slot exists
      const hasBookings = data.bookings.some(b => b.slotId === data.slots[existingIndex].id);
      if (hasBookings) {
        throw new Error('Cannot remove a slot that has bookings');
      }
      // Remove available slot
      data.slots.splice(existingIndex, 1);
    } else {
      // Add available slot
      // We still save "day" for backwards compatibility or easy reference
      const dayName = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' });
      data.slots.push({
        id: db.generateId(),
        tutorId,
        day: dayName,
        date: dateStr,
        startHour,
        endHour,
        status: 'available'
      });
    }
    
    db.save(data);
    return true; // toggled
  },
  
  // Student: Request to book a slot
  bookSlot: (studentId, slotId, dateStr) => {
    const data = db.get();
    const slot = data.slots.find(s => s.id === slotId);
    
    if (!slot) throw new Error('Slot not found');
    
    // Validate Date matches slot Date (if slots are now date-specific)
    if (slot.date && slot.date !== dateStr) {
      throw new Error('Slot date mismatch');
    }
    
    const tutor = data.users.find(u => u.id === slot.tutorId);
    const maxCap = tutor ? (tutor.maxCapacity || 1) : 1;
    
    // Check if slot is already fully booked
    const currentBookings = data.bookings.filter(b => b.slotId === slotId && b.date === dateStr);
    
    // Ensure student hasn't already booked this slot
    if (currentBookings.some(b => b.studentId === studentId)) {
      throw new Error('You have already booked this slot');
    }
    
    if (currentBookings.length >= maxCap) {
      throw new Error('Slot is fully booked');
    }
    
    // Rule 1: Weekly Fairness Cap (max 3 per student)
    const studentBookings = data.bookings.filter(b => b.studentId === studentId);
    if (studentBookings.length >= 3) {
      throw new Error('You have reached your weekly limit of 3 booking requests.');
    }
    
    // Rule 2: Overlap check - make sure student doesn't already have a booking at this time on this date
    const overlapsWithOwn = studentBookings.some(b => 
      b.date === dateStr && intervalsOverlap(b.startHour, b.endHour, slot.startHour, slot.endHour)
    );
    if (overlapsWithOwn) {
      throw new Error('This slot overlaps with one of your existing bookings.');
    }
    
    // Everything valid -> Auto-resolve (accept immediately)
    // We no longer mutate the slot template itself.
    
    const newBooking = {
      id: db.generateId(),
      slotId: slot.id,
      studentId: studentId,
      tutorId: slot.tutorId,
      day: slot.day,
      date: dateStr, // Save specific date
      startHour: slot.startHour,
      endHour: slot.endHour,
      requestedAt: new Date().toISOString()
    };
    
    data.bookings.push(newBooking);
    db.save(data);
    
    return newBooking;
  },
  
  // Get confirmed bookings for a student
  getStudentBookings: (studentId) => {
    const data = db.get();
    return data.bookings.filter(b => b.studentId === studentId).map(booking => {
      const tutor = data.users.find(u => u.id === booking.tutorId);
      return {
        ...booking,
        tutorName: tutor ? tutor.name : 'Unknown'
      };
    });
  },
  
  // Get confirmed bookings for a tutor
  getTutorBookings: (tutorId) => {
    const data = db.get();
    return data.bookings.filter(b => b.tutorId === tutorId).map(booking => {
      const student = data.users.find(u => u.id === booking.studentId);
      return {
        ...booking,
        studentName: student ? student.name : 'Unknown'
      };
    });
  },
  
  // Expose all bookings (useful for filtering in UI)
  getAllBookings: () => {
    return db.get().bookings;
  },
  
  // Get stats for profiles
  getTutorStats: (tutorId) => {
    const data = db.get();
    const bookings = data.bookings.filter(b => b.tutorId === tutorId);
    // In a real app we'd filter for past dates, but here we just count all confirmed bookings
    return {
      hoursTaught: bookings.length, // 1 hour per booking
      rating: "4.9/5" // Mock rating
    };
  },
  
  getStudentStats: (studentId) => {
    const data = db.get();
    const bookings = data.bookings.filter(b => b.studentId === studentId);
    return {
      hoursLearned: bookings.length,
      attendance: "100%" // Mock behavior
    };
  }
};
