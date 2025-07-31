import PageController from './PageController.js';
import UserService from '../api/UserService.js';
import StudyGroupsService from '../api/StudyGroupsService.js';
import { createGroupUrl } from './StudyGroupDetailPage.js';
import StatsService from '../api/StatsService.js';
import { ModalUtility } from '../utils/ModalUtility.js';

// Update href attributes for group view links
export function updateGroupLinks() {
  const groupLinks = document.querySelectorAll('a#group-url');

  groupLinks.forEach(link => {
    const groupCard = link.closest('[data-group-name]');
    if (groupCard) {
      const groupName = groupCard.dataset.groupName;
      if (groupName) {
        link.href = createGroupUrl(groupName);
      }
    }
  });
}

class StudyGroupsPage {
  constructor() {
    this.isInitialized = false;
    this.groups = [];
  }

  // Initialize page - check auth, load data, setup handlers
  async init() {
    if (this.isInitialized) return;

    if (!UserService.isLoggedIn()) {
      PageController.navigateTo('login');
      return;
    }

    this.currentUser = UserService.getCurrentUser();

    await this.loadStudyGroups();
    updateGroupLinks();
    this.setupFormHandling();

    this.isInitialized = true;
  }

  // Load and render groups, stats, and UI updates
  async loadStudyGroups() {
    try {
      // Load both groups and members data
      const [groupsResponse, membersResponse] = await Promise.all([
        StudyGroupsService.getMyStudyGroups(),
        UserService.makeAuthenticatedRequest('members/')
      ]);

      const allGroups = groupsResponse.studyGroupsData?.data || [];
      const members = membersResponse.data || [];
      const currentUserId = this.currentUser?.userData?.id?.toString() || this.currentUser?.id?.toString();

      // Filter to user's groups only
      const userGroupIds = members
        .filter(member => member.relationships.user.data.id === currentUserId)
        .map(member => member.relationships.group.data.id);

      this.groups = allGroups.filter(group => userGroupIds.includes(group.id));

      // Render components
      StudyGroupsService.renderStudyGroups(this.groups, 'study-groups-container', members);
      StatsService.renderStats(allGroups, {
        userGroups: this.groups,
        layout: 'studyGroups',
        clickableCards: ['studygroups', 'meetings', 'availablegroups'],
        clickHandlers: {
            'meetings': () => {
              PageController.navigateTo('meetings');
            },
            'availablegroups': () => {
              ModalUtility.openJoinGroupModal();
            }
          }
        });

      this.updateCreateButtonStyle();

    } catch (error) {
      console.error('Failed to load study groups:', error);
      PageController.showError('Unable to load study groups. Please try refreshing the page.');
    }
  }

  // Refresh all group data and UI
  async refreshGroups() {
    await this.loadStudyGroups();
    updateGroupLinks();
  }

  // Change create button color based on group membership
  updateCreateButtonStyle() {
    const createButton = document.querySelector('[data-bs-target="#addGroupModal"]');
    if (!createButton) return;

    const hasGroups = this.groups && this.groups.length > 0;

    if (hasGroups) {
      createButton.className = 'btn btn-gator-accent'; // Orange when user has groups
    } else {
      createButton.className = 'btn btn-teal'; // Teal when no groups
    }
  }

  /* ====== FORM MANAGEMENT ====== */
  // Setup form submission handler (prevent duplicates)
  setupFormHandling() {
    if (!window.studyGroupsListenerAdded) {
      document.addEventListener('submit', async (e) => {
        if (e.target && e.target.id === 'addGroupForm') {
          e.preventDefault();
          await this.handleCreateGroup(e);
        }
      });
      window.studyGroupsListenerAdded = true;
    }
  }

  // Handle new group creation form submission
  async handleCreateGroup(event) {
    const form = event.target;
    const formData = new FormData(form);

    const groupData = {
      name: formData.get('groupName'),
      department: formData.get('department'),
      courseNumber: formData.get('courseNumber'),
      description: formData.get('groupDescription') || ''
    };

    // Validate required fields
    if (!groupData.name || !groupData.department || !groupData.courseNumber) {
      this.showModalError('Please fill in all required fields.');
      return;
    }

    try {
      // Update submit button state
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.textContent = 'Creating...';
        submitBtn.disabled = true;
      }

      const response = await StudyGroupsService.createStudyGroup(groupData);

      if (response.success) {
        this.showModalSuccess('Study group created successfully!');
        form.reset();

        // Auto-close modal after success
        setTimeout(() => {
          const modal = document.getElementById('addGroupModal');
          if (modal) {
            const closeBtn = modal.querySelector('[data-bs-dismiss="modal"]');
            if (closeBtn) closeBtn.click();
          }
          this.clearModalMessages();
        }, 1500);

        await this.refreshGroups();
        updateGroupLinks();
      } else {
        this.showModalError(response.message || 'Failed to create study group.');
      }
    } catch (error) {
      console.error('Error creating study group:', error);
      this.showModalError('An error occurred while creating the group. Please try again.');
    } finally {
      // Reset submit button state
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.textContent = 'Create Group';
        submitBtn.disabled = false;
      }
    }
  }

  /* ====== MODAL MESSAGE MANAGEMENT ====== */
  showModalError(message) {
    const errorDiv = document.getElementById('modalErrorMessage');
    const errorText = document.getElementById('errorText');

    if (errorDiv && errorText) {
      errorText.textContent = message;
      errorDiv.classList.remove('d-none');
      errorDiv.classList.add('show');
      this.hideSuccessMessage();
    } else {
      alert(message);
    }
  }

  showModalSuccess(message) {
    const successDiv = document.getElementById('modalSuccessMessage');
    const successText = document.getElementById('successText');

    if (successDiv && successText) {
      successText.textContent = message;
      successDiv.classList.remove('d-none');
      successDiv.classList.add('show');
      this.hideErrorMessage();
    } else {
      alert(message);
    }
  }

  hideErrorMessage() {
    const errorDiv = document.getElementById('modalErrorMessage');
    if (errorDiv) {
      errorDiv.classList.add('d-none');
      errorDiv.classList.remove('show');
    }
  }

  hideSuccessMessage() {
    const successDiv = document.getElementById('modalSuccessMessage');
    if (successDiv) {
      successDiv.classList.add('d-none');
      successDiv.classList.remove('show');
    }
  }

  clearModalMessages() {
    this.hideErrorMessage();
    this.hideSuccessMessage();
  }
}

export default StudyGroupsPage;