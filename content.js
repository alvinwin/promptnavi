// content.js
let inputBuffer = '';
let isEnabled = false;
const shortcuts = {
  'fw': 'Winner'
};

function findAndHighlightText(text) {
  const range = document.createRange();
  const selection = window.getSelection();
  selection.removeAllRanges();

  const treeWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while (node = treeWalker.nextNode()) {
    const index = node.textContent.toLowerCase().indexOf(text.toLowerCase());
    if (index >= 0) {
      range.setStart(node, index);
      range.setEnd(node, index + text.length);
      selection.addRange(range);
      
      // Scroll the element into view
      const element = range.commonAncestorContainer.parentElement;
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Highlight the text
      const span = document.createElement('span');
      span.style.backgroundColor = 'yellow';
      range.surroundContents(span);
      
      break;
    }
  }
}

document.addEventListener('keydown', (event) => {
  if (!isEnabled) return;
  
  if (event.key.length === 1) {
    inputBuffer += event.key.toLowerCase();
    if (inputBuffer.length > 2) {
      inputBuffer = inputBuffer.slice(-2);
    }
    
    const matchedShortcut = shortcuts[inputBuffer];
    if (matchedShortcut) {
      findAndHighlightText(matchedShortcut);
      inputBuffer = ''; // Reset the input buffer after a match
    }
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'findText') {
    findAndHighlightText(request.text);
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
