/**
 * UserService - Service for managing user authentication and session data
 * 
 * Handles all user-related functionality including:
 * - User authentication (login/logout)
 * - Session management and persistence
 * - Credential storage and retrieval
 * - Authentication header generation for API requests
 * - User data management
 * 
 * Uses Basic Authentication with Base64 encoding for API requests.
 * Stores credentials and user data in sessionStorage for persistence across page reloads.
 * 
 * @static
 */

import ApiService from './ApiService.js';

class UserService {
  // Static properties to store user state in memory
  static username = null;
  static password = null;
  static currentUserData = null;
  
  /* ======= GETTERS ======= */
  
  /**
   * Retrieves the current user's data
   * 
   * @returns {Object|null} Current user data object or null if not set
   * 
   * @example
   * const userData = UserService.getCurrentUserData();
   * if (userData) {
   *   console.log('User name:', userData.name);
   * }
   */
  static getCurrentUserData() {
    return this.currentUserData;
  }
  
  /**
   * Generates Basic Authentication header for API requests
   * Encodes username:password combination in Base64 format
   * 
   * @returns {string|null} Authorization header string or null if no credentials
   * 
   * @example
   * const authHeader = UserService.getAuthHeader();
   * // Returns: "Basic dXNlcm5hbWU6cGFzc3dvcmQ=" or null
   */
  static getAuthHeader() {
    if (this.username && this.password) {
      // Create Basic Auth header with Base64 encoding
      const authHeader = `Basic ${btoa(`${this.username}:${this.password}`)}`;
      return authHeader;
    }
    return null;
  }
  
  /**
   * Retrieves comprehensive current user information
   * 
   * @returns {Object} User information object containing:
   *   @returns {string|null} username - Current username
   *   @returns {Object|null} userData - Current user data
   *   @returns {boolean} isLoggedIn - Whether user is logged in
   * 
   * @example
   * const { username, userData, isLoggedIn } = UserService.getCurrentUser();
   * if (isLoggedIn) {
   *   console.log(`Welcome back, ${username}!`);
   * }
   */
  static getCurrentUser() {
    return {
      username: this.username,
      userData: this.currentUserData,
      isLoggedIn: this.isLoggedIn()
    };
  }
  
  /**
   * Retrieves just the current username
   * 
   * @returns {string|null} Current username or null if not logged in
   */
  static getCurrentUsername() {
    return this.username;
  }

  /* ======= SETTERS ======= */
  
  /**
   * Sets user credentials in memory
   * Does not persist to storage - use storeCredentials() for persistence
   * 
   * @param {string} username - User's username
   * @param {string} password - User's password
   * 
   * @example
   * UserService.setCredentials('john_doe', 'password123');
   */
  static setCredentials(username, password) {
    this.username = username;
    this.password = password;
  }
  
  /**
   * Sets current user data and persists to sessionStorage
   * Automatically stores the data for persistence across page reloads
   * 
   * @param {Object} userData - User data object to store
   * 
   * @example
   * const userData = { id: 123, name: 'John Doe', email: 'john@example.com' };
   * UserService.setCurrentUserData(userData);
   */
  static setCurrentUserData(userData) {
    this.currentUserData = userData;
    // Store user in sessionStorage for persistence across page reloads
    sessionStorage.setItem('currentUserData', JSON.stringify(userData));
  }

  /* ======= AUTHENTICATION ======= */
  
  /**
   * Authenticates a user with username and password
   * Makes API request to validate credentials and stores them on success
   * 
   * @param {string} username - User's username
   * @param {string} password - User's password
   * @returns {Promise<Object>} API response from successful authentication
   * @throws {Error} If authentication fails or API request fails
   * 
   * @example
   * try {
   *   const response = await UserService.login('john_doe', 'password123');
   *   console.log('Login successful:', response);
   * } catch (error) {
   *   console.error('Login failed:', error.message);
   * }
   */
  static async login(username, password) {
    // Set credentials temporarily for authentication attempt
    this.setCredentials(username, password);
    
    try {
      // Test credentials with API request
      const authHeader = this.getAuthHeader();
      const response = await ApiService.getData('', authHeader);
      
      // Store credentials on successful authentication
      this.storeCredentials(username, password);
      
      return response;
    } catch (error) {
      // Clear credentials if authentication fails
      this.clearCredentials();
      throw error;
    }
  }

  /* ======= SESSION MANAGEMENT ======= */
  
  /**
   * Stores credentials in sessionStorage for persistence
   * Allows user to remain logged in across page reloads
   * 
   * @param {string} username - Username to store
   * @param {string} password - Password to store
   * 
   */
  static storeCredentials(username, password) {
    sessionStorage.setItem('username', username);
    sessionStorage.setItem('password', password);
  }
  
  /**
   * Loads stored user data from sessionStorage
   * Attempts to restore user data from a previous session
   * 
   * @returns {Object|null} Loaded user data or null if none exists or parsing fails
   * 
   * @example
   * const userData = UserService.loadStoredUserData();
   * if (userData) {
   *   console.log('Restored user session for:', userData.name);
   * }
   */
  static loadStoredUserData() {
    const storedData = sessionStorage.getItem('currentUserData');
    
    if (storedData) {
      try {
        // Parse JSON data and restore to memory
        this.currentUserData = JSON.parse(storedData);
        return this.currentUserData;
      } catch (error) {
        // Handle corrupted JSON data gracefully
        console.error('Failed to parse stored user data:', error);
        return null;
      }
    }
    return null;
  }
  
  /**
   * Clears all user credentials and data from memory
   * Does not clear sessionStorage - use clearStoredCredentials() for that
   */
  static clearCredentials() {
    this.username = null;
    this.password = null;
    this.currentUserData = null;
  }
  
  /**
   * Loads stored credentials from sessionStorage and restores session
   * Useful for automatically logging in users when they return to the app
   * 
   * @returns {boolean} True if credentials were found and loaded, false otherwise
   * 
   * @example
   * // On app startup
   * if (UserService.loadStoredCredentials()) {
   *   console.log('User session restored');
   * } else {
   *   console.log('No stored session found');
   * }
   */
  static loadStoredCredentials() {
    const username = sessionStorage.getItem('username');
    const password = sessionStorage.getItem('password');
    if (username && password) {
      // Restore credentials to memory
      this.setCredentials(username, password);
      // Also restore user data if available
      this.loadStoredUserData();
      return true;
    }
    return false;
  }
  
  /* ======= STATE MANAGEMENT ======= */
  
  /**
   * Removes all stored credentials and user data from sessionStorage
   * Completely clears any persistent session data
   */
  static clearStoredCredentials() {
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('password');
    sessionStorage.removeItem('currentUserData');
  }
  
  /**
   * Checks if a user is currently logged in
   * 
   * @returns {boolean} True if user has valid credentials, false otherwise
   * 
   * @example
   * if (UserService.isLoggedIn()) {
   *   showDashboard();
   * } else {
   *   showLoginForm();
   * }
   */
  static isLoggedIn() {
    const hasMemoryCredentials = this.username !== null && this.password !== null;
    
    // Also check sessionStorage as backup
    if (!hasMemoryCredentials) {
      const storedUsername = sessionStorage.getItem('username');
      const storedPassword = sessionStorage.getItem('password');
      
      if (storedUsername && storedPassword) {
        console.log('Restoring credentials from sessionStorage');
        this.setCredentials(storedUsername, storedPassword);
        return true;
      }
    }
    
    return hasMemoryCredentials;
  }

  /* ======= LIFECYCLE ======= */
  
  /**
   * Logs out the current user
   * Clears all credentials, user data, and stored session information
   * Dispatches a custom event to notify other parts of the application
   * 
   * @returns {boolean} Always returns true to indicate successful logout
   * 
   * @example
   * UserService.logout();
   * // User is now logged out and 'userLoggedOut' event is dispatched
   */
  static logout() {
    // Clear all user data from memory
    this.clearCredentials();
    // Clear all stored session data
    this.clearStoredCredentials();
    
    // Notify other parts of the application about logout
    // Other components can listen for this event to update their state
    window.dispatchEvent(new CustomEvent('userLoggedOut'));
    
    return true;
  }

  /* ======= HELPERS ======= */
  
  /**
   * Helper method to make authenticated GET requests
   * Automatically includes authentication header and handles auth errors
   * 
   * @param {string} endpoint - API endpoint to request
   * @returns {Promise<Object>} Parsed response from API
   * @throws {Error} If no authentication credentials or API request fails
   * 
   * @example
   * const userData = await UserService.makeAuthenticatedRequest('user/profile');
   */
  static async makeAuthenticatedRequest(endpoint) {
    const authHeader = this.getAuthHeader();
    if (!authHeader) {
      throw new Error('No authentication credentials available');
    }
    return await ApiService.getData(endpoint, authHeader);
  }
  
  /**
   * Helper method to make authenticated POST requests
   * Automatically includes authentication header and handles auth errors
   * 
   * @param {string} endpoint - API endpoint to request
   * @param {Object} data - Data to send in request body
   * @returns {Promise<Object>} Parsed response from API
   * @throws {Error} If no authentication credentials or API request fails
   * 
   * @example
   * const updateData = { name: 'New Name' };
   * const result = await UserService.makeAuthenticatedPostRequest('user/profile', updateData);
   */
  static async makeAuthenticatedPostRequest(endpoint, data) {
    const authHeader = this.getAuthHeader();
    if (!authHeader) {
      throw new Error('No authentication credentials available');
    }
    return await ApiService.postData(endpoint, data, authHeader);
  }
}

export default UserService;