import UserService from '../api/UserService.js';
import MeetingService from '../api/MeetingService.js';
import StudyGroupsService from '../api/StudyGroupsService.js';
import StatsService from '../api/StatsService.js';
import ApiService from '../api/ApiService.js';
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
      console.log('Loading dashboard data...');

      // Test authentication first
      const authHeader = UserService.getAuthHeader();

      if (!authHeader) {
        throw new Error('No authentication header available');
      }

      // Load meetings and groups in parallel
      const [meetingsResponse, groupsResponse, membersResponse] = await Promise.all([
        MeetingService.getUpcomingMeetings(),
        StudyGroupsService.getMyStudyGroups(),
        UserService.makeAuthenticatedRequest('members/')
      ]);

      // Extract data arrays
      this.meetings = meetingsResponse.meetingData?.data || [];
      this.groups = groupsResponse.studyGroupsData?.data || [];
      this.members = membersResponse.groupMembersData?.data || [];

      // Filter groups to only show ones where current user is a member
      const currentUserId = this.currentUser?.userData?.id || this.currentUser?.id;

      // Find group IDs where current user is a member
      const userGroupIds = this.members
        .filter(member => member.relationships.user.data.id === currentUserId)
        .map(member => member.relationships.group.data.id);

      // Filter groups to only include user's groups
      this.groups = this.groups.filter(group => userGroupIds.includes(group.id));

      console.log(`Successfully loaded ${this.meetings.length} meetings and ${this.groups.length} groups for user ${currentUserId}`);

      // Render all dashboard sections
      this.renderDashboard();

    } catch (error) {
      console.error('Dashboard data loading failed:', error);
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
    console.error('Handle load error called');

    // Show error message in stats container
    const statsContainer = document.getElementById('stats-container');
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="alert alert-warning" role="alert">
          <h4 class="alert-heading">Unable to load dashboard data</h4>
          <p>Please try refreshing the page. If the problem persists, please contact support.</p>
          <details class="mt-3 d-none">
            <summary>Debugging Information</summary>
            <div class="mt-2">
              <p><strong>User logged in:</strong> ${UserService.isLoggedIn()}</p>
              <p><strong>Auth header available:</strong> ${!!UserService.getAuthHeader()}</p>
              <p><strong>API Base URL:</strong> ${ApiService.getBaseUrl()}</p>
              <p><strong>Current time:</strong> ${new Date().toISOString()}</p>
            </div>
          </details>
        </div>
      `;

      // Add retry button functionality
      const retryBtn = document.getElementById('retry-load-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => {
          console.log('Retrying dashboard data load...');
          this.loadDashboardData();
        });
      }
    } else {
      console.error('Stats container not found');
    }
  }

  // Method to refresh dashboard data
  async refreshDashboard() {
    await this.loadDashboardData();
  }
}

export default DashboardPage;