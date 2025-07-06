// Packages
import '@popperjs/core';
import 'bootstrap';

// Styles
import '../styles/main.scss';

// App
import App from './App.js';
import ApiService from './api/ApiService.js';

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  const app = new App();
  await app.init();
  
  // Make app available globally for debugging
  if (process.env.NODE_ENV === 'development') {
    window.app = app;
    window.ApiService = ApiService;
  }
});