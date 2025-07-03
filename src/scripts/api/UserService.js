// UserService.js
import ApiService from './ApiService.js';

class UserService {
  static username = null;
  static password = null;
  static currentUserData = null;
  
  /* ======= GETTERS ======= */
  static getCurrentUserData() {
    return this.currentUserData;
  }
  static getAuthHeader() {
    if (this.username && this.password) {
      const authHeader = `Basic ${btoa(`${this.username}:${this.password}`)}`;
      console.log(`Basic ${btoa(`${this.username}:${this.password}`)}`);
      return authHeader;
    }
    console.log('No credentials available'); //remove
    return null;
  }
  static getCurrentUser() {
    return {
      username: this.username,
      userData: this.currentUserData,
      isLoggedIn: this.isLoggedIn()
    };
  }
  static getCurrentUsername() {
    return this.username;
  }

  /* ======= SETTERS ======= */
  static setCredentials(username, password) {
    this.username = username;
    this.password = password;
    console.log('Credentials set for user:', username); // remove
  }
  static setCurrentUserData(userData) {
    this.currentUserData = userData;
    // Store user in sessionStorage for persistence
    sessionStorage.setItem('currentUserData', JSON.stringify(userData));
    console.log('Current user data stored:', userData); // remove
  }

  /* ======= AUTHENTICATION ======= */
  static async login(username, password) {
    this.setCredentials(username, password);
    
    try {
      const authHeader = this.getAuthHeader();
      const response = await ApiService.getData('', authHeader);
      console.log('Login response:', response);
      
      // Store credentials on successful login
      this.storeCredentials(username, password);
      
      return response;
    } catch (error) {
      // Clear credentials if login fails
      this.clearCredentials();
      throw error;
    }
  }

  /* ======= SESSION MANAGEMENT ======= */
  static storeCredentials(username, password) {
    sessionStorage.setItem('username', username);
    sessionStorage.setItem('password', password);
    console.log('Credentials stored in session'); //remove
  }
  static loadStoredUserData() {
    const storedData = sessionStorage.getItem('currentUserData');
    console.log('Loading stored user data:', storedData);
    
    if (storedData) {
      try {
        this.currentUserData = JSON.parse(storedData);
        console.log('User data loaded from storage:', this.currentUserData); // remove
        return this.currentUserData;
      } catch (error) {
        console.error('Failed to parse stored user data:', error); // remove
        return null;
      }
    }
    return null;
  }
  static clearCredentials() {
    this.username = null;
    this.password = null;
    this.currentUserData = null;
    console.log('Credentials cleared'); //remove
  }
  static loadStoredCredentials() {
    const username = sessionStorage.getItem('username');
    const password = sessionStorage.getItem('password');
    if (username && password) {
      this.setCredentials(username, password);
      this.loadStoredUserData();
      console.log('Loaded stored credentials for:', username); // remove
      return true;
    }
    return false;
  }
  
  /* ======= STATE MANAGEMENT ======= */
  static clearStoredCredentials() {
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('password');
    sessionStorage.removeItem('currentUserData');
  }
  static isLoggedIn() {
    return this.username !== null && this.password !== null;
  }

  /* ======= LIFECYCLE ======= */
  static logout() {
    console.log('Logging out user:', this.username); //remove
    this.clearCredentials();
    this.clearStoredCredentials();
    
    // Dispatch logout event for other parts of app to listen to
    window.dispatchEvent(new CustomEvent('userLoggedOut'));
    
    return true;
  }

  /* ======= HELPERS ======= */
  // Helper method to make authenticated requests
  static async makeAuthenticatedRequest(endpoint) {
    const authHeader = this.getAuthHeader();
    if (!authHeader) {
      throw new Error('No authentication credentials available');
    }
    return await ApiService.getData(endpoint, authHeader);
  }
  // Helper method to make authenticated POST requests
  static async makeAuthenticatedPostRequest(endpoint, data) {
    const authHeader = this.getAuthHeader();
    if (!authHeader) {
      throw new Error('No authentication credentials available');
    }
    return await ApiService.postData(endpoint, data, authHeader);
  }
}

export default UserService;