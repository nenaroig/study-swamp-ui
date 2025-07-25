// StudyGroupsService - manages study groups data and UI

import ApiService from './ApiService.js';
import UserService from './UserService.js';
import BaseService from './BaseService.js';

class StudyGroupsService extends BaseService {
  
  /* ======= GETTERS ======= */
  
  // Fetches all study groups that the current user is a member of
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
  
  // Creates a study group card element (implements BaseService abstract method)
  static createCard(group, index = 0, templateId = 'dashboard-groups-template') {
    const title = group.attributes?.name || 'Untitled Group',
    description = this.formatGroupDescription(group),
    id = `group-${group.id || index}`;
    
    const cardData = {
      title: title,
      description: description,
      id: id,
      buttonHandler: () => this.handleGroupAction(group)
    };
    
    const clone = this.createCardFromTemplate(templateId, cardData);
    
    // Add data-group-name attribute for URL generation
    const card = clone.querySelector('.card');
    if (card) {
      card.dataset.groupName = title;
    }
    
    return clone;
  }
  
  // Provides empty state configuration (implements BaseService abstract method)
  static getEmptyStateConfig() {
    return {
      title: 'No study groups',
      message: 'You haven\'t joined any study groups yet.'
    };
  }
  
  /* ======= CUSTOM CARD POPULATION ======= */
  
  // Populates study group card template with data (overrides BaseService method)
  static populateCardData(clone, data) {
    const titleElement = clone.querySelector('.groups-title'),
    descriptionElement = clone.querySelector('.groups-description'),
    buttonElement = clone.querySelector('a');
    
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
  
  // Formats study group description for display
  // Combines department and class number information into a readable format
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
      if (emptyStateCard) {
        emptyStateCard.classList.remove('d-none');
        emptyStateCard.classList.add('d-flex');
      }
      if (container) {
        container.classList.remove('d-flex');
        container.classList.add('d-none');
      }
    } else {
      // Show groups
      if (emptyStateCard) {
        emptyStateCard.classList.remove('d-flex');
        emptyStateCard.classList.add('d-none');
      }
      if (container) {
        container.classList.remove('d-none');
        container.classList.add('d-flex');
      }
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

  /* ======= CREATORS ======= */

  // Creates a new study group
  static async createStudyGroup(groupData) {
    try {
      const authHeader = UserService.getAuthHeader();
      const response = await ApiService.postData('groups/', {
        name: groupData.name,
        course_code: `${groupData.department} ${groupData.courseNumber}`,
        description: groupData.description,
        department: groupData.department,
        class_number: groupData.courseNumber
      }, authHeader);
      
      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error('Failed to create study group:', error);
      return {
        success: false,
        message: error.message || 'Failed to create study group'
      };
    }
  }
}

export default StudyGroupsService;