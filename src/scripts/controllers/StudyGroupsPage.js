import PageController from './PageController.js';
import UserService from '../api/UserService.js';
import StudyGroupsService from '../api/StudyGroupsService.js';

class StudyGroupsPage {
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
   
   // Load and render study groups
   await this.loadStudyGroups();
   
   this.isInitialized = true;
 }
 
 async loadStudyGroups() {
   try {
     // Fetch user's study groups from API
     const groupsResponse = await StudyGroupsService.getMyStudyGroups();
     
     // Extract data array with fallback to empty array
     this.groups = groupsResponse.studyGroupsData?.data || [];
     
     // Render groups using service layer
     StudyGroupsService.renderDashboardGroups(this.groups, 'dashboard-groups-container');
   } catch (error) {
     console.error('Failed to load study groups:', error);
     // Show user-friendly error message
     PageController.showError('Unable to load study groups. Please try refreshing the page.');
   }
 }

 // Refresh groups data and re-render
 async refreshGroups() {
   await this.loadStudyGroups();
 }
}

export default StudyGroupsPage;