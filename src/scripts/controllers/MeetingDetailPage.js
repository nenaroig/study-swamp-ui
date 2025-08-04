import PageController from './PageController.js';
import UserService from '../api/UserService.js';
import MeetingDetailService from '../api/MeetingDetailService.js';
import ApiService from '../api/ApiService.js';

// Convert meeting name to URL-friendly slug
export function createMeetingSlug(meetingName) {
  return MeetingDetailService.createMeetingSlug(meetingName);
}

// Extract meeting slug from current URL
export function getMeetingSlugFromUrl() {
  const path = window.location.pathname;
  const matches = path.match(/^\/meetings\/([^\/]+)$/);
  return matches ? matches[1] : null;
}

class MeetingDetailPage {
  constructor() {
    this.isInitialized = false;
  }
  
  async init(meetingSlug) {
    if (this.isInitialized) return;

    this.meetingSlug = meetingSlug;
    
    // Redirect to login if user is not authenticated
    if (!UserService.isLoggedIn()) {
      PageController.navigateTo('login');
      return;
    }
    
    // Get current user data
    this.currentUser = UserService.getCurrentUser();
    
    // Load and render meeting details
    await this.loadMeeting();
    
    this.isInitialized = true;
  }

  async loadMeeting() {
    try {
      // Get the meeting slug from URL
      const meetingSlug = getMeetingSlugFromUrl();
      if (!meetingSlug) {
        throw new Error('No meeting slug found in URL');
      }

      // Fetch the specific meeting by slug
      const meetingResponse = await MeetingDetailService.getMeetingBySlug(meetingSlug);
      
      // Try different ways to access the meeting data
      this.currentMeeting = meetingResponse.meetingData || {};
      
      if (!this.currentMeeting || !this.currentMeeting.id) {
        console.error('Meeting data structure:', JSON.stringify(meetingResponse, null, 2));
        throw new Error('Meeting not found or invalid structure');
      }
      
      // Load related data in parallel
      const authHeader = UserService.getAuthHeader();
      const [groupsResponse, usersResponse, locationsResponse, commentsResponse] = await Promise.all([
        ApiService.getData('groups/', authHeader),
        ApiService.getData('users/', authHeader),
        ApiService.getData('locations/', authHeader),
        ApiService.getData('meeting_comments/', authHeader)
      ]);
      
      // Filter data for this specific meeting
      const meetingId = this.currentMeeting.id?.toString();
      
      this.meetingComments = commentsResponse.data?.filter(comment => {
        const commentMeetingId = comment.relationships?.meeting?.data?.id?.toString();
        return commentMeetingId === meetingId;
      }) || [];
      
      this.allGroups = groupsResponse.data || [];
      this.allUsers = usersResponse.data || [];
      this.allLocations = locationsResponse.data || [];
      
      // Render all the meeting information
      this.renderMeetingDetails();
      this.renderComments();
      this.setupCommentForm();

      setTimeout(() => {
        this.setupDeleteButton();
        this.renderMeetingActions();
      }, 100);
      
    } catch (error) {
      console.error('Failed to load meeting:', error);
      console.error('Error details:', error.message);
      PageController.showError('Unable to load meeting. Please try refreshing the page.');
    }
  }
  
  renderMeetingDetails() {
    const title = document.getElementById('meeting-title');
    if (title) {
      title.textContent = this.currentMeeting.attributes?.name || 'Untitled Meeting';
    }
    
    const startTime = new Date(this.currentMeeting.attributes?.start_time);
    const endTime = new Date(this.currentMeeting.attributes?.end_time);
    
    // Format and display meeting time
    const timeElement = document.getElementById('meeting-time');
    if (timeElement) {
      timeElement.textContent = this.formatMeetingTime(startTime, endTime);
    }
    
    // Display location
    const locationElement = document.getElementById('meeting-location');
    if (locationElement) {
      const locationId = this.currentMeeting.relationships?.location?.data?.id;
      if (locationId && this.allLocations) {
        const locationData = this.allLocations.find(loc => loc.id === locationId);
        if (locationData) {
          const building = locationData.attributes?.building || '';
          const room = locationData.attributes?.room || '';
          locationElement.textContent = `${building} - Room ${room}`;
        }
      } else {
        locationElement.textContent = 'Location TBD';
      }
    }
    
    // Display group information
    const groupElement = document.getElementById('meeting-group');
    if (groupElement) {
      const groupId = this.currentMeeting.relationships?.group?.data?.id;
      if (groupId && this.allGroups) {
        const groupData = this.allGroups.find(group => group.id === groupId);
        if (groupData) {
          const groupName = groupData.attributes?.name || '';
          groupElement.textContent = groupName;
        }
      } else {
        groupElement.textContent = 'No group assigned';
      }
    }
    
    // Display description if available and show/hide section
    const descriptionElement = document.getElementById('meeting-description');
    const descriptionSection = document.getElementById('description-section');
    if (descriptionElement && descriptionSection) {
      const description = this.currentMeeting.attributes?.description || '';
      if (description && description.trim()) {
        descriptionElement.textContent = description;
        descriptionSection.style.display = 'block';  // Show the section
      } else {
        descriptionSection.style.display = 'none';   // Hide the section
      }
    }
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
    
    if (this.meetingComments.length === 0) {
      commentsList.innerHTML = '<p class="text-muted mt-4">No comments yet. Be the first to start the discussion!</p>';
      return;
    }
    
    // Sort comments by creation date (newest first)
    const sortedComments = [...this.meetingComments].sort((a, b) =>
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

  setupDeleteButton() {
    const deleteBtn = document.getElementById('delete-meeting-btn');
    if (!deleteBtn) return;
    
    // Add event listener for delete
    deleteBtn.addEventListener('click', () => {
      this.handleDeleteMeeting(this.currentMeeting.id);
    });
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
    
    if (!this.currentMeeting.id) {
      alert('Unable to post comment - meeting not found.');
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
        meeting: this.currentMeeting.id,
        user: currentUserId
      };
      
      // Post the comment
      const authHeader = UserService.getAuthHeader();
      const response = await ApiService.postData('meeting_comments/', commentData, authHeader);
      
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
      const commentsResponse = await ApiService.getData('meeting_comments/', authHeader);
      
      // Filter for this meeting
      const meetingId = this.currentMeeting.id;
      this.meetingComments = commentsResponse.data?.filter(comment =>
        comment.relationships?.meeting?.data?.id?.toString() === meetingId.toString()
      ) || [];
      
      // Re-render comments
      this.renderComments();
      
    } catch (error) {
      console.error('Failed to refresh comments:', error);
    }
  }

  async handleDeleteMeeting(meetingId) {
    if (!this.currentMeeting) {
      console.error('Meeting not found');
      return;
    }

    // Show confirmation dialog
    const meetingName = this.currentMeeting.attributes?.name || 'this meeting';
    const confirmed = confirm(`Are you sure you want to delete "${meetingName}"? This action cannot be undone.`);
    
    if (!confirmed) {
      return;
    }

    try {
      // Delete the meeting via API
      const authHeader = UserService.getAuthHeader();
      if (!authHeader) {
        throw new Error('No authentication available');
      }

      await ApiService.deleteData(`meetings/${meetingId}/`, authHeader);
      
      // Navigate back to meetings page after successful deletion
      alert('Meeting deleted successfully!');
      PageController.navigateTo('meetings');
      
    } catch (error) {
      console.error('Error deleting meeting:', error);
      alert('Failed to delete meeting. Please try again.');
    }
  }

  // Add this method to show/hide admin-only delete buttons
  renderMeetingActions() {
    // Try to find the button with different methods
    const deleteBtn = document.getElementById('delete-meeting-btn');
    const deleteBtnQuery = document.querySelector('#delete-meeting-btn');
    const deleteBtnClass = document.querySelector('.btn.btn-sm.btn-gator-accent');
    
    // Check if the meeting-title element exists (to confirm template loaded)
    const titleElement = document.getElementById('meeting-title');
    
    if (!deleteBtn) {
      const elementsWithIds = document.querySelectorAll('[id]');
      elementsWithIds.forEach(el => console.log('- ID:', el.id));
      return;
    }
    
    // Rest of your existing code...
    const isAdmin = this.currentUser?.userData?.attributes?.is_superuser || 
                    this.currentUser?.username?.includes('admin');
    
    if (isAdmin) {
      deleteBtn.style.display = 'inline-flex';
    } else {
      deleteBtn.style.display = 'none';
    }
  }
}

export default MeetingDetailPage;