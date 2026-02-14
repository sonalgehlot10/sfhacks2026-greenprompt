// GreenPrompt Dashboard Logic

// Badge definitions
const BADGES = [
  { id: 'first_step', name: 'First Step', icon: '🌱', desc: 'First optimization', requirement: 1 },
  { id: 'eco_warrior', name: 'Eco Warrior', icon: '💚', desc: '10 optimizations', requirement: 10 },
  { id: 'token_saver', name: 'Token Saver', icon: '💾', desc: 'Save 1,000 tokens', requirement: 1000 },
  { id: 'energy_hero', name: 'Energy Hero', icon: '⚡', desc: 'Save 0.1 Wh', requirement: 0.1 },
  { id: 'consistency', name: 'Consistent', icon: '🔥', desc: '7 days streak', requirement: 7 },
  { id: 'mega_saver', name: 'Mega Saver', icon: '🏆', desc: 'Save 10,000 tokens', requirement: 10000 },
  { id: 'clarity_master', name: 'Clarity Master', icon: '✨', desc: 'Avg +20 clarity', requirement: 20 },
  { id: 'planet_protector', name: 'Planet Protector', icon: '🌍', desc: 'Save 1 Wh', requirement: 1 },
  { id: 'legend', name: 'Legend', icon: '👑', desc: '100 optimizations', requirement: 100 }
];

// Initialize dashboard
async function initDashboard() {
  const stats = await getStats('all');
  updateStatsDisplay(stats);
  updateImpactMessage(stats);
  updateBadgesDisplay(stats);
  updateActivityList(stats.recentActivity || []);
  setupEventListeners();
}

// Get stats from storage
async function getStats(period) {
  return new Promise((resolve) => {
    chrome.storage.local.get(['optimizations', 'badges'], (result) => {
      const optimizations = result.optimizations || [];
      const earnedBadges = result.badges || [];
      
      // Filter by period
      const filtered = filterByPeriod(optimizations, period);
      
      const stats = {
        totalOptimizations: filtered.length,
        totalTokensSaved: filtered.reduce((sum, o) => sum + o.tokensSaved, 0),
        totalEnergySaved: filtered.reduce((sum, o) => sum + o.energySaved, 0),
        avgClarityImprovement: filtered.length > 0 
          ? Math.round(filtered.reduce((sum, o) => sum + o.clarityImprovement, 0) / filtered.length)
          : 0,
        recentActivity: optimizations.slice(-10).reverse(),
        earnedBadges: earnedBadges,
        allOptimizations: optimizations
      };
      
      resolve(stats);
    });
  });
}

// Filter optimizations by time period
function filterByPeriod(optimizations, period) {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  
  switch(period) {
    case 'today':
      return optimizations.filter(o => now - o.timestamp < oneDay);
    case 'week':
      return optimizations.filter(o => now - o.timestamp < 7 * oneDay);
    case 'month':
      return optimizations.filter(o => now - o.timestamp < 30 * oneDay);
    case 'year':
      return optimizations.filter(o => now - o.timestamp < 365 * oneDay);
    case 'all':
    default:
      return optimizations;
  }
}

// Update stats display
function updateStatsDisplay(stats) {
  document.getElementById('total-tokens-saved').textContent = stats.totalTokensSaved.toLocaleString();
  document.getElementById('total-energy-saved').textContent = stats.totalEnergySaved.toFixed(4);
  document.getElementById('total-optimizations').textContent = stats.totalOptimizations;
  document.getElementById('avg-clarity').textContent = `+${stats.avgClarityImprovement}`;
}

// Update impact message
function updateImpactMessage(stats) {
  const messageEl = document.getElementById('impact-message');
  
  if (stats.totalOptimizations === 0) {
    messageEl.textContent = 'Start optimizing prompts to see your sustainability impact!';
    return;
  }
  
  const equivalents = [];
  
  // Calculate equivalents
  if (stats.totalEnergySaved > 0.001) {
    const phoneCharges = (stats.totalEnergySaved / 10).toFixed(2); // ~10Wh per phone charge
    equivalents.push(`${phoneCharges} phone charges`);
  }
  
  if (stats.totalTokensSaved > 1000000) {
    const millions = (stats.totalTokensSaved / 1000000).toFixed(1);
    equivalents.push(`${millions}M tokens`);
  }
  
  const message = `You've saved ${stats.totalTokensSaved.toLocaleString()} tokens and ${stats.totalEnergySaved.toFixed(4)} Wh of energy! ` +
    (equivalents.length > 0 ? `That's equivalent to ${equivalents.join(' or ')}.` : '') +
    ` Keep up the great work! 🌱`;
  
  messageEl.textContent = message;
}

// Update badges display
function updateBadgesDisplay(stats) {
  const container = document.getElementById('badges-container');
  const noBadges = document.getElementById('no-badges');
  
  container.innerHTML = '';
  let earnedCount = 0;
  
  BADGES.forEach(badge => {
    const earned = checkBadgeEarned(badge, stats);
    if (earned) earnedCount++;
    
    const badgeEl = document.createElement('div');
    badgeEl.className = `badge ${earned ? '' : 'locked'}`;
    badgeEl.innerHTML = `
      <div class="badge-icon">${badge.icon}</div>
      <div class="badge-name">${badge.name}</div>
      <div class="badge-desc">${badge.desc}</div>
    `;
    
    if (earned) {
      badgeEl.title = `Unlocked: ${badge.name}`;
    } else {
      badgeEl.title = `Locked: ${badge.desc}`;
    }
    
    container.appendChild(badgeEl);
  });
  
  noBadges.style.display = earnedCount === 0 ? 'block' : 'none';
}

// Check if badge is earned
function checkBadgeEarned(badge, stats) {
  switch(badge.id) {
    case 'first_step':
      return stats.totalOptimizations >= 1;
    case 'eco_warrior':
      return stats.totalOptimizations >= 10;
    case 'token_saver':
      return stats.totalTokensSaved >= 1000;
    case 'energy_hero':
      return stats.totalEnergySaved >= 0.1;
    case 'consistency':
      return checkStreak(stats.allOptimizations) >= 7;
    case 'mega_saver':
      return stats.totalTokensSaved >= 10000;
    case 'clarity_master':
      return stats.avgClarityImprovement >= 20;
    case 'planet_protector':
      return stats.totalEnergySaved >= 1;
    case 'legend':
      return stats.totalOptimizations >= 100;
    default:
      return false;
  }
}

// Check streak
function checkStreak(optimizations) {
  if (optimizations.length === 0) return 0;
  
  const dates = new Set();
  optimizations.forEach(o => {
    const date = new Date(o.timestamp).toDateString();
    dates.add(date);
  });
  
  return dates.size;
}

// Update activity list
function updateActivityList(activities) {
  const listEl = document.getElementById('activity-list');
  const noActivity = document.getElementById('no-activity');
  
  if (activities.length === 0) {
    listEl.style.display = 'none';
    noActivity.style.display = 'block';
    return;
  }
  
  listEl.style.display = 'block';
  noActivity.style.display = 'none';
  listEl.innerHTML = '';
  
  activities.forEach(activity => {
    const itemEl = document.createElement('div');
    itemEl.className = 'activity-item';
    
    const date = new Date(activity.timestamp);
    const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    
    itemEl.innerHTML = `
      <div class="activity-header">
        <span class="activity-date">${dateStr}</span>
      </div>
      <div class="activity-stats">
        ${activity.tokensSaved} tokens saved
        <span class="activity-improvement">+${activity.clarityImprovement} clarity</span>
      </div>
    `;
    
    listEl.appendChild(itemEl);
  });
}

// Setup event listeners
function setupEventListeners() {
  // Period selector
  document.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      
      const period = e.target.dataset.period;
      const stats = await getStats(period);
      updateStatsDisplay(stats);
      updateImpactMessage(stats);
    });
  });
  
  // Reset stats
  document.getElementById('reset-stats').addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all stats? This cannot be undone.')) {
      chrome.storage.local.set({ optimizations: [], badges: [] }, () => {
        initDashboard();
      });
    }
  });
  
  // Export data
  document.getElementById('export-data').addEventListener('click', async () => {
    const stats = await getStats('all');
    const data = {
      exportDate: new Date().toISOString(),
      totalOptimizations: stats.totalOptimizations,
      totalTokensSaved: stats.totalTokensSaved,
      totalEnergySaved: stats.totalEnergySaved,
      avgClarityImprovement: stats.avgClarityImprovement,
      badges: stats.earnedBadges,
      activities: stats.allOptimizations
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `greenprompt-stats-${Date.now()}.json`;
    a.click();
  });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initDashboard);

// Listen for updates from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'STATS_UPDATED') {
    initDashboard();
  }
});
