// LogoutManager.js
import ApiService from '../ApiService.js';
import PageController from './PageController.js';

class LogoutManager {
  static init() {
    // Listen for logout events
    window.addEventListener('userLoggedOut', () => {
      this.handleLogout();
    });
    
    this.setupLogoutButtons();
  }
  
  static setupLogoutButtons() {
    document.addEventListener('click', (e) => {
      if (e.target.matches('.logout-btn')) {
        e.preventDefault();
        this.performLogout();
      }
    });
  }
  
  static performLogout() {
    const confirmed = confirm('Are you sure you want to logout?');
    if (confirmed) ApiService.logout();
  }
  
  static handleLogout() {
    // Redirect to login page
    PageController.navigateTo('/');
    
    // Show logout message
    setTimeout(() => {
      PageController.showSuccess('You have been logged out successfully');
    }, 100);
  }
}

export default LogoutManager;