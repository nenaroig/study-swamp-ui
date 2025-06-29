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
      greeting = 'Good morning';
    } else if (currentHour < 18) {
      greeting = 'Good afternoon';
    } else {
      greeting = 'Good evening';
    }
    
    console.log(`${greeting}! Welcome to your dashboard! 👋`);
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
      const userList = document.getElementById('user-list');
      console.log(this.userData);
      
      userList.innerHTML = '';

      this.userData.data.forEach(user => {
        const li = document.createElement('li');
        li.textContent = `${user.attributes.username} (${user.attributes.email}) ${user.attributes.first_name} ${user.attributes.last_name}`;
        userList.appendChild(li);
      });
    }
  }

  handleDataLoadError() {
    console.log('Showing error message to user');
    // Show user-friendly error message
  }
}

export default DashboardPage;