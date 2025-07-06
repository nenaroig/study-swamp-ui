/**
 * LoginPage - Handles user authentication for the application
 * 
 * Manages the login form, validates user credentials, and handles the authentication flow.
 * Integrates with UserService for credential management and session persistence.
 * Redirects users to dashboard upon successful authentication.
 */

import PageController from './PageController.js';
import UserService from '../api/UserService.js';

class LoginPage {
  constructor() {
    this.pageName = 'Login';
    this.eventListeners = [];
    this.isInitialized = false;
  }

  // Initialize login form event listeners
  init() {
    if (this.isInitialized) return;
    
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
      PageController.addEventListener(loginForm, 'submit', (e) => this.handleLogin(e), this.eventListeners);
    }
    
    this.isInitialized = true;
  }

  // Process login form submission
  async handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username')?.value,
    password = document.getElementById('password')?.value;
    
    if (username && password) {
      try {
        // Use UserService for authentication
        const loginResponse = await UserService.login(username, password);
        
        // Get the user data and find current user
        const usersData = await UserService.makeAuthenticatedRequest('users/');

        const currentUser = this.findCurrentUser(usersData, username);
        
        if (currentUser) {
          UserService.setCurrentUserData(currentUser);
        }
        
        PageController.showSuccess('Login successful!', e.target);
        
        // Navigate to dashboard after successful login
        setTimeout(() => {
          PageController.navigateTo('dashboard');
        }, 1000);
        
      } catch (error) {
        console.error('Login error:', error);
        PageController.showError('Login failed. Please check your credentials.', e.target);
      }
    } else {
      PageController.showError('Please fill in all fields', e.target);
    }
  }
  
  // Find current user in the users list by matching username/email/id
  findCurrentUser(usersResponse, username) {
    if (!usersResponse?.data) {
      return null;
    }
    
    // Search for current user by username
    const currentUser = usersResponse.data.find(user => {
      const attrs = user.attributes || {};
      return attrs.username === username ||
             attrs.email === username ||
             user.id === username;
    });
    
    return currentUser;
  }
}

export default LoginPage;