// LogoutManager.js
import ApiService from '../api/ApiService.js';
import UserService from '../api/UserService.js';
import PageController from './PageController.js';

class LogoutManager {
  static initialized = false;

  static init() {
    // Prevent multiple initializations
    if (this.initialized) return;
    
    // Use event delegation to handle logout button clicks
    // This works regardless of when the button is added to the DOM
    document.addEventListener('click', (e) => {
      if (e.target.closest('.logout-btn')) {
        e.preventDefault();
        this.performLogout();
      }
    });
    
    this.initialized = true;
  }
  static performLogout() {
    const confirmed = confirm('Are you sure you want to logout?');
    if (confirmed) {
      UserService.logout();
      this.handleLogout();
    }
  }
  
  static handleLogout() {
    // Redirect to login page
    PageController.navigateTo('login');
    
    // Show logout message
    setTimeout(() => {
      PageController.showSuccess('You have been logged out successfully');
    }, 100);
  }
}

export default LogoutManager;