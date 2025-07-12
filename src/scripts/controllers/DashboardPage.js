import UserService from '../api/UserService.js';
import MeetingService from '../api/MeetingService.js';
import StudyGroupsService from '../api/StudyGroupsService.js';
import StatsService from '../api/StatsService.js';
import PageController from './PageController.js';

class DashboardPage {
  constructor() {
    this.isInitialized = false;
    this.userData = null;
    this.currentUser = null;
    this.meetings = [];
    this.groups = [];
  }
  
  async init() {
    if (this.isInitialized) return;
    
    if (!UserService.isLoggedIn()) {
      PageController.navigateTo('/');
      return;
    }
    
    this.currentUser = UserService.getCurrentUser();
    this.setupWelcomeMessage();
    
    // Load all data and render dashboard
    await this.loadDashboardData();
    
    this.isInitialized = true;
  }
  
  async loadDashboardData() {
    try {
      // Load meetings and groups in parallel
      const [meetingsResponse, groupsResponse] = await Promise.all([
        MeetingService.getUpcomingMeetings(),
        StudyGroupsService.getMyStudyGroups()
      ]);
      
      // Extract data arrays
      this.meetings = meetingsResponse.meetingData?.data || [];
      this.groups = groupsResponse.studyGroupsData?.data || [];
      
      // Render all dashboard sections
      this.renderDashboard();
      
    } catch (error) {
      this.handleLoadError();
    }
  }
  
  renderDashboard() {
    // Render Stats
    StatsService.renderStats(this.meetings, this.groups, 'stats-container');
    
    // Render Meetings
    MeetingService.renderMeetings(this.meetings.slice(0, 3), 'meetings-container');
    
    // Render Groups
    StudyGroupsService.renderStudyGroups(this.groups.slice(0, 3), 'groups-container');
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
      
      if (this.currentUser?.userData?.attributes?.first_name) {
        name = this.currentUser.userData.attributes.first_name;
      } else if (this.currentUser?.username) {
        name = this.currentUser.username;
      }
      
      h1.textContent = `${greeting}, ${name}!`;
    }
    
    return greeting;
  }
  
  handleLoadError() {
    // Show error message in stats container
    const statsContainer = document.getElementById('stats-container');
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="alert alert-warning" role="alert">
          <h4 class="alert-heading">Unable to load dashboard data</h4>
          <p>Please try refreshing the page. If the problem persists, please contact support.</p>
        </div>
      `;
    }
  }
  
  // Method to refresh dashboard data
  async refreshDashboard() {
    await this.loadDashboardData();
  }
}

export default DashboardPage;