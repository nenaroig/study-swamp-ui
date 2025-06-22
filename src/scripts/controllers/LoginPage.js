import PageController from './PageController.js';

class LoginPage {
  constructor() {
    this.pageName = 'Login';
    this.eventListeners = [];
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    
    console.log('🔐 Login page initialized');
    
    const loginForm = document.getElementById('loginForm');
    console.log('Login form found:', loginForm); // Add this line
    
    if (loginForm) {
      PageController.addEventListener(loginForm, 'submit', (e) => this.handleLogin(e), this.eventListeners);
      console.log('Event listener added to form');
    } else {
      console.error('❌ Login form not found!');
    }
    
    this.isInitialized = true;
  }

  handleLogin(e) {
    e.preventDefault();
    
    // const username = document.getElementById('username')?.value;
    // const password = document.getElementById('password')?.value;
    
    // if (username && password) {
    //   console.log('✅ Login successful');
      PageController.navigateTo('dashboard');
    // } else {
    //   PageController.showError('Please fill in all fields', e.target);
    // }
  }
}

export default LoginPage;