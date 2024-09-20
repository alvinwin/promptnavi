// background.js
chrome.runtime.onInstalled.addListener(() => {
  console.log('Text Finder extension installed');
  chrome.storage.sync.set({enabled: false}, function() {
    console.log('Extension disabled by default');
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'findText') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'findText', text: request.text });
    });
  }
});
