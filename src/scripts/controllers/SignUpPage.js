import PageController from './PageController.js';

class SignUpPage {
  constructor() {
    this.pageName = 'Sign Up';
    this.eventListeners = [];
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    
    this.isInitialized = true;
  }

}

export default SignUpPage;