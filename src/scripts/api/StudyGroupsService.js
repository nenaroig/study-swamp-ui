/**
 * StudyGroupsService - Service for managing study group data and UI
 * 
 * Extends BaseService to provide study group-specific functionality including:
 * - Fetching user's study group memberships from the API
 * - Rendering study group cards in the UI
 * - Formatting group information for display
 * - Handling group-related user interactions
 * 
 * This service works with study group objects that have the structure:
 * {
 *   id: string,
 *   attributes: {
 *     name: string,
 *     department: string,
 *     class_number: string
 *   }
 * }
 * 
 * @extends BaseService
 */

import ApiService from './ApiService.js';
import UserService from './UserService.js';
import BaseService from './BaseService.js';

class StudyGroupsService extends BaseService {
  
  /* ======= GETTERS ======= */
  
  /**
   * Fetches all study groups that the current user is a member of
   * 
   * @returns {Promise<Object>} Object containing:
   *   @returns {Object} studyGroupsData - Raw API response with study group data
   * @throws {Error} If API request fails or user is not authenticated
   * 
   * @example
   * const { studyGroupsData } = await StudyGroupsService.getMyStudyGroups();
   * console.log('User study groups:', studyGroupsData);
   */
  static async getMyStudyGroups() {
    try {
      // Get authentication header from UserService
      const authHeader = UserService.getAuthHeader();
      
      // Fetch study groups data from API
      const studyGroupsData = await ApiService.getData('groups/', authHeader);
      
      return {
        studyGroupsData: studyGroupsData,
      };
    } catch (error) {
      console.error('Failed to get study groups:', error);
      throw error;
    }
  }

  /* ======= ABSTRACT METHOD IMPLEMENTATIONS ======= */
  
  /**
   * Creates a study group card element (implements BaseService abstract method)
   * 
   * @param {Object} group - Study group object from API
   * @param {number} index - Index in the groups array (default: 0)
   * @returns {DocumentFragment} HTML element for the study group card
   * 
   * @example
   * const group = { 
   *   id: '123', 
   *   attributes: { 
   *     name: 'CS 101 Study Group',
   *     department: 'Computer Science',
   *     class_number: '101'
   *   } 
   * };
   * const card = StudyGroupsService.createCard(group, 0);
   */
  static createCard(group, index = 0) {
    // Extract group information with fallbacks
    const title = group.attributes?.name || 'Untitled Group',
    description = this.formatGroupDescription(group),
    id = `group-${group.id || index}`;
    
    // Prepare data object for template population
    const cardData = {
      title: title,
      description: description,
      id: id,
      buttonHandler: () => this.handleGroupAction(group)
    };
    
    // Use BaseService template creation method
    return this.createCardFromTemplate('groups-template', cardData);
  }
  
  /**
   * Provides empty state configuration (implements BaseService abstract method)
   * 
   * @returns {Object} Configuration for empty state display:
   *   @returns {string} title - Main heading for empty state
   *   @returns {string} message - Descriptive message for empty state
   */
  static getEmptyStateConfig() {
    return {
      title: 'No study groups',
      message: 'You haven\'t joined any study groups yet.'
    };
  }
  
  /* ======= CUSTOM CARD POPULATION ======= */
  
  /**
   * Populates study group card template with data (overrides BaseService method)
   * Uses group-specific CSS selectors for precise element targeting
   * 
   * @param {DocumentFragment} clone - Cloned template element
   * @param {Object} data - Data object containing:
   *   @param {string} data.title - Study group name
   *   @param {string} data.description - Formatted group description (dept + class)
   *   @param {string} data.id - Unique card identifier
   *   @param {Function} data.buttonHandler - Click handler for group action button
   */
  static populateCardData(clone, data) {
    // Find group-specific elements using precise selectors
    const titleElement = clone.querySelector('.groups-title'),
    descriptionElement = clone.querySelector('.groups-description'),
    buttonElement = clone.querySelector('.groups-btn');
    
    // Populate title if both element and data exist
    if (titleElement && data.title) {
      titleElement.textContent = data.title;
    }
    
    // Populate description if both exist
    if (descriptionElement && data.description) {
      descriptionElement.textContent = data.description;
    }
    
    // Attach click handler to action button if both exist
    if (buttonElement && data.buttonHandler) {
      buttonElement.addEventListener('click', data.buttonHandler);
    }
    
    // Set unique ID on the card container for targeting
    if (data.id) {
      const cardDiv = clone.querySelector('div');
      if (cardDiv) {
        cardDiv.id = data.id;
      }
    }
  }

  /* ======= DISPLAY/RENDERING ======= */
  
  /**
   * Formats study group description for display
   * Combines department and class number information into a readable format
   * 
   * @param {Object} group - Study group object with attributes
   * @returns {string} Formatted description string
   * 
   * @example
   * // Full info available
   * formatGroupDescription({ attributes: { department: 'CS', class_number: '101' } })
   * // Returns: "CS 101"
   * 
   * // Only department available
   * formatGroupDescription({ attributes: { department: 'Mathematics' } })
   * // Returns: "Mathematics"
   * 
   * // Only class number available
   * formatGroupDescription({ attributes: { class_number: '201' } })
   * // Returns: "Class 201"
   * 
   * // No info available
   * formatGroupDescription({ attributes: {} })
   * // Returns: "Study Group"
   */
  static formatGroupDescription(group) {
    const department = group.attributes?.department,
    classNumber = group.attributes?.class_number;
    
    // Priority: department + class number combination
    if (department && classNumber) {
      return `${department} ${classNumber}`;
    } else if (department) {
      // Fallback: department only
      return department;
    } else if (classNumber) {
      // Fallback: class number only with prefix
      return `Class ${classNumber}`;
    }
    
    // Final fallback: generic description
    return 'Study Group';
  }
  
  /**
   * Renders a list of study groups into the specified container
   * Convenience method that calls the inherited renderItems method
   * 
   * @param {Array} groups - Array of study group objects to render
   * @param {string} containerId - ID of DOM element to render into (default: 'groups-container')
   * 
   * @example
   * const groups = await StudyGroupsService.getMyStudyGroups();
   * StudyGroupsService.renderStudyGroups(groups.studyGroupsData);
   */
  static renderStudyGroups(groups, containerId = 'groups-container') {
    // Use inherited renderItems method with group-specific type
    this.renderItems(groups, containerId, 'study groups');
  }
  
  /* ======= ACTION HANDLERS ======= */
  
  /**
   * Handles user interactions with study group cards (e.g., action button clicks)
   * Currently logs the action - should be implemented with actual functionality
   * 
   * @param {Object} group - The study group object that was interacted with
   * 
   * @todo Implement actual group actions such as:
   *   - Showing group details modal - possibly
   *   - Navigating to group page
   *   - Joining/leaving group
   *   - Viewing group members
   *   - Accessing group resources
   * 
   * @example
   * // This method is called automatically when user clicks action button
   * // Implementation might look like:
   * // window.location.href = `/groups/${group.id}`;
   * // or showGroupDetailsModal(group);
   */
  static handleGroupAction(group) {
    // TODO: Implement group action (join, view details, etc.)
    console.log('Group action clicked:', group);
    
    // Extract group information for logging/debugging
    const groupName = group.attributes?.name || 'Untitled Group',
    groupId = group.id;
    
    // Example implementation possibilities:
    // - Show group details modal: showGroupDetailsModal(group) - possibly
    // - Navigate to group page: window.location.href = `/groups/${groupId}`
    // - Join/leave group: toggleGroupMembership(groupId)
    
    // For now, just log the action for debugging
    console.log(`Action requested for group: ${groupName} (ID: ${groupId})`);
  }
}

export default StudyGroupsService;