class HMRManager {
  constructor(router) {
    this.router = router;
    this.init();
  }

  init() {
    if (module.hot) {
      this.setupHMR();
    }

    if (process.env.NODE_ENV === 'development') {
      this.setupDevTools();
    }
  }

  setupHMR() {
    // Accept hot updates for CSS
    module.hot.accept('../../styles/main.scss', () => {
      console.log('🎨 Styles updated via HMR!');
    });

    // Accept hot updates for HTML templates
    module.hot.accept('../../templates/login.html', () => {
      console.log('Login template updated via HMR!');
      this.router.loadPageContent();
    });

    module.hot.accept('../../templates/signup.html', () => {
      console.log('Sign up template updated via HMR!');
      this.router.loadPageContent();
    });

    module.hot.accept('../../templates/forgot-password.html', () => {
      console.log('Forgot Password template updated via HMR!');
      this.router.loadPageContent();
    });

    module.hot.accept('../../templates/dashboard/dashboard.html', () => {
      console.log('Dashboard template updated via HMR!');
      this.router.loadPageContent();
    });

    module.hot.accept('../../templates/navigation.html', () => {
      console.log('Navigation template updated via HMR!');
      this.router.loadPageContent();
    });

    // Accept hot updates for this module
    module.hot.accept('../main.js', () => {
      console.log('JavaScript updated via HMR!');
    });

    // Handle disposal
    module.hot.dispose(() => {
      console.log('Cleaning up before HMR...');
      this.cleanup();
    });
  }

  setupDevTools() {
    console.log('Running in development mode');
    
    // Helpful development tools for debugging
    window.debugApp = {
      router: this.router,
      reload: () => this.router.loadPageContent(),
      navigateTo: (page) => this.router.navigateToPage(page),
      version: '1.0.0',
      env: process.env.NODE_ENV,
      contentMap: this.router.contentMap
    };

    console.log('Debug tools available at window.debugApp');
  }

  cleanup() {
    if (window.debugApp) {
      delete window.debugApp;
    }
  }
}

export default HMRManager;