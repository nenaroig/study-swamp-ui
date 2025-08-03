// ModalUtility.js - Handles join group modal functionality
import ApiService from '../api/ApiService.js';
import UserService from '../api/UserService.js';

export class ModalUtility {
  
  // Add flag to prevent double-loading
  static isLoading = false;
  
  // ===== INITIALIZATION =====
  
  static initializeModalEvents() {
    // Load departments when create group modal is shown
    const addGroupModal = document.getElementById('addGroupModal');
    if (addGroupModal) {
      addGroupModal.addEventListener('show.bs.modal', async () => {
        await this.loadDepartments();
      });
    }
  }

  // ===== MODAL OPENING/CLOSING =====

  static openJoinGroupModal() {
    // Prevent double-loading if already in progress
    if (this.isLoading) return;
    
    const modal = document.getElementById('listGroupModal');
    if (!modal) {
      console.error('Join group modal not found');
      return;
    }

    // Check if modal is already visible
    if (modal.classList.contains('show')) {
      return;
    }

    this.clearModalState();
    this.triggerModal('#listGroupModal');
    
    // Set up one-time event listener for when modal is shown
    modal.addEventListener('shown.bs.modal', () => {
      this.loadAvailableGroups().catch(error => {
        console.error('Failed to load groups for modal:', error);
        this.showModalError('Failed to load available groups');
      });
    }, { once: true });
  }

  static openCreateGroupModal() {
    this.closeModalById('listGroupModal');
    
    setTimeout(() => {
      this.showModalById('addGroupModal');
    }, 150);
  }

  static closeModalById(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    const closeButton = modal.querySelector('[data-bs-dismiss="modal"]');
    if (closeButton) {
      closeButton.click();
    }
  }

  static showModalById(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    this.triggerModal(`#${modalId}`);
  }

  static triggerModal(target) {
    const triggerButton = document.createElement('button');
    triggerButton.setAttribute('data-bs-toggle', 'modal');
    triggerButton.setAttribute('data-bs-target', target);
    triggerButton.style.display = 'none';
    document.body.appendChild(triggerButton);
    
    triggerButton.click();
    
    setTimeout(() => {
      if (document.body.contains(triggerButton)) {
        document.body.removeChild(triggerButton);
      }
    }, 100);
  }

  // ===== DATA LOADING =====
  
  static async loadAvailableGroups() {
    // Prevent multiple simultaneous loads
    if (this.isLoading) return;
    this.isLoading = true;
    
    const container = document.getElementById('availableGroupsList');
    const loadingDiv = document.getElementById('loadingGroups');
    const noGroupsDiv = document.getElementById('noGroupsMessage');
    
    try {
      this.showLoading(loadingDiv, container, noGroupsDiv);
      
      const { allGroups, userGroupIds } = await this.fetchGroupsData();
      const availableGroups = allGroups.filter(group => !userGroupIds.includes(group.id));
      
      this.hideLoading(loadingDiv);
      
      if (availableGroups.length === 0) {
        this.showEmptyState(noGroupsDiv);
        return;
      }
      
      this.renderAvailableGroups(container, availableGroups);
      this.setupModalInteractions();
      
    } catch (error) {
      console.error('Error loading available groups:', error);
      this.hideLoading(loadingDiv);
      this.showModalError('Failed to load available groups');
      throw error;
    } finally {
      // Reset loading flag
      this.isLoading = false;
    }
  }

  static async fetchGroupsData() {
    const authHeader = UserService.getAuthHeader();
    const currentUser = UserService.getCurrentUser();
    const currentUserId = currentUser?.userData?.id?.toString() || currentUser?.id?.toString();
    
    const [allGroupsResponse, membersResponse] = await Promise.all([
      ApiService.getData('groups/', authHeader),
      ApiService.getData('members/', authHeader)
    ]);
    
    const allGroups = allGroupsResponse.data || [];
    const members = membersResponse.data || [];
    
    const userGroupIds = members
      .filter(member => member.relationships.user.data.id === currentUserId)
      .map(member => member.relationships.group.data.id);
    
    return { allGroups, userGroupIds };
  }

  static async loadDepartments() {
    try {
      const authHeader = UserService.getAuthHeader();
      const response = await ApiService.getEnumData('enums/', authHeader);
      const departments = response.data?.enums?.departments || [];
      
      this.populateDepartmentDropdown(departments);
      
    } catch (error) {
      console.error('Failed to load departments:', error);
      this.populateFallbackDepartments();
    }
  }

  // ===== RENDERING =====

  static renderAvailableGroups(container, availableGroups) {
    if (container) {
      availableGroups.forEach(group => {
        const groupCard = this.createAvailableGroupCard(group);
        container.appendChild(groupCard);
      });
    }
  }

  static createAvailableGroupCard(group) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'border rounded-3 p-3 mb-3';
    
    const title = group.attributes?.name || 'Untitled Group';
    const description = this.formatGroupDescription(group);
    const currentUser = UserService.getCurrentUser();
    const isAdmin = currentUser?.username?.includes('admin') || false;
    
    cardDiv.innerHTML = `
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <h5 class="mb-1">${title}</h5>
          <p class="text-muted mb-0">${description}</p>
        </div>
        ${isAdmin ? 
          '<span class="badge bg-secondary">Admin View</span>' : 
          `<button class="btn btn-outline-teal btn-sm join-group-btn" data-group-id="${group.id}">
            <span class="fa-solid fa-plus me-1"></span>Join
          </button>`
        }
      </div>
    `;
  
    if (!isAdmin) {
      const joinBtn = cardDiv.querySelector('.join-group-btn');
      joinBtn.addEventListener('click', () => this.handleJoinGroup(group));
    }
  
    return cardDiv;
  }

  static populateDepartmentDropdown(departments) {
    const departmentSelect = document.getElementById('department');
    if (!departmentSelect) return;
    
    departmentSelect.innerHTML = '<option value="">Dept</option>';
    
    departments.forEach(dept => {
      const option = document.createElement('option');
      option.value = dept.value;
      option.textContent = dept.label;
      departmentSelect.appendChild(option);
    });
  }

  static populateFallbackDepartments() {
    const departmentSelect = document.getElementById('department');
    if (departmentSelect) {
      departmentSelect.innerHTML = `
        <option value="">Dept</option>
        <option value="COP">COP</option>
        <option value="CEN">CEN</option>
        <option value="MAS">MAS</option>
        <option value="CHM">CHM</option>
        <option value="PHY">PHY</option>
        <option value="BIO">BIO</option>
      `;
    }
  }

  // ===== EVENT HANDLING =====

  static setupModalInteractions() {
    this.setupModalSearch();
    this.setupCreateGroupTrigger();
  }

  static async handleJoinGroup(group) {
    try {
      const authHeader = UserService.getAuthHeader();
      const currentUser = UserService.getCurrentUser();
      const currentUserId = currentUser?.userData?.id || currentUser?.id;
      
      const memberData = {
        user: parseInt(currentUserId),
        group: parseInt(group.id),
        creator: false
      };
      
      const response = await ApiService.postData('members/', memberData, authHeader);
      
      if (!response.data || !response.data.id) {
        if (currentUser.username && currentUser.username.includes('admin')) {
          throw new Error('Admin users cannot join groups. Please contact support if this is unexpected.');
        } else {
          throw new Error('Failed to join group - membership not created');
        }
      }
      
      this.showModalSuccess(`Successfully joined ${group.attributes?.name}!`);
      this.autoCloseModal('listGroupModal', 1500);
      
    } catch (error) {
      console.error('Error joining group:', error);
      this.showModalError(error.message || 'Failed to join group. Please try again.');
    }
  }

  static setupCreateGroupTrigger() {
    const createGroupBtn = document.getElementById('addGroupModalLabel');
    if (createGroupBtn) {
      createGroupBtn.replaceWith(createGroupBtn.cloneNode(true));
      const newBtn = document.getElementById('addGroupModalLabel');
      
      newBtn.addEventListener('click', () => {
        this.openCreateGroupModal();
      });
    }
  }

  static setupModalSearch() {
    const searchInput = document.getElementById('groupSearch');
    const groupsList = document.getElementById('availableGroupsList');
    
    if (!searchInput || !groupsList) return;
    
    searchInput.addEventListener('input', (e) => {
      this.filterGroups(e.target.value, groupsList);
    });
    
    this.setupSearchReset();
  }

  static filterGroups(searchTerm, groupsList) {
    const term = searchTerm.toLowerCase().trim();
    const groupCards = groupsList.querySelectorAll('.border.rounded-3');
    
    groupCards.forEach(card => {
      const title = card.querySelector('h5')?.textContent?.toLowerCase() || '';
      const description = card.querySelector('p')?.textContent?.toLowerCase() || '';
      const matches = title.includes(term) || description.includes(term);
      card.style.display = matches ? 'block' : 'none';
    });
    
    this.updateSearchResults(groupCards, term);
  }

  static updateSearchResults(groupCards, searchTerm) {
    const visibleCards = Array.from(groupCards).filter(card => card.style.display !== 'none');
    const noGroupsDiv = document.getElementById('noGroupsMessage');
    
    if (visibleCards.length === 0 && searchTerm) {
      this.showSearchNoResults(noGroupsDiv, searchTerm);
    } else {
      this.hideSearchNoResults(noGroupsDiv);
    }
  }

  static setupSearchReset() {
    const modal = document.getElementById('listGroupModal');
    modal.addEventListener('hidden.bs.modal', () => {
      this.resetSearchState();
    });
  }

  // ===== UI STATE MANAGEMENT =====

  static showLoading(loadingDiv, container, noGroupsDiv) {
    if (loadingDiv) loadingDiv.classList.remove('d-none');
    if (container) container.innerHTML = '';
    if (noGroupsDiv) noGroupsDiv.classList.add('d-none');
  }

  static hideLoading(loadingDiv) {
    if (loadingDiv) loadingDiv.classList.add('d-none');
  }

  static showEmptyState(noGroupsDiv) {
    if (noGroupsDiv) noGroupsDiv.classList.remove('d-none');
  }

  static showSearchNoResults(noGroupsDiv, searchTerm) {
    if (noGroupsDiv) {
      noGroupsDiv.classList.remove('d-none');
      noGroupsDiv.querySelector('p').textContent = `No groups found matching "${searchTerm}"`;
    }
  }

  static hideSearchNoResults(noGroupsDiv) {
    if (noGroupsDiv) {
      noGroupsDiv.classList.add('d-none');
    }
  }

  static resetSearchState() {
    const searchInput = document.getElementById('groupSearch');
    const groupsList = document.getElementById('availableGroupsList');
    const noGroupsDiv = document.getElementById('noGroupsMessage');
    
    if (searchInput) searchInput.value = '';
    
    if (groupsList) {
      const groupCards = groupsList.querySelectorAll('.border.rounded-3');
      groupCards.forEach(card => {
        card.style.display = 'block';
      });
    }
    
    if (noGroupsDiv) {
      noGroupsDiv.classList.add('d-none');
      noGroupsDiv.querySelector('p').textContent = 'No study groups available to join';
    }
  }

  static clearModalState() {
    const container = document.getElementById('availableGroupsList');
    const loadingDiv = document.getElementById('loadingGroups');
    const noGroupsDiv = document.getElementById('noGroupsMessage');
    const searchInput = document.getElementById('groupSearch');
    const errorDiv = document.getElementById('modalErrorMessage');
    const successDiv = document.getElementById('modalSuccessMessage');

    if (container) container.innerHTML = '';
    if (loadingDiv) loadingDiv.classList.add('d-none');
    if (noGroupsDiv) noGroupsDiv.classList.add('d-none');
    if (searchInput) searchInput.value = '';
    if (errorDiv) {
      errorDiv.classList.add('d-none');
      errorDiv.classList.remove('show');
    }
    if (successDiv) {
      successDiv.classList.add('d-none');
      successDiv.classList.remove('show');
    }
  }

  // ===== UI FEEDBACK =====

  static showModalError(message) {
    const errorDiv = document.getElementById('modalErrorMessage');
    const errorText = document.getElementById('errorText');
    
    if (errorText) errorText.textContent = message;
    if (errorDiv) {
      errorDiv.classList.remove('d-none');
      errorDiv.classList.add('show');
    }
  }

  static showModalSuccess(message) {
    const successDiv = document.getElementById('modalSuccessMessage');
    const successText = document.getElementById('successText');
    
    if (successText) successText.textContent = message;
    if (successDiv) {
      successDiv.classList.remove('d-none');
      successDiv.classList.add('show');
    }
  }

  static autoCloseModal(modalId, delay) {
    setTimeout(() => {
      const modal = document.getElementById(modalId);
      if (modal) {
        const closeBtn = modal.querySelector('[data-bs-dismiss="modal"]');
        if (closeBtn) closeBtn.click();
      }
    }, delay);
  }

  // ===== UTILITY HELPERS =====

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
}

export default ModalUtility;