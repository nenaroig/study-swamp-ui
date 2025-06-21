// src/scripts/main.js
import '../styles/main.scss';

// Import your HTML content as strings
import loginContent from '../templates/login.html';
// import dashboardContent from '../templates/dashboard.html';
// import coursesContent from '../templates/courses.html';

const contentMap = {
  'index': loginContent,
  // 'dashboard': dashboardContent,
  // 'courses': coursesContent,
};

const loadPageContent = () => {
  const path = window.location.pathname;
  const page = path.split('/').pop().replace('.html', '') || 'index';
  
  // Get the content for this page
  const content = contentMap[page];
  
  if (content) {
    // Load content into the app container
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = content;
    }
    
    // Show/hide navigation based on page
    // const navbar = document.getElementById('navbar');
    // if (navbar) {
    //   navbar.style.display = page === 'index' ? 'none' : 'block';
    // }
    
    // Initialize page-specific functionality
    initPageFunctionality(page);
  }
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

// const initDashboardPage = () => {
//   console.log('Dashboard initialized');
// };

// const initCoursesPage = () => {
//   console.log('Courses initialized');
// };

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', loadPageContent);