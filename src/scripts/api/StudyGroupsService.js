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
  
  // Creates dashboard-style cards (simple horizontal layout)
  static createDashboardCard(group, index = 0, membersData = []) {
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
  
  // Creates template-style cards (full layout with avatars)
  static createGroupCard(group, index = 0, membersData = []) {
    const title = group.attributes?.name || 'Untitled Group';
    const description = this.formatGroupDescription(group);
    
    // Create the main column wrapper
    const colDiv = document.createElement('div');
    colDiv.className = 'col-md-4 col-sm-6 mt-4';
    
    // Create the card wrapper
    const cardDiv = document.createElement('div');
    cardDiv.className = 'bg-white p-4 mb-3 h-100 rounded-4';
    cardDiv.setAttribute('data-group-name', title);
    
    // Create the inner content container
    const contentDiv = document.createElement('div');
    contentDiv.className = 'text-start d-flex flex-column h-100';
    
    // Create title
    const titleElement = document.createElement('h3');
    titleElement.className = 'h5 groups-title';
    titleElement.textContent = title;
    
    // Create description
    const descriptionElement = document.createElement('p');
    descriptionElement.className = 'groups-description';
    descriptionElement.textContent = description;
    
    // Create member avatars section
    const avatarSection = document.createElement('div');
    avatarSection.className = 'd-flex align-items-center justify-content-between mb-3';
    
    const memberAvatarsContainer = document.createElement('div');
    memberAvatarsContainer.className = 'member-avatars d-flex';
    
    // Populate member avatars
    const groupMembers = this.getGroupMembers(group.id, membersData);
    this.populateMemberAvatars(memberAvatarsContainer, groupMembers);
    
    avatarSection.appendChild(memberAvatarsContainer);
    
    // Create view group link
    const viewLink = document.createElement('a');
    viewLink.href = createGroupUrl(title);
    viewLink.className = 'small mt-auto';
    viewLink.textContent = 'VIEW GROUP';
    viewLink.id = 'group-url';
    
    // Assemble the card
    contentDiv.appendChild(titleElement);
    contentDiv.appendChild(descriptionElement);
    contentDiv.appendChild(avatarSection);
    contentDiv.appendChild(viewLink);
    
    cardDiv.appendChild(contentDiv);
    colDiv.appendChild(cardDiv);
    
    return colDiv;
  }
  
  // Smart render function that detects context and renders appropriately
  static renderStudyGroups(groups, containerId = 'study-groups-container', membersData = [], onJoinClick = null) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    // Detect if this is dashboard or main page based on container ID
    const isDashboard = containerId === 'groups-container';
    const isMainPage = containerId === 'study-groups-container';
    
    // Handle empty state
    if (!groups || groups.length === 0) {
      if (isDashboard) {
        // Dashboard empty state
        const message = document.createElement('p');
        message.className = 'text-muted mt-4';
        message.textContent = 'No study groups joined';
        container.appendChild(message);
      } else if (isMainPage) {
        // Main page empty state
        const emptyStateCard = document.getElementById('empty-state-card');
        if (emptyStateCard) {
          emptyStateCard.classList.remove('d-none');
          emptyStateCard.classList.add('d-flex');
        }
        return;
      }
    } else {
      // Hide empty state card for main page
      if (isMainPage) {
        const emptyStateCard = document.getElementById('empty-state-card');
        if (emptyStateCard) {
          emptyStateCard.classList.add('d-none');
          emptyStateCard.classList.remove('d-flex');
        }
      }
      
      // Render appropriate cards
      groups.forEach((group, index) => {
        const card = isDashboard 
        ? this.createDashboardCard(group, index, membersData)
        : this.createGroupCard(group, index, membersData);
        container.appendChild(card);
      });
    }
    
    // Add join button for dashboard only
    if (isDashboard) {
      const buttonDiv = document.createElement('div');
      buttonDiv.className = 'mt-4';
      
      const createBtn = document.createElement('button');
      createBtn.className = 'btn btn-teal btn-sm';
      createBtn.textContent = 'Join Study Group';
      createBtn.setAttribute('data-bs-toggle', 'modal');
      createBtn.setAttribute('data-bs-target', '#listGroupModal');
      
      if (onJoinClick) {
        const modal = document.getElementById('listGroupModal');
        modal.addEventListener('shown.bs.modal', onJoinClick, { once: true });
      }
      
      buttonDiv.appendChild(createBtn);
      container.appendChild(buttonDiv);
    }
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
      console.log('Creating group with user:', currentUser);
      
      // Try different ways to get the user ID
      let currentUserId = currentUser?.userData?.id;
      if (!currentUserId && currentUser?.userData?.data) {
        currentUserId = currentUser.userData.data.id;
      }
      
      console.log('Current user ID for group creation:', currentUserId);
      
      const payload = {
        name: groupData.name,
        department: groupData.department,
        class_number: parseInt(groupData.courseNumber, 10) || 0
      };
      
      console.log('Creating group with payload:', payload);
      const groupResponse = await ApiService.postData('groups/', payload, authHeader);
      console.log('Group creation response:', groupResponse);
      
      // If group creation successful, check if user is already a member, then add if not
      if (groupResponse && groupResponse.data && groupResponse.data.id) {
        const groupId = groupResponse.data.id;
        
        // Check if user is already a member of this group
        console.log('Checking existing memberships for group:', groupId);
        const membersResponse = await ApiService.getData('members/', authHeader);
        const existingMembership = membersResponse.data?.find(member => 
          member.relationships?.user?.data?.id == currentUserId && 
          member.relationships?.group?.data?.id == groupId
        );
        
        if (existingMembership) {
          console.log('User is already a member of this group:', existingMembership);
        } else {
          // Create member relationship only if one doesn't exist
          const memberData = {
            user: parseInt(currentUserId, 10) || currentUserId,
            group: parseInt(groupId, 10) || groupId,
            creator: true,
            editor: true
          };
          
          console.log('Creating member with data:', memberData);
          const memberResponse = await ApiService.postData('members/', memberData, authHeader);
          console.log('Member creation response:', memberResponse);
          
          if (!memberResponse || !memberResponse.data) {
            console.error('Failed to add user as group member');
            // Don't throw error here, as the group was already created
          }
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