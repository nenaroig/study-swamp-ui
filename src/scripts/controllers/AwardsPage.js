import UserService from '../api/UserService.js';
import StatsService from '../api/StatsService.js';
import ApiService from '../api/ApiService.js';

class AwardsPage {
  constructor() {
    this.pageName = 'Awards';
    this.isInitialized = false;
    this.userAwards = [];
    this.allAwards = {};
    this.badgeTypeEnums = [];
  }
  
  init() {
    if (this.isInitialized) return;
    
    this.initAsync().catch(error => {
      console.error('Failed to initialize awards page:', error);
      this.renderError();
    });
  }

  async initAsync() {
    await this.loadEnumsAndAwards();
    this.isInitialized = true;
  }

  // Load enums and awards data
async loadEnumsAndAwards() {
  try {
    console.log('🔄 Loading enums and awards...');
    
    // Load badge type enums using the existing getEnumData method
    const authHeader = UserService.getAuthHeader();
    const enumsResponse = await ApiService.getEnumData('enums/', authHeader);
    
    // Access badge_types from the correct path
    this.badgeTypeEnums = enumsResponse.data?.enums?.badge_types || [];
    
    // Build award definitions from enums
    this.buildAwardDefinitions();
    
    // Load user awards
    await this.loadUserAwards();
  } catch (error) {
    console.error('❌ Failed to load enums and awards:', error);
    this.renderError();
  }
}
  
  // Define all possible awards with their criteria and descriptions
  buildAwardDefinitions() {
    const awardDetails = {
      0: {
        description: 'Welcome to the community! Awarded for creating your account.',
        icon: 'fa-solid fa-egg text-silver',
        criteria: 'Create your user account',
        rarity: 'common',
        points: 50
      },
      1: {
        description: 'Made your first connection! Awarded for joining your first study group.',
        icon: 'fa-solid fa-droplet text-blue-light',
        criteria: 'Join your first study group',
        rarity: 'common',
        points: 100
      },
      2: {
        description: 'Always on time! Awarded for checking into your first meeting.',
        icon: 'fa-solid fa-bolt-lightning text-yellow',
        criteria: 'Check into your first meeting',
        rarity: 'uncommon',
        points: 150
      },
      3: {
        description: 'Social butterfly! Awarded for attending a campus-wide event.',
        icon: 'fa-solid fa-gift',
        criteria: 'Check into a meeting with no associated group',
        rarity: 'uncommon',
        points: 200
      },
      4: {
        description: 'Dedication at its finest! Awarded for checking into 5 meetings.',
        icon: 'fa-solid fa-trophy',
        criteria: 'Check into 5 different meetings',
        rarity: 'rare',
        points: 500
      },
      5: {
        description: 'Point master! Awarded for reaching 1000 total points.',
        icon: 'fa-solid fa-crown',
        criteria: 'Reach 1000 total points',
        rarity: 'legendary',
        points: 1000
      }
    };

    // Combine enum data with award details
    this.badgeTypeEnums.forEach(enumItem => {
      const details = awardDetails[enumItem.value] || {};
      this.allAwards[enumItem.value] = {
        id: enumItem.label.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        name: enumItem.label,
        badgeType: enumItem.value,
        ...details
      };
    });
  }

  // Get all awards as array for display
  getAllAwardsArray() {
    return Object.values(this.allAwards);
  }
  
  // Load user's earned awards from API or calculate based on user data
  async loadUserAwards() {
    try {
      const currentUserData = UserService.getCurrentUserData();
      const userId = currentUserData?.data?.id;
      
      if (!userId) {
        console.error('No user ID found');
        return;
      }

      // Get all awards from API
      const response = await UserService.makeAuthenticatedRequest('awards/');
      const allAwards = response.data || [];
      
      // Filter awards for current user and map to our format
      this.userAwards = allAwards
        .filter(award => award.relationships.user.data.id === userId)
        .map(award => {
          const badgeType = award.attributes.badge_type;
          const awardDefinition = this.allAwards[badgeType];
          
          if (!awardDefinition) {
            console.warn(`Unknown badge_type: ${badgeType}`);
            return null;
          }
          
          return {
            ...awardDefinition,
            earnedDate: award.attributes.created_at,
            apiId: award.id
          };
        })
        .filter(award => award !== null); // Remove any null entries
      
      this.renderAwards();
    } catch (error) {
      console.error('Failed to load awards:', error);
      this.renderError();
    }
  }
  
  // Render the awards page
  renderAwards() {
    const container = document.getElementById('awards-stats-container');
    if (!container) return;

    const allAwardsArray = this.getAllAwardsArray();
    const earnedAwardIds = this.userAwards.map(award => award.id);

    container.innerHTML = `
      <!-- Stats container for StatsService cards -->
      <div id="awards-stats-cards" class="my-4"></div>

      <div class="row row-cols-1 row-cols-sm-2 row-cols-lg-3">
        ${allAwardsArray.map(award => {
          const isEarned = earnedAwardIds.includes(award.id);
          const userAward = this.userAwards.find(ua => ua.id === award.id);

          return `
            <div class="col mb-4">
              <div class="card award-card h-100 ${isEarned ? 'earned' : 'locked'} ${award.rarity} rounded-4">
                <div class="card-body text-center">
                  <div class="award-icon mb-3">
                    <span class="${isEarned ? '' : 'grayscale'} ${award.icon} fa-2x"></span>
                  </div>
                  <h2 class="h4 fw-600 ${isEarned ? '' : 'text-muted'}">${award.name}</h2>
                  <p class="card-text ${isEarned ? '' : 'text-muted'}">${award.description}</p>
                  <div class="award-criteria">
                    <small class="text-muted">${award.criteria}</small>
                  </div>
                  ${isEarned ? `
                    <div class="award-earned mt-3">
                      <span class="badge bg-success">Earned</span>
                      <div class="earned-date text-muted small mt-1">
                        ${new Date(userAward.earnedDate).toLocaleDateString()}
                      </div>
                      <div class="award-points text-gator-accent small">
                        +${award.points} points
                      </div>
                    </div>
                  ` : `
                    <div class="award-locked mt-3">
                      <span class="badge bg-lighter-gray">Locked</span>
                    </div>
                  `}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div class="awards-progress mt-5">
        <h4>Progress Overview</h4>
        <div class="progress mb-2">
          <div class="progress-bar" role="progressbar" 
              style="width: ${(this.userAwards.length / allAwardsArray.length) * 100}%" 
              aria-valuenow="${this.userAwards.length}" 
              aria-valuemin="0" 
              aria-valuemax="${allAwardsArray.length}">
            ${Math.round((this.userAwards.length / allAwardsArray.length) * 100)}%
          </div>
        </div>
        <p class="text-muted">
          Keep participating in study groups and attending meetings to unlock more awards!
        </p>
      </div>
    `;

    // Render the stats cards using StatsService
    StatsService.renderAwardsStats('awards-stats-cards', this.userAwards, allAwardsArray, {
      cardClass: 'col-md-4'
    });
  }

  // Handle errors
  renderError() {
    const container = document.getElementById('awards-stats-container');
    if (!container) return;
    
    container.innerHTML = `
      <div class="alert alert-warning text-center">
        <h4>Unable to load awards</h4>
        <p>Please try refreshing the page. If the problem persists, contact support.</p>
        <button class="btn btn-primary" onclick="location.reload()">Retry</button>
      </div>
    `;
  }

  // Public method to refresh awards (useful after user completes an action)
  async refresh() {
    await this.loadUserAwards();
  }
}

export default AwardsPage;