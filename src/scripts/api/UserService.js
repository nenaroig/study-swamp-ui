import ApiService from './ApiService.js';

class UserService {
  static username = null;
  static password = null;
  static currentUserData = null;

  /* ======= GETTERS ======= */

  // Returns current user data object
  static getCurrentUserData() {
    return this.currentUserData;
  }

  // Generates Basic Auth header for API requests
  static getAuthHeader() {
    if (this.username && this.password) {
      const authHeader = `Basic ${btoa(`${this.username}:${this.password}`)}`;
      return authHeader;
    }
    return null;
  }

  // Returns complete user info including login status
  static getCurrentUser() {
    return {
      username: this.username,
      userData: this.currentUserData,
      isLoggedIn: this.isLoggedIn()
    };
  }

  // Returns just the current username
  static getCurrentUsername() {
    return this.username;
  }

  /* ======= SETTERS ======= */

  // Sets credentials in memory only
  static setCredentials(username, password) {
    this.username = username;
    this.password = password;
  }

  // Sets user data and persists to localStorage
  static setCurrentUserData(userData) {
    console.log('🔵 setCurrentUserData called with:', userData);
    this.currentUserData = userData;
    localStorage.setItem('currentUserData', JSON.stringify(userData));
    console.log('🔵 Stored to localStorage successfully');
  }

  /* ======= AUTHENTICATION ======= */

  // Authenticates user and stores credentials on success
  static async login(username, password) {
    this.setCredentials(username, password);

    try {
      const authHeader = this.getAuthHeader();
      const response = await ApiService.getData('', authHeader);

      this.storeCredentials(username, password);

      return response;
    } catch (error) {
      this.clearCredentials();
      throw error;
    }
  }

  /* ======= SESSION MANAGEMENT ======= */

  // Stores credentials in localStorage
  static storeCredentials(username, password) {
    console.log('🔵 storeCredentials called:', username);
    localStorage.setItem('username', username);
    localStorage.setItem('password', password);
    console.log('🔵 Credentials stored to localStorage');
  }

  // Loads stored user data from localStorage
  static loadStoredUserData() {
    const storedData = localStorage.getItem('currentUserData');

    if (storedData) {
      try {
        this.currentUserData = JSON.parse(storedData);
        return this.currentUserData;
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        return null;
      }
    }
    return null;
  }

  // Clears credentials from memory only
  static clearCredentials() {
    console.log('🔴 clearCredentials called');
    this.username = null;
    this.password = null;
    this.currentUserData = null;
  }

  // Loads stored credentials from localStorage and restores session
  static loadStoredCredentials() {
    const username = localStorage.getItem('username');
    const password = localStorage.getItem('password');
    if (username && password) {
      this.setCredentials(username, password);
      this.loadStoredUserData();
      return true;
    }
    return false;
  }

  /* ======= STATE MANAGEMENT ======= */

  // Removes all stored data from localStorage
  static clearStoredCredentials() {
    console.log('🔴 clearStoredCredentials called - clearing localStorage');
    localStorage.removeItem('username');
    localStorage.removeItem('password');
    localStorage.removeItem('currentUserData');
  }

  // Checks if user is logged in
  static isLoggedIn() {
    console.log('🔍 isLoggedIn check - memory credentials:', this.username, this.password ? '***' : null);
    const hasMemoryCredentials = this.username !== null && this.password !== null;

    if (!hasMemoryCredentials) {
      const storedUsername = localStorage.getItem('username');
      const storedPassword = localStorage.getItem('password');
      console.log('🔍 Checking localStorage:', storedUsername, storedPassword ? '***' : null);

      if (storedUsername && storedPassword) {
        console.log('🟢 Restoring credentials from localStorage');
        this.setCredentials(storedUsername, storedPassword);
        return true;
      } else {
        console.log('🔴 No stored credentials found');
      }
    }

    console.log('🔍 Final login status:', hasMemoryCredentials);
    return hasMemoryCredentials;
  }

  /* ======= LIFECYCLE ======= */

  // Logs out user and clears all data
  static logout() {
    console.log('🔴 LOGOUT CALLED - Stack trace:');
    console.trace(); // This will show us exactly what called logout

    this.clearCredentials();
    this.clearStoredCredentials();

    window.dispatchEvent(new CustomEvent('userLoggedOut'));

    return true;
  }

  /* ======= HELPERS ======= */

  // Makes authenticated GET request
  static async makeAuthenticatedRequest(endpoint) {
    const authHeader = this.getAuthHeader();
    if (!authHeader) {
      throw new Error('No authentication credentials available');
    }
    return await ApiService.getData(endpoint, authHeader);
  }

  // Makes authenticated POST request
  static async makeAuthenticatedPostRequest(endpoint, data) {
    const authHeader = this.getAuthHeader();
    if (!authHeader) {
      throw new Error('No authentication credentials available');
    }
    return await ApiService.postData(endpoint, data, authHeader);
  }
}

export default UserService;