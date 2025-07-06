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
      return authHeader;
    }
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
  }
  static setCurrentUserData(userData) {
    this.currentUserData = userData;
    // Store user in sessionStorage for persistence
    sessionStorage.setItem('currentUserData', JSON.stringify(userData));
  }

  /* ======= AUTHENTICATION ======= */
  static async login(username, password) {
    this.setCredentials(username, password);
    
    try {
      const authHeader = this.getAuthHeader();
      const response = await ApiService.getData('', authHeader);
      
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
  }
  static loadStoredUserData() {
    const storedData = sessionStorage.getItem('currentUserData');
    
    if (storedData) {
      try {
        this.currentUserData = JSON.parse(storedData);
        return this.currentUserData;
      } catch (error) {
        return null;
      }
    }
    return null;
  }
  static clearCredentials() {
    this.username = null;
    this.password = null;
    this.currentUserData = null;
  }
  static loadStoredCredentials() {
    const username = sessionStorage.getItem('username');
    const password = sessionStorage.getItem('password');
    if (username && password) {
      this.setCredentials(username, password);
      this.loadStoredUserData();
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