
const slider = document.getElementById('flavorSlider');
const valueDisplay = document.getElementById('valueDisplay');
let lastSavedValue = null;
let saveTimeout = null;

chrome.storage.sync.get(['flavorLevel'], (result) => {
  const level = result.flavorLevel !== undefined ? result.flavorLevel : 0;
  slider.value = level;
  updateDisplay(level);
  lastSavedValue = level;
});

function updateDisplay(value) {
  let label = '';
  if (value <= 10) label = 'Overseasoned (In a Good Way)';
  else if (value < 40) label = 'Boldly Seasoned';
  else if (value < 70) label = 'Well Seasoned';
  else if (value < 90) label = 'Mildly Seasoned';
  else label = 'Unseasoned';
  valueDisplay.textContent = label;
}

slider.addEventListener('input', (e) => {
  const value = parseInt(e.target.value);
  updateDisplay(value);
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    if (lastSavedValue !== value) {
      chrome.storage.sync.set({ flavorLevel: value });
      lastSavedValue = value;
    }
  }, 200);
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'updateFlavor',
        level: value
      }, () => {});
    }
  });
});