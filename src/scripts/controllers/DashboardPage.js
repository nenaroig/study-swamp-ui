import ApiService from '../ApiService.js';
import PageController from './PageController.js';

class DashboardPage {
  constructor() {
    this.isInitialized = false;
    this.userData = null;
    this.currentUser = null;
  }
  
  async init() {
    if (this.isInitialized) return;
    
    if (!ApiService.isLoggedIn()) {
      console.log('User not logged in, redirecting...'); // remove
      PageController.navigateTo('/');
      return;
    }
    
    // Get current user info including stored user data
    this.currentUser = ApiService.getCurrentUser();
    console.log('Dashboard - Current user from ApiService:', this.currentUser); //remove

    console.log('SessionStorage currentUserData:', sessionStorage.getItem('currentUserData')); // remove
    
    // Setup welcome message
    this.setupWelcomeMessage();
    
    this.isInitialized = true;
  }
  
  setupWelcomeMessage() {
    const currentHour = new Date().getHours();
    let greeting;
    
    if (currentHour < 12) {
      greeting = 'Good morning';
    } else if (currentHour < 18) {
      greeting = 'Good afternoon';
    } else {
      greeting = 'Good evening';
    }
    
    const h1 = document.getElementById('greeting');
    if (h1) {
      let name = 'Gator';

    console.log('Setting up welcome message');
    console.log('Current user:', this.currentUser);
    console.log('User data:', this.currentUser?.userData);
      
      
      // Get currentUser
      if (this.currentUser?.userData?.attributes?.first_name) {
        name = this.currentUser.userData.attributes.first_name;
        console.log('Using first name:', name);
      } else if (this.currentUser?.username) {
        name = this.currentUser.username;
        console.log('Using username:', name);
      }
      
      h1.textContent = `${greeting}, ${name}!`;
    }
    
    return greeting;
  }
}

export default DashboardPage;