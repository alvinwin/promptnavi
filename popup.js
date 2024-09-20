// popup.js
document.addEventListener('DOMContentLoaded', function() {
  const enableToggle = document.getElementById('enableToggle');

  // Load the saved state
  chrome.storage.sync.get('enabled', function(data) {
    enableToggle.checked = data.enabled || false;
  });

  // Save the state when changed
  enableToggle.addEventListener('change', function() {
    chrome.storage.sync.set({enabled: this.checked}, function() {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "toggleEnabled", enabled: enableToggle.checked});
      });
    });
  });
});
