
import loginContent from '../../templates/login.html';
import navigationContent from '../../templates/navigation.html';
import signUpContent from '../../templates/signup.html';
import forgotPasswordContent from '../../templates/forgot-password.html';
import dashboardContent from '../../templates/dashboard/dashboard.html';

class AppRouter {
  constructor() {
    this.contentMap = {
      'index': loginContent,
      'signup': signUpContent,
      'forgot-password': forgotPasswordContent,
      'dashboard': dashboardContent,
    };

    this.pagesWithNav = ['dashboard'];
    
    this.titles = {
      'index': 'Study Swamp - Login',
      'signup': 'Study Swamp - Sign Up',
      'dashboard': 'Study Swamp - Dashboard',
      'forgot-password': 'Study Swamp - Forgot Password',
    };

    this.navigationContent = navigationContent;
  }

  getCurrentPage() {
    const path = window.location.pathname;
    return path.split('/').pop().replace('.html', '') || 'index';
  }

  loadPageContent() {
    const page = this.getCurrentPage();
    
    const content = this.contentMap[page];
    
    if (content) {
      this.renderContent(page, content);
      this.updatePageTitle(page);
      this.setupNavigation();
      
      // Dispatch custom event for page-specific initialization
      this.dispatchPageLoadEvent(page);
    }
  }

  renderContent(page, content) {
    const app = document.getElementById('app');
    if (app) {
      if (this.pagesWithNav.includes(page)) {
        app.innerHTML = this.navigationContent + content;
      } else {
        app.innerHTML = content;
      }
    }
  }

  updatePageTitle(page) {
    document.title = this.titles[page] || 'Study Swamp';
  }

  setupNavigation() {
    const navLinks = document.querySelectorAll('[data-page]');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetPage = e.target.getAttribute('data-page');
        this.navigateToPage(targetPage);
      });
    });
  }

  navigateToPage(page) {
    const newUrl = page === 'index' ? '/' : `/${page}.html`;
    window.history.pushState({page}, '', newUrl);
    
    // Update current URL and reload content
    window.history.replaceState({page}, '', newUrl);
    this.loadPageContent();
  }

  dispatchPageLoadEvent(page) {
    const event = new CustomEvent('pageLoaded', {
      detail: { page }
    });
    window.dispatchEvent(event);
  }

  init() {
    // Handle browser back/forward buttons
    window.addEventListener('popstate', (e) => {
      this.loadPageContent();
    });

    // Initial page load
    this.loadPageContent();
  }
}

export default AppRouter;