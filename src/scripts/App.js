import AppRouter from './router/AppRouter.js';
import PageController from './controllers/PageController.js';
import HMRManager from './dev/HMRManager.js';
import UserService from './api/UserService.js';
import ApiService from './api/ApiService.js';
import LogoutManager from './controllers/LogoutManager.js';

class App {
  constructor() {
    this.router = null;
    this.pageController = null;
    this.hmrManager = null;
    this.inactivityTimer = null;
    this.inactivityTimeout = 40 * 60 * 1000; // 40 minutes in milliseconds
  }
  
  init() {
    console.log('🚀 Study Swamp App Starting...');
    
    // Try to restore user session
    if (UserService.loadStoredCredentials()) {
      console.log('Restored user session');
    }
    
    // Initialize router
    this.router = new AppRouter();
    
    // Initialize page controller
    this.pageController = new PageController();
    
    // Setup navigation event listener
    this.setupGlobalListeners();
    
    // Initialize router (this will load the current page)
    this.router.init();
    
    setTimeout(() => {
      LogoutManager.init();
    }, 100);

    // Start inactivity timer if user is logged in
    this.setupInactivityTimer();
    
    // Initialize HMR in development
    if (process.env.NODE_ENV === 'development') {
      this.hmrManager = new HMRManager(this.router);
    }
    
    console.log('✅ Study Swamp App Initialized');
  }
  
  setupGlobalListeners() {
    // Listen for navigation events from page controllers
    window.addEventListener('navigateToPage', (e) => {
      this.router.navigateToPage(e.detail.page);
    });
    
    // Listen for any global app events
    window.addEventListener('appError', (e) => {
      console.error('App Error:', e.detail);
    });
  }

  // Sets up auto-logout timer that triggers after 40 minutes of user inactivity
  setupInactivityTimer() {
    // Only set up timer if user is logged in
    if (!UserService.isLoggedIn()) return;
    
    // Events that indicate user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    // Reset timer on any activity
    const resetTimer = () => {
      if (this.inactivityTimer) {
        clearTimeout(this.inactivityTimer);
      }
      
      // Only set timer if user is still logged in
      if (UserService.isLoggedIn()) {
        this.inactivityTimer = setTimeout(() => {
          this.autoLogout();
        }, this.inactivityTimeout);
      }
    };
    
    // Add event listeners for user activity
    activityEvents.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });
    
    // Start the initial timer
    resetTimer();
    
    // Listen for logout events to clear timer
    window.addEventListener('userLoggedOut', () => {
      if (this.inactivityTimer) {
        clearTimeout(this.inactivityTimer);
        this.inactivityTimer = null;
      }
    });
  }
  
  // Logs out user automatically when inactivity timeout is reached
  autoLogout() {
    UserService.logout();
    PageController.navigateTo('login');
    PageController.showError('You have been logged out due to inactivity.');
  }
  
  // Public methods for external use
  navigateTo(page) {
    this.router.navigateToPage(page);
  }
  
  getCurrentPage() {
    return this.router.getCurrentPage();
  }
  
  reload() {
    this.router.loadPageContent();
  }
  
  // Check if user is authenticated
  isAuthenticated() {
    return UserService.isLoggedIn();
  }
  
  logout() {
    ApiService.logout();
  }
}

export default App;