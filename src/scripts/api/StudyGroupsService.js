/**
 * StudyGroupsService - Service for managing study group data and UI
 * 
 * Extends BaseService to provide study group-specific functionality including:
 * - Fetching user's study group memberships from the API
 * - Rendering study group cards in the UI
 * - Formatting group information for display
 * - Handling group-related user interactions
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
   */
  static async getMyStudyGroups() {
    try {
      const authHeader = UserService.getAuthHeader();
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
   */
  static createCard(group, index = 0, templateId = 'groups-template') {
    const title = group.attributes?.name || 'Untitled Group',
    description = this.formatGroupDescription(group),
    id = `group-${group.id || index}`;
    
    const cardData = {
      title: title,
      description: description,
      id: id,
      buttonHandler: () => this.handleGroupAction(group)
    };
    
    return this.createCardFromTemplate(templateId, cardData);
  }
  
  /**
   * Provides empty state configuration (implements BaseService abstract method)
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
   */
  static populateCardData(clone, data) {
    const titleElement = clone.querySelector('.groups-title'),
    descriptionElement = clone.querySelector('.groups-description'),
    buttonElement = clone.querySelector('.groups-btn');
    
    if (titleElement && data.title) {
      titleElement.textContent = data.title;
    }
    
    if (descriptionElement && data.description) {
      descriptionElement.textContent = data.description;
    }
    
    if (buttonElement && data.buttonHandler) {
      buttonElement.addEventListener('click', data.buttonHandler);
    }
    
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
   */
  static formatGroupDescription(group) {
    const department = group.attributes?.department,
    classNumber = group.attributes?.class_number;
    
    if (department && classNumber) {
      return `${department} ${classNumber}`;
    } else if (department) {
      return department;
    } else if (classNumber) {
      return `Class ${classNumber}`;
    }
    
    return 'Study Group';
  }
  
  // Renders study groups into the specified container
  static renderStudyGroups(groups, containerId = 'groups-container') {
    this.renderItems(groups, containerId, 'study groups');
  }

  // Renders study groups using dashboard-specific template 
  static renderDashboardGroups(groups, containerId = 'dashboard-groups-container') {
    const emptyStateCard = document.getElementById('empty-state-card');
    const container = document.getElementById(containerId);
    
    if (!groups || groups.length === 0) {
      // Show empty state
      if (emptyStateCard) emptyStateCard.style.display = 'block';
      if (container) container.style.display = 'none';
    } else {
      // Show groups
      if (emptyStateCard) emptyStateCard.style.display = 'none';
      if (container) container.style.display = 'block';
      this.renderItems(groups, containerId, 'study groups', 'dashboard-groups-template');
    }
  }
  
  /* ======= ACTION HANDLERS ======= */
  
  /**
   * Handles user interactions with study group cards (e.g., action button clicks)
   * Currently logs the action - should be implemented with actual functionality
   * 
   * @todo Implement actual group actions such as:
   *   - Showing group details modal - possibly
   *   - Navigating to group page
   *   - Joining/leaving group
   *   - Viewing group members
   *   - Accessing group resources
   */
  static handleGroupAction(group) {
    console.log('Group action clicked:', group);
    
    const groupName = group.attributes?.name || 'Untitled Group',
    groupId = group.id;
    
    // Example implementation possibilities:
    // - Show group details modal: showGroupDetailsModal(group) - possibly
    // - Navigate to group page: window.location.href = `/groups/${groupId}`
    // - Join/leave group: toggleGroupMembership(groupId)
    
    console.log(`Action requested for group: ${groupName} (ID: ${groupId})`);
  }
}

export default StudyGroupsService;