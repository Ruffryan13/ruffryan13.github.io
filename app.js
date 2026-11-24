const appList = [
  {
    id: "study",
    name: "AI Study Studio",
    category: "learn",
    icon: "✦",
    tagline: "Learn any topic, your way.",
    status: "AI setup needed",
    state: "pending",
    detail: "A Duolingo-like learning space for languages and other subjects: short lessons, practice, and tests tailored to what you want to learn.",
    footnote: "AI lessons and generated tests are not connected in this preview. A secure AI service and your learning preferences will be needed."
  },
  {
    id: "games",
    name: "Browser Games",
    category: "play",
    icon: "▣",
    tagline: "Your games, ready to launch.",
    status: "Game list pending",
    state: "pending",
    detail: "A home for the browser games you choose. Add your list later and the launchpad can be organized around it.",
    footnote: "No games are embedded yet because you said you’ll provide the list later."
  },
  {
    id: "openbot",
    name: "OpenBot Manager",
    category: "tools",
    icon: "◉",
    tagline: "A control room for your bots.",
    status: "OpenBot setup needed",
    state: "pending",
    detail: "A dashboard concept for managing OpenBot agents and their work.",
    footnote: "This preview is not connected to your OpenBot account or agents."
  },
  {
    id: "email",
    name: "Email Manager",
    category: "connect",
    icon: "✉",
    tagline: "Bring your inbox into one view.",
    status: "Email provider needed",
    state: "pending",
    detail: "A focused place to review and organize email.",
    footnote: "No mailbox is connected. Email access would require a provider integration and explicit account authorization."
  },
  {
    id: "notes",
    name: "Notes",
    category: "tools",
    icon: "✎",
    tagline: "Capture a thought before it goes.",
    status: "Local notes ready",
    state: "ready",
    detail: "A quick scratchpad saved only in this browser on this device.",
    footnote: "Notes use this browser’s local storage; they do not sync to an account or cloud."
  },
  {
    id: "calendar",
    name: "Google Calendar",
    category: "connect",
    icon: "▦",
    tagline: "Keep your plans in sight.",
    status: "Google connection needed",
    state: "pending",
    detail: "A calendar panel for upcoming events and a simple view of your schedule.",
    footnote: "No calendar data is available until Google sign-in and authorization are configured."
  },
  {
    id: "remote",
    name: "Remote Desktop",
    category: "tools",
    icon: "▤",
    tagline: "Reach your other computer.",
    status: "Secure host needed",
    state: "pending",
    detail: "A launch point for remote access to a computer you own or are authorized to use.",
    footnote: "Remote control is not enabled. It requires a trusted host, secure sign-in, and your permission."
  },
  {
    id: "vlc",
    name: "VLC in VS Code",
    category: "tools",
    icon: "▶",
    tagline: "Media tools beside your code.",
    status: "Planned",
    state: "pending",
    detail: "Your idea for a music and video player built into VS Code, using VLC.",
    footnote: "A static website cannot control a local VS Code or VLC installation; this needs a desktop extension."
  },
  {
    id: "files",
    name: "File Manager",
    category: "tools",
    icon: "▱",
    tagline: "A tidy view of your files.",
    status: "Browser access limited",
    state: "pending",
    detail: "A file-organizing space designed to work with files you choose to open.",
    footnote: "Web pages cannot browse your device freely. File access must be user-selected and remains limited to the browser."
  },
  {
    id: "search",
    name: "Ad-free Web Search",
    category: "connect",
    icon: "⌕",
    tagline: "Find the useful stuff, skip ads.",
    status: "Provider to choose",
    state: "pending",
    detail: "A search shortcut configured around your preference for results without ads.",
    footnote: "No provider is connected yet, so I can’t promise ad-free results or link to a specific service."
  },
  {
    id: "cloud",
    name: "Cloud",
    category: "connect",
    icon: "☁",
    tagline: "Your online files and projects.",
    status: "Cloud provider needed",
    state: "pending",
    detail: "A landing page for the cloud service you decide to use.",
    footnote: "No cloud account is connected and no files are stored by this preview."
  },
  {
    id: "groups",
    name: "OpenBot Groups",
    category: "connect",
    icon: "♧",
    tagline: "Talk with your OpenBot bots.",
    status: "OpenBot setup needed",
    state: "pending",
    detail: "A group space for conversations with OpenBot bots.",
    footnote: "Group conversations are not connected to OpenBot in this preview."
  },
  {
    id: "ai-notes",
    name: "AI Notes Taker",
    category: "learn",
    icon: "✧",
    tagline: "Turn information into clear notes.",
    status: "AI setup needed",
    state: "pending",
    detail: "A note-taking space that could summarize material and organize key ideas with AI.",
    footnote: "AI processing is not connected. Nothing is sent to an AI service from this preview."
  },
  {
    id: "settings",
    name: "Settings",
    category: "tools",
    icon: "⚙",
    tagline: "Make the space feel like yours.",
    status: "Theme ready",
    state: "ready",
    detail: "Adjust your local display preference and make this workspace feel more like home.",
    footnote: "Settings in this preview are saved only in this browser."
  },
  {
    id: "login",
    name: "Login / Sign up",
    category: "connect",
    icon: "⌑",
    tagline: "A personal account, when ready.",
    status: "Preview only",
    state: "pending",
    detail: "Account screens can be added when you choose how the site should securely store accounts.",
    footnote: "This preview does not collect passwords or create accounts."
  }
];

const grid = document.querySelector("#app-grid");
const searchInput = document.querySelector("#app-search");
const emptyState = document.querySelector("#empty-state");
const dialog = document.querySelector("#app-dialog");
const themeToggle = document.querySelector("#theme-toggle");
let activeFilter = "all";
let toastTimer;

const descriptions = {
  learn: "Learn",
  play: "Play",
  tools: "Tools",
  connect: "Connect",
  all: "Overview"
};

function renderApps() {
  const query = searchInput.value.trim().toLowerCase();
  const visible = appList.filter((app) => {
    const matchesFilter = activeFilter === "all" || app.category === activeFilter;
    const matchesQuery = `${app.name} ${app.tagline} ${app.status}`.toLowerCase().includes(query);
    return matchesFilter && matchesQuery;
  });

  grid.innerHTML = visible.map((app) => `
    <button class="app-card" type="button" data-app="${app.id}" aria-label="Open ${app.name}">
      <span class="card-top">
        <span class="app-icon" aria-hidden="true">${app.icon}</span>
        <span class="card-arrow" aria-hidden="true">↗</span>
      </span>
      <h3>${app.name}</h3>
      <p>${app.tagline}</p>
      <span class="card-status ${app.state}">${app.status}</span>
    </button>
  `).join("");

  document.querySelector("#app-count").textContent = String(visible.length);
  emptyState.hidden = visible.length > 0;
}

function setFilter(filter) {
  activeFilter = filter;
  document.querySelectorAll("[data-filter]").forEach((button) => {
    const selected = button.dataset.filter === filter;
    button.classList.toggle("active", selected && button.classList.contains("nav-item"));
    button.classList.toggle("selected", selected && button.classList.contains("filter-chip"));
    if (button.classList.contains("filter-chip")) button.setAttribute("aria-pressed", String(selected));
  });
  document.querySelector("#crumb-current").textContent = descriptions[filter] || "Overview";
  document.querySelector("#section-title").innerHTML = `${filter === "all" ? "Your launchpad" : descriptions[filter]}<span class="heading-dot">.</span>`;
  renderApps();
}

function openApp(id) {
  const app = appList.find((item) => item.id === id);
  if (!app) return;
  document.querySelector("#dialog-icon").textContent = app.icon;
  document.querySelector("#dialog-kicker").textContent = `${descriptions[app.category].toUpperCase()} SPACE`;
  document.querySelector("#dialog-title").textContent = app.name;
  document.querySelector("#dialog-status").textContent = app.status;
  document.querySelector("#dialog-description").textContent = app.detail;
  document.querySelector("#dialog-footnote").textContent = app.footnote;
  const extra = document.querySelector("#dialog-extra");
  extra.innerHTML = "";

  if (app.id === "notes") {
    const savedNote = localStorage.getItem("ruffryan13-note") || "";
    extra.innerHTML = `
      <div class="module-box">
        <label for="note-text">Your quick note</label>
        <textarea id="note-text" placeholder="Write something you want to remember..."></textarea>
        <button class="button button-primary" id="save-note" type="button">Save on this device</button>
        <p class="local-note">Private to this browser. Clearing site data removes it.</p>
      </div>`;
    extra.querySelector("#note-text").value = savedNote;
    extra.querySelector("#save-note").addEventListener("click", () => {
      localStorage.setItem("ruffryan13-note", extra.querySelector("#note-text").value);
      showToast("Note saved in this browser.");
    });
  } else if (app.id === "study" || app.id === "ai-notes") {
    extra.innerHTML = `
      <div class="module-box">
        <label for="topic-input">${app.id === "study" ? "What would you like to learn?" : "What are your notes about?"}</label>
        <input id="topic-input" type="text" maxlength="120" placeholder="${app.id === "study" ? "e.g. astronomy, French, or fractions" : "e.g. a book, class, or project"}">
        <button class="button button-quiet" id="topic-action" type="button">${app.id === "study" ? "Preview a lesson plan" : "Preview a note outline"}</button>
        <p class="module-output" id="topic-output" aria-live="polite"></p>
        <p class="local-note">This is a simple preview, not AI-generated content.</p>
      </div>`;
    extra.querySelector("#topic-action").addEventListener("click", () => {
      const topic = extra.querySelector("#topic-input").value.trim();
      const output = extra.querySelector("#topic-output");
      output.textContent = topic
        ? `Preview for “${topic}”: start with the basics, try a short practice activity, then check what you remember with a mini-test.`
        : "Type a topic first to preview the lesson structure.";
    });
  } else if (app.id === "settings") {
    extra.innerHTML = `
      <div class="module-box">
        <div class="settings-row"><span>Color theme</span><button class="toggle-button" id="dialog-theme-toggle" type="button"></button></div>
        <p class="local-note">Your theme preference is saved in this browser.</p>
      </div>`;
    const button = extra.querySelector("#dialog-theme-toggle");
    button.textContent = document.documentElement.dataset.theme === "dark" ? "Dark" : "Light";
    button.addEventListener("click", toggleTheme);
  }

  dialog.showModal();
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 2400);
}

function toggleTheme() {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  localStorage.setItem("ruffryan13-theme", next);
  themeToggle.setAttribute("aria-label", `Switch to ${next === "dark" ? "light" : "dark"} theme`);
  themeToggle.textContent = next === "dark" ? "☼" : "☾";
  const dialogButton = document.querySelector("#dialog-theme-toggle");
  if (dialogButton) dialogButton.textContent = next === "dark" ? "Dark" : "Light";
}

function initializeTheme() {
  const stored = localStorage.getItem("ruffryan13-theme");
  if (stored === "dark" || stored === "light") {
    document.documentElement.dataset.theme = stored;
  }
  themeToggle.textContent = document.documentElement.dataset.theme === "dark" ? "☼" : "☾";
  themeToggle.setAttribute("aria-label", `Switch to ${document.documentElement.dataset.theme === "dark" ? "light" : "dark"} theme`);
}

document.addEventListener("click", (event) => {
  const card = event.target.closest("[data-app]");
  if (card) openApp(card.dataset.app);

  const filterButton = event.target.closest("[data-filter]");
  if (filterButton) setFilter(filterButton.dataset.filter);

  const openButton = event.target.closest("[data-open]");
  if (openButton) openApp(openButton.dataset.open);
});

searchInput.addEventListener("input", renderApps);
themeToggle.addEventListener("click", toggleTheme);
document.querySelector("#dialog-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});
document.querySelector("#notification-toggle").addEventListener("click", () => {
  const popover = document.querySelector("#notification-popover");
  popover.hidden = !popover.hidden;
});
document.querySelector("#close-notifications").addEventListener("click", () => {
  document.querySelector("#notification-popover").hidden = true;
});
document.addEventListener("keydown", (event) => {
  if (event.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
    event.preventDefault();
    searchInput.focus();
  }
  if (event.key === "Escape") document.querySelector("#notification-popover").hidden = true;
});

initializeTheme();
renderApps();
