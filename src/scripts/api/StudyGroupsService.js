// StudyGroupsService - manages study groups data and UI

import ApiService from './ApiService.js';
import UserService from './UserService.js';
import BaseService from './BaseService.js';
import PageController from '../controllers/PageController.js';
import { createGroupUrl } from '../controllers/StudyGroupDetailPage.js';

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
  static createCard(group, index = 0, templateId = 'study-groups-template', membersData = []) {
    const title = group.attributes?.name || 'Untitled Group',
    description = this.formatGroupDescription(group),
    id = `group-${group.id || index}`;
    
    const cardData = {
      title: title,
      description: description,
      id: id,
      group: group,
      members: this.getGroupMembers(group.id, membersData),
      buttonHandler: () => this.handleGroupAction(group)
    };
    
    const clone = this.createCardFromTemplate(templateId, cardData);
    
    // Add data-group-name attribute for URL generation
    const container = clone.querySelector('div[data-group-name]');
    if (container) {
      container.dataset.groupName = title;
    }
    
    return clone;
  }
  
  // Retrieves members of a specific group
  static getGroupMembers(groupId, membersData) {
    return membersData.filter(member => 
      member.relationships.group.data.id === groupId
    );
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
    buttonElement = clone.querySelector('a'),
    memberAvatarsContainer = clone.querySelector('.member-avatars');
    
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
    
    if (memberAvatarsContainer && data.members) {
      this.populateMemberAvatars(memberAvatarsContainer, data.members);
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
  
  // Renders study groups using dashboard-specific template 
  static renderStudyGroups(groups, containerId = 'study-groups-container', membersData = []) {
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
        emptyStateCard.classList.remove('d-block');
        emptyStateCard.classList.add('d-none');
      }
      if (container) {
        container.classList.remove('d-none');
      }
      
      // Clear container
      container.innerHTML = '';
      
      // Create cards with member data
      groups.forEach((group, index) => {
        const card = this.createCard(group, index, 'study-groups-template', membersData);
        container.appendChild(card);
      });
    }
  }
  
  static async populateMemberAvatars(container, members) {
    // Clear existing avatars
    container.innerHTML = '';
    
    const maxVisibleMembers = 2;
    const membersToShow = members.slice(0, maxVisibleMembers);
    
    try {
      // Get user details for each member
      const authHeader = UserService.getAuthHeader();
      const userPromises = membersToShow.map(member => {
        const userId = member.relationships.user.data.id;
        return UserService.makeAuthenticatedRequest(`users/${userId}`);
      });
      
      const userResponses = await Promise.all(userPromises);
      
      userResponses.forEach((userResponse, index) => {
        const memberDiv = document.createElement('div');
        memberDiv.className = 'member-avatar rounded-circle text-white';
        
        // Get member initials from user response
        const userData = userResponse.data;
        const firstName = userData.attributes?.first_name || '';
        const lastName = userData.attributes?.last_name || '';
        
        let initials = '';
        if (firstName && lastName) {
          initials = firstName.charAt(0).toUpperCase() + lastName.charAt(0).toUpperCase();
        } else if (firstName) {
          initials = firstName.charAt(0).toUpperCase() + (firstName.charAt(1) || '').toUpperCase();
        }
        
        memberDiv.textContent = initials;
        container.appendChild(memberDiv);
      });
      
      // Add "+X" indicator if there are more members
      if (members.length > maxVisibleMembers) {
        const moreDiv = document.createElement('div');
        moreDiv.className = 'member-avatar rounded-circle text-white';
        moreDiv.textContent = `+${members.length - maxVisibleMembers}`;
        container.appendChild(moreDiv);
      }
      
    } catch (error) {
      console.error('Error fetching user details for avatars:', error);
    }
  }
  
  /* ======= ACTION HANDLERS ======= */
  
  /**
  * Handles user interactions with study group cards (e.g., action button clicks)
  * Currently logs the action - should be implemented with actual functionality
  * 
  * @todo Implement actual group actions such as:
  *   - Joining/leaving group
  *   - Accessing group resources
  */
  static handleGroupAction(group) {
    const groupName = group.attributes?.name || 'Untitled Group';
    
    const groupUrl = createGroupUrl(groupName);
    window.location.href = groupUrl;
  }
  
  /* ======= CREATORS ======= */
  
  // Creates a new study group and adds current user as member
  static async createStudyGroup(groupData) {
    try {
      const authHeader = UserService.getAuthHeader();
      const currentUser = UserService.getCurrentUser();
      const currentUserId = currentUser?.userData?.id || currentUser?.id;
      
      const payload = {
        name: groupData.name,
        department: groupData.department,
        class_number: parseInt(groupData.courseNumber)
      };
      
      const groupResponse = await ApiService.postData('groups/', payload, authHeader);
      
      // If group creation successful, add current user as member
      if (groupResponse && groupResponse.data && groupResponse.data.id) {
        const groupId = groupResponse.data.id;
        
        // Create member relationship
        const memberData = {
          user: parseInt(currentUserId),
          group: parseInt(groupId),
          creator: true
        };
        
        const memberResponse = await ApiService.postData('members/', memberData, authHeader);
        
        if (!memberResponse || !memberResponse.data) {
          throw new Error('Failed to add user as group member');
        }
      } else {
        throw new Error('Group creation failed - no response data');
      }
      
      return {
        success: true,
        data: groupResponse
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