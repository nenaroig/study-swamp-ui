import ApiService from '../api/ApiService.js';
import UserService from '../api/UserService.js';
import MeetingService from '../api/MeetingsService.js';
import StudyGroupsService from '../api/StudyGroupsService.js';
import StatsService from '../api/StatsService.js';
import PageController from './PageController.js';

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
      const currentUserId = this.currentUser?.userData?.id?.toString() || this.currentUser?.id?.toString();

      // Find groups where user is a member
      const userGroupIds = this.members
        .filter(member => member.relationships.user.data.id === currentUserId)
        .map(member => member.relationships.group.data.id);

      // Filter to user's groups and meetings only
      this.groups = this.allGroups.filter(group => userGroupIds.includes(group.id));
      this.meetings = this.allMeetings.filter(meeting => {
        const meetingGroupId = meeting.relationships?.group?.data?.id;
        return userGroupIds.includes(meetingGroupId);
      });

      console.log(`Loaded ${this.meetings.length} meetings and ${this.groups.length} groups for user ${currentUserId}`);

      this.renderDashboard();

    } catch (error) {
      console.error('Dashboard data loading failed:', error);
      this.handleLoadError();
    }
  }

  // Render all dashboard components
  renderDashboard() {

    const self = this;

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
        self.openJoinGroupModal();
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
      () => this.openJoinGroupModal()
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

      if (this.currentUser?.userData?.attributes?.first_name) {
        name = this.currentUser.userData.attributes.first_name;
      } else if (this.currentUser?.username) {
        name = this.currentUser.username;
      }

      h1.textContent = `${greeting}, ${name}!`;
    }
  }

  // Opens modal and loads available groups
  openJoinGroupModal() {
    // Load the groups first
    this.loadAvailableGroups();
    
    // Then trigger the modal using data attributes
    const modal = document.getElementById('listGroupModal');
    if (modal) {
      // Create and click a hidden button with Bootstrap attributes
      const btn = document.createElement('button');
      btn.setAttribute('data-bs-toggle', 'modal');
      btn.setAttribute('data-bs-target', '#listGroupModal');
      btn.style.display = 'none';
      document.body.appendChild(btn);
      btn.click();
      document.body.removeChild(btn);
    }
  }

  // Loads and displays available groups in the modal
  async loadAvailableGroups() {
    const container = document.getElementById('availableGroupsList');
    const loadingDiv = document.getElementById('loadingGroups');
    const noGroupsDiv = document.getElementById('noGroupsMessage');

    try {
      // Show loading state
      loadingDiv.classList.remove('d-none');
      container.innerHTML = '';
      noGroupsDiv.classList.add('d-none');

      const authHeader = UserService.getAuthHeader();
      const currentUser = UserService.getCurrentUser();
      const currentUserId = currentUser?.userData?.id?.toString() || currentUser?.id?.toString();

      // Get all groups and user's memberships
      const [allGroupsResponse, membersResponse] = await Promise.all([
        ApiService.getData('groups/', authHeader),
        ApiService.getData('members/', authHeader)
      ]);

      const allGroups = allGroupsResponse.data || [];
      const members = membersResponse.data || [];

      // Find groups user is already a member of
      const userGroupIds = members
        .filter(member => member.relationships.user.data.id === currentUserId)
        .map(member => member.relationships.group.data.id);

      // Filter to groups user is NOT a member of
      const availableGroups = allGroups.filter(group => !userGroupIds.includes(group.id));

      // Hide loading
      loadingDiv.classList.add('d-none');

      if (availableGroups.length === 0) {
        noGroupsDiv.classList.remove('d-none');
        return;
      }

      // Render available groups
      availableGroups.forEach(group => {
        const groupCard = this.createAvailableGroupCard(group);
        container.appendChild(groupCard);
      });

      // Setup search functionality after groups are loaded
      this.setupModalSearch();

    } catch (error) {
      console.error('Error loading available groups:', error);
      loadingDiv.classList.add('d-none');
      this.showModalError('Failed to load available groups');
    }
  }

  // Creates a card for an available group
  createAvailableGroupCard(group) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'border rounded-3 p-3 mb-3';

    const title = group.attributes?.name || 'Untitled Group';
    const description = StudyGroupsService.formatGroupDescription(group);

    cardDiv.innerHTML = `
    <div class="d-flex align-items-center justify-content-between">
      <div>
        <h5 class="mb-1">${title}</h5>
        <p class="text-muted mb-0">${description}</p>
      </div>
      <button class="btn btn-outline-teal btn-sm join-group-btn" data-group-id="${group.id}">
        <span class="fa-solid fa-plus me-1"></span>Join
      </button>
    </div>
  `;

    // Add click handler to join button
    const joinBtn = cardDiv.querySelector('.join-group-btn');
    joinBtn.addEventListener('click', () => this.handleJoinGroup(group));

    return cardDiv;
  }

  // Handles joining a group
  async handleJoinGroup(group) {
    try {
      const authHeader = UserService.getAuthHeader();
      const currentUser = UserService.getCurrentUser();
      const currentUserId = currentUser?.userData?.id || currentUser?.id;

      const memberData = {
        user: parseInt(currentUserId),
        group: parseInt(group.id),
        creator: false
      };

      await ApiService.postData('members/', memberData, authHeader);

      this.showModalSuccess(`Successfully joined ${group.attributes?.name}!`);

      // Close modal and reload dashboard after short delay
      setTimeout(() => {
        // Close the modal
        const modal = document.getElementById('listGroupModal');
        const modalInstance = bootstrap.Modal.getInstance(modal) || new bootstrap.Modal(modal);
        modalInstance.hide();

        // Reload dashboard data
        this.refreshDashboard();
      }, 1500);

    } catch (error) {
      console.error('Error joining group:', error);
      this.showModalError('Failed to join group. Please try again.');
    }
  }

  // Shows error message in modal
  showModalError(message) {
    const errorDiv = document.getElementById('modalErrorMessage');
    const errorText = document.getElementById('errorText');

    errorText.textContent = message;
    errorDiv.classList.remove('d-none');
    errorDiv.classList.add('show');
  }

  // Shows success message in modal
  showModalSuccess(message) {
    const successDiv = document.getElementById('modalSuccessMessage');
    const successText = document.getElementById('successText');

    successText.textContent = message;
    successDiv.classList.remove('d-none');
    successDiv.classList.add('show');
  }

  // Sets up search functionality for the modal
  setupModalSearch() {
    const searchInput = document.getElementById('groupSearch');
    const groupsList = document.getElementById('availableGroupsList');

    if (!searchInput || !groupsList) return;

    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase().trim();
      const groupCards = groupsList.querySelectorAll('.border.rounded-3');

      groupCards.forEach(card => {
        const title = card.querySelector('h5')?.textContent?.toLowerCase() || '';
        const description = card.querySelector('p')?.textContent?.toLowerCase() || '';

        // Check if search term matches title or description
        const matches = title.includes(searchTerm) || description.includes(searchTerm);

        // Show/hide the card based on match
        if (matches) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });

      // Check if any groups are visible
      const visibleCards = Array.from(groupCards).filter(card => card.style.display !== 'none');
      const noGroupsDiv = document.getElementById('noGroupsMessage');

      if (visibleCards.length === 0 && searchTerm) {
        // Show "no results" message
        if (noGroupsDiv) {
          noGroupsDiv.classList.remove('d-none');
          noGroupsDiv.querySelector('p').textContent = `No groups found matching "${searchTerm}"`;
        }
      } else {
        // Hide no groups message
        if (noGroupsDiv) {
          noGroupsDiv.classList.add('d-none');
        }
      }
    });

    // Clear search when modal is hidden
    const modal = document.getElementById('listGroupModal');
    modal.addEventListener('hidden.bs.modal', () => {
      searchInput.value = '';
      // Reset all cards to visible
      const groupCards = groupsList.querySelectorAll('.border.rounded-3');
      groupCards.forEach(card => {
        card.style.display = 'block';
      });
      // Reset no groups message
      const noGroupsDiv = document.getElementById('noGroupsMessage');
      if (noGroupsDiv) {
        noGroupsDiv.classList.add('d-none');
        noGroupsDiv.querySelector('p').textContent = 'No study groups available to join';
      }
    });
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