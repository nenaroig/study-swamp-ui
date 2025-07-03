import UserService from '../api/UserService.js';
import MeetingService from '../api/MeetingService.js';
import PageController from './PageController.js';

class DashboardPage {
  constructor() {
    this.isInitialized = false;
    this.userData = null;
    this.currentUser = null;
    this.upcomingMeetings = null;
  }
  
  async init() {
    if (this.isInitialized) return;
    
    if (!UserService.isLoggedIn()) {
      PageController.navigateTo('/');
      return;
    }
    
    // Get current user info including stored user data
    this.currentUser = UserService.getCurrentUser();
    this.upcomingMeetings = MeetingService.getUpcomingMeetings();
    
    // Setup welcome message
    this.setupWelcomeMessage();
    this.displayUpcomingMeetings();
    
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
      
      console.log('Current user:', this.currentUser); // remove
      
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
  
  async displayUpcomingMeetings() {
    try {
      const response = await MeetingService.getUpcomingMeetings(),
      meetings = response.meetingData.data || [];
      
      if (meetings.length > 0) {
        MeetingService.renderMeetings(meetings, 'meetings-container');
      }
      
    } catch (error) {
      console.error('Failed to load meetings:', error);
    }
  }
}

export default DashboardPage;