import PageController from './PageController.js';
import UserService from '../api/UserService.js';
import StudyGroupsService from '../api/StudyGroupsService.js';

class StudyGroupsPage {
  constructor() {
    this.isInitialized = false;
    this.currentUser = null;
    this.groups = [];
    this.eventListeners = [];
  }
  
  renderGroupsDirectly() {
    const container = document.getElementById('dashboard-groups-container');
    const template = document.getElementById('dashboard-groups-template');
    const emptyStateCard = document.getElementById('empty-state-card');
    
    if (!container) {
      console.error('dashboard-groups-container not found');
      return;
    }
    
    if (!template) {
      console.error('dashboard-groups-template not found');
      return;
    }
    
    // Clear container
    container.innerHTML = '';
    
    if (this.groups.length === 0) {
      // Show empty state
      if (emptyStateCard) emptyStateCard.style.display = 'flex';
      container.style.display = 'none';
      return;
    }

    // Hide empty state and show groups
    if (emptyStateCard) emptyStateCard.style.display = 'none';
    container.style.display = 'flex';
    
    // Render each group
    this.groups.forEach(group => {
      const clone = template.content.cloneNode(true);
      
      // Populate the template
      const titleElement = clone.querySelector('.groups-title');
      const descriptionElement = clone.querySelector('.groups-description');
      const buttonElement = clone.querySelector('.groups-btn');
      
      if (titleElement) {
        titleElement.textContent = group.attributes?.name || 'Untitled Group';
      }
      
      if (descriptionElement) {
        const dept = group.attributes?.department;
        const num = group.attributes?.class_number;
        descriptionElement.textContent = dept && num ? `${dept} ${num}` : 'Study Group';
      }
      
      if (buttonElement) {
        buttonElement.addEventListener('click', () => {
          console.log('Group clicked:', group);
        });
      }
      
      container.appendChild(clone);
    });
  }
  
  async init() {
    if (this.isInitialized) return;
    
    if (!UserService.isLoggedIn()) {
      PageController.navigateTo('login');
      return;
    }
    
    this.currentUser = UserService.getCurrentUser();
    
    // Load and render study groups
    await this.loadStudyGroups();
    
    this.isInitialized = true;
  }
  
  async loadStudyGroups() {
    try {
      // Fetch user's study groups
      const groupsResponse = await StudyGroupsService.getMyStudyGroups();
      
      // Extract data array
      this.groups = groupsResponse.studyGroupsData?.data || [];
      
      // Debug: Check what groups we have
      console.log('Groups to render:', this.groups);
      
      this.renderGroupsDirectly();
      
    } catch (error) {
      console.error('Failed to load study groups:', error);
      this.showError();
    }
  }
  
  showError() {
    const container = document.getElementById('groups-container');
    if (container) {
      container.innerHTML = `
        <div class="alert alert-danger">
          <p>Unable to load study groups. Please try refreshing the page.</p>
        </div>
      `;
    }
  }
}

export default StudyGroupsPage;