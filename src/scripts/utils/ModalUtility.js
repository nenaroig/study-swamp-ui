// ModalUtility.js - Handles join group modal functionality
import ApiService from '../api/ApiService.js';
import UserService from '../api/UserService.js';

export class ModalUtility {
  
  // Opens the join groups modal and loads available groups
  static openJoinGroupModal() {
    // Load available groups data first
    this.loadAvailableGroups();
    
    // Trigger modal using Bootstrap data attributes (avoids bootstrap dependency)
    const modal = document.getElementById('listGroupModal');
    if (modal) {
      const btn = document.createElement('button');
      btn.setAttribute('data-bs-toggle', 'modal');
      btn.setAttribute('data-bs-target', '#listGroupModal');
      btn.style.display = 'none';
      document.body.appendChild(btn);
      btn.click();
      document.body.removeChild(btn);
    }
  }
  
  // Fetches and renders available groups (excluding user's current groups)
  static async loadAvailableGroups() {
    const container = document.getElementById('availableGroupsList');
    const loadingDiv = document.getElementById('loadingGroups');
    const noGroupsDiv = document.getElementById('noGroupsMessage');
    
    try {
      // Show loading spinner and clear previous content
      loadingDiv.classList.remove('d-none');
      container.innerHTML = '';
      noGroupsDiv.classList.add('d-none');
      
      const authHeader = UserService.getAuthHeader();
      const currentUser = UserService.getCurrentUser();
      const currentUserId = currentUser?.userData?.id?.toString() || currentUser?.id?.toString();
      
      // Fetch all groups and user memberships in parallel for efficiency
      const [allGroupsResponse, membersResponse] = await Promise.all([
        ApiService.getData('groups/', authHeader),
        ApiService.getData('members/', authHeader)
      ]);
      
      const allGroups = allGroupsResponse.data || [];
      const members = membersResponse.data || [];
      
      // Extract IDs of groups user is already a member of
      const userGroupIds = members
      .filter(member => member.relationships.user.data.id === currentUserId)
      .map(member => member.relationships.group.data.id);
      
      // Show only groups user hasn't joined yet
      const availableGroups = allGroups.filter(group => !userGroupIds.includes(group.id));
      
      // Hide loading spinner
      loadingDiv.classList.add('d-none');
      
      // Show empty state if no groups available to join
      if (availableGroups.length === 0) {
        noGroupsDiv.classList.remove('d-none');
        return;
      }
      
      // Create and display group cards
      availableGroups.forEach(group => {
        const groupCard = this.createAvailableGroupCard(group);
        container.appendChild(groupCard);
      });
      
      // Enable search functionality after groups are rendered
      this.setupModalSearch();
      
    } catch (error) {
      console.error('Error loading available groups:', error);
      loadingDiv.classList.add('d-none');
      this.showModalError('Failed to load available groups');
    }
  }
  
  // Creates HTML card element for a joinable group
  static createAvailableGroupCard(group) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'border rounded-3 p-3 mb-3';
    
    const title = group.attributes?.name || 'Untitled Group';
    const description = this.formatGroupDescription(group);
    
    // Check if current user is admin
    const currentUser = UserService.getCurrentUser();
    const isAdmin = currentUser?.username?.includes('admin') || false;
    
    // Build card HTML with group info and conditionally show join button
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
  
  // Attach click handler for join functionality only if not admin
  if (!isAdmin) {
    const joinBtn = cardDiv.querySelector('.join-group-btn');
    joinBtn.addEventListener('click', () => this.handleJoinGroup(group));
  }
  
  return cardDiv;
}

// Adds user as member to selected group and provides feedback
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
    
    // Check if the membership was actually created
    if (!response.data || !response.data.id) {
      // Special message for admin users
      if (currentUser.username && currentUser.username.includes('admin')) {
        throw new Error('Admin users cannot join groups. Please contact support if this is unexpected.');
      } else {
        throw new Error('Failed to join group - membership not created');
      }
    }
    
    this.showModalSuccess(`Successfully joined ${group.attributes?.name}!`);
    
    // Auto-close modal after success message is shown
    setTimeout(() => {
      const modal = document.getElementById('listGroupModal');
      if (modal) {
        const closeBtn = modal.querySelector('[data-bs-dismiss="modal"]');
        if (closeBtn) closeBtn.click();
      }
    }, 1500);
    
  } catch (error) {
    console.error('Error joining group:', error);
    this.showModalError(error.message || 'Failed to join group. Please try again.');
  }
}

// Displays error message in modal alert
static showModalError(message) {
  const errorDiv = document.getElementById('modalErrorMessage');
  const errorText = document.getElementById('errorText');
  
  errorText.textContent = message;
  errorDiv.classList.remove('d-none');
  errorDiv.classList.add('show');
}

// Displays success message in modal alert
static showModalSuccess(message) {
  const successDiv = document.getElementById('modalSuccessMessage');
  const successText = document.getElementById('successText');
  
  successText.textContent = message;
  successDiv.classList.remove('d-none');
  successDiv.classList.add('show');
}

// Enables real-time search filtering of group cards
static setupModalSearch() {
  const searchInput = document.getElementById('groupSearch');
  const groupsList = document.getElementById('availableGroupsList');
  
  if (!searchInput || !groupsList) return;
  
  // Filter groups as user types
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    const groupCards = groupsList.querySelectorAll('.border.rounded-3');
    
    groupCards.forEach(card => {
      const title = card.querySelector('h5')?.textContent?.toLowerCase() || '';
      const description = card.querySelector('p')?.textContent?.toLowerCase() || '';
      
      // Show/hide cards based on search term match
      const matches = title.includes(searchTerm) || description.includes(searchTerm);
      card.style.display = matches ? 'block' : 'none';
    });
    
    // Show "no results" message when search yields no matches
    const visibleCards = Array.from(groupCards).filter(card => card.style.display !== 'none');
    const noGroupsDiv = document.getElementById('noGroupsMessage');
    
    if (visibleCards.length === 0 && searchTerm) {
      if (noGroupsDiv) {
        noGroupsDiv.classList.remove('d-none');
        noGroupsDiv.querySelector('p').textContent = `No groups found matching "${searchTerm}"`;
      }
    } else {
      if (noGroupsDiv) {
        noGroupsDiv.classList.add('d-none');
      }
    }
  });
  
  // Reset search state when modal is closed
  const modal = document.getElementById('listGroupModal');
  modal.addEventListener('hidden.bs.modal', () => {
    searchInput.value = '';
    // Make all cards visible again
    const groupCards = groupsList.querySelectorAll('.border.rounded-3');
    groupCards.forEach(card => {
      card.style.display = 'block';
    });
    // Reset no groups message to default
    const noGroupsDiv = document.getElementById('noGroupsMessage');
    if (noGroupsDiv) {
      noGroupsDiv.classList.add('d-none');
      noGroupsDiv.querySelector('p').textContent = 'No study groups available to join';
    }
  });
}

// Formats group info as "DEPT ####" (e.g., "COP 3530")
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

// Load departments from API and populate dropdown
static async loadDepartments() {
  try {
    const authHeader = UserService.getAuthHeader();
    const response = await ApiService.getEnumData('enums/', authHeader);
    const departments = response.data?.enums?.departments || [];
    
    const departmentSelect = document.getElementById('department');
    if (!departmentSelect) return;
    
    // Clear existing options except the default
    departmentSelect.innerHTML = '<option value="">Dept</option>';
    
    // Add department options
    departments.forEach(dept => {
      const option = document.createElement('option');
      option.value = dept.value;
      option.textContent = dept.label;
      departmentSelect.appendChild(option);
    });
    
  } catch (error) {
    console.error('Failed to load departments:', error);
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
}
}

export default ModalUtility;