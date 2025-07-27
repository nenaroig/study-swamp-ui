import PageController from './PageController.js';
import UserService from '../api/UserService.js';
import StudyGroupDetailService from '../api/StudyGroupDetailService.js';
import ApiService from '../api/ApiService.js';

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
    // Prevent multiple initializations
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
      const [membersResponse, meetingsResponse, usersResponse, commentsResponse] = await Promise.all([
        ApiService.getData('members/', authHeader),
        ApiService.getData('meetings/', authHeader),
        ApiService.getData('users/', authHeader),
        ApiService.getData('group_comments/', authHeader)
      ]);
      
      // Filter data for this specific group
      const groupId = this.currentGroup.id?.toString(); // Convert to string
      console.log('Filtering for group ID (as string):', groupId);

      this.groupMembers = membersResponse.data?.filter(member => {
        const memberGroupId = member.relationships?.group?.data?.id?.toString();
        console.log(`Comparing: "${memberGroupId}" === "${groupId}"`);
        return memberGroupId === groupId;
      }) || [];
      
      this.groupMeetings = meetingsResponse.data?.filter(meeting => 
        meeting.relationships?.group?.data?.id === groupId
      ) || [];
      
      this.groupComments = commentsResponse.data?.filter(comment =>
        comment.relationships?.group?.data?.id === groupId
      ) || [];
      
      this.allUsers = usersResponse.data || [];
      
      // Render all the group information
      this.renderGroupDetails();
      this.renderGroupStats();
      this.renderMembers();
      this.renderMeetings();
      this.renderComments();
      this.setupCommentForm();
      this.setupMeetingModal();
      
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
    if (!membersList) return;
    
    membersList.innerHTML = '';
    
    this.groupMembers.forEach(member => {
      // Find the user data for this member
      const userId = member.relationships?.user?.data?.id;
      const user = this.allUsers.find(user => user.id === userId);
      
      if (user) {
        const memberCard = this.createMemberCard(member, user);
        membersList.appendChild(memberCard);
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
            <span class="fa-solid fa-map-marker-alt me-2 fa-fw"></span>Location TBD
          </p>
        </div>
        <button class="btn btn-sm btn-teal text-white">Join</button>
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
    
    console.log('Comment posted successfully:', response);
    
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
    this.renderGroupStats();
    
  } catch (error) {
    console.error('Failed to refresh comments:', error);
  }
}

// Refresh group data and re-render
async refreshGroup() {
  await this.loadStudyGroup();
}

setupMeetingModal() {
  const scheduleBtn = document.getElementById('schedule-meeting-btn');
  const createBtn = document.getElementById('create-meeting-btn');
  const modal = document.getElementById('scheduleMeetingModal');
  
  if (scheduleBtn && modal) {
    scheduleBtn.addEventListener('click', () => {
      this.showMeetingModal();
    });
  }
  
  if (createBtn) {
    createBtn.addEventListener('click', this.handleMeetingSubmit.bind(this));
  }
}

async showMeetingModal() {
  try {
    console.log('Loading meeting modal...');
    
    // Load available locations
    console.log('Loading locations...');
    await this.loadLocations();
    console.log('Locations loaded successfully');
    
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateInput = document.getElementById('meeting-date');
    if (dateInput) {
      dateInput.value = tomorrow.toISOString().split('T')[0];
    }
    
    // Check if Bootstrap modal is available
    if (typeof bootstrap === 'undefined') {
      console.error('Bootstrap is not loaded');
      alert('Bootstrap modal library is not available. Please refresh the page.');
      return;
    }
    
    // Show the modal using Bootstrap
    const modalElement = document.getElementById('scheduleMeetingModal');
    if (!modalElement) {
      console.error('Modal element not found');
      alert('Modal element not found. Please refresh the page.');
      return;
    }
    
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
    console.log('Modal shown successfully');
    
  } catch (error) {
    console.error('Error showing meeting modal:', error);
    console.error('Error details:', error.message, error.stack);
    alert(`Error loading meeting form: ${error.message}`);
  }
}

async loadLocations() {
  try {
    console.log('Starting to load locations...');
    const authHeader = UserService.getAuthHeader();
    console.log('Auth header:', authHeader);
    
    const locations = await ApiService.getData('locations/', authHeader);
    console.log('Locations response:', locations);
    
    const locationSelect = document.getElementById('meeting-location');
    if (!locationSelect) {
      console.error('Location select element not found');
      return;
    }
    
    if (locationSelect && locations.data) {
      locationSelect.innerHTML = '<option value="">Select location...</option>';
      
      locations.data.forEach(location => {
        const option = document.createElement('option');
        option.value = location.id;
        option.textContent = `${location.attributes.building} - Room ${location.attributes.room}`;
        locationSelect.appendChild(option);
      });
      
      console.log(`Loaded ${locations.data.length} locations`);
    } else {
      console.error('No locations data found:', locations);
    }
  } catch (error) {
    console.error('Error loading locations:', error);
    console.error('Error details:', error.message, error.stack);
    throw error; // Re-throw to be caught by showMeetingModal
  }
}

async handleMeetingSubmit(e) {
  e.preventDefault();
  
  const createBtn = document.getElementById('create-meeting-btn');
  const originalText = createBtn.textContent;
  
  try {
    createBtn.disabled = true;
    createBtn.textContent = 'Creating...';
    
    // Get form data
    const name = document.getElementById('meeting-name').value;
    const date = document.getElementById('meeting-date').value;
    const startTime = document.getElementById('meeting-start-time').value;
    const duration = parseFloat(document.getElementById('meeting-duration').value);
    const locationId = document.getElementById('meeting-location').value;
    const description = document.getElementById('meeting-description').value;
    
    // Validate required fields
    if (!name || !date || !startTime || !locationId) {
      alert('Please fill in all required fields.');
      return;
    }
    
    // Calculate start and end times
    const startDateTime = new Date(`${date}T${startTime}`);
    const endDateTime = new Date(startDateTime.getTime() + duration * 60 * 60 * 1000);
    
    // Create meeting data
    const meetingData = {
      name: name,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      group: this.currentGroup.id,
      location: locationId
    };
    
    if (description.trim()) {
      meetingData.description = description;
    }
    
    // Submit the meeting
    const authHeader = UserService.getAuthHeader();
    const result = await ApiService.postData('meetings/', meetingData, authHeader);
    
    if (result) {
      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('scheduleMeetingModal'));
      modal.hide();
      
      // Clear form
      document.getElementById('meeting-form').reset();
      
      // Reload meetings section
      await this.loadStudyGroup();
      
      alert('Meeting scheduled successfully!');
    }
    
  } catch (error) {
    console.error('Error creating meeting:', error);
    alert('Error scheduling meeting. Please try again.');
  } finally {
    createBtn.disabled = false;
    createBtn.textContent = originalText;
  }
}
}

export default StudyGroupDetailPage;