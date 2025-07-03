import PageController from './PageController.js';
import ApiService from '../api/ApiService.js';

class LoginPage {
  constructor() {
    this.pageName = 'Login';
    this.eventListeners = [];
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    
    console.log('Login page initialized'); // remove
    
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
      PageController.addEventListener(loginForm, 'submit', (e) => this.handleLogin(e), this.eventListeners);
    }
    
    this.isInitialized = true;
  }

  async handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username')?.value,
    password = document.getElementById('password')?.value;
    
    if (username && password) {
      try {
        // Set credentials in ApiService
        ApiService.setCredentials(username, password);
        
        // Store credentials for session persistence
        ApiService.storeCredentials(username, password);
        
        // Test the credentials by calling the base API endpoint
        const apiData = await ApiService.getData('');
        console.log('API base response:', apiData); // remove
        
        // Get the user data and find current user
        const usersData = await ApiService.getData('users/');
        console.log('Users data response:', usersData); //remove

        const currentUser = this.findCurrentUserInList(usersData, username);
        console.log('Found current user:', currentUser); //remove
        
        if (currentUser) {
          ApiService.setCurrentUserData(currentUser);
          console.log('✅ Login successful - Current user found:', currentUser);
        } else {
          console.log('✅ Login successful - User data not found in users list');
        }
        
        PageController.showSuccess('Login successful!', e.target);
        
        // Navigate to dashboard after successful login
        setTimeout(() => {
          PageController.navigateTo('dashboard');
        }, 1000);
        
      } catch (error) {
        PageController.showError('Login failed. Please check your credentials.', e.target);
      }
    } else {
      PageController.showError('Please fill in all fields', e.target);
    }
  }
  
  findCurrentUserInList(usersResponse, username) {
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