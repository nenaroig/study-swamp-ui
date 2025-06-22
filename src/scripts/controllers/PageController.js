class PageController {
  constructor() {
    this.pages = new Map();
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
        this.initLoginPage();
        break;
      case 'dashboard':
        this.initDashboardPage();
        break;
      // case 'profile':
      //   this.initProfilePage();
      //   break;
      default:
        console.warn(`No initialization found for page: ${page}`);
    }
  }

  initLoginPage() {
    console.log('🔐 Login page initialized');
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      const handleLogin = (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (username && password) {
          window.dispatchEvent(new CustomEvent('navigateToPage', {
            detail: { page: 'dashboard' }
          }));
        } else {
          alert('Please fill in all fields');
        }
      };

      loginForm.addEventListener('submit', handleLogin);
      
      // Store cleanup function
      this.pages.set('index', {
        cleanup: () => {
          if (loginForm) {
            loginForm.removeEventListener('submit', handleLogin);
          }
        }
      });
    }
  }

  initDashboardPage() {
    console.log('📊 Dashboard page initialized');
    
    // Dashboard specific functionality
    const welcomeMessage = () => {
      console.log('Welcome to your dashboard!');
    };

    welcomeMessage();

    // Store cleanup function if needed
    this.pages.set('dashboard', {
      cleanup: () => {
        // Clean up dashboard event listeners, timers, etc.
      }
    });
  }

  // initProfilePage() {
  //   console.log('👤 Profile page initialized');
  //   // Profile specific functionality
  // }

  cleanup() {
    // Clean up the current page
    this.pages.forEach((pageData) => {
      if (pageData.cleanup) {
        pageData.cleanup();
      }
    });
    this.pages.clear();
  }
}

export default PageController;