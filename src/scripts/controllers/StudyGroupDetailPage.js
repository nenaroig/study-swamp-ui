import PageController from './PageController.js';
import UserService from '../api/UserService.js';
import StudyGroupDetailService from '../api/StudyGroupDetailService.js';
import { getGroupSlugFromUrl } from '../utils/URLHelpers.js';

class StudyGroupDetailPage {
  constructor() {
    this.isInitialized = false;
    this.currentGroup = null;
    this.members = [];
    this.meetings = [];
    this.comments = [];
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
      
      // Extract single group object (not array)
      this.currentGroup = groupResponse.studyGroupData || {};
      
      if (!this.currentGroup || !this.currentGroup.id) {
        this.handleGroupNotFound();
        return;
      }
      
      // Fetch all related data in parallel
      await Promise.all([
        this.loadGroupMembers(),
        this.loadGroupMeetings(),
        this.loadGroupComments()
      ]);
      
      // Render all sections
      this.renderGroupHeader();
      this.renderGroupStats();
      
      // Use the StudyGroupDetailService rendering methods directly as suggested
      StudyGroupDetailService.renderMembers(this.members, 'members-list');
      StudyGroupDetailService.renderMeetings(this.meetings, 'meetings-list');
      StudyGroupDetailService.renderComments(this.comments, 'comments-list');
      
      this.setupCommentForm();
      
    } catch (error) {
      console.error('Failed to load study group:', error);
      PageController.showError('Unable to load study group. Please try refreshing the page.');
    }
  }
  
  async loadGroupMembers() {
    try {
      const groupId = this.currentGroup.id;
      const membersResponse = await StudyGroupDetailService.getGroupMembers(groupId);
      this.members = membersResponse.members || [];
    } catch (error) {
      console.error('Failed to load group members:', error);
      this.members = [];
    }
  }
  
  async loadGroupMeetings() {
    try {
      const groupId = this.currentGroup.id;
      const meetingsResponse = await StudyGroupDetailService.getGroupMeetings(groupId);
      this.meetings = meetingsResponse.meetings || [];
    } catch (error) {
      console.error('Failed to load group meetings:', error);
      this.meetings = [];
    }
  }
  
  async loadGroupComments() {
    try {
      const groupId = this.currentGroup.id;
      const commentsResponse = await StudyGroupDetailService.getGroupComments(groupId);
      this.comments = commentsResponse.comments || [];
    } catch (error) {
      console.error('Failed to load group comments:', error);
      this.comments = [];
    }
  }
  
  // Render the group header with name and department
  renderGroupHeader() {
    // Update group title
    const titleElement = document.getElementById('group-title');
    titleElement.textContent = this.currentGroup.attributes?.name || 'Untitled Group';
    
    // Update department info
    const departmentElement = document.getElementById('group-department');
    const department = this.currentGroup.attributes?.department || '';
    const classNumber = this.currentGroup.attributes?.class_number || '';
    if (department && classNumber) {
      departmentElement.textContent = `${department} ${classNumber}`;
    } else if (department) {
      departmentElement.textContent = department;
    } else if (classNumber) {
      departmentElement.textContent = `Class ${classNumber}`;
    } else {
      departmentElement.textContent = 'No department specified';
    }
  }
  
  // Render the group stats (members, meetings, comments counts)
  renderGroupStats() {
    // Update member count
    const memberCountElement = document.getElementById('member-count');
    memberCountElement.textContent = this.members.length.toString();
    
    // Update meeting count
    const meetingCountElement = document.getElementById('meeting-count');
    meetingCountElement.textContent = this.meetings.length.toString();
    
    // Update comment count
    const commentCountElement = document.getElementById('comment-count');
    commentCountElement.textContent = this.comments.length.toString();
  }
  
  // Set up the comment form with the current user's info
  setupCommentForm() {
    const avatarElement = document.querySelector('.member-avatar');
    
    if (this.currentUser && avatarElement) {
      const firstName = this.currentUser.userData?.attributes?.first_name || '';
      const lastName = this.currentUser.userData?.attributes?.last_name || '';
      
      // Generate initials
      const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || 'YU';
      avatarElement.textContent = initials;
    }
    
    // Set up the post comment button (implementation would go here)
    const postButton = document.querySelector('.btn-tealmt-3');
    if (postButton) {
      postButton.addEventListener('click', this.handlePostComment.bind(this));
    }
  }
  
  // Handle posting a new comment
  async handlePostComment() {
    const textarea = document.querySelector('textarea');
    const content = textarea.value.trim();
    
    if (!content) {
      // Show validation error
      return;
    }
    
    // Implementation for posting comment would go here
    console.log('Posting comment:', content);
    
    // Clear the textarea
    textarea.value = '';
    
    // Refresh comments (would be implemented with actual API call)
    // await this.loadGroupComments();
    // this.renderGroupComments();
  }
  
  // Handle case when group is not found
  handleGroupNotFound() {
    const container = document.querySelector('.inner-wrapper');
    container.innerHTML = `
      <div class="bg-white p-5 text-center rounded-4 mt-5">
        <span class="fa-solid fa-exclamation-circle text-warning fa-3x"></span>
        <h1 class="mt-4">Group Not Found</h1>
        <p class="mt-4">Sorry, the study group you're looking for could not be found.</p>
        <a href="/groups" class="btn btn-violet mt-4">
          <span class="fa-solid fa-arrow-left me-3"></span>Back to Study Groups
        </a>
      </div>
    `;
  }
  
  // Refresh group data and re-render
  async refreshGroup() {
    await this.loadStudyGroup();
  }
}

export default StudyGroupDetailPage;