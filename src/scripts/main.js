// Packages
import '@popperjs/core';
import 'bootstrap';

import '../styles/main.scss';

// Import your HTML content as strings
import loginContent from '../templates/login.html';
import navigationContent from '../templates/navigation.html';
// import dashboardContent from '../templates/dashboard.html';
// import profileContent from '../templates/profile.html';

const contentMap = {
  'index': loginContent,
  // 'dashboard': dashboardContent,
  // 'profile': profileContent,
};

// Pages that should show navigation
// const pagesWithNav = ['dashboard', , 'profile'];
const pagesWithNav = [];

const loadPageContent = () => {
  const path = window.location.pathname;
  const page = path.split('/').pop().replace('.html', '') || 'index';
  
  console.log(`🚀 Loading ${page} page`);
  
  // Get the content for this page
  const content = contentMap[page];
  
  if (content) {
    const app = document.getElementById('app');
    if (app) {
      // Show navigation for certain pages
      if (pagesWithNav.includes(page)) {
        app.innerHTML = navigationContent + content;
      } else {
        app.innerHTML = content;
      }
    }
    
    // Update page title dynamically
    const titles = {
      'index': 'Study Swamp - Login',
      // 'dashboard': 'Study Swamp - Dashboard',
      // 'profile': 'Study Swamp - Profile'
    };
    document.title = titles[page] || 'Study Swamp';
    
    // Initialize page-specific functionality
    initPageFunctionality(page);
    
    // Setup navigation if present
    setupNavigation();
  }
};

const setupNavigation = () => {
  // Handle navigation clicks
  // const navLinks = document.querySelectorAll('[data-page]');
  // navLinks.forEach(link => {
  //   link.addEventListener('click', (e) => {
  //     e.preventDefault();
  //     const targetPage = e.target.getAttribute('data-page');
  //     navigateToPage(targetPage);
  //   });
  // });
};

const navigateToPage = (page) => {
  // Update URL without page reload
  const newUrl = page === 'index' ? '/' : `/${page}.html`;
  window.history.pushState({page}, '', newUrl);
  
  // Load new content
  window.location.pathname = newUrl;
  loadPageContent();
};

const initPageFunctionality = (page) => {
  switch(page) {
    case 'index':
      initLoginPage();
      break;
    // case 'dashboard':
    //   initDashboardPage();
    //   break;
    // case 'courses':
    //   initCoursesPage();
    //   break;
  }
};

const initLoginPage = () => {
  console.log('🔐 Login page initialized');
  
  // Uncomment when you're ready to add form functionality
  // const loginForm = document.getElementById('loginForm');
  // if (loginForm) {
  //   loginForm.addEventListener('submit', (e) => {
  //     e.preventDefault();
  //     const username = document.getElementById('username').value;
  //     const password = document.getElementById('password').value;
      
  //     if (username && password) {
  //       window.location.href = '/dashboard.html';
  //     } else {
  //       alert('Please fill in all fields');
  //     }
  //   });
  // }
};

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', loadPageContent);

// Hot Module Replacement (HMR) setup
if (module.hot) {
  console.log('🔥 HMR is enabled!');
  
  // Accept hot updates for CSS
  module.hot.accept('../styles/main.scss', () => {
    console.log('🎨 Styles updated via HMR!');
  });
  
  // Accept hot updates for HTML templates
  module.hot.accept('../templates/login.html', () => {
    console.log('📄 Login template updated via HMR!');
    // Reload the page content
    loadPageContent();
  });
  
  // Accept hot updates for this module
  module.hot.accept('./main.js', () => {
    console.log('🔄 JavaScript updated via HMR!');
  });
  
  // Handle disposal
  module.hot.dispose(() => {
    console.log('🧹 Cleaning up before HMR...');
  });
}

// Development helpers
if (process.env.NODE_ENV === 'development') {
  console.log('🛠️ Running in development mode');
  
  // Add helpful development tools to window for debugging
  window.debugApp = {
    reload: loadPageContent,
    version: '1.0.0',
    env: process.env.NODE_ENV,
    contentMap
  };
}