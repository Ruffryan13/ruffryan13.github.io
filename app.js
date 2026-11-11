const pages = {
  Passwords: {
    icon: "▣",
    description: "A secure vault for passwords and passkeys.",
    detail: "No passwords are stored by this prototype. A real vault needs audited encryption, protected key handling, and a recovery design before it should hold credentials."
  },
  Email: {
    icon: "✉",
    description: "Bring your inboxes together in one place.",
    detail: "Email is not connected. Connecting a provider requires a supported sign-in flow and the minimum permissions needed for the features you choose."
  },
  Websites: {
    icon: "◎",
    description: "Keep track of your website and its status.",
    detail: "Your public website is listed below. Editing or deploying it needs a connected GitHub workflow; no changes have been made to the site."
  },
  Notes: {
    icon: "▤",
    description: "Write notes that stay in this browser on this device.",
    detail: "Notes are stored locally in this browser and are not encrypted or synced."
  },
  OpenBot: {
    icon: "✳",
    description: "A single place for OpenBot tools and activity.",
    detail: "OpenBot management is not connected to this app. This dashboard does not read or change OpenBot agents, settings, or data."
  },
  "Remote desktop": {
    icon: "▱",
    description: "Connect to your own computers securely.",
    detail: "Remote desktop is not connected. A real connection needs an authenticated remote-access service and explicit device pairing."
  },
  "SSH terminal": {
    icon: "⌘",
    description: "Administer your own servers over SSH.",
    detail: "No SSH session is active. A secure implementation needs a trusted backend or native client and must never expose private keys in browser storage."
  }
};

const pageContent = document.querySelector("#page-content");
const currentSection = document.querySelector("#current-section");
const navButtons = [...document.querySelectorAll(".nav-item")];
const installButton = document.querySelector("#install-button");
let activePage = "Overview";
let selectedNoteId = null;
let deferredInstallPrompt = null;

function setActivePage(name) {
  activePage = name;
  currentSection.textContent = name;
  navButtons.forEach((button) => {
    const active = button.dataset.page === name;
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  if (name === "Overview") renderOverview();
  else if (name === "Notes") renderNotes();
  else renderModule(name);
}

function moduleCard(name, state = "Not connected") {
  const module = pages[name];
  const card = document.createElement("a");
  card.className = "module-card";
  card.href = "#";
  card.setAttribute("aria-label", `${name}: ${state}`);
  card.addEventListener("click", (event) => {
    event.preventDefault();
    setActivePage(name);
  });

  const top = document.createElement("div");
  top.className = "card-top";
  const icon = document.createElement("span");
  icon.className = "module-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = module.icon;
  const badge = document.createElement("span");
  badge.className = `badge${state === "Ready" ? " ready" : ""}`;
  badge.textContent = state;
  top.append(icon, badge);
  const title = document.createElement("h3");
  title.textContent = name;
  const description = document.createElement("p");
  description.textContent = module.description;
  card.append(top, title, description);
  return card;
}

function renderOverview() {
  pageContent.replaceChildren();
  const hero = document.createElement("section");
  hero.className = "hero";
  hero.innerHTML = '<p class="eyebrow">PERSONAL WORKSPACE</p><h1>Your tools, in one place.</h1><p class="subtitle">A cross-device home for your website, notes, email, and connected services. Notes work on this device; the other services need secure connections before they can be used.</p>';
  pageContent.append(hero);

  const heading = document.createElement("div");
  heading.className = "section-heading";
  heading.innerHTML = "<h2>Your workspace</h2><p>Choose an area to open it</p>";
  pageContent.append(heading);

  const grid = document.createElement("div");
  grid.className = "module-grid";
  grid.append(
    moduleCard("Passwords"),
    moduleCard("Email"),
    moduleCard("Websites"),
    moduleCard("Notes", "Ready"),
    moduleCard("OpenBot"),
    moduleCard("Remote desktop"),
    moduleCard("SSH terminal")
  );
  pageContent.append(grid);

  const notice = document.createElement("div");
  notice.className = "notice";
  notice.textContent = "Security note: do not put passwords, recovery codes, or private SSH keys in Notes. Notes are saved unencrypted in this browser on this device.";
  pageContent.append(notice);
}

function renderModule(name) {
  const module = pages[name];
  pageContent.replaceChildren();
  const header = document.createElement("div");
  header.className = "module-head";
  const icon = document.createElement("span");
  icon.className = "module-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = module.icon;
  const copy = document.createElement("div");
  const eyebrow = document.createElement("p");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = "WORKSPACE MODULE";
  const title = document.createElement("h1");
  title.textContent = name;
  const subtitle = document.createElement("p");
  subtitle.className = "subtitle";
  subtitle.textContent = module.description;
  copy.append(eyebrow, title, subtitle);
  header.append(icon, copy);
  pageContent.append(header);

  const panel = document.createElement("section");
  panel.className = "panel";
  const panelTitle = document.createElement("h2");
  panelTitle.textContent = name === "Websites" ? "Your website" : "Connection status";
  const detail = document.createElement("p");
  detail.textContent = module.detail;
  panel.append(panelTitle, detail);

  if (name === "Websites") {
    const link = document.createElement("a");
    link.className = "site-link";
    link.href = "https://ruffryan13.github.io";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Open ruffryan13.github.io ↗";
    panel.append(link);
  }

  const state = document.createElement("div");
  state.className = "integration-state";
  const dot = document.createElement("span");
  dot.className = "status-dot";
  dot.setAttribute("aria-hidden", "true");
  const text = document.createElement("span");
  text.textContent = name === "Websites" ? "Site link available · management not connected" : "Not connected";
  state.append(dot, text);
  panel.append(state);
  pageContent.append(panel);
}

function readNotes() {
  const stored = localStorage.getItem("control-center-notes");
  if (!stored) return [];
  const notes = JSON.parse(stored);
  if (!Array.isArray(notes)) throw new Error("Saved notes have an unexpected format.");
  return notes;
}

function saveNotes(notes) {
  localStorage.setItem("control-center-notes", JSON.stringify(notes));
}

function renderNotes(message = "") {
  pageContent.replaceChildren();
  const eyebrow = document.createElement("p");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = "ON THIS DEVICE";
  const title = document.createElement("h1");
  title.textContent = "Notes";
  const subtitle = document.createElement("p");
  subtitle.className = "subtitle";
  subtitle.textContent = "Notes are saved in this browser only and are not encrypted or synced. Do not store passwords, recovery codes, or other secrets here.";
  pageContent.append(eyebrow, title, subtitle);

  const layout = document.createElement("div");
  layout.className = "note-layout";
  const list = document.createElement("div");
  list.className = "note-list";
  list.setAttribute("aria-label", "Saved notes");
  const editor = document.createElement("form");
  editor.className = "panel note-editor";
  editor.id = "note-form";
  editor.innerHTML = '<input name="title" maxlength="100" placeholder="Note title" aria-label="Note title" required><textarea name="body" maxlength="10000" placeholder="Write a note..." aria-label="Note text"></textarea><p class="form-message" role="status"></p><div class="note-actions"><button class="secondary-button" type="button" id="new-note">New note</button><button class="primary-button" type="submit">Save note</button></div>';

  let notes;
  try {
    notes = readNotes();
  } catch (error) {
    notes = [];
    editor.querySelector(".form-message").textContent = `Could not read saved notes: ${error.message}`;
    editor.querySelector(".form-message").classList.add("error");
  }

  if (selectedNoteId && !notes.some((note) => note.id === selectedNoteId)) selectedNoteId = null;
  if (!selectedNoteId && notes.length) selectedNoteId = notes[0].id;

  if (notes.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-notes";
    empty.textContent = "No notes yet. Create one here; it will stay in this browser on this device.";
    list.append(empty);
  }

  for (const note of notes) {
    const item = document.createElement("button");
    item.type = "button";
    item.classList.toggle("selected", note.id === selectedNoteId);
    const noteTitle = document.createElement("strong");
    noteTitle.textContent = note.title || "Untitled note";
    const noteBody = document.createElement("small");
    noteBody.textContent = note.body || "Empty note";
    item.append(noteTitle, noteBody);
    item.addEventListener("click", () => {
      selectedNoteId = note.id;
      renderNotes();
    });
    list.append(item);
  }

  const selectedNote = notes.find((note) => note.id === selectedNoteId);
  if (selectedNote) {
    editor.elements.title.value = selectedNote.title;
    editor.elements.body.value = selectedNote.body;
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "danger-button";
    removeButton.textContent = "Delete note";
    removeButton.addEventListener("click", () => {
      try {
        saveNotes(notes.filter((note) => note.id !== selectedNoteId));
        selectedNoteId = null;
        renderNotes("Note deleted.");
      } catch (error) {
        showNoteError(editor, `Could not delete note: ${error.message}`);
      }
    });
    editor.querySelector(".note-actions").prepend(removeButton);
  }

  editor.querySelector("#new-note").addEventListener("click", () => {
    selectedNoteId = null;
    renderNotes();
    pageContent.querySelector('[name="title"]').focus();
  });
  editor.addEventListener("submit", (event) => {
    event.preventDefault();
    const titleValue = editor.elements.title.value.trim();
    const bodyValue = editor.elements.body.value;
    if (!titleValue) {
      showNoteError(editor, "Add a title before saving.");
      return;
    }
    try {
      const currentNotes = readNotes();
      const note = { id: selectedNoteId || crypto.randomUUID(), title: titleValue, body: bodyValue, updatedAt: new Date().toISOString() };
      const updated = selectedNoteId
        ? currentNotes.map((item) => item.id === selectedNoteId ? note : item)
        : [note, ...currentNotes];
      saveNotes(updated);
      selectedNoteId = note.id;
      renderNotes("Note saved on this device.");
    } catch (error) {
      showNoteError(editor, `Could not save note: ${error.message}`);
    }
  });

  layout.append(list, editor);
  pageContent.append(layout);
  if (message) {
    const status = pageContent.querySelector(".form-message");
    status.textContent = message;
  }
}

function showNoteError(form, message) {
  const status = form.querySelector(".form-message");
  status.textContent = message;
  status.classList.add("error");
}

navButtons.forEach((button) => {
  button.addEventListener("click", () => setActivePage(button.dataset.page));
});
document.querySelector(".brand").addEventListener("click", (event) => {
  event.preventDefault();
  setActivePage("Overview");
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installButton.hidden = false;
});
installButton.addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installButton.hidden = true;
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js");
  });
}

setActivePage(activePage);
