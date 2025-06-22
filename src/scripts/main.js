// Packages
import '@popperjs/core';
import 'bootstrap';

// Styles
import '../styles/main.scss';

// App
import App from './App.js';

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
  
  // Make app available globally for debugging
  if (process.env.NODE_ENV === 'development') {
    window.app = app;
  }
});