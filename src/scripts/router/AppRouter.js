/**
* AppRouter - Client-side router for single-page application
* Handles navigation between pages without full page reloads
*/

import loginContent from '../../templates/login.html';
import navigationContent from '../../templates/navigation.html';
import signUpContent from '../../templates/signup.html';
import forgotPasswordContent from '../../templates/forgot-password.html';
import dashboardContent from '../../templates/dashboard/dashboard.html';
import groupsContent from '../../templates/groups/groups.html';
import groupContent from '../../templates/groups/group.html';
import meetingsContent from '../../templates/meetings/meetings.html';
import awardsContent from '../../templates/awards/awards.html';
import profileContent from '../../templates/profile/profile.html';
import UserService from '../api/UserService';

class AppRouter {
  constructor() {
    // Map page names to their HTML content
    this.contentMap = {
      'login': loginContent,
      'signup': signUpContent,
      'forgot-password': forgotPasswordContent,
      'dashboard': dashboardContent,
      'groups': groupsContent,
      'group': groupContent,
      'meetings': meetingsContent,
      'awards': awardsContent,
      'profile': profileContent,
    };
    
    // Pages that need navigation sidebar
    this.pagesWithNav = ['dashboard', 'groups', 'group', 'meetings', 'awards', 'profile'];
    
    // Page titles for browser tab
    this.titles = {
      'login': 'Study Swamp - Login',
      'signup': 'Study Swamp - Sign Up',
      'dashboard': 'Study Swamp',
      'forgot-password': 'Study Swamp - Forgot Password',
      'groups': 'Study Swamp - My Study Groups',
      'group': 'Study Swamp - Study Group',
      'meetings': 'Study Swamp - Meetings',
      'awards': 'Study Swamp - Awards',
      'profile': 'Study Swamp - My Profile',
    };
    
    this.navigationContent = navigationContent;
  }
  
  // Extract page name from current URL
  getCurrentPage() {
    const path = window.location.pathname;
    const segments = path.split('/').filter(Boolean);
    
    // If no segments, return dashboard
    if (segments.length === 0) return 'dashboard';
    
    // If URL has 2 segments (like /groups/slug), return singular form
    if (segments.length === 2) {
      const basePage = segments[0];
      // Convert plural to singular for detail pages
      const singularMap = {
        'groups': 'group',
        'meetings': 'meeting', 
        'users': 'user',
        'awards': 'award'
      };
      return singularMap[basePage] || basePage;
    }
    
    // For single segment URLs, return as-is
    return segments[0];
  }
  
  // Handle initial load
  handleInitialLoad() {
    const path = window.location.pathname;
    
    // Only redirect to login if we're on root path during initial load and user is not logged in
    if (path === '/' && !UserService.isLoggedIn()) {
      this.navigateToPage('login');
      return true;
    }
    
    return false;
  }
  
  // Load and render content for current page
  loadPageContent() {
    const page = this.getCurrentPage();
    const content = this.contentMap[page];
    
    if (content) {
      this.renderContent(page, content);
      this.updatePageTitle(page);
      this.setupNavigation();
      this.dispatchPageLoadEvent(page);
    } else {
      // Page not found, redirect to dashboard
      this.navigateToPage('dashboard');
    }
  }
  
  // Render page content with or without navigation
  renderContent(page, content) {
    const app = document.getElementById('app');
    if (!app) return;
    
    if (this.pagesWithNav.includes(page)) {
      app.innerHTML = this.navigationContent + content;
    } else {
      app.innerHTML = content;
    }
  }
  
  // Update browser tab title
  updatePageTitle(page) {
    document.title = this.titles[page] || 'Study Swamp';
  }
  
  // Set up click handlers for navigation links
  setupNavigation() {
    const navLinks = document.querySelectorAll('[data-page]');
    
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Get target page from clicked element or its parent
        const targetPage = e.target.getAttribute('data-page') || 
        e.target.closest('[data-page]')?.getAttribute('data-page');
        
        if (targetPage) {
          this.navigateToPage(targetPage);
        }
      });
    });
  }
  
  // Navigate to a new page without page reload
  navigateToPage(page) {
    const newUrl = page === 'dashboard' ? '/' : `/${page}`;
    window.history.pushState({page}, '', newUrl);
    this.loadPageContent();
  }
  
  // Emit custom event when page loads (for page-specific JS)
  dispatchPageLoadEvent(page) {
    const event = new CustomEvent('pageLoaded', { detail: { page } });
    window.dispatchEvent(event);
  }
  
  // Initialize the router
  init() {
    // Handle browser back/forward buttons
    window.addEventListener('popstate', () => {
      this.loadPageContent();
    });
    
    // Check if we need to redirect to login on initial load
    if (!this.handleInitialLoad()) {
      // If no redirect happened, load the current page normally
      this.loadPageContent();
    }
  }
}

export default AppRouter;