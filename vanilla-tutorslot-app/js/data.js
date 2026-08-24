

const STORAGE_KEY = 'SlotSync_data';


const defaultData = {
  users: [], 
  slots: [], 
  bookings: [] 
};


function hashString(str) {
  let hash = 0;
  if (str.length === 0) return hash.toString();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; 
  }
  return hash.toString();
}


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


const userApi = {
  createUser: (name, email, password, role, subjects = [], maxCapacity = 1) => {
    const data = db.get();
    
    
    if (data.users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Email is already registered');
    }
    
    
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
      
      const unbookedCount = data.slots.filter(s => s.tutorId === tutor.id && s.status === 'available').length;
      const displaySubjects = tutor.subjects ? tutor.subjects.join(', ') : (tutor.subject || 'General');
      
      return {
        id: tutor.id,
        name: tutor.name,
        subjects: displaySubjects,
        subject: displaySubjects, 
        maxCapacity: tutor.maxCapacity || 1,
        openSlots: unbookedCount 
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



function intervalsOverlap(startA, endA, startB, endB) {
  
  
  return startA < endB && endA > startB;
}


const slotApi = {
  
  getSlotSyncs: (tutorId) => {
    return db.get().slots.filter(s => s.tutorId === tutorId);
  },
  
  
  getAllAvailableSlots: () => {
    const data = db.get();
    return data.slots.map(slot => {
      
      const tutor = data.users.find(u => u.id === slot.tutorId);
      const displaySubjects = tutor ? (tutor.subjects ? tutor.subjects.join(', ') : (tutor.subject || 'General')) : 'General';
      
      return {
        ...slot,
        tutorName: tutor ? tutor.name : 'Unknown Tutor',
        tutorSubject: displaySubjects,
        tutorMaxCapacity: tutor ? (tutor.maxCapacity || 1) : 1
      };
    }); 
  },
  
  
  toggleAvailability: (tutorId, dateStr, startHour) => {
    const data = db.get();
    const endHour = startHour + 1; 
    
    
    const existingIndex = data.slots.findIndex(s => 
      s.tutorId === tutorId && s.date === dateStr && s.startHour === startHour
    );
    
    if (existingIndex >= 0) {
      
      const hasBookings = data.bookings.some(b => b.slotId === data.slots[existingIndex].id);
      if (hasBookings) {
        throw new Error('Cannot remove a slot that has bookings');
      }
      
      data.slots.splice(existingIndex, 1);
    } else {
      
      
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
    return true; 
  },
  
  
  bookSlot: (studentId, slotId, dateStr) => {
    const data = db.get();
    const slot = data.slots.find(s => s.id === slotId);
    
    if (!slot) throw new Error('Slot not found');
    
    
    if (slot.date && slot.date !== dateStr) {
      throw new Error('Slot date mismatch');
    }
    
    const tutor = data.users.find(u => u.id === slot.tutorId);
    const maxCap = tutor ? (tutor.maxCapacity || 1) : 1;
    
    
    const currentBookings = data.bookings.filter(b => b.slotId === slotId && b.date === dateStr);
    
    
    if (currentBookings.some(b => b.studentId === studentId)) {
      throw new Error('You have already booked this slot');
    }
    
    if (currentBookings.length >= maxCap) {
      throw new Error('Slot is fully booked');
    }
    
    
    const studentBookings = data.bookings.filter(b => b.studentId === studentId);
    if (studentBookings.length >= 3) {
      throw new Error('You have reached your weekly limit of 3 booking requests.');
    }
    
    
    const overlapsWithOwn = studentBookings.some(b => 
      b.date === dateStr && intervalsOverlap(b.startHour, b.endHour, slot.startHour, slot.endHour)
    );
    if (overlapsWithOwn) {
      throw new Error('This slot overlaps with one of your existing bookings.');
    }
    
    
    
    
    const newBooking = {
      id: db.generateId(),
      slotId: slot.id,
      studentId: studentId,
      tutorId: slot.tutorId,
      day: slot.day,
      date: dateStr, 
      startHour: slot.startHour,
      endHour: slot.endHour,
      requestedAt: new Date().toISOString()
    };
    
    data.bookings.push(newBooking);
    db.save(data);
    
    return newBooking;
  },
  
  
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
  
  
  getAllBookings: () => {
    return db.get().bookings;
  },
  
  
  getTutorStats: (tutorId) => {
    const data = db.get();
    const bookings = data.bookings.filter(b => b.tutorId === tutorId);
    
    return {
      hoursTaught: bookings.length, 
      rating: "4.9/5" 
    };
  },
  
  getStudentStats: (studentId) => {
    const data = db.get();
    const bookings = data.bookings.filter(b => b.studentId === studentId);
    return {
      hoursLearned: bookings.length,
      attendance: "100%" 
    };
  }
};
