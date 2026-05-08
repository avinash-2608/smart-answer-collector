// content.js

let toolbar = null;

// ==========================
// CREATE TOOLBAR
// ==========================
function createToolbar() {

  if (toolbar) return toolbar;

  toolbar = document.createElement('div');
  toolbar.id = 'smart-answer-toolbar';

  const title = document.createElement('div');
  title.className = 'sac-title';
  title.innerText = '✨ Smart Answer Collector';

  toolbar.appendChild(title);

  const btn = document.createElement('button');
  btn.className = 'sac-btn';
  btn.innerHTML = '🪄 Save & Auto Organize';

  btn.addEventListener('click', (e) => {

    e.stopPropagation();
    e.preventDefault();

    saveSelection();

  });

  toolbar.appendChild(btn);

  document.body.appendChild(toolbar);

  toolbar.addEventListener('mousedown', (e) => {
    e.preventDefault();
  });

  return toolbar;
}

// ==========================
// DETECT CATEGORY
// ==========================
function detectCategory(text) {

  const lower = text.toLowerCase();

  // DEFINITION
  if (
    lower.startsWith("what is") ||
    lower.includes("defined as") ||
    lower.includes("refers to") ||
    lower.includes("is a branch")
  ) {
    return "Definition";
  }

  // FLOW / PROCESS
  if (
    lower.includes("steps") ||
    lower.includes("phases") ||
    lower.includes("process") ||
    lower.includes("workflow") ||
    lower.includes("stage")
  ) {
    return "Flowchart";
  }

  // ADVANTAGES
  if (
    lower.includes("advantages") ||
    lower.includes("benefits") ||
    lower.includes("importance") ||
    lower.includes("why")
  ) {
    return "Advantages";
  }

  // DISADVANTAGES
  if (
    lower.includes("disadvantages") ||
    lower.includes("limitations") ||
    lower.includes("cons")
  ) {
    return "Disadvantages";
  }

  // CONCLUSION
  if (
    lower.includes("in short") ||
    lower.includes("in conclusion") ||
    lower.includes("to conclude") ||
    lower.includes("therefore")
  ) {
    return "Conclusion";
  }

  // IMPORTANT POINT
  if (
    lower.includes("important") ||
    lower.includes("note")
  ) {
    return "Important Point";
  }

  // EXAMPLE
  if (
    lower.startsWith("example") ||
    lower.startsWith("for example") ||
    lower.includes("simple example")
  ) {
    return "Example";
  }

  return "Explanation";
}

// ==========================
// SAVE SELECTION
// ==========================
async function saveSelection() {

  const selection = window.getSelection();

  const text = selection.toString().trim();

  if (!text) return;

  // SPLIT TEXT INTO SMALLER SECTIONS
  const sections = text
    .split(/\n\s*\n|\n(?=\d+\.)|\n(?=[A-Z])/g)
    .filter(section => section.trim() !== '');

  for (const section of sections) {

    const cleanedText = section.trim();

    const detectedCategory = detectCategory(cleanedText);

    const noteData = {

      category: detectedCategory,

      content: cleanedText,

      questionTitle: document.title || "ChatGPT Answer"

    };

    try {

      const response = await fetch(
        "http://localhost:8081/notes/save",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify(noteData)
        }
      );

      if (!response.ok) {
        throw new Error("Backend save failed");
      }

    } catch (error) {

      console.error(
        "Backend unavailable, saving locally.",
        error
      );

      // LOCAL STORAGE FALLBACK
      const note = {

        id: Date.now().toString(),

        content: cleanedText,

        category: detectedCategory,

        timestamp: new Date().toISOString(),

        questionTitle: noteData.questionTitle

      };

      chrome.storage.local.get(
        ['savedNotes'],
        (result) => {

          const notes = result.savedNotes || [];

          notes.push(note);

          chrome.storage.local.set({
            savedNotes: notes
          });

        }
      );
    }
  }

  showToast("✅ Answer auto-organized!");

  hideToolbar();

  selection.removeAllRanges();
}

// ==========================
// TOAST
// ==========================
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

// ==========================
// HIDE TOOLBAR
// ==========================
function hideToolbar() {

  if (toolbar) {

    toolbar.style.display = 'none';

    toolbar.classList.remove('sac-visible');

  }
}

// ==========================
// TEXT SELECTION EVENT
// ==========================
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

// ==========================
// SHOW TOOLBAR
// ==========================
function showToolbar(rect) {

  const tb = createToolbar();

  tb.style.display = 'flex';

  tb.style.visibility = 'hidden';

  const scrollX =
    window.scrollX ||
    document.documentElement.scrollLeft;

  const scrollY =
    window.scrollY ||
    document.documentElement.scrollTop;

  const tbWidth = tb.offsetWidth || 500;

  const tbHeight = tb.offsetHeight || 60;

  let top =
    rect.top +
    scrollY -
    tbHeight -
    15;

  let left =
    rect.left +
    scrollX +
    (rect.width / 2) -
    (tbWidth / 2);

  if (top < scrollY) {

    top = rect.bottom + scrollY + 15;

  }

  if (left < 10) {

    left = 10;

  }

  if (left + tbWidth > window.innerWidth) {

    left = window.innerWidth - tbWidth - 10;

  }

  tb.style.visibility = 'visible';

  tb.style.top = `${top}px`;

  tb.style.left = `${left}px`;

  requestAnimationFrame(() => {

    tb.classList.add('sac-visible');

  });
}