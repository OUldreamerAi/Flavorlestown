


let currentFlavorLevel = 0;
let originalStylesheets = [];
let originalInlineStyles = new Map();
let removedSVGs = [];
let removedImages = [];

function storeOriginalStyles() {
  document.querySelectorAll('link[rel="stylesheet"]').forEach(sheet => {
    originalStylesheets.push({
      element: sheet,
      disabled: sheet.disabled
    });
  });
  document.querySelectorAll('[style]').forEach(element => {
    originalInlineStyles.set(element, element.getAttribute('style'));
  });
}


function applyFlavorLevel(level) {
  currentFlavorLevel = level;
  const oldStyle = document.getElementById('flavorlestown-override');
  if (oldStyle) oldStyle.remove();
  if (level === 0) {
    originalStylesheets.forEach(sheet => { sheet.element.disabled = false; });
    return;
  }
  if (level < 90) {
    originalStylesheets.forEach(sheet => { sheet.element.disabled = false; });
  }

  const style = document.createElement("style");
  style.id = "flavorlestown-override";
  let cssRules = [];
  if (level >= 10) {
    cssRules.push(`* {
        border:0!important;
        outline:0!important;
        outline-offset:0!important;}`);
  }
  if (level >= 20) {
    cssRules.push(`* {
        border-radius:0!important;}`);
  }
  if (level >= 30) {
    cssRules.push(`* {
        box-shadow:none!important;
        text-shadow:none!important;}`);
  }
  if (level >= 40) {
    cssRules.push(`* {padding:0!important; }`);
  }
  if (level >= 50) {
    cssRules.push(`* {
        background-image:none!important;}
        `);
  } 
  if (level >= 60) {
    cssRules.push(`*{ 
        font-family:Arial,sans-serif!important;
        font-weight:normal!important;
        font-style:normal!important;
        text-decoration:none!important;}`);
  }
  if (level >= 70) {
    cssRules.push(`body{background-color:#f3f3f3!important;}`);
  }
  if (level >= 80) {
    cssRules.push(`*,*::before,*::after{
        float:none!important;
        color:black!important;
        background-color:white!important;
        background:white!important;
        background-image:none!important;
        background-repeat:no-repeat!important;
        background-position:0 0!important;
        background-size:auto!important;
        box-shadow:none!important;
        text-shadow:none!important;
        }body{background-color:white!important;
        background:white!important;
        }*::before,*::after{background:none!important;
        background-image:none!important;
        content:""!important;}`);
  }
  if (level >= 90) {
    originalStylesheets.forEach(sheet => { sheet.element.disabled = true; });
    if (removedSVGs.length === 0) {
      document.querySelectorAll('svg').forEach(svg => {
        removedSVGs.push({element: svg.cloneNode(true), parent: svg.parentNode, nextSibling: svg.nextSibling});
        svg.remove();
      });
    }
    cssRules.push(`*{all:revert!important;
        }body{background:white!important;
        color:black!important;
        font-family:serif!important;
        padding:10px!important;
        }svg{display:none!important;
        }img{max-width:200px!important;}`);
  } else {
    if (removedSVGs.length > 0) {
      removedSVGs.forEach(item => {
        if (item.parent) {
          if (item.nextSibling) item.parent.insertBefore(item.element, item.nextSibling);
          else item.parent.appendChild(item.element);
        }
      });
      removedSVGs = [];
    }
  }
  if (level >= 100) {
    document.querySelectorAll('[style]').forEach(element => { element.removeAttribute('style'); });
    if (removedImages.length === 0) {
      document.querySelectorAll('img').forEach(img => {
        removedImages.push({element: img.cloneNode(true), parent: img.parentNode, nextSibling: img.nextSibling});
        img.remove();
      });
    }
    document.querySelectorAll('style:not(#flavorlestown-override)').forEach(styleTag => { styleTag.remove(); });
    cssRules.push(`body{
        background:white!important;
        color:black!important;
        font-family:serif!important;
        font-size:16px!important;
        line-height:1.5!important;
        padding:10px!important;
        }*{all:revert!important;
        }a{color:blue!important;
        text-decoration:underline!important;
        }img{display:none!important;}`);
  } else {
    if (removedImages.length > 0) {
      removedImages.forEach(item => {
        if (item.parent) {
          if (item.nextSibling) item.parent.insertBefore(item.element, item.nextSibling);
          else item.parent.appendChild(item.element);
        }
      });
      removedImages = [];
    }
  }
  style.textContent = cssRules.join('\n');
  document.head.appendChild(style);
}
  
function initialize() {
  storeOriginalStyles();
  chrome.storage.sync.get(['flavorLevel'], (result) => {
    const level = result.flavorLevel !== undefined ? result.flavorLevel : 0;
    applyFlavorLevel(level);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}


window.addEventListener('popstate', () => {
  chrome.storage.sync.get(['flavorLevel'], (result) => {
    const level = result.flavorLevel !== undefined ? result.flavorLevel : 0;
    applyFlavorLevel(level);
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateFlavor') {
    applyFlavorLevel(request.level);
    sendResponse({ success: true });
  }
});

const observer = new MutationObserver((mutations) => {
  const stylesheetAdded = mutations.some(mutation => 
    Array.from(mutation.addedNodes).some(node => 
      node.nodeName === 'LINK' && node.rel === 'stylesheet'
    )
  );
  if (stylesheetAdded) {
    storeOriginalStyles();
    applyFlavorLevel(currentFlavorLevel);
  }
  const overrideExists = document.getElementById('flavorlestown-override');
  if (!overrideExists) {
    applyFlavorLevel(currentFlavorLevel);
  }
});


observer.observe(document.documentElement, {
  childList: true,
  subtree: true
});
  