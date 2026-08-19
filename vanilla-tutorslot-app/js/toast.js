/**
 * toast.js
 * Simple toast notification system
 */

const toast = {
  show: (message, type = 'success') => {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toastEl = document.createElement('div');
    toastEl.className = `toast ${type}`;
    toastEl.textContent = message;
    
    container.appendChild(toastEl);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      toastEl.style.animation = 'fadeOut 0.3s ease forwards';
      setTimeout(() => {
        if (container.contains(toastEl)) {
          container.removeChild(toastEl);
        }
      }, 300);
    }, 3000);
  }
};
