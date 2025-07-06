/**
 * AppRouter - Client-side router for single-page application
 * Handles navigation between pages without full page reloads
 */

import loginContent from '../../templates/login.html';
import navigationContent from '../../templates/navigation.html';
import signUpContent from '../../templates/signup.html';
import forgotPasswordContent from '../../templates/forgot-password.html';
import dashboardContent from '../../templates/dashboard/dashboard.html';

class AppRouter {
  constructor() {
    // Map page names to their HTML content
    this.contentMap = {
      'index': loginContent,
      'signup': signUpContent,
      'forgot-password': forgotPasswordContent,
      'dashboard': dashboardContent,
    };

    // Pages that need navigation sidebar
    this.pagesWithNav = ['dashboard'];
    
    // Page titles for browser tab
    this.titles = {
      'index': 'Study Swamp - Login',
      'signup': 'Study Swamp - Sign Up',
      'dashboard': 'Study Swamp',
      'forgot-password': 'Study Swamp - Forgot Password',
    };

    this.navigationContent = navigationContent;
  }

  // Extract page name from current URL
  getCurrentPage() {
    const path = window.location.pathname;
    return path.split('/').pop() || 'dashboard';
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

    // Load initial page
    this.loadPageContent();
  }
}

export default AppRouter;