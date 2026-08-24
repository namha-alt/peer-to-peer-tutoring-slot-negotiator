

document.addEventListener('DOMContentLoaded', () => {
  
  const session = userApi.getSession();
  if (!session || session.role !== 'tutor') {
    window.location.href = 'index.html';
    return;
  }

  
  document.getElementById('user-name-display').textContent = session.name;
  
  
  const tutorNameProfile = document.getElementById('tutor-name-profile');
  if (tutorNameProfile) tutorNameProfile.textContent = session.name;
  
  const stats = slotApi.getTutorStats(session.id);
  const profileRating = document.getElementById('profile-rating');
  const profileHours = document.getElementById('profile-hours');
  const profileSubjects = document.getElementById('profile-subjects');
  
  if (profileRating) profileRating.textContent = stats.rating;
  if (profileHours) profileHours.textContent = stats.hoursTaught;
  
  
  const tutors = userApi.getTutors();
  const myTutorData = tutors.find(t => t.id === session.id);
  if (profileSubjects && myTutorData) {
    profileSubjects.textContent = myTutorData.subjects;
  }

  
  document.getElementById('logout-btn').addEventListener('click', () => {
    userApi.clearSession();
    window.location.href = 'index.html';
  });

  
  const capacityInput = document.getElementById('tutor-capacity-setting');
  if (capacityInput) {
    const tutors = userApi.getTutors();
    const myTutorData = tutors.find(t => t.id === session.id);
    capacityInput.value = myTutorData && myTutorData.maxCapacity ? myTutorData.maxCapacity : 1;
    
    capacityInput.addEventListener('change', (e) => {
      const newVal = parseInt(e.target.value, 10);
      if (newVal >= 1) {
        
        const data = db.get();
        const userIndex = data.users.findIndex(u => u.id === session.id);
        if (userIndex >= 0) {
          data.users[userIndex].maxCapacity = newVal;
          db.save(data);
          toast.show('Capacity updated successfully', 'success');
          applySlotData(); 
        }
      }
    });
  }

  
  const START_HOUR = 8; 
  const END_HOUR = 20;  
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const calendarHeader = document.getElementById('calendar-header');
  const calendarBody = document.getElementById('calendar-body');
  const timeLabels = document.getElementById('time-labels');
  const statAvailable = document.getElementById('stat-available');
  const statBooked = document.getElementById('stat-booked');

  
  let mySlots = slotApi.getSlotSyncs(session.id);
  
  
  let weekOffset = 0;
  let currentWeekDates = [];

  
  function getLocalDateStr(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function getWeekDates(offset) {
    const today = new Date();
    
    const day = today.getDay() || 7;
    today.setDate(today.getDate() - day + 1 + (offset * 7));
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d);
    }
    return dates;
  }
  
  function updateWeekUI() {
    currentWeekDates = getWeekDates(weekOffset);
    const format = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    document.getElementById('week-label').textContent = `${format(currentWeekDates[0])} - ${format(currentWeekDates[6])}`;
    
    
    const headers = document.querySelectorAll('.calendar-day-header');
    DAYS.forEach((day, index) => {
      if (headers[index]) {
        headers[index].textContent = `${day} (${format(currentWeekDates[index])})`;
      }
    });
    
    applySlotData();
  }
  
  document.getElementById('prev-week-btn').addEventListener('click', () => {
    weekOffset--;
    updateWeekUI();
  });
  
  document.getElementById('next-week-btn').addEventListener('click', () => {
    weekOffset++;
    updateWeekUI();
  });
  
  function updateStats() {
    
    
    let availableCount = 0;
    let bookedCount = 0;
    
    const allBookings = slotApi.getAllBookings().filter(b => b.tutorId === session.id);
    
    mySlots.forEach(slot => {
      
      const dayIndex = DAYS.indexOf(slot.day);
      if (dayIndex === -1 || currentWeekDates.length === 0) return;
      const dateStr = getLocalDateStr(currentWeekDates[dayIndex]);
      
      
      if (slot.date && slot.date !== dateStr) return;
      
      
      const bookingsForSlot = allBookings.filter(b => b.slotId === slot.id && b.date === dateStr);
      
      const tutors = userApi.getTutors();
      const myTutorData = tutors.find(t => t.id === session.id);
      const maxCap = myTutorData ? (myTutorData.maxCapacity || 1) : 1;
      
      if (bookingsForSlot.length >= maxCap) bookedCount++;
      else availableCount++;
    });
    
    statAvailable.textContent = availableCount;
    statBooked.textContent = bookedCount;
  }

  
  function formatHour(hour) {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h = hour % 12 || 12;
    return `${h}:00 ${ampm}`;
  }

  
  function renderCalendar() {
    
    DAYS.forEach(day => {
      const headerEl = document.createElement('div');
      headerEl.className = 'calendar-day-header';
      headerEl.textContent = day;
      calendarHeader.appendChild(headerEl);
    });

    
    for (let h = START_HOUR; h < END_HOUR; h++) {
      const labelEl = document.createElement('div');
      labelEl.className = 'time-label';
      labelEl.textContent = formatHour(h);
      timeLabels.appendChild(labelEl);
    }

    
    DAYS.forEach(day => {
      const colEl = document.createElement('div');
      colEl.className = 'calendar-day-col';
      colEl.dataset.day = day; 

      for (let h = START_HOUR; h < END_HOUR; h++) {
        const slotEl = document.createElement('div');
        slotEl.className = 'calendar-slot';
        slotEl.dataset.day = day;
        slotEl.dataset.hour = h;
        
        
        const contentEl = document.createElement('div');
        contentEl.className = 'slot-content';
        slotEl.appendChild(contentEl);
        
        
        slotEl.addEventListener('click', () => handleSlotClick(day, h));
        
        colEl.appendChild(slotEl);
      }
      
      calendarBody.appendChild(colEl);
    });
    
    
    updateWeekUI();
    renderMyBookings();
  }

  
  function applySlotData() {
    
    document.querySelectorAll('.calendar-slot').forEach(el => {
      el.className = 'calendar-slot';
      el.querySelector('.slot-content').textContent = '';
    });

    // Get my subject
    const tutors = userApi.getTutors();
    const myTutorData = tutors.find(t => t.id === session.id);
    const mySubject = myTutorData ? myTutorData.subject : 'General';
    const baseLabel = `${session.name} — ${mySubject}`;
    
    const allBookings = slotApi.getAllBookings();

    mySlots.forEach(slot => {
      const slotEl = document.querySelector(`.calendar-slot[data-day="${slot.day}"][data-hour="${slot.startHour}"]`);
      if (slotEl) {
        const dayIndex = DAYS.indexOf(slot.day);
        if (dayIndex === -1 || currentWeekDates.length === 0) return;
        const dateStr = getLocalDateStr(currentWeekDates[dayIndex]);
        
        
        if (slot.date && slot.date !== dateStr) return;
        
        const bookingsForSlot = allBookings.filter(b => b.slotId === slot.id && b.date === dateStr);
        const maxCap = myTutorData ? (myTutorData.maxCapacity || 1) : 1;
        
        if (bookingsForSlot.length >= maxCap) {
          slotEl.classList.add('status-booked');
          
          if (bookingsForSlot.length === 1) {
            const data = db.get();
            const student = data.users.find(u => u.id === bookingsForSlot[0].studentId);
            slotEl.querySelector('.slot-content').textContent = `Booked by ${student ? student.name : 'Student'}`;
          } else {
            slotEl.querySelector('.slot-content').textContent = `Fully Booked (${bookingsForSlot.length}/${maxCap})`;
          }
        } else if (bookingsForSlot.length > 0) {
           slotEl.classList.add('tutor-available');
           slotEl.querySelector('.slot-content').textContent = `${bookingsForSlot.length}/${maxCap} Booked — Available`;
        } else {
          slotEl.classList.add('tutor-available');
          slotEl.querySelector('.slot-content').textContent = baseLabel;
        }
      }
    });
    
    updateStats();
  }

  
  function handleSlotClick(day, hour) {
    const dayIndex = DAYS.indexOf(day);
    if (dayIndex === -1 || currentWeekDates.length === 0) return;
    const dateStr = getLocalDateStr(currentWeekDates[dayIndex]);

    
    const existingSlot = mySlots.find(s => s.date === dateStr && s.startHour === hour);
    
    if (existingSlot) {
      
      const hasBookings = slotApi.getAllBookings().some(b => b.slotId === existingSlot.id);
      if (hasBookings) {
        toast.show('Cannot remove a slot that has existing bookings.', 'error');
        return;
      }
    }

    try {
      
      slotApi.toggleAvailability(session.id, dateStr, hour);
      
      
      mySlots = slotApi.getSlotSyncs(session.id);
      applySlotData();
      
    } catch (err) {
      toast.show(err.message, 'error');
    }
  }

  
  function renderMyBookings() {
    const myBookingsContainer = document.getElementById('my-bookings-container');
    if (!myBookingsContainer) return;
    
    myBookingsContainer.innerHTML = '';
    
    const tutorBookings = slotApi.getTutorBookings(session.id);
    
    if (tutorBookings.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.innerHTML = `
        <h3>No bookings yet</h3>
        <p>When students book your slots, they will appear here.</p>
      `;
      myBookingsContainer.appendChild(emptyState);
      return;
    }
    
    
    const sorted = [...tutorBookings].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startHour - b.startHour;
    });
    
    sorted.forEach(booking => {
      const card = document.createElement('div');
      card.style.padding = 'var(--space-md)';
      card.style.backgroundColor = 'var(--surface-color)';
      card.style.border = '1px solid var(--border-color)';
      card.style.borderRadius = 'var(--radius-sm)';
      card.style.marginBottom = 'var(--space-sm)';
      card.style.display = 'flex';
      card.style.justifyContent = 'space-between';
      card.style.alignItems = 'center';
      
      const bookingDate = new Date(booking.date + 'T00:00:00'); 
      const dateLabel = bookingDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      
      card.innerHTML = `
        <div>
          <strong style="color: var(--primary-color);">${booking.studentName}</strong>
          <div style="color: var(--text-muted); font-size: 0.9rem; margin-top: 4px;">
            ${dateLabel}, ${formatHour(booking.startHour)} - ${formatHour(booking.endHour)}
          </div>
        </div>
        <div>
          <span class="role-badge" style="background-color: var(--accent-booked); color: var(--text-main); border-color: var(--accent-booked-border);">Booked</span>
        </div>
      `;
      
      myBookingsContainer.appendChild(card);
    });
  }

  
  renderCalendar();
});
