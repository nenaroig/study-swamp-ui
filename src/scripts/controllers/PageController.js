import LoginPage from './LoginPage.js';
import DashboardPage from './DashboardPage.js';

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
    console.log(`🎯 Initializing ${page} page functionality`);
    
    // Clean up previous page
    this.cleanup();
    
    // Initialize current page
    switch(page) {
      case 'index':
        this.currentPage = new LoginPage();
        this.currentPage.init();
        break;
      case 'dashboard':
        this.currentPage = new DashboardPage();
        this.currentPage.init();
        break;
      default:
        console.warn(`No page class found for: ${page}`);
    }
  }

  cleanup() {
    if (this.currentPage) {
      console.log(`🧹 Cleaning up ${this.currentPage.pageName} page`);
      
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
}

export default PageController;