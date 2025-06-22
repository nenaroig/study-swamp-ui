import PageController from './PageController.js';

class SignUpPage {
  constructor() {
    this.pageName = 'Sign Up';
    this.eventListeners = [];
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    
    console.log('🔐 Sign Up page initialized');
    
    this.isInitialized = true;
  }

}

export default SignUpPage;