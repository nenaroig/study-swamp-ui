import ApiService from './ApiService.js';
import UserService from './UserService.js';

class StudyGroupsService {
  /* ======= GETTERS ======= */
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

  /* ======= DISPLAY/RENDERING ======= */
  static createGroupsCard(group, index = 0) {
    const template = document.getElementById('groups-template');
    if (!template) {
      return;
    }
    
    const clone = template.content.cloneNode(true);
    
    // Fill in the data using your API structure
    const title = group.attributes?.name || 'Untitled Group',
    description = this.formatGroupDescription(group);
    
    clone.querySelector('.groups-title').textContent = title;
    clone.querySelector('.groups-description').textContent = description;
    
    clone.querySelector('.groups-btn').addEventListener('click', () => {
      this.handleGroupAction(group);
    });
    
    const groupDiv = clone.querySelector('div');
    groupDiv.id = `group-${group.id || index}`;
    
    return clone;
  }

  static formatGroupDescription(group) {
    const department = group.attributes?.department;
    const classNumber = group.attributes?.class_number;
    
    if (department && classNumber) {
      return `${department} ${classNumber}`;
    } else if (department) {
      return department;
    } else if (classNumber) {
      return `Class ${classNumber}`;
    }
    
    return 'Study Group';
  }

  static handleGroupAction(group) {
    const groupName = group.attributes?.name || 'Untitled Group',
    groupId = group.id;
  }
  
  static renderStudyGroups(groups, containerId = 'groups-container') {
    const container = document.getElementById(containerId);
    
    if (!container) {
      console.error(`Container with id "${containerId}" not found`);
      return;
    }
    
    // Clear existing content
    container.innerHTML = '';
    
    if (!groups || groups.length === 0) {
      this.renderEmptyState(container);
      return;
    }
    
    // Create group cards - Fixed method name here
    groups.forEach((group, index) => {
      const groupCard = this.createGroupsCard(group, index);
      container.appendChild(groupCard);
    });
  }
  
  static renderEmptyState(container) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'd-flex align-items-center justify-content-center mt-4 p-4';
    emptyDiv.innerHTML = `
      <div class="text-center text-muted">
        <h5>No study groups</h5>
        <p class="mb-0">You haven't joined any study groups yet.</p>
      </div>
    `;
    container.appendChild(emptyDiv);
  }
}

export default StudyGroupsService;