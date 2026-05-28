document.addEventListener('DOMContentLoaded', () => {
  const dateElement = document.getElementById('current-date');
  const contentElement = document.getElementById('teaching-content');
  const shareBtn = document.getElementById('share-btn');

  // Format today's local date details
  const today = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  dateElement.textContent = today.toLocaleDateString('en-US', options);

  // Derive target file matching path: data/[YEAR]/bible-teachings.json
  const currentYear = today.getFullYear();
  const jsonPath = `data/${currentYear}/bible-teachings.json`;

  // ISO format comparison tracking (YYYY-MM-DD)
  const targetDateString = today.toISOString().split('T')[0];

  let currentTeaching = null;

  // Fetch teaching asset dynamically by folder structure
  fetch(jsonPath)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Could not find teachings file for the year ${currentYear}`);
      }
      return response.json();
    })
    .then(data => {
      // Find item matching target string identifier
      currentTeaching = data.find(item => item.date === targetDateString);

      if (currentTeaching) {
        contentElement.innerHTML = currentTeaching.teaching;
        setupBibleLinks();
      } else {
        contentElement.innerHTML = `<p>No teaching scheduled for today (${targetDateString}).</p>`;
      }
    })
    .catch(error => {
      console.error('Error handling daily data source extraction:', error);
      contentElement.innerHTML = `<p>Error loading today's teaching. Please try again later.</p>`;
    });

  // Native UI Sharing Framework Execution Engine
  shareBtn.addEventListener('click', () => {
    if (!currentTeaching) return;

    // Remove internal HTML styling markup wrapper fragments cleanly
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = currentTeaching.teaching;
    const plainTextContent = tempDiv.textContent || tempDiv.innerText || "";

    if (navigator.share) {
      navigator.share({
        title: currentTeaching.topic || 'Daily Bible Teaching',
        text: plainTextContent,
        url: window.location.href
      }).catch(err => console.error('Error native sharing details failed:', err));
    } else {
      // Fallback pasteboard action logic string handling interface
      navigator.clipboard.writeText(`${currentTeaching.topic || 'Daily Bible Teaching'}\n\n${plainTextContent}`)
        .then(() => alert('Teaching contents copied onto keyboard clipboard paste buffers successfully!'))
        .catch(err => console.error('Failed processing automated dynamic copy parameters:', err));
    }
  });

  // Scrapes generated inner elements looking for dynamic target strings 
  function setupBibleLinks() {
    const textNodes = [];
    const walk = document.createTreeWalker(contentElement, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while(node = walk.nextNode()) {
      if (node.parentNode.tagName !== 'A' && node.parentNode.className !== 'bible-link') {
        textNodes.push(node);
      }
    }

    // Comprehensive standard text string evaluation checking parameters
    const regex = /(?:\b(?:Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1\s+Samuel|2\s+Samuel|1\s+Kings|2\s+Kings|1\s+Chronicles|2\s+Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Proverbs|Ecclesiastes|Song\s+of\s+Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1\s+Corinthians|2\s+Corinthians|Galatians|Ephesians|Philippians|Colossians|1\s+ thereians|1\s+Thessalonians|2\s+Thessalonians|1\s+Timothy|2\s+Timothy|Titus|Philemon|Hebrews|James|1\s+Peter|2\s+Peter|1\s+John|2\s+John|3\s+John|Jude|Revelation)\b)\s+\d+:\d+(?:\s*-\s*\d+)?/gi;

    // Target tracking mutation cycles
    for (let i = textNodes.length - 1; i >= 0; i--) {
      const node = textNodes[i];
      const text = node.nodeValue;
      let match;
      const matches = [];

      while ((match = regex.exec(text)) !== null) {
        matches.push(match);
      }

      if (matches.length > 0) {
        const fragment = document.createDocumentFragment();
        let lastIndex = 0;

        matches.forEach(m => {
          const matchText = m[0];
          const matchIndex = m.index;

          if (matchIndex > lastIndex) {
            fragment.appendChild(document.createTextNode(text.substring(lastIndex, matchIndex)));
          }

          const span = document.createElement('span');
          span.className = 'bible-link';
          span.textContent = matchText;
          span.setAttribute('role', 'button');
          span.setAttribute('tabindex', '0');
          span.addEventListener('click', () => showBiblePopup(matchText));
          span.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              showBiblePopup(matchText);
            }
          });

          fragment.appendChild(span);
          lastIndex = matchIndex + matchText.length;
        });

        if (lastIndex < text.length) {
          fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
        }

        node.parentNode.replaceChild(fragment, node);
      }
    }
  }

  // Floating Context window markup execution handler
  function showBiblePopup(reference) {
    const overlay = document.createElement('div');
    overlay.className = 'bible-popup-overlay';

    const popup = document.createElement('div');
    popup.className = 'bible-popup';
    popup.setAttribute('role', 'dialog');
    popup.setAttribute('aria-modal', 'true');

    popup.innerHTML = `
      <button class="bible-popup-close" aria-label="Close dialog">&times;</button>
      <h3 class="bible-popup-title">${reference}</h3>
      <div class="bible-popup-content"><p>Loading scripture text...</p></div>
    `;

    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    const closeBtn = popup.querySelector('.bible-popup-close');
    closeBtn.focus();

    closeBtn.addEventListener('click', () => {
      document.body.removeChild(overlay);
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) document.body.removeChild(overlay);
    });

    const timeout = setTimeout(() => {
      const content = popup.querySelector('.bible-popup-content');
      if (content) {
        content.innerHTML = `<p>Taking longer than expected to load. Please try again.</p>`;
      }
    }, 10000);

    fetch(`https://bible-api.com/${encodeURIComponent(reference)}?translation=kjv`)
      .then(res => res.json())
      .then(data => {
        clearTimeout(timeout);
        const content = popup.querySelector('.bible-popup-content');
        if (data.error) {
          content.innerHTML = `<p>Could not load "${reference}".</p>`;
        } else {
          const verses = data.verses.map(v => `<sup>${v.verse}</sup> ${v.text}`).join(' ');
          content.innerHTML = `
            <div>${verses}</div>
            <p style="text-align: right; font-style: italic; margin-top: 20px;">
              — ${data.reference} (KJV)
            </p>
          `;
        }
      })
      .catch(err => {
        clearTimeout(timeout);
        const content = popup.querySelector('.bible-popup-content');
        if (content) {
          content.innerHTML = `<p>Error loading Bible text.</p><p>${err.message || 'Please try again later.'}</p>`;
        }
      });
  }
});
