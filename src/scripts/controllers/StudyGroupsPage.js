import PageController from './PageController.js';
import UserService from '../api/UserService.js';
import StudyGroupsService from '../api/StudyGroupsService.js';
import { createGroupUrl } from './StudyGroupDetailPage.js';

// Update existing empty href link
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
  }
  
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
  
  async loadStudyGroups() {
    try {
      const groupsResponse = await StudyGroupsService.getMyStudyGroups();
      this.groups = groupsResponse.studyGroupsData?.data || [];
      StudyGroupsService.renderDashboardGroups(this.groups, 'dashboard-groups-container');
    } catch (error) {
      console.error('Failed to load study groups:', error);
      PageController.showError('Unable to load study groups. Please try refreshing the page.');
    }
  }
  
  async refreshGroups() {
    await this.loadStudyGroups();
  }
  
  setupFormHandling() {
    // Prevent duplicate event listeners
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
  
  async handleCreateGroup(event) {
    const form = event.target;
    const formData = new FormData(form);
    
    const groupData = {
      name: formData.get('groupName'),
      department: formData.get('department'),
      courseNumber: formData.get('courseNumber'),
      description: formData.get('groupDescription') || ''
    };
    
    if (!groupData.name || !groupData.department || !groupData.courseNumber) {
      this.showModalError('Please fill in all required fields.');
      return;
    }
    
    try {
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.textContent = 'Creating...';
        submitBtn.disabled = true;
      }
      
      const response = await StudyGroupsService.createStudyGroup(groupData);
      
      if (response.success) {
        this.showModalSuccess('Study group created successfully!');
        form.reset();
        
        // Auto-close modal after showing success
        setTimeout(() => {
          const modal = document.getElementById('addGroupModal');
          if (modal) {
            const closeBtn = modal.querySelector('[data-bs-dismiss="modal"]');
            if (closeBtn) {
              closeBtn.click();
            }
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
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.textContent = 'Create Group';
        submitBtn.disabled = false;
      }
    }
  }
  
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