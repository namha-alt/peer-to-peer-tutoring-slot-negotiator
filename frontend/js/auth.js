

document.addEventListener('DOMContentLoaded', () => {
  
  const session = userApi.getSession();
  if (session) {
    window.location.href = session.role === 'tutor' ? 'tutor.html' : 'student.html';
    return;
  }

  
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const toggleLink = document.getElementById('toggle-link');
  const toggleText = document.getElementById('toggle-text');
  const authSubtitle = document.getElementById('auth-subtitle');
  
  const signupRole = document.getElementById('signup-role');
  const tutorSubjectGroup = document.getElementById('tutor-subject-group');
  const subjectCheckboxes = document.querySelectorAll('input[name="subject"]');
  const tutorSubjectOtherGroup = document.getElementById('tutor-subject-other-group');
  const signupSubjectOther = document.getElementById('signup-subject-other');
  const signupSubjectOtherCb = document.getElementById('signup-subject-other-cb');
  const tutorCapacityGroup = document.getElementById('tutor-capacity-group');
  const signupCapacity = document.getElementById('signup-capacity');

  let isLogin = true;

  
  const handleToggle = (e) => {
    e.preventDefault();
    isLogin = !isLogin;
    
    if (isLogin) {
      loginForm.classList.remove('hidden');
      signupForm.classList.add('hidden');
      authSubtitle.textContent = 'Sign in to your account';
      toggleText.innerHTML = `Don't have an account? <a href="#" id="toggle-link">Sign up</a>`;
    } else {
      loginForm.classList.add('hidden');
      signupForm.classList.remove('hidden');
      authSubtitle.textContent = 'Create a new account';
      toggleText.innerHTML = `Already have an account? <a href="#" id="toggle-link">Sign in</a>`;
    }
    
    
    document.getElementById('toggle-link').addEventListener('click', handleToggle);
  };

  toggleLink.addEventListener('click', handleToggle);

  
  if (signupRole && tutorSubjectGroup && tutorSubjectOtherGroup) {
    signupRole.addEventListener('change', (e) => {
      if (e.target.value === 'tutor') {
        tutorSubjectGroup.classList.remove('hidden');
        if (tutorCapacityGroup) tutorCapacityGroup.classList.remove('hidden');
      } else {
        tutorSubjectGroup.classList.add('hidden');
        tutorSubjectOtherGroup.classList.add('hidden');
        if (tutorCapacityGroup) tutorCapacityGroup.classList.add('hidden');
      }
    });

    if (signupSubjectOtherCb) {
      signupSubjectOtherCb.addEventListener('change', (e) => {
        if (e.target.checked) {
          tutorSubjectOtherGroup.classList.remove('hidden');
        } else {
          tutorSubjectOtherGroup.classList.add('hidden');
        }
      });
    }
  }

  
  const showError = (id, message) => {
    const errorEl = document.getElementById(`${id}-error`);
    if (errorEl) {
      errorEl.textContent = message;
      document.getElementById(id).style.borderColor = 'var(--error-color)';
    }
  };

  const clearErrors = (formId) => {
    const form = document.getElementById(formId);
    const errors = form.querySelectorAll('.error-message');
    const inputs = form.querySelectorAll('input');
    
    errors.forEach(e => e.textContent = '');
    inputs.forEach(i => i.style.borderColor = '');
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Login Submit
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors('login-form');
    
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    
    let isValid = true;
    
    if (!validateEmail(email)) {
      showError('login-email', 'Please enter a valid email address');
      isValid = false;
    }
    
    if (password.length === 0) {
      showError('login-password', 'Password is required');
      isValid = false;
    }
    
    if (!isValid) return;
    
    try {
      const user = userApi.authenticate(email, password);
      userApi.setSession(user);
      toast.show('Login successful!');
      
      
      setTimeout(() => {
        window.location.href = user.role === 'tutor' ? 'tutor.html' : 'student.html';
      }, 500);
    } catch (err) {
      showError('login-password', err.message);
      toast.show(err.message, 'error');
    }
  });

  
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors('signup-form');
    
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const role = document.getElementById('signup-role').value;
    
    let subjects = [];
    let maxCapacity = 1;
    if (role === 'tutor') {
      const checkedBoxes = document.querySelectorAll('input[name="subject"]:checked');
      checkedBoxes.forEach(cb => {
        if (cb.value === 'Other') {
          if (signupSubjectOther.value.trim()) subjects.push(signupSubjectOther.value.trim());
        } else {
          subjects.push(cb.value);
        }
      });
      maxCapacity = parseInt(signupCapacity.value, 10) || 1;
    }
    
    let isValid = true;
    
    if (name.length < 2) {
      showError('signup-name', 'Name must be at least 2 characters');
      isValid = false;
    }
    
    if (!validateEmail(email)) {
      showError('signup-email', 'Please enter a valid email address');
      isValid = false;
    }
    
    if (password.length < 6) {
      showError('signup-password', 'Password must be at least 6 characters');
      isValid = false;
    }
    
    if (role === 'tutor' && subjects.length === 0) {
      showError('signup-name', 'Please select at least one subject'); 
      isValid = false;
    }
    
    if (!isValid) return;
    
    try {
      const user = userApi.createUser(name, email, password, role, subjects, maxCapacity);
      userApi.setSession(user);
      toast.show('Account created successfully!');
      
      
      setTimeout(() => {
        window.location.href = user.role === 'tutor' ? 'tutor.html' : 'student.html';
      }, 500);
    } catch (err) {
      showError('signup-email', err.message);
      toast.show(err.message, 'error');
    }
  });
});
