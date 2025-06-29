import ApiService from '../ApiService.js';

class DashboardPage {
  constructor() {
  }

  async init() {
    if (this.isInitialized) return;
    
    console.log('Dashboard page initialized');
    
    this.setupWelcomeMessage();

    // Load API data
    await this.loadDashboardData();
    
    this.isInitialized = true;
  }

  setupWelcomeMessage() {
    const currentHour = new Date().getHours();
    let greeting;
    
    if (currentHour < 12) {
      greeting = 'Good morning, ';
    } else if (currentHour < 18) {
      greeting = 'Good afternoon, ';
    } else {
      greeting = 'Good evening, ';
    }
    return greeting;
  } 

  async loadDashboardData() {
    try {
      // Load user data
      const userData = await ApiService.getData('users/');
      console.log('User data loaded:', userData);
      this.userData = userData;
      
      this.updateDashboardUI();
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      this.handleDataLoadError();
    }
  }

  updateDashboardUI() {
    if (this.userData && this.userData.data) {
      
      const h1 = document.getElementById('greeting');
      const currentUser = this.userData.data[0];
      
      if (h1 && currentUser) {
        const currentGreeting = this.setupWelcomeMessage(),
        firstName = currentUser.attributes.first_name || '';
        h1.textContent = `${currentGreeting}${firstName}!`;
      }
    }
  }

  handleDataLoadError() {
    console.log('Showing error message to user');
    // Show user-friendly error message
  }
}

export default DashboardPage;