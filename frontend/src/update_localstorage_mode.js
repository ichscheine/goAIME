/**
 * update_localstorage_mode.js
 * 
 * This script updates any localStorage entries that have "contest" mode to use "competition" instead
 * Run this in the browser console to fix client-side inconsistencies
 */

(function() {
  console.log("Starting localStorage mode standardization...");
  let updateCount = 0;
  let checkedCount = 0;
  
  // Loop through all localStorage keys
  Object.keys(localStorage).forEach(key => {
    try {
      // Try to parse as JSON
      const value = JSON.parse(localStorage.getItem(key));
      checkedCount++;
      
      // Check for direct mode property
      if (value && value.mode === "contest") {
        console.log(`Found mode="contest" in key: ${key}`);
        value.mode = "competition";
        localStorage.setItem(key, JSON.stringify(value));
        updateCount++;
      }
      
      // Check for sessions array
      if (value && value.sessions && Array.isArray(value.sessions)) {
        let sessionUpdated = false;
        
        // Check each session in the array
        value.sessions.forEach(session => {
          if (session && session.mode === "contest") {
            console.log(`Found session with mode="contest" in key: ${key}`);
            session.mode = "competition";
            sessionUpdated = true;
          }
        });
        
        // Save back to localStorage if any session was updated
        if (sessionUpdated) {
          localStorage.setItem(key, JSON.stringify(value));
          updateCount++;
        }
      }
    } catch (e) {
      // Not JSON or other error, skip
    }
  });
  
  console.log(`Standardization complete. Checked ${checkedCount} items, updated ${updateCount} items.`);
  console.log("Please refresh the page to apply the changes.");
})();
