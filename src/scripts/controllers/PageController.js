import LoginPage from './LoginPage.js';
import SignUpPage from './SignUpPage.js';
import DashboardPage from './DashboardPage.js';
import StudyGroupsPage from './StudyGroupsPage.js';
import StudyGroupDetailPage from './StudyGroupDetailPage.js';
import MeetingsPage from './MeetingsPage.js';
import MeetingDetailPage from './MeetingDetailPage.js';
import ProfilePage from './ProfilePage.js';
import AwardsPage from './AwardsPage.js';

class PageController {
  constructor() {
    this.currentPage = null;
    this.init();
  }

  init() {
    // Listen for page load events from router
    window.addEventListener('pageLoaded', (e) => {
      this.initPageFunctionality(e.detail.page);
    });
  }

  initPageFunctionality(page) {
    // Clean up previous page
    this.cleanup();
    
    // Initialize current page
    switch(page) {
      case 'login':
        this.currentPage = new LoginPage();
        this.currentPage.init();
        break;
      case 'signup':
        this.currentPage = new SignUpPage();
        this.currentPage.init();
        break;
      case 'dashboard':
        this.currentPage = new DashboardPage();
        this.currentPage.init();
        break;
      case 'study-groups':
        this.currentPage = new StudyGroupsPage();
        this.currentPage.init();
        break;
      case 'group':
        // Extract the group slug from the URL
        const groupSlug = this.extractSlugFromPath('groups');
        this.currentPage = new StudyGroupDetailPage();
        this.currentPage.init(groupSlug);
        break;
      case 'meetings':
        this.currentPage = new MeetingsPage();
        this.currentPage.init();
        break;
      case 'meeting':
        // Extract the meetings slug from the URL
        const meetingSlug = this.extractSlugFromPath('meetings');
        this.currentPage = new MeetingDetailPage();
        this.currentPage.init(meetingSlug);
        break;
      case 'profile':
        this.currentPage = new ProfilePage();
        this.currentPage.init();
        break;
      case 'awards':
        this.currentPage = new AwardsPage();
        this.currentPage.init();
        break;
      default:
        console.warn(`No page class found for: ${page}`);
    }
  }

  cleanup() {
    if (this.currentPage) {
      
      // Clean up event listeners
      if (this.currentPage.eventListeners) {
        this.currentPage.eventListeners.forEach(({ element, event, handler }) => {
          if (element) {
            element.removeEventListener(event, handler);
          }
        });
      }
      
      // Reset page state
      this.currentPage.isInitialized = false;
      this.currentPage = null;
    }
  }

  // Helper methods that pages can use
  static addEventListener(element, event, handler, listeners) {
    if (element) {
      element.addEventListener(event, handler);
      listeners.push({ element, event, handler });
    }
  }

  static navigateTo(page) {
    window.dispatchEvent(new CustomEvent('navigateToPage', {
      detail: { page }
    }));
  }

  static showError(message, container = null) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger mt-3';
    errorDiv.textContent = message;
    
    if (container) {
      container.appendChild(errorDiv);
      setTimeout(() => errorDiv.remove(), 5000);
    } else {
      console.error(message);
    }
  }

  static showSuccess(message, container = null) {
    const successDiv = document.createElement('div');
    successDiv.className = 'alert alert-success mt-3';
    successDiv.textContent = message;
    
    if (container) {
      container.appendChild(successDiv);
      setTimeout(() => successDiv.remove(), 3000);
    }
  }

  // Helper method to extract slug from URL path
  extractSlugFromPath(basePath) {
    const path = window.location.pathname;
    const regex = new RegExp(`^/${basePath}/([^/]+)$`);
    const matches = path.match(regex);
    return matches ? matches[1] : null;
  }
}

export default PageController;