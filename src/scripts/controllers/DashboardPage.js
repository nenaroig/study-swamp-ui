import PageController from './PageController.js';

class DashboardPage {
  constructor() {
  }

  init() {
    if (this.isInitialized) return;
    
    console.log('📊 Dashboard page initialized');
    
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
    
    console.log(`${greeting}! Welcome to your dashboard! 👋`);
  }
}

export default DashboardPage;