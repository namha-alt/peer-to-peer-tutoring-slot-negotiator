

document.addEventListener('DOMContentLoaded', () => {
  
  const session = userApi.getSession();
  if (!session || session.role !== 'tutor') {
    window.location.href = 'login.html';
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
    window.location.href = 'login.html';
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
      if (headers[index + 1]) {
        headers[index + 1].textContent = `${day} (${format(currentWeekDates[index])})`;
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

    const todayStr = getLocalDateStr(new Date());

    // Mark past slots visually across all days
    DAYS.forEach((day, dayIndex) => {
      if (dayIndex >= currentWeekDates.length) return;
      const dateStr = getLocalDateStr(currentWeekDates[dayIndex]);
      if (dateStr < todayStr) {
        document.querySelectorAll(`.calendar-slot[data-day="${day}"]`).forEach(slotEl => {
          slotEl.classList.add('slot-past');
        });
      }
    });

    mySlots.forEach(slot => {
      const slotEl = document.querySelector(`.calendar-slot[data-day="${slot.day}"][data-hour="${slot.startHour}"]`);
      if (slotEl) {
        const dayIndex = DAYS.indexOf(slot.day);
        if (dayIndex === -1 || currentWeekDates.length === 0) return;
        const dateStr = getLocalDateStr(currentWeekDates[dayIndex]);
        
        if (slot.date && slot.date !== dateStr) return;
        
        const bookingsForSlot = allBookings.filter(b => b.slotId === slot.id && b.date === dateStr && b.status !== 'rejected');
        const maxCap = myTutorData ? (myTutorData.maxCapacity || 1) : 1;
        
        if (bookingsForSlot.length >= maxCap) {
          slotEl.classList.add('status-booked');
          
          if (bookingsForSlot.length === 1) {
            const data = db.get();
            const student = data.users.find(u => u.id === bookingsForSlot[0].studentId);
            const statusLabel = bookingsForSlot[0].status === 'pending' ? ' (Pending)' : '';
            slotEl.querySelector('.slot-content').textContent = `Booked by ${student ? student.name : 'Student'}${statusLabel}`;
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

    const todayStr = getLocalDateStr(new Date());
    if (dateStr < todayStr) {
      toast.show('Cannot set or modify availability for past dates.', 'error');
      return;
    }

    const existingSlot = mySlots.find(s => s.date === dateStr && s.startHour === hour);
    
    if (existingSlot) {
      const hasBookings = slotApi.getAllBookings().some(b => b.slotId === existingSlot.id && b.status !== 'rejected');
      if (hasBookings) {
        toast.show('Cannot remove a slot that has active bookings or pending requests.', 'error');
        return;
      }
    }

    try {
      slotApi.toggleAvailability(session.id, dateStr, hour);
      mySlots = slotApi.getSlotSyncs(session.id);
      applySlotData();
      renderMyBookings();
    } catch (err) {
      toast.show(err.message, 'error');
    }
  }

  function renderMyBookings() {
    const pendingContainer = document.getElementById('pending-requests-container');
    const confirmedContainer = document.getElementById('my-bookings-container');
    const pendingBadge = document.getElementById('pending-count-badge');

    if (!confirmedContainer) return;

    const todayStr = getLocalDateStr(new Date());
    const allTutorBookings = slotApi.getTutorBookings(session.id);

    // Filter out dates past the current day per user requirement
    const upcomingBookings = allTutorBookings.filter(b => b.date >= todayStr);

    const pendingList = upcomingBookings.filter(b => b.status === 'pending');
    const confirmedList = upcomingBookings.filter(b => b.status === 'confirmed');

    if (pendingBadge) {
      pendingBadge.textContent = `${pendingList.length} Pending`;
    }

    // 1. Render Pending Requests
    if (pendingContainer) {
      pendingContainer.innerHTML = '';
      if (pendingList.length === 0) {
        pendingContainer.innerHTML = `
          <div class="empty-state" style="padding: var(--space-md); text-align: left; background: var(--surface-color); border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
            <p style="margin: 0; color: var(--text-muted);">No pending student requests right now.</p>
          </div>
        `;
      } else {
        pendingList.forEach(booking => {
          const card = document.createElement('div');
          card.style.padding = 'var(--space-md)';
          card.style.backgroundColor = 'var(--surface-color)';
          card.style.border = '1px solid #FCD34D';
          card.style.borderLeft = '4px solid #F59E0B';
          card.style.borderRadius = 'var(--radius-sm)';
          card.style.marginBottom = 'var(--space-sm)';
          card.style.display = 'flex';
          card.style.justifyContent = 'space-between';
          card.style.alignItems = 'flex-start';
          card.style.gap = 'var(--space-md)';
          card.style.flexWrap = 'wrap';

          const bookingDate = new Date(booking.date + 'T00:00:00');
          const dateLabel = bookingDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

          let attachmentHtml = '';
          if (booking.attachmentName) {
            if (booking.attachmentData) {
              attachmentHtml = `
                <div style="margin-top: 6px;">
                  <a href="${booking.attachmentData}" download="${booking.attachmentName}" style="color: var(--primary-color); font-size: 0.85rem; font-weight: 500; text-decoration: underline;">
                    📎 View / Download Attached PDF: ${booking.attachmentName}
                  </a>
                </div>
              `;
            } else {
              attachmentHtml = `<div style="margin-top: 6px; color: var(--text-muted); font-size: 0.85rem;">📎 Attached File: ${booking.attachmentName}</div>`;
            }
          }

          card.innerHTML = `
            <div style="flex: 1; min-width: 250px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <strong style="font-size: 1.05rem; color: var(--text-main);">${booking.studentName}</strong>
                <span style="color: var(--text-muted); font-size: 0.85rem;">• ${dateLabel}, ${formatHour(booking.startHour)} - ${formatHour(booking.endHour)}</span>
              </div>
              <div style="margin-top: 6px; font-size: 0.95rem;">
                <strong>Topic to Study:</strong> <span style="color: var(--primary-color); font-weight: 600;">${booking.topic || 'General Tutoring'}</span>
              </div>
              ${booking.specifics ? `<div style="margin-top: 4px; color: var(--text-muted); font-size: 0.9rem;"><strong>Notes from Student:</strong> ${booking.specifics}</div>` : ''}
              ${attachmentHtml}
            </div>
            <div style="display: flex; gap: var(--space-sm); align-items: center;">
              <button class="btn btn-sm btn-success" data-action="confirm" data-id="${booking.id}">✓ Accept</button>
              <button class="btn btn-sm btn-danger" data-action="reject" data-id="${booking.id}">✕ Decline</button>
            </div>
          `;

          card.querySelector('[data-action="confirm"]').addEventListener('click', () => {
            try {
              slotApi.updateBookingStatus(booking.id, 'confirmed');
              toast.show(`Booking with ${booking.studentName} confirmed!`, 'success');
              renderMyBookings();
              applySlotData();
            } catch (err) {
              toast.show(err.message, 'error');
            }
          });

          card.querySelector('[data-action="reject"]').addEventListener('click', () => {
            if (confirm(`Are you sure you want to decline ${booking.studentName}'s request?`)) {
              try {
                slotApi.updateBookingStatus(booking.id, 'rejected');
                toast.show(`Request declined.`, 'success');
                renderMyBookings();
                applySlotData();
              } catch (err) {
                toast.show(err.message, 'error');
              }
            }
          });

          pendingContainer.appendChild(card);
        });
      }
    }

    // 2. Render Confirmed Bookings
    confirmedContainer.innerHTML = '';
    if (confirmedList.length === 0) {
      confirmedContainer.innerHTML = `
        <div class="empty-state" style="padding: var(--space-md); text-align: left; background: var(--surface-color); border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
          <p style="margin: 0; color: var(--text-muted);">No upcoming confirmed sessions.</p>
        </div>
      `;
      return;
    }

    const sorted = [...confirmedList].sort((a, b) => {
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
      card.style.alignItems = 'flex-start';
      card.style.gap = 'var(--space-md)';

      const bookingDate = new Date(booking.date + 'T00:00:00');
      const dateLabel = bookingDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

      let attachmentHtml = '';
      if (booking.attachmentName) {
        if (booking.attachmentData) {
          attachmentHtml = `
            <div style="margin-top: 6px;">
              <a href="${booking.attachmentData}" download="${booking.attachmentName}" style="color: var(--primary-color); font-size: 0.85rem; font-weight: 500; text-decoration: underline;">
                📎 Attached: ${booking.attachmentName} (Download)
              </a>
            </div>
          `;
        } else {
          attachmentHtml = `<div style="margin-top: 6px; color: var(--text-muted); font-size: 0.85rem;">📎 Attached: ${booking.attachmentName}</div>`;
        }
      }

      card.innerHTML = `
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <strong style="color: var(--primary-color); font-size: 1.05rem;">${booking.studentName}</strong>
            <span style="color: var(--text-muted); font-size: 0.85rem;">• ${dateLabel}, ${formatHour(booking.startHour)} - ${formatHour(booking.endHour)}</span>
          </div>
          <div style="margin-top: 6px; font-size: 0.95rem;">
            <strong>Topic:</strong> <span style="color: var(--text-main); font-weight: 500;">${booking.topic || 'General Tutoring'}</span>
          </div>
          ${booking.specifics ? `<div style="margin-top: 4px; color: var(--text-muted); font-size: 0.9rem;"><strong>Notes:</strong> ${booking.specifics}</div>` : ''}
          ${attachmentHtml}
        </div>
        <div>
          <span class="role-badge badge-confirmed">✓ Confirmed</span>
        </div>
      `;

      confirmedContainer.appendChild(card);
    });
  }

  
  renderCalendar();
});
