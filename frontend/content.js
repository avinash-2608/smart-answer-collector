// content.js
const CATEGORIES = [
  { id: 'Definition', label: 'Definition', icon: '📖' },
  { id: 'Explanation', label: 'Explanation', icon: '📝' },
  { id: 'Example', label: 'Example', icon: '💡' },
  { id: 'Important Point', label: 'Important', icon: '⭐' },
  { id: 'Diagram', label: 'Diagram', icon: '📊' },
  { id: 'Flowchart', label: 'Flowchart', icon: '🔄' },
  { id: 'Advantages', label: 'Advantages', icon: '✅' },
  { id: 'Disadvantages', label: 'Disadvantages', icon: '❌' },
  { id: 'Conclusion', label: 'Conclusion', icon: '🎯' }
];

let toolbar = null;

function createToolbar() {
  if (toolbar) return toolbar;
  
  toolbar = document.createElement('div');
  toolbar.id = 'smart-answer-toolbar';
  
  const title = document.createElement('div');
  title.className = 'sac-title';
  title.innerText = 'Save as:';
  toolbar.appendChild(title);
  
  const btnGroup = document.createElement('div');
  btnGroup.className = 'sac-btn-group';
  
  CATEGORIES.forEach(category => {
    const btn = document.createElement('button');
    btn.className = 'sac-btn';
    btn.innerHTML = `<span class="sac-icon">${category.icon}</span> <span class="sac-label">${category.label}</span>`;
    btn.title = `Save as ${category.label}`;
    
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      saveSelection(category);
    });
    
    btnGroup.appendChild(btn);
  });
  
  toolbar.appendChild(btnGroup);
  document.body.appendChild(toolbar);
  
  toolbar.addEventListener('mousedown', (e) => {
    e.preventDefault(); 
  });
  
  return toolbar;
}

async function saveSelection(category) {
  const selection = window.getSelection();
  const text = selection.toString().trim();
  
  if (!text) return;
  
  const noteData = {
    category: category.id,
    content: text,
    questionTitle: document.title || "ChatGPT Answer"
  };
  
  try {
    const response = await fetch("http://localhost:8080/notes/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(noteData)
    });
    
    if (response.ok) {
      showToast(`Saved to ${category.label}!`);
    } else {
      showToast(`Error saving to backend.`);
    }
  } catch (error) {
    console.error("Backend unavailable, saving locally as fallback.", error);
    // Fallback logic
    const note = {
      id: Date.now().toString(),
      content: text,
      category: category.id,
      timestamp: new Date().toISOString(),
      questionTitle: noteData.questionTitle
    };
    chrome.storage.local.get(['savedNotes'], (result) => {
      const notes = result.savedNotes || [];
      notes.push(note);
      chrome.storage.local.set({ savedNotes: notes }, () => {
        showToast(`Saved to local storage (${category.label})!`);
      });
    });
  }
  
  hideToolbar();
  selection.removeAllRanges();
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.id = 'sac-toast';
  toast.innerText = message;
  document.body.appendChild(toast);
  
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translate(-50%, 0)';
  });
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translate(-50%, 20px)';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

function hideToolbar() {
  if (toolbar) {
    toolbar.style.display = 'none';
    toolbar.classList.remove('sac-visible');
  }
}

document.addEventListener('mouseup', (e) => {
  if (toolbar && toolbar.contains(e.target)) return;
  
  setTimeout(() => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    if (text.length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      showToolbar(rect);
    } else {
      hideToolbar();
    }
  }, 10);
});

function showToolbar(rect) {
  const tb = createToolbar();
  tb.style.display = 'flex';
  tb.style.visibility = 'hidden';
  
  const scrollX = window.scrollX || document.documentElement.scrollLeft;
  const scrollY = window.scrollY || document.documentElement.scrollTop;
  
  const tbWidth = tb.offsetWidth || 500; 
  const tbHeight = tb.offsetHeight || 60; 
  
  let top = rect.top + scrollY - tbHeight - 15;
  let left = rect.left + scrollX + (rect.width / 2) - (tbWidth / 2);
  
  if (top < scrollY) {
    top = rect.bottom + scrollY + 15;
  }
  if (left < 10) left = 10;
  if (left + tbWidth > window.innerWidth) left = window.innerWidth - tbWidth - 10;
  
  tb.style.visibility = 'visible';
  tb.style.top = `${top}px`;
  tb.style.left = `${left}px`;
  
  requestAnimationFrame(() => {
    tb.classList.add('sac-visible');
  });
}