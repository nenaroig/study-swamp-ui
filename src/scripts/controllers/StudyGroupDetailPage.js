import PageController from './PageController.js';
import UserService from '../api/UserService.js';
import StudyGroupDetailService from '../api/StudyGroupDetailService.js';

// Convert group name to URL-friendly slug
export function createGroupSlug(groupName) {
  return StudyGroupDetailService.createGroupSlug(groupName);
}

// Create full URL
export function createGroupUrl(groupName) {
  const slug = createGroupSlug(groupName);
  return `/groups/${slug}`;
}

// Extract group slug from current URL
export function getGroupSlugFromUrl() {
  const path = window.location.pathname;
  const matches = path.match(/^\/groups\/([^\/]+)$/);
  return matches ? matches[1] : null;
}

class StudyGroupDetailPage {
  constructor() {
    this.isInitialized = false;
  }
  
  async init() {
    // Prevent multiple initializations
    if (this.isInitialized) return;
    
    // Redirect to login if user is not authenticated
    if (!UserService.isLoggedIn()) {
      PageController.navigateTo('login');
      return;
    }
    
    // Get current user data
    this.currentUser = UserService.getCurrentUser();
    
    // Load and render study group
    await this.loadStudyGroup();
    
    this.isInitialized = true;
  }
  
  async loadStudyGroup() {
    try {
      // Get the group slug from URL
      const groupSlug = getGroupSlugFromUrl();
      if (!groupSlug) {
        throw new Error('No group slug found in URL');
      }
      
      // Fetch the specific group by slug
      const groupResponse = await StudyGroupDetailService.getGroupBySlug(groupSlug);
      
      // Extract single group object (not array)
      this.currentGroup = groupResponse.studyGroupData || {};
      
      // Add group name to h1
      const title = document.getElementById('group-title');
      console.log(this.currentGroup);
      
      title.textContent = this.currentGroup.attributes?.name || 'Group not found';
      
    } catch (error) {
      console.error('Failed to load study group:', error);
      PageController.showError('Unable to load study group. Please try refreshing the page.');
    }
  }
  
  // Refresh group data and re-render
  async refreshGroup() {
    await this.loadStudyGroup();
  }
}

export default StudyGroupDetailPage;