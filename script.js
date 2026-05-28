document.addEventListener('DOMContentLoaded', () => {
  const dateDisplay = document.getElementById("dateDisplay");
  const calendarPicker = document.getElementById("calendarPicker");
  const todayBtn = document.getElementById("todayBtn");
  const shareBtn = document.getElementById("shareBtn");
  const darkThemeBtn = document.getElementById("darkThemeBtn");
  
  const output = document.getElementById('teaching-output');
  const spinner = document.getElementById('loadingSpinner');
  const widgetContainer = document.getElementById("bible-teaching-widget");

  // Setup UI Dates
  const today = new Date();
  const currentDateString = today.toISOString().split('T')[0];
  
  dateDisplay.innerText = today.toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  
  calendarPicker.value = currentDateString;

  // Initial target fetch parameters mapping on load
  getTeachingByDate(currentDateString);

  // Event Listeners
  calendarPicker.addEventListener('change', (e) => {
    getTeachingByDate(e.target.value);
  });

  todayBtn.addEventListener('click', () => {
    const todayStr = new Date().toISOString().split('T')[0];
    calendarPicker.value = todayStr;
    getTeachingByDate(todayStr);
  });

  darkThemeBtn.addEventListener('click', () => {
    widgetContainer.classList.toggle("dark");
  });

  shareBtn.addEventListener('click', () => {
    const text = output.innerText;
    if (navigator.share) {
      navigator.share({
        title: 'Daily Bible Teaching',
        text: text,
        url: window.location.href
      }).catch(err => console.error('Share error:', err));
    } else {
      navigator.clipboard.writeText(text).then(() => {
        alert("Teaching copied to clipboard! You can now paste and share it.");
      });
    }
  });

  // Feedback Handlers
  document.getElementById('likeBtn').addEventListener('click', () => {
    alert("Bro Henry says ❤️ Thank you for liking today's teaching!");
  });
  document.getElementById('prayerBtn').addEventListener('click', () => {
    alert("Bro Henry says 🙏 We're praying for you too!");
  });
  document.getElementById('feedbackBtn').addEventListener('click', () => {
    alert("Bro Henry says ⭐ Thank you for your feedback!");
  });

  // Core Processing Routine
  async function getTeachingByDate(dateStr) {
    if (!dateStr) return;
    
    output.style.display = 'none';
    spinner.style.display = 'flex';

    // Extract targeting year identifier directly out of standard date payload layout (YYYY-MM-DD)
    const targetYear = dateStr.split('-')[0];
    const yearlyJsonUrl = `data/${targetYear}/bible-teachings.json`;

    try {
      const response = await fetch(yearlyJsonUrl);
      if (!response.ok) {
        throw new Error(`Teaching repository data file error for year: ${targetYear}`);
      }
      
      const teachingsData = await response.json();
      const todayTeaching = teachingsData.find(item => item.date === dateStr);

      spinner.style.display = 'none';
      output.style.display = 'block';

      if (todayTeaching) {
        let teachingContent = todayTeaching.teaching;
        
        // Inline hyperlinking parser matching book data strings directly 
        teachingContent = teachingContent.replace(
          /(?:\b(?:Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1\s+Samuel|2\s+Samuel|1\s+Kings|2\s+Kings|1\s+Chronicles|2\s+Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Proverbs|Ecclesiastes|Song\s+of\s+Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1\s+Corinthians|2\s+Corinthians|Galatians|Ephesians|Philippians|Colossians|1\s+Thessalonians|2\s+Thessalonians|1\s+Timothy|2\s+Timothy|Titus|Philemon|Hebrews|James|1\s+Peter|2\s+Peter|1\s+John|2\s+John|3\s+John|Jude|Revelation)\b)\s+\d+:\d+(?:\s*-\s*\d+)?/gi,
          (match) => `<span class="bible-reference" style="color: var(--primary-color); text-decoration: underline; cursor: pointer; font-weight: 600;">${match}</span>`
        );
        
        output.innerHTML = teachingContent;
        bindReferenceClickListeners();
      } else {
        output.innerHTML = '⚠️ No teaching found for this date.';
      }
    } catch (error) {
      console.error("Data tracking framework extraction error:", error);
      spinner.style.display = 'none';
      output.style.display = 'block';
      output.innerHTML = "⚠️ Failed to load teaching.";
    }
  }

  // Bind custom link parameters dynamically on render cycles
  function bindReferenceClickListeners() {
    const elements = output.querySelectorAll('.bible-reference');
    elements.forEach(element => {
      element.addEventListener('click', () => {
        showBiblePopup(element.textContent);
      });
    });
  }

  // Popup Framework Interaction Layer
  function showBiblePopup(reference) {
    const overlay = document.createElement('div');
    overlay.className = 'bible-popup-overlay';
    
    const popup = document.createElement('div');
    popup.className = 'bible-popup';

    popup.innerHTML = `
      <button class="bible-popup-close" aria-label="Close popup">&times;</button>
      <h3>${reference}</h3>
      <div class="bible-popup-content">
        <div class="spinner">
          <svg fill="#4CAF50" viewBox="0 0 512 512" width="24" height="24">
            <path d="M256 32C132.3 32 32 132.3 32 256h64c0-88.4 71.6-160 160-160V32z">
              <animateTransform attributeName="transform" type="rotate" from="0 256 256"
                to="360 256 256" dur="1.2s" repeatCount="indefinite" />
            </path>
          </svg>
        </div>
      </div>
    `;

    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    popup.querySelector('.bible-popup-close').addEventListener('click', () => {
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
