// LogoutManager.js
import ApiService from '../api/ApiService.js';
import UserService from '../api/UserService.js';
import PageController from './PageController.js';

class LogoutManager {
  static init() {

    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
      this.logoutBtn = logoutBtn;
      this.setupLogoutButtons();
    }
    
  }
  
  static setupLogoutButtons() {
    this.logoutBtn.addEventListener('click', (e) => {
      console.log(e.target);
        
      e.preventDefault();
      this.performLogout();
    });
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