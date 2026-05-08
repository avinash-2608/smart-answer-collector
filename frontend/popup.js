// popup.js
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

let allNotes = [];

document.addEventListener('DOMContentLoaded', () => {
  loadNotes();

  // Event Listeners
  document.getElementById('search-input').addEventListener('input', handleSearch);
  document.getElementById('clear-all').addEventListener('click', handleClearAll);
  document.getElementById('export-txt').addEventListener('click', () => exportNotesLocal('txt'));
  document.getElementById('export-pdf').addEventListener('click', () => exportFromBackend('pdf'));
  document.getElementById('export-docx').addEventListener('click', () => exportFromBackend('docx'));
});

async function loadNotes() {
  try {
    const response = await fetch("http://localhost:8080/notes/all");
    if (response.ok) {
      allNotes = await response.json();
      renderNotes(allNotes);
      updateStats();
    } else {
      throw new Error("Backend not responding");
    }
  } catch (error) {
    console.warn("Falling back to local storage...", error);
    chrome.storage.local.get(['savedNotes'], (result) => {
      allNotes = result.savedNotes || [];
      renderNotes(allNotes);
      updateStats();
    });
  }
}

function updateStats() {
  document.getElementById('note-count').textContent = allNotes.length;
}

function renderNotes(notesToRender) {
  const container = document.getElementById('notes-container');
  container.innerHTML = '';

  if (notesToRender.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📝</div>
        <p>No notes found.</p>
        <span>Select text on ChatGPT to start collecting!</span>
      </div>
    `;
    return;
  }

  const grouped = {};
  CATEGORIES.forEach(cat => grouped[cat.id] = []);
  
  notesToRender.forEach(note => {
    // Handling edge case where category string casing might differ
    const catId = CATEGORIES.find(c => c.id.toLowerCase() === note.category.toLowerCase())?.id || 'Explanation';
    if (!grouped[catId]) grouped[catId] = [];
    grouped[catId].push(note);
  });

  CATEGORIES.forEach(cat => {
    const catNotes = grouped[cat.id];
    if (catNotes && catNotes.length > 0) {
      const section = document.createElement('div');
      section.className = 'category-section';
      
      const header = document.createElement('div');
      header.className = 'category-header';
      header.innerHTML = `
        <span class="category-title cat-${cat.id.toLowerCase().replace(' ', '-')}">${cat.icon} ${cat.label}</span>
        <span class="category-count">${catNotes.length}</span>
      `;
      section.appendChild(header);

      catNotes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      catNotes.forEach(note => {
        const card = document.createElement('div');
        card.className = 'note-card';
        
        const date = new Date(note.timestamp).toLocaleString(undefined, { 
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
        });

        const searchTerm = document.getElementById('search-input').value.trim();
        let displayText = escapeHTML(note.content);
        if (searchTerm) {
          const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
          displayText = displayText.replace(regex, '<mark style="background: rgba(16,163,127,0.4); color: white; border-radius: 2px;">$1</mark>');
        }

        card.innerHTML = `
          <div class="note-content">${displayText}</div>
          <div class="note-footer">
            <span class="note-date">${date}</span>
            <div class="note-actions">
              <button class="icon-btn copy-btn" title="Copy text" data-id="${note.id}">📋</button>
              <button class="icon-btn delete-btn" title="Delete note" data-id="${note.id}">🗑️</button>
            </div>
          </div>
        `;
        section.appendChild(card);
      });

      container.appendChild(section);
    }
  });

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      deleteNote(id);
    });
  });

  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      // Handle both local (string IDs) and backend (numeric IDs)
      const note = allNotes.find(n => String(n.id) === String(id));
      if (note) {
        navigator.clipboard.writeText(note.content).then(() => showToast('Copied to clipboard!'));
      }
    });
  });
}

function handleSearch(e) {
  const query = e.target.value.toLowerCase();
  if (!query) {
    renderNotes(allNotes);
    return;
  }
  
  const filtered = allNotes.filter(note => note.content.toLowerCase().includes(query));
  renderNotes(filtered);
}

async function deleteNote(id) {
  // If id is numeric, it's from backend. If string (like timestamp), local.
  const numericId = parseInt(id);
  if (!isNaN(numericId) && numericId < 10000000000) { 
    try {
      const res = await fetch(`http://localhost:8080/notes/${id}`, { method: 'DELETE' });
      if(res.ok) {
        allNotes = allNotes.filter(note => note.id !== numericId);
        renderNotes(allNotes);
        updateStats();
        showToast('Note deleted');
      }
    } catch(e) { console.error(e); }
  } else {
    allNotes = allNotes.filter(note => String(note.id) !== String(id));
    chrome.storage.local.set({ savedNotes: allNotes }, () => {
      renderNotes(allNotes);
      updateStats();
      showToast('Local note deleted');
    });
  }
}

async function handleClearAll() {
  if (allNotes.length === 0) return;
  
  if (confirm('Are you sure you want to delete all saved notes? This cannot be undone.')) {
    try {
      await fetch("http://localhost:8080/notes/clear", { method: 'DELETE' });
      allNotes = [];
      renderNotes(allNotes);
      updateStats();
      showToast('All notes cleared from backend');
    } catch (e) {
      chrome.storage.local.set({ savedNotes: [] }, () => {
        allNotes = [];
        renderNotes(allNotes);
        updateStats();
        showToast('All notes cleared locally');
      });
    }
  }
}

function exportNotesLocal(format) {
  if (allNotes.length === 0) {
    showToast('No notes to export!');
    return;
  }

  let content = 'SMART ANSWER COLLECTOR - EXAM NOTES\n';
  content += 'Generated on: ' + new Date().toLocaleString() + '\n\n';
  content += '=======================================\n\n';

  CATEGORIES.forEach(cat => {
    const catNotes = allNotes.filter(n => n.category.toLowerCase() === cat.id.toLowerCase());
    if (catNotes.length > 0) {
      content += `[ ${cat.label.toUpperCase()} ]\n`;
      content += `---------------------------------------\n`;
      catNotes.forEach((note, index) => {
        content += `${index + 1}. ${note.content}\n\n`;
      });
      content += '\n';
    }
  });

  if (format === 'txt') {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    chrome.downloads.download({
      url: url,
      filename: `exam_notes_${Date.now()}.txt`,
      saveAs: true
    }, () => {
      showToast('Exported to TXT!');
      navigator.clipboard.writeText(content).then(() => showToast('Exported to TXT and copied!'));
    });
  }
}

async function exportFromBackend(format) {
  if (allNotes.length === 0) {
    showToast('No notes to export!');
    return;
  }
  showToast(`Generating ${format.toUpperCase()}...`);
  try {
    const res = await fetch(`http://localhost:8080/notes/export/${format}`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error("Backend export failed");
    
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    chrome.downloads.download({
      url: url,
      filename: `exam_notes_${Date.now()}.${format}`,
      saveAs: true
    }, () => {
      showToast(`Exported to ${format.toUpperCase()}!`);
    });
  } catch (e) {
    console.error(e);
    showToast(`Failed to export ${format.toUpperCase()} from backend.`);
  }
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}