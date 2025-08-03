import PageController from './PageController.js';
import UserService from '../api/UserService.js';
import StudyGroupDetailService from '../api/StudyGroupDetailService.js';
import ApiService from '../api/ApiService.js';
import ModalUtility from '../utils/ModalUtility.js';

// Convert group name to URL-friendly slug
export function createGroupSlug(groupName) {
  return StudyGroupDetailService.createGroupSlug(groupName);
}

// Create full URL
export function createGroupUrl(groupName) {
  const slug = createGroupSlug(groupName);
  return `/study-groups/${slug}`;
}

// Extract group slug from current URL
export function getGroupSlugFromUrl() {
  const path = window.location.pathname;
  const matches = path.match(/^\/study-groups\/([^\/]+)$/);
  return matches ? matches[1] : null;
}

class StudyGroupDetailPage {
  constructor() {
    this.isInitialized = false;
  }
  
  async init() {
    if (this.isInitialized) return;
    
    // Redirect to login if user is not authenticated
    if (!UserService.isLoggedIn()) {
      PageController.navigateTo('login');
      return;
    }
    
    // Get current user data
    this.currentUser = UserService.getCurrentUser();
    
    // Load and render study group
    await this.loadStudyGroup();
    
    this.isInitialized = true;
  }

  async loadStudyGroup() {
    try {
      // Get the group slug from URL
      const groupSlug = getGroupSlugFromUrl();
      if (!groupSlug) {
        throw new Error('No group slug found in URL');
      }
      
      // Fetch the specific group by slug
      const groupResponse = await StudyGroupDetailService.getGroupBySlug(groupSlug);
      this.currentGroup = groupResponse.studyGroupData || {};

      if (!this.currentGroup.id) {
        throw new Error('Group not found');
      }
      
      // Load related data in parallel
      const authHeader = UserService.getAuthHeader();
      const [membersResponse, meetingsResponse, usersResponse, commentsResponse, locationsResponse] = await Promise.all([
        ApiService.getData('members/', authHeader),
        ApiService.getData('meetings/', authHeader),
        ApiService.getData('users/', authHeader),
        ApiService.getData('group_comments/', authHeader),
        ApiService.getData('locations/', authHeader)
      ]);
      
      // Filter data for this specific group
      const groupId = this.currentGroup.id?.toString();
      
      this.groupMembers = membersResponse.data?.filter(member => {
        const memberGroupId = member.relationships?.group?.data?.id?.toString();
        return memberGroupId === groupId;
      }) || [];
      
      this.groupMeetings = meetingsResponse.data?.filter(meeting =>
        meeting.relationships?.group?.data?.id === groupId
      ) || [];
      
      this.groupComments = commentsResponse.data?.filter(comment =>
        comment.relationships?.group?.data?.id === groupId
      ) || [];
      
      this.allUsers = usersResponse.data || [];
      this.allLocations = locationsResponse.data || [];
      
      // Render all the group information
      this.renderGroupDetails();
      this.renderGroupActions();
      this.renderMembers();
      this.renderMeetings();
      this.renderComments();
      this.setupCommentForm();
      this.setupMeetingModal();
      this.setupEditGroupModal();
      
    } catch (error) {
      console.error('Failed to load study group:', error);
      PageController.showError('Unable to load study group. Please try refreshing the page.');
    }
  }
  
  renderGroupDetails() {
    const title = document.getElementById('group-title');
    title.textContent = this.currentGroup.attributes?.name || '';
    
    const department = document.getElementById('group-department');
    const deptCode = this.currentGroup.attributes?.department || '';
    const classNum = this.currentGroup.attributes?.class_number || '';

    department.textContent = `${deptCode} ${classNum}`;
    
    // Show/hide edit button based on user permissions
    this.updateEditButtonVisibility();
  }
  
  updateEditButtonVisibility() {
    const editBtn = document.getElementById('edit-group-btn');
    if (!editBtn) {
      return;
    }
    
    // Check if current user is a creator or editor of the group
    const currentUserId = this.currentUser?.userData?.id;
    const currentUsername = this.currentUser?.username;
    
    if (!currentUserId && !currentUsername) {
      console.warn('No current user ID or username found');
      editBtn.classList.add('d-none');
      return;
    }
    
    // Find user's membership in the group
    const userMembership = this.groupMembers.find(member => {
      const memberUserId = member.relationships?.user?.data?.id;
      return (
        (currentUserId && memberUserId == currentUserId) || 
        (currentUsername && currentUsername.includes('admin'))
      );
    });
    
    // For admins, show the button
    if (currentUsername && currentUsername.includes('admin')) {
      editBtn.classList.remove('d-none');
      return;
    }
    
    // Show edit button if user is creator or editor
    if (userMembership) {
      if (userMembership.attributes?.creator || userMembership.attributes?.editor) {
        editBtn.classList.remove('d-none');
      } else {
        editBtn.classList.add('d-none');
      }
    } else {
      editBtn.classList.add('d-none');
    }
  }
  
  renderGroupStats() {
    // Update member count
    const memberCount = document.getElementById('member-count');
    memberCount.textContent = this.groupMembers.length;
    
    // Update meeting count
    const meetingCount = document.getElementById('meeting-count');
    meetingCount.textContent = this.groupMeetings.length;
    
    // Update comment count
    const commentCount = document.getElementById('comment-count');
    commentCount.textContent = this.groupComments.length;
  }
  
  renderMembers() {
    const membersList = document.getElementById('members-list');
    if (!membersList) {
      console.error('members-list element not found');
      return;
    }
    
    membersList.innerHTML = '';
    
    this.groupMembers.forEach((member, index) => {
      
      // Find the user data for this member
      const userId = member.relationships?.user?.data?.id;
      
      const user = this.allUsers.find(user => user.id === userId);
      
      if (user) {
        const memberCard = this.createMemberCard(member, user);
        membersList.appendChild(memberCard);
      } else {
        console.error('User not found for member:', member);
      }
    });
  }
  
  createMemberCard(member, user) {
    const div = document.createElement('div');
    div.className = 'd-flex align-items-center justify-content-between mt-4';
    
    const firstName = user.attributes?.first_name || '';
    const lastName = user.attributes?.last_name || '';
    const email = user.attributes?.email || '';
    const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    
    let roleHtml = '';
    if (member.attributes?.creator) {
      roleHtml += '<span class="badge rounded-pill text-bg-info text-white">Creator</span>';
    }
    if (member.attributes?.editor) {
      roleHtml += '<span class="badge rounded-pill bg-success ms-1">Editor</span>';
    }
    if (!member.attributes?.creator && !member.attributes?.editor) {
      roleHtml = '<span class="badge rounded-pill bg-secondary">Member</span>';
    }
    
    div.innerHTML = `
      <div class="d-flex align-items-center mt-3">
        <div class="member-avatar rounded-circle text-white me-3">${initials}</div>
        <div>
          <h4 class="h5 fw-500">${firstName} ${lastName}</h4>
          <p class="smaller text-muted mb-0">${email}</p>
        </div>
      </div>
      <div>${roleHtml}</div>
    `;
    
    return div;
  }
  
  renderMeetings() {
    const meetingsList = document.getElementById('meetings-list');
    if (!meetingsList) return;
    
    meetingsList.innerHTML = '';
    
    // Filter for upcoming meetings only
    const now = new Date();
    const upcomingMeetings = this.groupMeetings.filter(meeting => {
      const startTime = new Date(meeting.attributes?.start_time);
      return startTime > now;
    });
    
    if (upcomingMeetings.length === 0) {
      meetingsList.innerHTML = '<p class="text-muted mt-4">No upcoming meetings scheduled.</p>';
      return;
    }
    
    upcomingMeetings.forEach(meeting => {
      const meetingCard = this.createMeetingCard(meeting);
      meetingsList.appendChild(meetingCard);
    });
  }

  createMeetingCard(meeting) {
    const div = document.createElement('div');
    div.className = 'meeting-card';
    
    const name = meeting.attributes?.name || 'Untitled Meeting';
    const startTime = new Date(meeting.attributes?.start_time);
    const endTime = new Date(meeting.attributes?.end_time);
    const locationId = meeting.relationships?.location?.data?.id;
    
    // Initialize locationText with default value
    let locationText = 'Location TBD';
    
    if (locationId && this.allLocations) {
      const locationData = this.allLocations.find(loc => loc.id === locationId);
      if (locationData) {
        const building = locationData.attributes?.building || '';
        const room = locationData.attributes?.room || '';
        locationText = `${building} - Room ${room}`;
      }
    }
    
    // Format time display
    const timeString = this.formatMeetingTime(startTime, endTime);
    
    div.innerHTML = `
      <div class="d-flex justify-content-between align-items-start mt-4">
        <div>
          <h4 class="fw-500">${name}</h4>
          <p class="text-muted mt-3">
            <span class="fa-solid fa-clock me-2 fa-fw"></span>${timeString}
          </p>
          <p class="text-muted mb-0">
            <span class="fa-solid fa-map-marker-alt me-2 fa-fw"></span>${locationText}
          </p>
        </div>
      </div>
    `;
    
    return div;
  }
  
  formatMeetingTime(startTime, endTime) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const meetingDate = new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate());
    
    let dateString = '';
    if (meetingDate.getTime() === today.getTime()) {
      dateString = 'Today';
    } else {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (meetingDate.getTime() === tomorrow.getTime()) {
        dateString = 'Tomorrow';
      } else {
        dateString = startTime.toLocaleDateString();
      }
    }
    
    const startTimeString = startTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const endTimeString = endTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    
    return `${dateString} at ${startTimeString} - ${endTimeString}`;
  }
  
  renderComments() {
    const commentsList = document.getElementById('comments-list');
    if (!commentsList) return;
    
    commentsList.innerHTML = '';
    
    if (this.groupComments.length === 0) {
      commentsList.innerHTML = '<p class="text-muted mt-4">No comments yet. Be the first to start the conversation!</p>';
      return;
    }
    
    // Sort comments by creation date (newest first)
    const sortedComments = [...this.groupComments].sort((a, b) =>
      new Date(b.attributes?.created_at) - new Date(a.attributes?.created_at)
    );
    
    sortedComments.forEach(comment => {
      const commentCard = this.createCommentCard(comment);
      commentsList.appendChild(commentCard);
    });
  }

  createCommentCard(comment) {
    const div = document.createElement('div');
    div.className = 'd-flex mt-4';
    
    // Find the user who made this comment
    const userId = comment.relationships?.user?.data?.id;
    const user = this.allUsers.find(u => u.id === userId);
    
    if (!user) {
      return div; // Return empty div if user not found
    }
    
    const firstName = user.attributes?.first_name || '';
    const lastName = user.attributes?.last_name || '';
    const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    const commentText = comment.attributes?.text || '';
    const createdAt = new Date(comment.attributes?.created_at);
    
    // Format relative time
    const timeString = this.formatRelativeTime(createdAt);
    
    div.innerHTML = `
        <div class="member-avatar rounded-circle text-white me-3">${initials}</div>
        <div class="flex-grow-1">
          <p class="fw-500 mb-2">${firstName} ${lastName}</p>
          <div class="comment-bubble">
            <p class="mt-4 fw-500 mb-1">${commentText}</p>
            <p class="smaller text-muted">${timeString}</p>
          </div>
        </div>
      `;
    
    return div;
  }

  formatRelativeTime(date) {
    const now = new Date();
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  setupCommentForm() {
    const commentForm = document.getElementById('comment-textarea');
    const postButton = document.getElementById('post-comment-btn');
    
    if (!commentForm || !postButton) return;
    
    // Set up current user's avatar in the form
    this.updateCommentFormAvatar();
    
    // Add click handler for post button
    postButton.addEventListener('click', async (e) => {
      e.preventDefault();
      await this.postComment(commentForm);
    });
    
    // Add Enter+Ctrl shortcut for posting
    commentForm.addEventListener('keydown', async (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        await this.postComment(commentForm);
      }
    });
  }

  updateCommentFormAvatar() {
    const avatarElement = document.getElementById('current-user-avatar');
    if (!avatarElement || !this.currentUser) return;
    
    const userData = this.currentUser.userData || {};
    const firstName = userData.attributes?.first_name || '';
    const lastName = userData.attributes?.last_name || '';
    const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || 'YU';
    
    avatarElement.textContent = initials;
  }

  async postComment(commentForm) {
    const commentText = commentForm.value.trim();
    
    if (!commentText) {
      alert('Please enter a comment before posting.');
      return;
    }
    
    if (!this.currentGroup.id) {
      alert('Unable to post comment - group not found.');
      return;
    }
    
    try {
      // Disable the form while posting
      const postButton = document.getElementById('post-comment-btn');
      const originalText = postButton.textContent;
      postButton.disabled = true;
      postButton.textContent = 'Posting...';
      
      // Get current user ID
      const currentUserId = this.currentUser?.userData?.id || '1'; // fallback to admin1
      
      // Prepare comment data
      const commentData = {
        text: commentText,
        group: this.currentGroup.id,
        user: currentUserId
      };
      
      // Post the comment
      const authHeader = UserService.getAuthHeader();
      const response = await ApiService.postData('group_comments/', commentData, authHeader);
      
      // Clear the form
      commentForm.value = '';
      
      // Refresh the comments to show the new one
      await this.refreshComments();
      
      // Re-enable the form
      postButton.disabled = false;
      postButton.textContent = originalText;
      
    } catch (error) {
      console.error('Failed to post comment:', error);
      alert('Failed to post comment. Please try again.');
      
      // Re-enable the form
      const postButton = document.getElementById('post-comment-btn');
      postButton.disabled = false;
      postButton.textContent = 'Post Comment';
    }
  }

  async refreshComments() {
    try {
      // Fetch updated comments
      const authHeader = UserService.getAuthHeader();
      const commentsResponse = await ApiService.getData('group_comments/', authHeader);
      
      // Filter for this group
      const groupId = this.currentGroup.id;
      this.groupComments = commentsResponse.data?.filter(comment =>
        comment.relationships?.group?.data?.id === groupId
      ) || [];
      
      // Re-render comments and update stats
      this.renderComments();
      
    } catch (error) {
      console.error('Failed to refresh comments:', error);
    }
  }

  // Refresh group data and re-render
  async refreshGroup() {
    await this.loadStudyGroup();
  }

  setupMeetingModal() {
    const modal = document.getElementById('scheduleMeetingModal');
    const form = document.getElementById('meeting-form');
    
    if (!modal || !form) return;
    
    // Use Bootstrap's modal events instead of manual click handlers
    modal.addEventListener('show.bs.modal', async () => {
      try {
        await this.loadLocations();
        this.populateGroupSelect();
        
        // Set default date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateInput = document.getElementById('meeting-date');
        if (dateInput) {
          dateInput.value = tomorrow.toISOString().split('T')[0];
        }
      } catch (error) {
        console.error('Error setting up meeting modal:', error);
        alert('Error loading meeting form. Please try again.');
      }
    });
    
    // Handle form submission
    form.addEventListener('submit', this.handleMeetingSubmit.bind(this));
  }

  // Add this new method to populate the group select
  populateGroupSelect() {
    const groupSelect = document.getElementById('meeting-group');
    if (!groupSelect || !this.currentGroup) return;
    
    groupSelect.innerHTML = '<option value="">Select study group...</option>';
    
    // Pre-select the current group
    const option = document.createElement('option');
    option.value = this.currentGroup.id;
    option.textContent = this.currentGroup.attributes?.name || 'Current Group';
    option.selected = true;
    groupSelect.appendChild(option);
  }

  async loadLocations() {
    try {
      const authHeader = UserService.getAuthHeader();
      const response = await ApiService.getData('locations/', authHeader);
      const locationSelect = document.getElementById('meeting-location');
      
      if (!locationSelect) {
        console.error('Location select element not found');
        return;
      }
      
      if (response.data && response.data.length > 0) {
        locationSelect.innerHTML = '<option value="">Select location...</option>';
        
        response.data.forEach(location => {
          const option = document.createElement('option');
          option.value = location.id;
          option.textContent = `${location.attributes.building} - Room ${location.attributes.room}`;
          locationSelect.appendChild(option);
        });
      } else {
        locationSelect.innerHTML = '<option value="">No locations available</option>';
        console.warn('No locations data found:', response);
      }
    } catch (error) {
      console.error('Error loading locations:', error);
      const locationSelect = document.getElementById('meeting-location');
      if (locationSelect) {
        locationSelect.innerHTML = '<option value="">Error loading locations</option>';
      }
      throw error;
    }
  }

  async handleMeetingSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.querySelector('#scheduleMeetingModal [type="submit"]');
    const originalText = submitBtn?.textContent || 'Schedule Meeting';
    
    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating...';
      }
      
      // Get form elements first and check they exist
      const nameEl = document.getElementById('meeting-name');
      const dateEl = document.getElementById('meeting-date');
      const startTimeEl = document.getElementById('meeting-start-time');
      const durationEl = document.getElementById('meeting-duration');
      const locationEl = document.getElementById('meeting-location');
      const descriptionEl = document.getElementById('meeting-description');
      
      // Check for missing required elements
      if (!nameEl || !dateEl || !startTimeEl || !durationEl || !locationEl) {
        console.error('Missing form elements. Modal may not be properly loaded.');
        alert('Form is not properly loaded. Please close the modal and try again.');
        return;
      }
      
      // Get form data
      const name = nameEl.value;
      const date = dateEl.value;
      const startTime = startTimeEl.value;
      const duration = parseFloat(durationEl.value);
      const locationId = locationEl.value;
      const description = descriptionEl ? descriptionEl.value : '';
      
      // Validate required fields
      if (!name || !date || !startTime || !locationId) {
        alert('Please fill in all required fields.');
        return;
      }
      
      // Calculate start and end times
      const startDateTime = new Date(`${date}T${startTime}`);
      const endDateTime = new Date(startDateTime.getTime() + duration * 60 * 60 * 1000);
      
      // Create meeting data using the same format as MeetingsPage
      const meetingData = {
        name: name,
        description: description || '',
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        group: parseInt(this.currentGroup.id),
        location: parseInt(locationId)
      };
      
      // Use the same API method as MeetingsPage
      const result = await UserService.makeAuthenticatedPostRequest('meetings/', meetingData);
      
      if (result) {
        // Clear form first
        document.getElementById('meeting-form').reset();
        
        // Close modal using the close button (like ModalUtility does)
        const modal = document.getElementById('scheduleMeetingModal');
        const closeBtn = modal.querySelector('[data-bs-dismiss="modal"]');
        if (closeBtn) {
          closeBtn.click();
        }
        
        // Reload the page data
        await this.loadStudyGroup();
        
        alert('Meeting scheduled successfully!');
      }
      
    } catch (error) {
      console.error('Error creating meeting:', error);
      console.error('Error details:', error.message, error.stack);
      alert('Error scheduling meeting. Please try again.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  }

  setupEditGroupModal() {
    const editBtn = document.getElementById('edit-group-btn');
    const editForm = document.getElementById('editGroupForm');
    const modal = document.getElementById('editGroupModal');

    // Set up modal shown event to populate form
    if (modal) {
      modal.addEventListener('show.bs.modal', this.showEditGroupModal.bind(this));
    }

    // Set up form submit event
    if (editForm) {
      editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleEditGroupSubmit(e);
      });
    }
  }

  renderGroupActions() {
    const actionsContainer = document.getElementById('group-actions');
    if (!actionsContainer) return;
    
    const currentUserId = this.currentUser?.userData?.id || this.currentUser?.id;
    const isAdmin = this.currentUser?.userData?.attributes?.is_superuser || 
                    this.currentUser?.username?.toLowerCase().includes('admin');
    
    // For group management, admins have full control
    // Regular users who created the group have limited control
    const userIsGroupMember = this.groupMembers.some(member => 
      member.relationships?.user?.data?.id?.toString() === currentUserId?.toString()
    );
    
    if (isAdmin) {
      // Admin view - full control
      actionsContainer.innerHTML = `
        <p><span class="badge bg-secondary">Admin View</span></p>
        <button class="btn btn-outline-teal me-2" id="edit-group-btn" data-bs-toggle="modal" data-bs-target="#editGroupModal">
          <span class="fa-solid fa-edit me-2"></span>Edit Group
        </button>
        <button class="btn btn-gator-accent" id="delete-group-btn">
          <span class="fa-solid fa-trash me-2"></span>Delete Group
        </button>
      `;
      
      document.getElementById('delete-group-btn').addEventListener('click', () => {
        this.handleDeleteGroup();
      });
    } else if (userIsGroupMember) {
      // Regular member view
      actionsContainer.innerHTML = `
        <button class="btn btn-gator-accent" id="leave-group-btn">
          <span class="fa-solid fa-user-minus me-2"></span>Leave Group
        </button>
      `;
      
      document.getElementById('leave-group-btn').addEventListener('click', () => {
        this.handleLeaveGroup();
      });
    }
  }

  async showEditGroupModal(event) {
    try {
      // Populate form with current group data
      const groupNameInput = document.getElementById('editGroupName');
      const departmentSelect = document.getElementById('editDepartment');
      const courseNumberInput = document.getElementById('editCourseNumber');
      const descriptionTextarea = document.getElementById('editGroupDescription');
      
      if (groupNameInput) groupNameInput.value = this.currentGroup.attributes?.name || '';
      if (courseNumberInput) courseNumberInput.value = this.currentGroup.attributes?.class_number || '';
      if (descriptionTextarea) descriptionTextarea.value = this.currentGroup.attributes?.description || '';
      
      // Load departments if not already loaded
      await this.loadDepartmentsForEdit();
      
      // Set the current department
      if (departmentSelect && this.currentGroup.attributes?.department) {
        departmentSelect.value = this.currentGroup.attributes.department;
      }
      
      // Clear any previous messages
      this.clearEditModalMessages();
      
    } catch (error) {
      console.error('Error showing edit group modal:', error);
    }
  }

  async loadDepartmentsForEdit() {
    try {
      const departmentSelect = document.getElementById('editDepartment');
      if (!departmentSelect) return;
      
      // Check if departments are already loaded
      if (departmentSelect.children.length > 1) return;
      
      const authHeader = UserService.getAuthHeader();
      const response = await ApiService.getData('groups/', authHeader);
      
      if (response && response.data) {
        // Extract unique departments from existing groups
        const departments = [...new Set(response.data.map(group => group.attributes?.department).filter(Boolean))];
        
        // Clear loading option
        departmentSelect.innerHTML = '<option value="">Select Department</option>';
        
        // Add department options
        departments.forEach(dept => {
          const option = document.createElement('option');
          option.value = dept;
          option.textContent = dept;
          departmentSelect.appendChild(option);
        });
      }
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  }

  async handleEditGroupSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('edit-group-submit-btn');
    const originalText = submitBtn.textContent || 'Save Changes';
    
    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';
      
      // Get form data
      const name = document.getElementById('editGroupName').value.trim();
      const department = document.getElementById('editDepartment').value;
      const courseNumber = document.getElementById('editCourseNumber').value.trim();
      
      // Validate required fields
      if (!name || !department || !courseNumber) {
        this.showEditModalError('Please fill in all required fields.');
        return;
      }
      
      // Prepare update data
      const updateData = {
        name: name,
        department: department,
        class_number: parseInt(courseNumber, 10) || 0,
      };
      
      // Submit the update
      const authHeader = UserService.getAuthHeader();
      const result = await ApiService.putData(`groups/${this.currentGroup.id}/`, updateData, authHeader);
      
      if (result) {
        // Show success message
        this.showEditModalSuccess('Group updated successfully!');
        
        // Close modal after a short delay and redirect if name changed
        setTimeout(() => {
          ModalUtility.closeModalById('editGroupModal');
          // Check if the group name changed and redirect if needed
          const newGroupName = document.getElementById('editGroupName').value.trim();
          const currentGroupName = this.currentGroup?.attributes?.name;
          
          if (newGroupName && newGroupName !== currentGroupName) {
            // Convert the new name to URL-friendly format (lowercase, replace spaces with hyphens)
            const newSlug = newGroupName.toLowerCase()
              .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
              .replace(/\s+/g, '-') // Replace spaces with hyphens
              .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
              .trim('-'); // Remove leading/trailing hyphens
            
            // Redirect to the new URL
            window.location.href = `/study-groups/${newSlug}`;
          } else {
            // Just reload group data if name didn't change
            this.loadStudyGroup();
          }
        }, 1500);
      } else {
        this.showEditModalError('Failed to update group. Please try again.');
      }
      
    } catch (error) {
      console.error('Error updating group:', error);
      this.showEditModalError('Error updating group. Please try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }

  showEditModalError(message) {
    const errorDiv = document.getElementById('editModalErrorMessage');
    const errorText = document.getElementById('editErrorText');
    
    if (errorDiv && errorText) {
      errorText.textContent = message;
      errorDiv.classList.remove('d-none');
      errorDiv.classList.add('show');
      this.hideEditSuccessMessage();
    }
  }

  showEditModalSuccess(message) {
    const successDiv = document.getElementById('editModalSuccessMessage');
    const successText = document.getElementById('editSuccessText');
    
    if (successDiv && successText) {
      successText.textContent = message;
      successDiv.classList.remove('d-none');
      successDiv.classList.add('show');
      this.hideEditErrorMessage();
    } else {
      console.warn('Success elements not found, using alert');
      alert(message);
    }
  }

  hideEditErrorMessage() {
    const errorDiv = document.getElementById('editModalErrorMessage');
    if (errorDiv) {
      errorDiv.classList.add('d-none');
      errorDiv.classList.remove('show');
    }
  }

  hideEditSuccessMessage() {
    const successDiv = document.getElementById('editModalSuccessMessage');
    if (successDiv) {
      successDiv.classList.add('d-none');
      successDiv.classList.remove('show');
    }
  }

  clearEditModalMessages() {
    this.hideEditErrorMessage();
    this.hideEditSuccessMessage();
  }

  // Handle leaving a group
  async handleLeaveGroup() {
    if (!confirm('Are you sure you want to leave this group?')) {
      return;
    }
    
    try {
      const currentUserId = this.currentUser?.userData?.id || this.currentUser?.id;
      await StudyGroupDetailService.leaveGroup(this.currentGroup.id, currentUserId);
      
      alert('You have successfully left the group.');
      PageController.navigateTo('study-groups');
      
    } catch (error) {
      console.error('Error leaving group:', error);
      alert('Failed to leave group. Please try again.');
    }
  }

  // Handle deleting a group
  async handleDeleteGroup() {
    const currentUserId = this.currentUser?.userData?.id || this.currentUser?.id;
    const isAdmin = this.currentUser?.userData?.attributes?.is_superuser || 
                    this.currentUser?.username?.toLowerCase().includes('admin');
    
    if (!isAdmin) {
      alert('Only administrators can delete groups.');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return;
    }
    
    try {
      await StudyGroupDetailService.deleteGroup(this.currentGroup.id);
      
      alert('Group has been successfully deleted.');
      PageController.navigateTo('study-groups');
      
    } catch (error) {
      console.error('Error deleting group:', error);
      
      // Show specific error message based on the error
      if (error.message.includes('500')) {
        alert('Server Error: Group deletion is currently not available due to backend restrictions. Please contact the system administrator to manually delete this group from the database.');
      } else {
        alert('Failed to delete group. Please try again or contact support.');
      }
    }
  }
}

export default StudyGroupDetailPage;