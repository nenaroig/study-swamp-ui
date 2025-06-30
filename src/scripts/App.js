import AppRouter from './router/AppRouter.js';
import PageController from './controllers/PageController.js';
import HMRManager from './dev/HMRManager.js';
import ApiService from './ApiService.js';
import LogoutManager from './controllers/LogoutManager.js';

class App {
  constructor() {
    this.router = null;
    this.pageController = null;
    this.hmrManager = null;
  }
  
  init() {
    console.log('🚀 Study Swamp App Starting...');
    
    // Try to restore user session
    if (ApiService.loadStoredCredentials()) {
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
    return ApiService.isLoggedIn();
  }
  
  logout() {
    ApiService.logout();
  }
}

export default App;