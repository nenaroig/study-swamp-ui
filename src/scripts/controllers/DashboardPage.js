import ApiService from '../api/ApiService.js';
import UserService from '../api/UserService.js';
import MeetingService from '../api/MeetingsService.js';
import StudyGroupsService from '../api/StudyGroupsService.js';
import StatsService from '../api/StatsService.js';
import PageController from './PageController.js';
import ModalUtility from '../utils/ModalUtility.js';

class DashboardPage {
  constructor() {
    this.isInitialized = false;
    this.currentUser = null;
    this.meetings = [];
    this.groups = [];
    this.allGroups = [];
    this.allMeetings = [];
    this.members = [];
  }
  
  // Initialize dashboard - check auth and load data
  async init() {
    if (this.isInitialized) return;
    
    if (!UserService.isLoggedIn()) {
      PageController.navigateTo('/');
      return;
    }
    
    this.currentUser = UserService.getCurrentUser();
    this.setupWelcomeMessage();
    await this.loadDashboardData();
    
    this.isInitialized = true;
  }
  
  // Load and filter all dashboard data
  async loadDashboardData() {
    try {
      const authHeader = UserService.getAuthHeader();
      if (!authHeader) {
        throw new Error('No authentication header available');
      }
      
      // Load all data in parallel
      const [meetingsResponse, groupsResponse, membersResponse] = await Promise.all([
        MeetingService.getUpcomingMeetings(),
        StudyGroupsService.getMyStudyGroups(),
        UserService.makeAuthenticatedRequest('members/')
      ]);
      
      // Store all data
      this.allMeetings = meetingsResponse.meetingData?.data || [];
      this.allGroups = groupsResponse.studyGroupsData?.data || [];
      this.members = membersResponse.data || [];
      
      // Get current user ID for filtering
      const currentUserData = UserService.getCurrentUserData();
      const currentUserId = currentUserData?.data?.id?.toString();
      
      if (!currentUserId) {
        throw new Error('Unable to determine current user ID. Please try logging in again.');
      }
      
      // Check if current user is admin
      const isAdmin = this.currentUser?.username?.includes('admin') || false;
      
      if (isAdmin) {
        // Admin users see all groups and meetings
        this.groups = this.allGroups;
        this.meetings = this.allMeetings;
      } else {
        // Regular users see only their joined groups and related meetings
        const userGroupIds = this.members
          .filter(member => {
            const memberUserId = member.relationships?.user?.data?.id?.toString();
            return memberUserId === currentUserId;
          })
          .map(member => member.relationships.group.data.id.toString());
        
        this.groups = this.allGroups.filter(group => userGroupIds.includes(group.id.toString()));
        this.meetings = this.allMeetings.filter(meeting => {
          const meetingGroupId = meeting.relationships?.group?.data?.id?.toString();
          return userGroupIds.includes(meetingGroupId);
        });
      }
      
      this.renderDashboard();
      
    } catch (error) {
      console.error('Dashboard data loading failed:', error);
      this.handleLoadError();
    }
  }
  
  // Render all dashboard components
  renderDashboard() {
    // Render stats cards (4 cards in dashboard layout)
    StatsService.renderStats(this.allGroups, {
      userGroups: this.groups,
      meetings: this.meetings,
      layout: 'dashboard',
      containerId: 'stats-container',
      cardClass: 'col-md-3',
      clickableCards: ['studygroups', 'todaysmeetings', 'availablegroups'],
      clickHandlers: {
        'studygroups': () => {
          PageController.navigateTo('study-groups');
        },
        'todaysmeetings': () => {
          PageController.navigateTo('meetings');
        },
        'availablegroups': () => {
          ModalUtility.openJoinGroupModal();
        }
      }
    });
    
    // Render recent meetings and groups
    MeetingService.renderMeetings(this.meetings.slice(0, 3), 'meetings-container', {
      userGroups: this.groups
    });
    
    StudyGroupsService.renderStudyGroups(
      this.groups.slice(0, 3),
      'groups-container',
      this.members,
      () => ModalUtility.openJoinGroupModal()
    );
  }
  
  // Set personalized greeting based on time of day
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
      
      // Get current user data properly
      const currentUserData = UserService.getCurrentUserData();

      if (currentUserData?.attributes?.first_name) {
        name = currentUserData.attributes.first_name;
      } else if (this.currentUser?.username) {
        name = this.currentUser.username;
      }
      
      h1.textContent = `${greeting}, ${name}!`;
    }
  }
  
  // Display error message when data loading fails
  handleLoadError() {
    const statsContainer = document.getElementById('stats-container');
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="alert alert-warning" role="alert">
          <h4 class="alert-heading">Unable to load dashboard data</h4>
          <p>Please try refreshing the page. If the problem persists, please contact support.</p>
        </div>
      `;
    } else {
      console.error('Stats container not found');
    }
  }
  
  // Refresh all dashboard data
  async refreshDashboard() {
    await this.loadDashboardData();
  }
}

export default DashboardPage;