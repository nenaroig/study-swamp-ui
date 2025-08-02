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
  
  // ===== INITIALIZATION =====
  
  async init() {
    if (this.isInitialized) return;
    
    if (!UserService.isLoggedIn()) {
      PageController.navigateTo('/');
      return;
    }
    
    this.currentUser = UserService.getCurrentUser();
    this.setupWelcomeMessage();

    ModalUtility.initializeModalEvents();
    await this.loadDashboardData();
    
    this.isInitialized = true;
  }
  
  // ===== DATA LOADING =====
  
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
      
      this.filterDataForCurrentUser();
      this.renderDashboard();
      
    } catch (error) {
      console.error('Dashboard data loading failed:', error);
      this.handleLoadError();
    }
  }
  
  // Filter meetings and groups based on user permissions
  filterDataForCurrentUser() {
    const currentUserData = UserService.getCurrentUserData();
    const currentUserId = currentUserData?.data?.id?.toString() || currentUserData?.id?.toString();
    
    if (!currentUserId) {
      console.error('❌ Dashboard - No user ID found in:', currentUserData);
      throw new Error('Unable to determine current user ID. Please try logging in again.');
    }
    
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
  }
  
  // ===== RENDERING =====
  
  async renderDashboard() {
    try {
      await this.renderStats();
      this.renderMeetingsAndGroups();
    } catch (error) {
      console.error('Failed to calculate award points for dashboard:', error);
      this.renderFallbackStats();
    }
  }
  
  // Render stats cards with dynamic award points calculation
  async renderStats() {
    const currentUserData = UserService.getCurrentUserData();
    const userId = currentUserData?.data?.id || currentUserData?.id;
    
    let awardPoints = 0;
    
    if (userId) {
      awardPoints = await this.calculateAwardPoints(userId);
    }
    
    StatsService.renderStats(this.allGroups, {
      userGroups: this.groups,
      meetings: this.meetings,
      layout: 'dashboard',
      containerId: 'stats-container',
      cardClass: 'col-sm-6 col-lg-3',
      clickableCards: ['studygroups', 'todaysmeetings', 'pointsearned', 'availablegroups'],
      clickHandlers: {
        'studygroups': () => PageController.navigateTo('study-groups'),
        'todaysmeetings': () => PageController.navigateTo('meetings'),
        'pointsearned': () => PageController.navigateTo('awards'),
        'availablegroups': () => ModalUtility.openJoinGroupModal()
      }
    });
    
    // Update the award points card
    StatsService.updateCard('stats-container', 2, awardPoints, 'gator gold');
  }
  
  // Calculate user's total award points
  async calculateAwardPoints(userId) {
    const [enumsResponse, awardsResponse] = await Promise.all([
      ApiService.getEnumData('enums/', UserService.getAuthHeader()),
      UserService.makeAuthenticatedRequest('awards/')
    ]);

    const awardDetails = {
      0: { points: 50 },   // Egg Tooth
      1: { points: 100 },  // First Splash  
      2: { points: 150 },  // Snap To It
      3: { points: 200 },  // Tailgator
      4: { points: 500 },  // Gator Done
      5: { points: 1000 }  // Chomp Champ
    };

    const badgeTypeEnums = enumsResponse.data?.enums?.badge_types || [];
    const allAwards = badgeTypeEnums.map(enumItem => ({
      badgeType: enumItem.value,
      points: awardDetails[enumItem.value]?.points || 0
    }));

    const userAwards = (awardsResponse.data || [])
      .filter(award => award.relationships.user.data.id === userId)
      .map(award => {
        const awardDef = allAwards.find(a => a.badgeType === award.attributes.badge_type);
        return awardDef ? awardDef.points : 0;
      });

    return userAwards.reduce((sum, points) => sum + points, 0);
  }
  
  // Render meetings and study groups sections
  renderMeetingsAndGroups() {
    // Filter and render upcoming meetings only
    const now = new Date();
    const upcomingMeetings = this.meetings.filter(meeting => {
      const meetingDate = new Date(meeting.attributes?.start_time);
      return meetingDate >= now;
    });
    
    MeetingService.renderMeetings(upcomingMeetings.slice(0, 3), 'meetings-container', {
      userGroups: this.groups
    });
    
    StudyGroupsService.renderStudyGroups(
      this.groups.slice(0, 3),
      'groups-container',
      this.members,
      () => ModalUtility.openJoinGroupModal()
    );
  }
  
  // Fallback stats rendering without dynamic points
  renderFallbackStats() {
    StatsService.renderStats(this.allGroups, {
      userGroups: this.groups,
      meetings: this.meetings,
      layout: 'dashboard',
      containerId: 'stats-container',
      cardClass: 'col-md-3',
      clickableCards: ['studygroups', 'todaysmeetings', 'availablegroups'],
      clickHandlers: {
        'studygroups': () => PageController.navigateTo('study-groups'),
        'todaysmeetings': () => PageController.navigateTo('meetings'),
        'availablegroups': () => ModalUtility.openJoinGroupModal()
      }
    });
  }
  
  // ===== UI HELPERS =====
  
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
      
      const currentUserData = UserService.getCurrentUserData();
      
      if (currentUserData?.data?.attributes?.first_name) {
        name = currentUserData.data.attributes.first_name;
      } else if (currentUserData?.attributes?.first_name) {
        name = currentUserData.attributes.first_name;
      } else if (this.currentUser?.username) {
        name = this.currentUser.username;
      }
      
      h1.textContent = `${greeting}, ${name}!`;
    }
  }
  
  // ===== ERROR HANDLING =====
  
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
  
  // ===== PUBLIC METHODS =====
  
  async refreshDashboard() {
    await this.loadDashboardData();
  }
}

export default DashboardPage;