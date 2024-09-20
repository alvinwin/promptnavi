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
      chrome.tabs.sendMessage(tabs[0].id, { action: 'findText', text: request.text, caseSensitive: request.caseSensitive });
    });
  }
});

// content.js
let inputBuffer = '';
let isEnabled = false;
let currentSearchTerm = '';
let currentMatches = [];
let currentMatchIndex = -1;
const shortcuts = {
  'fw': { text: 'Winner', caseSensitive: false, showIndicator: true },
  'fa': { text: 'Annotated Response', caseSensitive: true, showIndicator: true },
  'fc1': { text: '[Turn 1] [Optional]', caseSensitive: true },
  'fc2': { text: '[Turn 2] [Optional]', caseSensitive: true },
  'fc3': { text: '[Turn 3] [Optional]', caseSensitive: true },
  'fc4': { text: '[Turn 4] [Optional]', caseSensitive: true },
  'fc5': { text: '[Turn 5] [Optional]', caseSensitive: true }
};

function createMatchIndicator() {
  const indicator = document.createElement('div');
  indicator.id = 'text-finder-indicator';
  indicator.style.display = 'none';
  document.body.appendChild(indicator);
  return indicator;
}

let matchIndicator = createMatchIndicator();

function updateMatchIndicator(index, total, context) {
  if (matchIndicator) {
    matchIndicator.innerHTML = `
      <div class="indicator-content">
        <div class="match-count">${index + 1} / ${total}</div>
        <div class="match-context">${context}</div>
      </div>
    `;
    matchIndicator.style.display = 'block';
  }
}

function hideMatchIndicator() {
  if (matchIndicator) {
    matchIndicator.style.display = 'none';
  }
}

function findAllMatches(text, caseSensitive) {
  const matches = [];
  const regex = new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), caseSensitive ? 'g' : 'gi');
  const treeWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  
  let node;
  while (node = treeWalker.nextNode()) {
    let match;
    while (match = regex.exec(node.textContent)) {
      matches.push({
        node: node,
        index: match.index,
        text: match[0]
      });
    }
  }
  
  return matches;
}

function getMatchContext(match) {
  const contextLength = 50;
  const text = match.node.textContent;
  const start = Math.max(0, match.index - contextLength);
  const end = Math.min(text.length, match.index + match.text.length + contextLength);
  let context = text.slice(start, end);
  
  if (start > 0) context = '...' + context;
  if (end < text.length) context = context + '...';
  
  return context;
}

function highlightMatch(match) {
  const range = document.createRange();
  range.setStart(match.node, match.index);
  range.setEnd(match.node, match.index + match.text.length);
  
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  
  // Scroll the element into view
  const element = range.commonAncestorContainer.parentElement;
  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  
  // Highlight the text
  const span = document.createElement('span');
  span.style.backgroundColor = 'yellow';
  range.surroundContents(span);
}

function findAndHighlightText(text, caseSensitive, showIndicator) {
  // Remove previous highlights
  document.querySelectorAll('span[style="background-color: yellow;"]').forEach(el => {
    el.outerHTML = el.innerHTML;
  });

  currentSearchTerm = text;
  currentMatches = findAllMatches(text, caseSensitive);
  currentMatchIndex = -1;
  
  if (currentMatches.length > 0) {
    findNextMatch(showIndicator);
  } else {
    console.log('No matches found');
    hideMatchIndicator();
  }
}

function findNextMatch(showIndicator = false) {
  if (currentMatches.length === 0) return;
  
  currentMatchIndex = (currentMatchIndex + 1) % currentMatches.length;
  const match = currentMatches[currentMatchIndex];
  highlightMatch(match);
  
  if (showIndicator) {
    const context = getMatchContext(match);
    updateMatchIndicator(currentMatchIndex, currentMatches.length, context);
  } else {
    hideMatchIndicator();
  }
}

function cancelSearch() {
  currentSearchTerm = '';
  currentMatches = [];
  currentMatchIndex = -1;
  
  // Remove all highlights
  document.querySelectorAll('span[style="background-color: yellow;"]').forEach(el => {
    el.outerHTML = el.innerHTML;
  });
  
  hideMatchIndicator();
  console.log('Search cancelled');
}

document.addEventListener('keydown', (event) => {
  if (!isEnabled) return;
  
  if (event.key === 'n') {
    findNextMatch(shortcuts[inputBuffer]?.showIndicator);
  } else if (event.key === 'q') {
    cancelSearch();
  } else if (event.key.length === 1) {
    inputBuffer += event.key.toLowerCase();
    if (inputBuffer.length > 3) {
      inputBuffer = inputBuffer.slice(-3);
    }
    
    const matchedShortcut = shortcuts[inputBuffer];
    if (matchedShortcut) {
      findAndHighlightText(matchedShortcut.text, matchedShortcut.caseSensitive, matchedShortcut.showIndicator);
      inputBuffer = ''; // Reset the input buffer after a match
    }
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'findText') {
    findAndHighlightText(request.text, request.caseSensitive);
  } else if (request.action === 'toggleEnabled') {
    isEnabled = request.enabled;
    console.log('Extension ' + (isEnabled ? 'enabled' : 'disabled'));
  }
});

// Load the initial state
chrome.storage.sync.get('enabled', function(data) {
  isEnabled = data.enabled || false;
  console.log('Initial state: ' + (isEnabled ? 'enabled' : 'disabled'));
});
