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

  // Creates a study group card element without using templates
  static createCard(group, index = 0, templateId = 'study-groups-template', membersData = []) {
    const title = group.attributes?.name || 'Untitled Group';
    const description = this.formatGroupDescription(group);

    const cardDiv = document.createElement('div');
    cardDiv.className = 'd-flex align-items-center justify-content-between mt-4';
    cardDiv.id = `group-${group.id || index}`;
    cardDiv.setAttribute('data-group-name', title);

    const contentDiv = document.createElement('div');

    const titleElement = document.createElement('h3');
    titleElement.className = 'h5';
    titleElement.textContent = title;

    const descriptionElement = document.createElement('p');
    descriptionElement.className = 'text-muted mb-0';
    descriptionElement.textContent = description;

    contentDiv.appendChild(titleElement);
    contentDiv.appendChild(descriptionElement);

    const viewBtn = document.createElement('a');
    viewBtn.href = '#';
    viewBtn.className = 'btn btn-gator-accent text-white btn-sm ms-auto';
    viewBtn.textContent = 'View';
    viewBtn.addEventListener('click', () => this.handleGroupAction(group));

    cardDiv.appendChild(contentDiv);
    cardDiv.appendChild(viewBtn);

    return cardDiv;
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

  // Renders study groups
  static renderStudyGroups(groups, containerId = 'study-groups-container', membersData = [], onJoinClick = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    // Show groups if they exist, otherwise show empty message
    if (!groups || groups.length === 0) {
      const message = document.createElement('p');
      message.className = 'text-muted mt-4';
      message.textContent = 'No study groups joined';
      container.appendChild(message);
    } else {
      groups.forEach((group, index) => {
        const card = this.createCard(group, index, 'study-groups-template', membersData);
        container.appendChild(card);
      });
    }

    // Always show the Join Study Group button at the bottom
    const buttonDiv = document.createElement('div');
    buttonDiv.className = 'mt-4';

    const createBtn = document.createElement('button');
    createBtn.className = 'btn btn-teal btn-sm';
    createBtn.textContent = 'Join Study Group';
    createBtn.setAttribute('data-bs-toggle', 'modal');
    createBtn.setAttribute('data-bs-target', '#listGroupModal');

    // Use the callback if provided
    if (onJoinClick) {
      const modal = document.getElementById('listGroupModal');
      modal.addEventListener('shown.bs.modal', onJoinClick, { once: true });
    }

    buttonDiv.appendChild(createBtn);
    container.appendChild(buttonDiv);
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