/**
 * student.js
 * Handles the Student Dashboard functionality (viewing slots, booking, displaying confirmed bookings)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Session check
  const session = userApi.getSession();
  if (!session || session.role !== 'student') {
    window.location.href = 'index.html';
    return;
  }

  // Set user info
  document.getElementById('user-name-display').textContent = session.name;
  
  // Profile Stats
  const studentNameProfile = document.getElementById('student-name-profile');
  if (studentNameProfile) studentNameProfile.textContent = session.name;
  
  const stats = slotApi.getStudentStats(session.id);
  const profileAttendance = document.getElementById('profile-attendance');
  const profileHours = document.getElementById('profile-hours');
  
  if (profileAttendance) profileAttendance.textContent = stats.attendance;
  if (profileHours) profileHours.textContent = stats.hoursLearned;

  // Logout
  document.getElementById('logout-btn').addEventListener('click', () => {
    userApi.clearSession();
    window.location.href = 'index.html';
  });

  // Calendar configuration
  const START_HOUR = 8;
  const END_HOUR = 20;
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const calendarHeader = document.getElementById('calendar-header');
  const calendarBody = document.getElementById('calendar-body');
  const timeLabels = document.getElementById('time-labels');
  const statRequests = document.getElementById('stat-requests');
  const myBookingsContainer = document.getElementById('my-bookings-container');
  
  // Browse elements
  const tutorSearch = document.getElementById('tutor-search');
  const tutorFilter = document.getElementById('tutor-filter');
  const tutorCardsContainer = document.getElementById('tutor-cards-container');

  // Local State
  let availableSlots = [];
  let myBookings = [];
  let tutors = [];
  let activeFilter = 'all'; // 'all' or tutorId
  let searchQuery = '';
  
  // Week Navigation State
  let weekOffset = 0;
  let currentWeekDates = [];

  // Date Helper
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
    
    // Update headers
    const headers = document.querySelectorAll('.calendar-day-header');
    DAYS.forEach((day, index) => {
      // The first header is 'Time', so days start at index 1
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
  
  function updateDataAndUI() {
    availableSlots = slotApi.getAllAvailableSlots();
    myBookings = slotApi.getStudentBookings(session.id);
    tutors = userApi.getTutors();
    
    // Update stats
    statRequests.textContent = `${myBookings.length} / 3`;
    
    renderTutorCards();
    updateTutorDropdown();
    // Do not call applySlotData here directly, let updateWeekUI handle it if it's initialized, 
    // or if we just want to render bookings:
    if (currentWeekDates.length > 0) {
      applySlotData();
    }
    renderMyBookings();
  }

  function formatHour(hour) {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h = hour % 12 || 12;
    return `${h}:00 ${ampm}`;
  }

  // Render Calendar Shell
  function renderCalendar() {
    // Render Day Headers (empty initially)
    DAYS.forEach(day => {
      const headerEl = document.createElement('div');
      headerEl.className = 'calendar-day-header';
      headerEl.textContent = day;
      calendarHeader.appendChild(headerEl);
    });

    // Render Time Labels
    for (let h = START_HOUR; h < END_HOUR; h++) {
      const labelEl = document.createElement('div');
      labelEl.className = 'time-label';
      labelEl.textContent = formatHour(h);
      timeLabels.appendChild(labelEl);
    }

    // Render Day Columns and Slots
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
        
        colEl.appendChild(slotEl);
      }
      
      calendarBody.appendChild(colEl);
    });
    updateDataAndUI(); // Initializes myBookings, availableSlots, etc.
    updateWeekUI(); // Applies slots using currentWeekDates
  }
  
  // Browse Tutors Logic
  function renderTutorCards() {
    tutorCardsContainer.innerHTML = '';
    
    const filteredTutors = tutors.filter(t => 
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    if (filteredTutors.length === 0) {
      tutorCardsContainer.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1; padding: var(--space-md);">No tutors match your search.</div>`;
      return;
    }
    
    filteredTutors.forEach(tutor => {
      const card = document.createElement('div');
      card.className = `tutor-card ${activeFilter === tutor.id ? 'active' : ''}`;
      card.innerHTML = `
        <div class="tutor-card-name">${tutor.name}</div>
        <div class="tutor-card-subject">${tutor.subject}</div>
        <div class="tutor-card-slots">${tutor.openSlots} open slots</div>
      `;
      
      card.addEventListener('click', () => {
        if (activeFilter === tutor.id) {
          activeFilter = 'all'; // toggle off
        } else {
          activeFilter = tutor.id;
        }
        tutorFilter.value = activeFilter;
        renderTutorCards();
        applySlotData();
      });
      
      tutorCardsContainer.appendChild(card);
    });
  }
  
  function updateTutorDropdown() {
    // Keep 'All Tutors' option
    tutorFilter.innerHTML = '<option value="all">All Tutors</option>';
    tutors.forEach(tutor => {
      const option = document.createElement('option');
      option.value = tutor.id;
      option.textContent = `${tutor.name} (${tutor.subject})`;
      tutorFilter.appendChild(option);
    });
    tutorFilter.value = activeFilter;
  }
  
  // Event Listeners for Browse Controls
  if (tutorSearch) {
    tutorSearch.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderTutorCards();
    });
  }
  
  if (tutorFilter) {
    tutorFilter.addEventListener('change', (e) => {
      activeFilter = e.target.value;
      renderTutorCards();
      applySlotData();
    });
  }

  // Apply available slots & own bookings to the UI
  function applySlotData() {
    // Reset all slots first
    document.querySelectorAll('.calendar-slot').forEach(el => {
      el.className = 'calendar-slot';
      el.querySelector('.slot-content').textContent = '';
      
      // Remove previous event listeners by cloning (quickest way)
      const clone = el.cloneNode(true);
      el.parentNode.replaceChild(clone, el);
    });

    // 1. Plot student's own bookings first
    myBookings.forEach(booking => {
      const slotEl = document.querySelector(`.calendar-slot[data-day="${booking.day}"][data-hour="${booking.startHour}"]`);
      if (slotEl) {
        slotEl.classList.add('own-booking');
        slotEl.querySelector('.slot-content').textContent = `With ${booking.tutorName}`;
      }
    });

    // 2. Plot available slots
    // Filter slots based on active tutor filter
    const slotsToDisplay = activeFilter === 'all' 
      ? availableSlots 
      : availableSlots.filter(s => s.tutorId === activeFilter);
      
    const allBookings = slotApi.getAllBookings();
      
    // Handle case where multiple tutors might be available at the same time
    slotsToDisplay.forEach(slot => {
      const dayIndex = DAYS.indexOf(slot.day);
      if (dayIndex === -1 || currentWeekDates.length === 0) return;
      const dateStr = getLocalDateStr(currentWeekDates[dayIndex]);
      
      // Ignore if slot isn't for this specific date or has no date
      if (slot.date && slot.date !== dateStr) return;
      
      // Calculate capacity
      const currentBookings = allBookings.filter(b => b.slotId === slot.id && b.date === dateStr);
      const maxCap = slot.tutorMaxCapacity || 1;
      
      // If it's fully booked, skip
      if (currentBookings.length >= maxCap) return;
      
      const slotEl = document.querySelector(`.calendar-slot[data-day="${slot.day}"][data-hour="${slot.startHour}"]`);
      if (slotEl && !slotEl.classList.contains('own-booking')) {
        let displayLabel = `${slot.tutorName} — ${slot.tutorSubject}`;
        if (maxCap > 1) {
          displayLabel += ` (${currentBookings.length}/${maxCap})`;
        }
        
        // If it already has an available slot from another tutor
        if (slotEl.classList.contains('student-bookable')) {
           // Append a "+1" indicator or similar if multiple (simplification for Phase 1)
           if (!slotEl.querySelector('.slot-content').textContent.includes('&')) {
             slotEl.querySelector('.slot-content').textContent += ` & others`;
           }
        } else {
          slotEl.classList.add('student-bookable');
          slotEl.querySelector('.slot-content').textContent = displayLabel;
          
          // Click handler to book
          slotEl.onclick = () => handleBookSlot(slot.id, dateStr);
        }
      }
    });
  }

  function handleBookSlot(slotId, dateStr) {
    if (confirm('Do you want to book this tutoring slot?')) {
      try {
        slotApi.bookSlot(session.id, slotId, dateStr);
        toast.show('Slot successfully booked!', 'success');
        updateDataAndUI();
      } catch (err) {
        toast.show(err.message, 'error');
      }
    }
  }

  // Render My Bookings List
  function renderMyBookings() {
    myBookingsContainer.innerHTML = '';
    
    if (myBookings.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.innerHTML = `
        <h3>No bookings yet</h3>
        <p>Browse the calendar above to find and request a tutoring slot.</p>
      `;
      myBookingsContainer.appendChild(emptyState);
      return;
    }
    
    // Sort bookings by date and time
    const sorted = [...myBookings].sort((a, b) => {
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
      
      const bookingDate = new Date(booking.date + 'T00:00:00'); // Force local time
      const dateLabel = bookingDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      
      card.innerHTML = `
        <div>
          <strong style="color: var(--primary-color);">${booking.tutorName}</strong>
          <div style="color: var(--text-muted); font-size: 0.9rem; margin-top: 4px;">
            ${dateLabel}, ${formatHour(booking.startHour)} - ${formatHour(booking.endHour)}
          </div>
        </div>
        <div>
          <span class="role-badge" style="background-color: var(--accent-own-booking); color: var(--primary-color); border-color: var(--accent-own-booking-border);">Confirmed</span>
        </div>
      `;
      
      myBookingsContainer.appendChild(card);
    });
  }

  // Initialize
  renderCalendar();
});
