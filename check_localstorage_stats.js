// Simulate reading user stats from localStorage
// Run this script in the browser console to check the current stats

function checkLocalStorageStats() {
  // Check user data
  const user = localStorage.getItem('user');
  console.log('User data:', user ? JSON.parse(user) : 'Not found');
  
  // Check goAmy stats specifically
  const goAmyStats = localStorage.getItem('user_stats_goAmy');
  console.log('goAmy stats:', goAmyStats ? JSON.parse(goAmyStats) : 'Not found');
  
  // List all localStorage keys that might be relevant
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('user_') || key === 'user') {
      keys.push(key);
    }
  }
  console.log('Relevant localStorage keys:', keys);
}

checkLocalStorageStats();
