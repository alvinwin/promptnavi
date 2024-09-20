// content.js
let inputBuffer = '';
let isEnabled = false;
let currentSearchTerm = '';
let currentMatches = [];
let currentMatchIndex = -1;
const shortcuts = {
  'fw': { text: 'Winner', caseSensitive: false },
  'fa': { text: 'Annotated Response', caseSensitive: true },
  'fc1': { text: '[Turn 1] [Optional] Please provide comments for any issues identified.', caseSensitive: true },
  'fc2': { text: '[Turn 2] [Optional] Please provide comments for any issues identified.', caseSensitive: true },
  'fc3': { text: '[Turn 3] [Optional] Please provide comments for any issues identified.', caseSensitive: true },
  'fc4': { text: '[Turn 4] [Optional] Please provide comments for any issues identified.', caseSensitive: true },
  'fc5': { text: '[Turn 5] [Optional] Please provide comments for any issues identified.', caseSensitive: true },
};

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
        text: match[0],
      });
    }
  }

  return matches;
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

function findAndHighlightText(text, caseSensitive) {
  // Remove previous highlights
  document.querySelectorAll('span[style="background-color: yellow;"]').forEach(el => {
    el.outerHTML = el.innerHTML;
  });

  currentSearchTerm = text;
  currentMatches = findAllMatches(text, caseSensitive);
  currentMatchIndex = -1;

  if (currentMatches.length > 0) {
    findNextMatch();
  } else {
    console.log('No matches found');
  }
}

function findNextMatch() {
  if (currentMatches.length === 0) return;

  currentMatchIndex = (currentMatchIndex + 1) % currentMatches.length;
  highlightMatch(currentMatches[currentMatchIndex]);
}

document.addEventListener('keydown', (event) => {
  if (!isEnabled) return;

  if (event.key === 'n') {
    findNextMatch();
  } else if (event.key === 'q') {
    cancelSearch();
  } else if (event.key.length === 1) {
    inputBuffer += event.key.toLowerCase();
    if (inputBuffer.length > 3) {
      inputBuffer = inputBuffer.slice(-3);
    }

    const matchedShortcut = shortcuts[inputBuffer];
    if (matchedShortcut) {
      findAndHighlightText(matchedShortcut.text, matchedShortcut.caseSensitive);
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
