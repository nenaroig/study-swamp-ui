import PageController from './PageController.js';

class ForgotPassword {
  constructor() {
    this.pageName = 'Forgot Password';
    this.eventListeners = [];
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    
    console.log('🔐 Forgot Password page initialized');
    
    this.isInitialized = true;
  }

}

export default ForgotPassword;