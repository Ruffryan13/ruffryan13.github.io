(() => {
  "use strict";

  const keys = {
    notes: "ruffryan13-notes",
    tasks: "ruffryan13-bot-tasks",
    events: "ruffryan13-calendar-events",
    rooms: "ruffryan13-groups",
    links: "ruffryan13-cloud-links",
    remote: "ruffryan13-remote-hosts",
    study: "ruffryan13-study-progress",
    profile: "ruffryan13-profile",
    settings: "ruffryan13-settings"
  };
  const featureCopy = {
    study: ["Short lessons and quick quizzes.", "Practice runs in this browser; no AI service is connected."],
    openbot: ["A local board for organizing bot tasks.", "This board is saved on this device and does not connect to OpenBot agents."],
    email: ["Import messages and draft mail safely.", "Imported files stay in memory for this session. Nothing is uploaded or sent automatically."],
    notes: ["Create, search, and export your notes.", "Notes are saved in this browser only."],
    calendar: ["Plan events and exchange calendar files.", "Events stay in this browser. Google Calendar sync is not connected."],
    remote: ["Save connection details for a trusted host.", "This web page cannot stream or control another computer. Only connect to systems you own or are authorized to use."],
    vlc: ["Play a local audio or video file here.", "This browser player cannot control VLC or VS Code installed on your computer."],
    files: ["Browse files and folders you choose.", "Selected files remain on your device and are not uploaded."],
    search: ["Search Wikipedia or the wider web.", "Wikipedia search has no ads; web search may include sponsored results."],
    cloud: ["Keep quick links to your cloud drives.", "Links open your provider in a new tab; this site does not access or sync cloud files."],
    groups: ["Keep simple local chat rooms and notes.", "Rooms are private to this browser and are not shared with other people or OpenBot."],
    "ai-notes": ["Summarize text and pull out action items.", "This on-device helper uses simple text rules, not an AI service. Your text stays here."],
    settings: ["Personalize your launchpad and back up local data.", "Preferences and app data are stored only in this browser."],
    login: ["Sign in with the local test account.", "Sign-up is admin-blocked. The test account has no privileges and the static page is not a secure account system."],
    "provider-setup": ["Record provider configuration safely.", "This does not authorize an account or create a live OAuth connection."]
  };
  const cardCopy = {
    study: ["Guided mini-lessons and quizzes.", "Practice ready"],
    openbot: ["Organize tasks in a local board.", "Local board"],
    email: ["Import .eml files or draft mail.", "Import ready"],
    notes: ["Create and search private local notes.", "Local notes"],
    calendar: ["Plan events; import or export .ics.", "Local calendar"],
    remote: ["Save details for an authorized host.", "Setup only", "pending"],
    vlc: ["Play selected media in this browser.", "Browser player"],
    files: ["Browse files you select on this device.", "Browser files"],
    search: ["Search Wikipedia or the wider web.", "Search ready"],
    cloud: ["Open your own cloud drive links.", "Link shortcuts", "pending"],
    groups: ["Use private rooms saved on this device.", "Local rooms"],
    "ai-notes": ["Summarize text and extract action items.", "Local helper"],
    settings: ["Theme, motion, profile, and backups.", "Settings ready"],
    login: ["Sign in to the test account.", "Test login", "pending"],
    "provider-setup": ["Add non-secret connection settings.", "Setup available", "pending"]
  };
  const dialogStatuses = {
    study: ["Practice ready", "local-ready"],
    openbot: ["Local board", "local-ready"],
    email: ["Import and draft tools", "local-ready"],
    notes: ["Local notes ready", "local-ready"],
    calendar: ["Local planner", "local-ready"],
    remote: ["Setup notes only", "setup-only"],
    vlc: ["Browser player", "local-ready"],
    files: ["Selected-file access", "local-ready"],
    search: ["Search shortcuts", "local-ready"],
    cloud: ["Shortcuts only", "setup-only"],
    groups: ["Local rooms", "local-ready"],
    "ai-notes": ["Local text helper", "local-ready"],
    settings: ["Settings available", "local-ready"],
    login: ["Test account", "setup-only"],
    "provider-setup": ["Setup guide", "setup-only"]
  };
  const dialog = document.querySelector("#app-dialog");
  const extra = document.querySelector("#dialog-extra");
  const reportedStorageIssues = new Set();
  const mediaUrls = new Set();
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let emailItems = [];
  let activeEmail = null;
  let activeRoom = null;

  function notify(message) {
    const toast = document.querySelector("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("visible");
    window.clearTimeout(notify.timer);
    notify.timer = window.setTimeout(() => toast.classList.remove("visible"), 3000);
  }

  function readArray(key) {
    const value = readData(key, []);
    if (Array.isArray(value)) return value.filter((item) => item && typeof item === "object" && !Array.isArray(item));
    if (!reportedStorageIssues.has(key)) {
      reportedStorageIssues.add(key);
      notify("Saved app data has an unexpected format and was not loaded.");
    }
    return [];
  }

  function readData(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch (error) {
      if (!reportedStorageIssues.has(key)) {
        reportedStorageIssues.add(key);
        notify("Saved data could not be read. Check browser storage before clearing site data.");
      }
      return fallback;
    }
  }

  function writeData(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      notify("Could not save in this browser. Its storage may be full or unavailable.");
      return false;
    }
  }

  function makeId() {
    return globalThis.crypto?.randomUUID?.()
      || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function makeButton(text, className = "button button-quiet", action = "") {
    const button = element("button", className, text);
    button.type = "button";
    if (action) button.dataset.featureAction = action;
    return button;
  }

  function makeLink(text, href, className = "button button-quiet") {
    const link = element("a", className, text);
    try {
      const url = new URL(href);
      if (url.protocol !== "https:" || url.username || url.password) throw new Error("Unsupported link.");
      link.href = url.href;
    } catch (error) {
      link.setAttribute("aria-disabled", "true");
      link.classList.add("disabled-link");
      return link;
    }
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    return link;
  }

  function downloadFile(name, contents, type) {
    const url = URL.createObjectURL(new Blob([contents], { type }));
    const link = element("a");
    link.href = url;
    link.download = name;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function moduleBox(title, intro) {
    const box = element("section", "module-box feature-module");
    box.append(element("h3", "feature-heading", title), element("p", "feature-intro", intro));
    return box;
  }

  function addField(parent, labelText, input, id) {
    const label = element("label", "", labelText);
    label.htmlFor = id;
    input.id = id;
    parent.append(label, input);
    return input;
  }

  function enhanceCards() {
    for (const [id, copy] of Object.entries(cardCopy)) {
      const card = document.querySelector(`[data-app="${id}"]`);
      if (!card) continue;
      const description = card.querySelector("p");
      const status = card.querySelector(".card-status");
      if (description) description.textContent = copy[0];
      if (status) {
        status.textContent = copy[1];
        status.className = `card-status ${copy[2] || "ready"}`;
      }
    }
  }

  function updateProfileName(name) {
    const safeName = name.trim().slice(0, 40);
    const profile = document.querySelector(".profile-chip strong");
    if (profile) profile.textContent = safeName || "Ruffryan13";
  }

  function updateSignedInState() {
    const signedIn = window.R13Auth?.isSignedIn?.() || false;
    const profile = document.querySelector(".profile-chip strong");
    const userButton = document.querySelector(".user-button");
    if (profile) profile.textContent = signedIn ? "Ruffryan13" : "Ruffryan13";
    if (userButton) {
      const label = userButton.querySelector("span:nth-child(2)");
      if (label) label.textContent = signedIn ? "Signed in" : "Sign in";
      userButton.setAttribute("aria-label", signedIn ? "Ruffryan13 test account signed in" : "Sign in");
    }
  }

  function mountStudy() {
    const box = moduleBox("Choose a short lesson", "Pick a topic, learn one useful idea, then try a quick question.");
    const tracks = [
      { id: "fractions", name: "Fractions", lesson: "A fraction is a part of a whole. The numerator counts the parts you have; the denominator counts equal parts in the whole.", question: "What is 3/4 of 20?", choices: ["5", "15", "17"], answer: "15", explain: "20 divided into 4 equal groups is 5 per group; 3 groups make 15." },
      { id: "percent", name: "Percentages", lesson: "Percent means “out of 100.” To find 10% of a number, divide it by 10.", question: "What is 10% of 70?", choices: ["7", "10", "17"], answer: "7", explain: "70 divided by 10 is 7." },
      { id: "space", name: "The Solar System", lesson: "Planets orbit the Sun. Earth is the third planet from the Sun, and Mars is the fourth.", question: "Which planet is known as the Red Planet?", choices: ["Venus", "Mars", "Jupiter"], answer: "Mars", explain: "Iron-rich dust gives Mars its reddish appearance." },
      { id: "writing", name: "Clear writing", lesson: "A strong paragraph develops one main idea with a clear topic sentence, supporting details, and a closing thought.", question: "What should a topic sentence do?", choices: ["Introduce the paragraph’s main idea", "Repeat every detail", "Add an unrelated fact"], answer: "Introduce the paragraph’s main idea", explain: "The topic sentence helps the reader understand what the paragraph is about." }
    ];
    const select = element("select");
    for (const track of tracks) select.add(new Option(track.name, track.id));
    const start = makeButton("Start lesson", "button button-primary");
    const lesson = element("div", "study-lesson");
    lesson.setAttribute("aria-live", "polite");
    const progress = element("p", "local-note", "Your progress is saved only on this device.");
    const savedProgress = readData("ruffryan13-study-progress", { xp: 0, completed: [] });
    const score = element("p", "study-score", `Practice points: ${Number(savedProgress.xp) || 0}`);
    const selectionLabel = element("label", "", "Lesson");
    selectionLabel.htmlFor = "study-track";
    select.id = "study-track";
    box.append(selectionLabel, select, start, lesson, score, progress);

    start.addEventListener("click", () => {
      const track = tracks.find((item) => item.id === select.value);
      if (!track) return;
      lesson.replaceChildren();
      lesson.append(element("h4", "", track.name), element("p", "", track.lesson), element("p", "study-question", track.question));
      const choices = element("div", "study-choices");
      for (const choice of track.choices) {
        const answer = makeButton(choice, "study-choice");
        answer.addEventListener("click", () => {
          if (choices.dataset.answered === "true") return;
          choices.dataset.answered = "true";
          const correct = choice === track.answer;
          answer.classList.add(correct ? "correct" : "incorrect");
          if (!correct) {
            for (const item of choices.children) {
              if (item.textContent === track.answer) item.classList.add("correct");
            }
          }
          lesson.append(element("p", correct ? "study-feedback success" : "study-feedback", `${correct ? "Correct. " : "Not quite. "}${track.explain}`));
          if (correct) {
            const latest = readData("ruffryan13-study-progress", { xp: 0, completed: [] });
            latest.xp = (Number(latest.xp) || 0) + 10;
            latest.completed = [...new Set([...(Array.isArray(latest.completed) ? latest.completed : []), track.id])];
            if (writeData("ruffryan13-study-progress", latest)) score.textContent = `Practice points: ${latest.xp}`;
          }
        });
        choices.append(answer);
      }
      lesson.append(choices);
    });
    extra.append(box);
  }

  function mountTasks() {
    const tasks = readArray(keys.tasks);
    const box = moduleBox("Local task board", "Track work you plan to do with your bots. This does not control connected agents.");
    const form = element("form", "feature-form");
    const title = element("input");
    title.type = "text";
    title.maxLength = 100;
    title.required = true;
    title.placeholder = "Task name";
    addField(form, "New task", title, "bot-task-title");
    const description = element("textarea");
    description.rows = 2;
    description.maxLength = 500;
    description.placeholder = "Optional details";
    addField(form, "Details", description, "bot-task-details");
    const submit = element("button", "button button-primary", "Add task");
    submit.type = "submit";
    form.append(submit);
    const list = element("div", "feature-list");
    box.append(form, list);

    const render = () => {
      list.replaceChildren();
      if (!tasks.length) {
        list.append(element("p", "empty-module", "No tasks yet. Add one to start your board."));
        return;
      }
      for (const task of tasks) {
        const row = element("article", "feature-row task-row");
        const copy = element("div", "feature-row-copy");
        copy.append(element("strong", "", task.title || "Untitled task"));
        if (task.description) copy.append(element("p", "", task.description));
        const controls = element("div", "feature-row-actions");
        const status = element("select");
        for (const option of ["To do", "In progress", "Done"]) status.add(new Option(option, option));
        status.value = ["To do", "In progress", "Done"].includes(task.status) ? task.status : "To do";
        status.setAttribute("aria-label", `Status for ${task.title || "task"}`);
        status.addEventListener("change", () => {
          task.status = status.value;
          writeData(keys.tasks, tasks);
        });
        const remove = makeButton("Remove", "small-control");
        remove.addEventListener("click", () => {
          const index = tasks.findIndex((item) => item.id === task.id);
          if (index >= 0) tasks.splice(index, 1);
          writeData(keys.tasks, tasks);
          render();
        });
        controls.append(status, remove);
        row.append(copy, controls);
        list.append(row);
      }
    };
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      tasks.unshift({ id: makeId(), title: title.value.trim(), description: description.value.trim(), status: "To do" });
      if (writeData(keys.tasks, tasks)) {
        form.reset();
        render();
        notify("Task added to this device’s board.");
      }
    });
    render();
    extra.append(box);
  }

  function parseEmailFile(file, contents) {
    const normalized = contents.replace(/\r\n/g, "\n").replace(/\n[ \t]+/g, " ");
    const splitAt = normalized.indexOf("\n\n");
    const headers = splitAt < 0 ? normalized : normalized.slice(0, splitAt);
    const fullBody = splitAt < 0 ? "" : normalized.slice(splitAt + 2);
    const getHeader = (name) => {
      const match = headers.match(new RegExp(`^${name}:\\s*(.*)$`, "im"));
      return match ? match[1].trim() : "";
    };
    return {
      id: makeId(),
      fileName: file.name,
      from: getHeader("From") || "Unknown sender",
      subject: getHeader("Subject") || file.name,
      date: getHeader("Date"),
      body: fullBody.slice(0, 12000),
      truncated: fullBody.length > 12000
    };
  }

  function mountEmail() {
    emailItems = [];
    activeEmail = null;
    const box = moduleBox("Private, local inbox tools", "Import .eml files you choose, or compose a draft in your default mail app. Plain-text previews do not decode attachments.");
    const fileInput = element("input");
    fileInput.type = "file";
    fileInput.accept = ".eml,message/rfc822,text/plain";
    fileInput.multiple = true;
    addField(box, "Import message files", fileInput, "email-import");
    const compose = element("form", "feature-form compose-form");
    const to = element("input");
    to.type = "email";
    to.required = true;
    to.placeholder = "recipient@example.com";
    addField(compose, "To", to, "email-to");
    const subject = element("input");
    subject.type = "text";
    subject.maxLength = 120;
    addField(compose, "Subject", subject, "email-subject");
    const body = element("textarea");
    body.rows = 3;
    body.maxLength = 3000;
    addField(compose, "Message", body, "email-body");
    const draft = element("button", "button button-primary", "Open draft in mail app");
    draft.type = "submit";
    compose.append(draft);
    const layout = element("div", "email-layout");
    const list = element("div", "email-list feature-list");
    const preview = element("article", "email-preview");
    preview.append(element("p", "empty-module", "Import a message to preview it here."));
    layout.append(list, preview);
    box.append(compose, layout);

    const render = () => {
      list.replaceChildren();
      if (!emailItems.length) list.append(element("p", "empty-module", "No imported messages in this session."));
      for (const item of emailItems) {
        const button = makeButton(`${item.subject} — ${item.from}`, "email-item");
        button.classList.toggle("selected", item.id === activeEmail);
        button.addEventListener("click", () => {
          activeEmail = item.id;
          const selected = emailItems.find((message) => message.id === activeEmail);
          preview.replaceChildren(
            element("h4", "", selected.subject),
            element("p", "email-meta", `From: ${selected.from}`),
            ...(selected.date ? [element("p", "email-meta", `Date: ${selected.date}`)] : []),
            element("pre", "email-body-preview", selected.body || "This message has no plain-text body."),
            ...(selected.truncated ? [element("p", "local-note", "Preview is limited to the first 12,000 characters.")] : [])
          );
          const archive = makeButton("Remove from this session", "small-control");
          archive.addEventListener("click", () => {
            emailItems = emailItems.filter((message) => message.id !== selected.id);
            activeEmail = null;
            render();
          });
          preview.append(archive);
          render();
        });
        list.append(button);
      }
    };
    fileInput.addEventListener("change", async () => {
      for (const file of fileInput.files || []) {
        if (file.size > 5 * 1024 * 1024) {
          notify(`${file.name} is larger than the 5 MB import limit.`);
          continue;
        }
        try {
          emailItems.push(parseEmailFile(file, await file.text()));
        } catch (error) {
          notify(`Could not read ${file.name}.`);
        }
      }
      render();
    });
    compose.addEventListener("submit", (event) => {
      event.preventDefault();
      const address = to.value.trim();
      const query = new URLSearchParams({ subject: subject.value, body: body.value });
      const link = document.createElement("a");
      link.href = `mailto:${encodeURIComponent(address)}?${query}`;
      link.click();
    });
    extra.append(box);
    render();
  }

  function getNotes() {
    const saved = readData(keys.notes, null);
    if (Array.isArray(saved)) return saved.filter((note) => note && typeof note === "object" && !Array.isArray(note));
    let oldNote;
    try {
      oldNote = localStorage.getItem("ruffryan13-note");
    } catch (error) {
      notify("Could not read the previous quick note from this browser.");
      return [];
    }
    if (!oldNote) return [];
    const migrated = [{ id: makeId(), title: "Quick note", text: oldNote, updatedAt: new Date().toISOString() }];
    writeData(keys.notes, migrated);
    return migrated;
  }

  function mountNotes() {
    let notes = getNotes();
    let selectedId = notes[0]?.id || null;
    const box = moduleBox("Notes on this device", "Search, create, edit, and export notes. Content never leaves this browser.");
    const toolbar = element("div", "feature-toolbar");
    const search = element("input");
    search.type = "search";
    search.placeholder = "Search notes";
    search.setAttribute("aria-label", "Search notes");
    const create = makeButton("New note", "button button-primary");
    toolbar.append(search, create);
    const layout = element("div", "notes-layout");
    const list = element("div", "notes-list");
    const editor = element("form", "feature-form note-editor");
    const title = element("input");
    title.maxLength = 120;
    title.required = true;
    addField(editor, "Title", title, "note-title");
    const content = element("textarea");
    content.rows = 8;
    content.maxLength = 20000;
    addField(editor, "Note", content, "note-content");
    const actions = element("div", "feature-toolbar");
    const save = element("button", "button button-primary", "Save note");
    save.type = "submit";
    const exportButton = makeButton("Export text", "small-control");
    const deleteButton = makeButton("Delete note", "small-control");
    actions.append(save, exportButton, deleteButton);
    editor.append(actions);
    layout.append(list, editor);
    box.append(toolbar, layout);

    const selectNote = (note) => {
      selectedId = note?.id || null;
      title.value = note?.title || "";
      content.value = note?.text || "";
      deleteButton.disabled = !note;
      exportButton.disabled = !note;
      renderList();
    };
    const renderList = () => {
      list.replaceChildren();
      const query = search.value.trim().toLowerCase();
      const visible = notes.filter((note) => `${note.title} ${note.text}`.toLowerCase().includes(query));
      if (!visible.length) list.append(element("p", "empty-module", notes.length ? "No notes match this search." : "No notes yet. Create your first one."));
      for (const note of visible) {
        const button = makeButton(note.title || "Untitled note", "note-item");
        button.classList.toggle("selected", note.id === selectedId);
        button.addEventListener("click", () => selectNote(note));
        list.append(button);
      }
    };
    create.addEventListener("click", () => {
      const note = { id: makeId(), title: "Untitled note", text: "", updatedAt: new Date().toISOString() };
      notes.unshift(note);
      selectNote(note);
      renderList();
      title.focus();
    });
    search.addEventListener("input", renderList);
    editor.addEventListener("submit", (event) => {
      event.preventDefault();
      let note = notes.find((item) => item.id === selectedId);
      if (!note) {
        note = { id: makeId() };
        notes.unshift(note);
        selectedId = note.id;
      }
      note.title = title.value.trim();
      note.text = content.value;
      note.updatedAt = new Date().toISOString();
      if (writeData(keys.notes, notes)) {
        renderList();
        notify("Note saved on this device.");
      }
    });
    deleteButton.addEventListener("click", () => {
      if (!selectedId || !window.confirm("Delete this note from this browser?")) return;
      notes = notes.filter((note) => note.id !== selectedId);
      writeData(keys.notes, notes);
      selectNote(notes[0] || null);
      renderList();
    });
    exportButton.addEventListener("click", () => {
      const note = notes.find((item) => item.id === selectedId);
      if (note) downloadFile(`${(note.title || "note").replace(/[^\w.-]+/g, "-")}.txt`, `${note.title}\n\n${note.text}`, "text/plain");
    });
    selectNote(notes[0] || null);
    extra.append(box);
  }

  function formatEventTime(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Time not set" : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
  }

  function escapeIcs(value) {
    return String(value || "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  }

  function icsDate(value) {
    return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  }

  function parseIcsDate(value, timeZone = "") {
    const compact = value.replace(/Z$/, "");
    const match = compact.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?)?$/);
    if (!match) return null;
    const [, year, month, day, hour = "09", minute = "00", second = "00"] = match;
    const targetUtc = Date.UTC(+year, +month - 1, +day, +hour, +minute, +second);
    if (value.endsWith("Z")) return new Date(targetUtc).toISOString();
    if (timeZone) {
      try {
        const formatter = new Intl.DateTimeFormat("en-US", {
          timeZone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hourCycle: "h23"
        });
        let timestamp = targetUtc;
        for (let attempt = 0; attempt < 2; attempt += 1) {
          const parts = Object.fromEntries(formatter.formatToParts(new Date(timestamp)).map((part) => [part.type, part.value]));
          const observedUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
          timestamp += targetUtc - observedUtc;
        }
        return new Date(timestamp).toISOString();
      } catch (error) {
        return null;
      }
    }
    const date = new Date(+year, +month - 1, +day, +hour, +minute, +second);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  async function importCalendarFile(file, events) {
    if (file.size > 2 * 1024 * 1024) throw new Error("Calendar file is larger than 2 MB.");
    const text = (await file.text()).replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
    const blocks = text.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || [];
    let imported = 0;
    for (const block of blocks) {
      const field = (name) => {
        const match = block.match(new RegExp(`^${name}((?:;[^:]*)?):(.*)$`, "im"));
        return match
          ? {
            params: match[1],
            value: match[2].replace(/\\n/g, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";")
          }
          : { params: "", value: "" };
      };
      const startField = field("DTSTART");
      const timeZone = startField.params.match(/(?:^|;)TZID=([^;]+)/i)?.[1] || "";
      const start = parseIcsDate(startField.value, timeZone);
      if (!start) continue;
      events.push({
        id: makeId(),
        title: field("SUMMARY").value || "Imported event",
        start,
        details: field("DESCRIPTION").value
      });
      imported += 1;
    }
    if (!imported) throw new Error("No valid events were found in this calendar file.");
    return imported;
  }

  function mountCalendar() {
    let events = readArray(keys.events)
      .filter((item) => typeof item.start === "string" && !Number.isNaN(new Date(item.start).getTime()));
    const box = moduleBox("Calendar planner", "Add local events, import .ics files, or export a calendar to use elsewhere.");
    const form = element("form", "feature-form calendar-form");
    const title = element("input");
    title.type = "text";
    title.required = true;
    title.maxLength = 120;
    addField(form, "Event", title, "calendar-title");
    const start = element("input");
    start.type = "datetime-local";
    start.required = true;
    addField(form, "Date and time", start, "calendar-start");
    const details = element("textarea");
    details.rows = 2;
    details.maxLength = 500;
    addField(form, "Details", details, "calendar-details");
    const add = element("button", "button button-primary", "Add event");
    add.type = "submit";
    form.append(add);
    const controls = element("div", "feature-toolbar");
    const importInput = element("input");
    importInput.type = "file";
    importInput.accept = ".ics,text/calendar";
    importInput.setAttribute("aria-label", "Import calendar file");
    const exportButton = makeButton("Export .ics", "button button-quiet");
    const google = makeLink("Open Google Calendar", "https://calendar.google.com/");
    controls.append(importInput, exportButton, google);
    const list = element("div", "feature-list");
    box.append(form, controls, list);

    const render = () => {
      list.replaceChildren();
      const sorted = events.slice().sort((a, b) => new Date(a.start) - new Date(b.start));
      if (!sorted.length) list.append(element("p", "empty-module", "No events yet."));
      for (const item of sorted) {
        const row = element("article", "feature-row");
        const copy = element("div", "feature-row-copy");
        copy.append(element("strong", "", item.title || "Untitled event"), element("p", "", formatEventTime(item.start)));
        if (item.details) copy.append(element("p", "", item.details));
        const remove = makeButton("Remove", "small-control");
        remove.addEventListener("click", () => {
          events = events.filter((event) => event.id !== item.id);
          writeData(keys.events, events);
          render();
        });
        row.append(copy, remove);
        list.append(row);
      }
    };
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const startDate = new Date(start.value);
      if (Number.isNaN(startDate.getTime())) {
        notify("Choose a valid date and time.");
        return;
      }
      events.push({ id: makeId(), title: title.value.trim(), start: startDate.toISOString(), details: details.value.trim() });
      if (writeData(keys.events, events)) {
        form.reset();
        render();
        notify("Event saved in this browser.");
      }
    });
    importInput.addEventListener("change", async () => {
      const file = importInput.files?.[0];
      if (!file) return;
      try {
        const imported = await importCalendarFile(file, events);
        if (writeData(keys.events, events)) {
          render();
          notify(`${imported} calendar event${imported === 1 ? "" : "s"} imported.`);
        }
      } catch (error) {
        notify("Could not read that calendar file.");
      }
    });
    exportButton.addEventListener("click", () => {
      const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Ruffryan13//Local Calendar//EN"];
      for (const item of events) {
        lines.push("BEGIN:VEVENT", `UID:${item.id}@ruffryan13.local`, `DTSTAMP:${icsDate(new Date().toISOString())}`, `DTSTART:${icsDate(item.start)}`, `SUMMARY:${escapeIcs(item.title)}`);
        if (item.details) lines.push(`DESCRIPTION:${escapeIcs(item.details)}`);
        lines.push("END:VEVENT");
      }
      lines.push("END:VCALENDAR");
      downloadFile("ruffryan13-calendar.ics", lines.join("\r\n"), "text/calendar");
    });
    render();
    extra.append(box);
  }

  function mountRemote() {
    let hosts = readArray(keys.remote);
    const box = moduleBox("Trusted host setup", "Save a computer name and setup notes for your own remote-access client.");
    const form = element("form", "feature-form");
    const name = element("input");
    name.type = "text";
    name.required = true;
    name.maxLength = 80;
    name.placeholder = "Home desktop";
    addField(form, "Connection name", name, "remote-name");
    const address = element("input");
    address.type = "text";
    address.required = true;
    address.maxLength = 200;
    address.placeholder = "Computer name or address";
    addField(form, "Authorized computer", address, "remote-address");
    const note = element("textarea");
    note.rows = 2;
    note.maxLength = 500;
    note.placeholder = "Optional setup notes";
    addField(form, "Notes", note, "remote-notes");
    const add = element("button", "button button-primary", "Save connection notes");
    add.type = "submit";
    form.append(add);
    const list = element("div", "feature-list");
    box.append(form, list);
    const render = () => {
      list.replaceChildren();
      if (!hosts.length) list.append(element("p", "empty-module", "No host details saved."));
      for (const host of hosts) {
        const row = element("article", "feature-row");
        const copy = element("div", "feature-row-copy");
        copy.append(element("strong", "", host.name), element("p", "", host.address));
        if (host.note) copy.append(element("p", "", host.note));
        const remove = makeButton("Remove", "small-control");
        remove.addEventListener("click", () => {
          hosts = hosts.filter((entry) => entry.id !== host.id);
          writeData(keys.remote, hosts);
          render();
        });
        row.append(copy, remove);
        list.append(row);
      }
    };
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      hosts.unshift({ id: makeId(), name: name.value.trim(), address: address.value.trim(), note: note.value.trim() });
      if (writeData(keys.remote, hosts)) {
        form.reset();
        render();
        notify("Connection notes saved locally.");
      }
    });
    extra.append(box);
    render();
  }

  function mountMedia() {
    const box = moduleBox("Browser media player", "Choose an audio or video file from your device to play it here.");
    const input = element("input");
    input.type = "file";
    input.accept = "audio/*,video/*";
    addField(box, "Choose media", input, "media-file");
    const player = element("div", "media-stage");
    const hint = element("p", "empty-module", "Your media stays on this device.");
    player.append(hint);
    box.append(player);
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) return;
      for (const url of mediaUrls) URL.revokeObjectURL(url);
      mediaUrls.clear();
      player.replaceChildren();
      const url = URL.createObjectURL(file);
      mediaUrls.add(url);
      const media = document.createElement(file.type.startsWith("video/") ? "video" : "audio");
      media.controls = true;
      media.preload = "metadata";
      media.src = url;
      media.addEventListener("error", () => notify("This browser cannot play that media format."));
      player.append(media, element("p", "local-note", `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB`));
    });
    extra.append(box);
  }

  function mountFiles() {
    const box = moduleBox("Choose files to browse", "Select files or a folder. The browser does not upload or keep them after this session.");
    const picker = element("input");
    picker.type = "file";
    picker.multiple = true;
    addField(box, "Select files", picker, "file-picker");
    const folderPicker = element("input");
    folderPicker.type = "file";
    folderPicker.multiple = true;
    folderPicker.setAttribute("webkitdirectory", "");
    folderPicker.setAttribute("directory", "");
    addField(box, "Select a folder", folderPicker, "folder-picker");
    const search = element("input");
    search.type = "search";
    search.placeholder = "Filter selected files";
    search.setAttribute("aria-label", "Filter selected files");
    const layout = element("div", "files-layout");
    const list = element("div", "files-list");
    const preview = element("div", "file-preview");
    preview.append(element("p", "empty-module", "Choose a file to preview it."));
    box.append(search, layout);
    layout.append(list, preview);
    let files = [];
    const render = () => {
      list.replaceChildren();
      const query = search.value.trim().toLowerCase();
      const visible = files.filter((file) => file.name.toLowerCase().includes(query));
      if (!visible.length) list.append(element("p", "empty-module", files.length ? "No selected files match." : "No files selected."));
      for (const file of visible) {
        const button = makeButton(`${file.webkitRelativePath || file.name} · ${(file.size / 1024).toFixed(0)} KB`, "file-item");
        button.addEventListener("click", async () => {
          preview.replaceChildren(element("h4", "", file.name));
          const type = file.type || "";
          if (type.startsWith("image/")) {
            const imageUrl = URL.createObjectURL(file);
            mediaUrls.add(imageUrl);
            const image = element("img", "file-image-preview");
            image.src = imageUrl;
            image.alt = file.name;
            preview.append(image);
          } else if (type.startsWith("text/") || /\.(txt|md|json|csv|html|css|js|xml|log|eml)$/i.test(file.name)) {
            try {
              const content = await file.slice(0, 200000).text();
              preview.append(element("pre", "file-text-preview", content));
              if (file.size > 200000) preview.append(element("p", "local-note", "Text preview is limited to the first 200 KB."));
            } catch (error) {
              preview.append(element("p", "empty-module", "Could not read this file."));
            }
          } else {
            const open = makeButton("Open selected file", "button button-quiet");
            open.addEventListener("click", () => {
              const url = URL.createObjectURL(file);
              mediaUrls.add(url);
              window.open(url, "_blank", "noopener");
            });
            preview.append(element("p", "local-note", `${type || "Unknown file type"} · ${(file.size / 1024).toFixed(0)} KB`), open);
          }
        });
        list.append(button);
      }
    };
    picker.addEventListener("change", () => {
      files = Array.from(picker.files || []);
      render();
    });
    folderPicker.addEventListener("change", () => {
      files = Array.from(folderPicker.files || []);
      render();
    });
    search.addEventListener("input", render);
    extra.append(box);
  }

  function mountSearch() {
    const box = moduleBox("Search shortcuts", "Search encyclopedia articles or the wider web. Results open in a new tab.");
    const form = element("form", "feature-form");
    const input = element("input");
    input.type = "search";
    input.required = true;
    input.maxLength = 200;
    input.placeholder = "What are you looking for?";
    addField(form, "Search", input, "web-query");
    const actions = element("div", "feature-toolbar");
    const wiki = element("button", "button button-primary", "Search Wikipedia");
    wiki.type = "submit";
    wiki.dataset.searchProvider = "wiki";
    const web = element("button", "button button-quiet", "Search the web");
    web.type = "submit";
    web.dataset.searchProvider = "web";
    actions.append(wiki, web);
    form.append(actions);
    box.append(form, element("p", "local-note", "Wikipedia search is ad-free. Web search may show sponsored results."));
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const query = input.value.trim();
      if (!query) return;
      const provider = event.submitter?.dataset.searchProvider;
      const base = provider === "wiki"
        ? "https://en.wikipedia.org/w/index.php?search="
        : "https://html.duckduckgo.com/html/?q=";
      window.open(`${base}${encodeURIComponent(query)}`, "_blank", "noopener,noreferrer");
    });
    extra.append(box);
  }

  function mountCloud() {
    let links = readArray(keys.links);
    const box = moduleBox("Cloud drive shortcuts", "Save secure web links to cloud services you already use. No passwords are saved here.");
    const form = element("form", "feature-form");
    const name = element("input");
    name.type = "text";
    name.required = true;
    name.maxLength = 80;
    name.placeholder = "Drive name";
    addField(form, "Name", name, "cloud-name");
    const urlInput = element("input");
    urlInput.type = "url";
    urlInput.required = true;
    urlInput.placeholder = "https://…";
    addField(form, "HTTPS link", urlInput, "cloud-url");
    const add = element("button", "button button-primary", "Save link");
    add.type = "submit";
    form.append(add);
    const list = element("div", "feature-list");
    box.append(form, list);
    const render = () => {
      list.replaceChildren();
      if (!links.length) list.append(element("p", "empty-module", "No cloud links saved."));
      for (const item of links) {
        const row = element("article", "feature-row");
        const copy = element("div", "feature-row-copy");
        copy.append(element("strong", "", item.name));
        const open = makeLink("Open", item.url, "small-control");
        const remove = makeButton("Remove", "small-control");
        remove.addEventListener("click", () => {
          links = links.filter((link) => link.id !== item.id);
          writeData(keys.links, links);
          render();
        });
        row.append(copy, open, remove);
        list.append(row);
      }
    };
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      let url;
      try {
        url = new URL(urlInput.value);
      } catch (error) {
        notify("Enter a valid HTTPS link.");
        return;
      }
      if (url.protocol !== "https:") {
        notify("For safety, cloud shortcuts must use HTTPS.");
        return;
      }
      if (url.username || url.password) {
        notify("Remove any username or password from the link and sign in at the provider instead.");
        return;
      }
      links.unshift({ id: makeId(), name: name.value.trim(), url: url.href });
      if (writeData(keys.links, links)) {
        form.reset();
        render();
        notify("Cloud shortcut saved on this device.");
      }
    });
    render();
    extra.append(box);
  }

  function mountProviderSetup() {
    const saved = readData("ruffryan13-provider-config", {});
    const box = moduleBox("Connection setup", "Add the public configuration a provider needs. This is a preparation checklist, not a live sign-in.");
    const form = element("form", "feature-form provider-setup-form");
    const provider = element("select");
    ["Google Calendar / Gmail", "Google Drive", "Dropbox", "OneDrive", "Slack", "Notion", "Other"].forEach((name) => provider.add(new Option(name, name)));
    provider.value = saved.provider || "Google Calendar / Gmail";
    addField(form, "Provider", provider, "provider-name");
    const clientId = element("input");
    clientId.type = "text";
    clientId.autocomplete = "off";
    clientId.placeholder = "Public OAuth client ID (optional)";
    clientId.value = saved.clientId || "";
    addField(form, "OAuth client ID", clientId, "provider-client-id");
    const redirect = element("input");
    redirect.type = "url";
    redirect.placeholder = "https://your-domain.example/oauth/callback";
    redirect.value = saved.redirect || "";
    addField(form, "Authorized redirect URL", redirect, "provider-redirect");
    const scopes = element("textarea");
    scopes.rows = 3;
    scopes.placeholder = "One permission scope per line, for example: https://www.googleapis.com/auth/calendar.readonly";
    scopes.value = Array.isArray(saved.scopes) ? saved.scopes.join("\n") : "";
    addField(form, "Requested scopes", scopes, "provider-scopes");
    const endpoint = element("input");
    endpoint.type = "url";
    endpoint.placeholder = "https://api.your-service.example (optional)";
    endpoint.value = saved.endpoint || "";
    addField(form, "Backend endpoint", endpoint, "provider-endpoint");
    const save = element("button", "button button-primary", "Save setup notes");
    save.type = "submit";
    form.append(save);
    const savedNote = element("p", "local-note", "Nothing here signs you in. Never enter a password, client secret, API key, or access token.");
    box.append(form, savedNote);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const redirectValue = redirect.value.trim();
      if (redirectValue) {
        try {
          const parsed = new URL(redirectValue);
          if (parsed.protocol !== "https:") throw new Error("HTTPS required");
        } catch (error) {
          notify("Use an HTTPS redirect URL, or leave it blank for now.");
          redirect.focus();
          return;
        }
      }
      const config = {
        provider: provider.value,
        clientId: clientId.value.trim().slice(0, 300),
        redirect: redirectValue,
        scopes: scopes.value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean).slice(0, 30),
        endpoint: endpoint.value.trim()
      };
      if (config.endpoint) {
        try {
          const parsed = new URL(config.endpoint);
          if (parsed.protocol !== "https:") throw new Error("HTTPS required");
        } catch (error) {
          notify("Backend endpoint must use HTTPS, or be left blank.");
          endpoint.focus();
          return;
        }
      }
      if (writeData("ruffryan13-provider-config", config)) {
        savedNote.textContent = `Saved locally for ${config.provider}. A secure connector still needs to be deployed before data can sync.`;
        notify("Provider setup notes saved on this device.");
      }
    });
    extra.append(box);
  }

  function mountGroups() {
    let rooms = readArray(keys.rooms).map((room) => ({
      ...room,
      messages: Array.isArray(room.messages)
        ? room.messages.filter((item) => item && typeof item.text === "string")
        : []
    }));
    activeRoom = rooms[0]?.id || null;
    const box = moduleBox("Local group rooms", "Create a private room and keep messages on this device. It is not a shared chat.");
    const form = element("form", "feature-form room-create");
    const name = element("input");
    name.type = "text";
    name.required = true;
    name.maxLength = 60;
    name.placeholder = "Room name";
    addField(form, "New room", name, "room-name");
    const create = element("button", "button button-primary", "Create room");
    create.type = "submit";
    form.append(create);
    const roomList = element("div", "room-tabs");
    const conversation = element("div", "room-conversation");
    const composer = element("form", "feature-form room-composer");
    const message = element("textarea");
    message.rows = 2;
    message.required = true;
    message.maxLength = 1000;
    message.placeholder = "Write a local message…";
    addField(composer, "Message", message, "room-message");
    const send = element("button", "button button-quiet", "Add to room");
    send.type = "submit";
    composer.append(send);
    box.append(form, roomList, conversation, composer);

    const render = () => {
      roomList.replaceChildren();
      for (const room of rooms) {
        const select = makeButton(room.name, "room-tab");
        select.classList.toggle("selected", room.id === activeRoom);
        select.addEventListener("click", () => {
          activeRoom = room.id;
          render();
        });
        roomList.append(select);
      }
      const room = rooms.find((item) => item.id === activeRoom);
      conversation.replaceChildren();
      composer.hidden = !room;
      if (!room) {
        conversation.append(element("p", "empty-module", "Create a room to start a local conversation."));
        return;
      }
      const heading = element("div", "feature-toolbar");
      heading.append(element("strong", "", room.name));
      const remove = makeButton("Delete room", "small-control");
      remove.addEventListener("click", () => {
        if (!window.confirm(`Delete “${room.name}” and its local messages?`)) return;
        rooms = rooms.filter((item) => item.id !== room.id);
        activeRoom = rooms[0]?.id || null;
        writeData(keys.rooms, rooms);
        render();
      });
      heading.append(remove);
      conversation.append(heading);
      if (!room.messages.length) conversation.append(element("p", "empty-module", "No messages yet."));
      for (const item of room.messages) {
        const bubble = element("article", "room-message-bubble");
        bubble.append(element("p", "", item.text), element("small", "", new Date(item.time).toLocaleString()));
        conversation.append(bubble);
      }
    };
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const room = { id: makeId(), name: name.value.trim(), messages: [] };
      rooms.unshift(room);
      activeRoom = room.id;
      if (writeData(keys.rooms, rooms)) {
        form.reset();
        render();
      }
    });
    composer.addEventListener("submit", (event) => {
      event.preventDefault();
      const room = rooms.find((item) => item.id === activeRoom);
      if (!room) return;
      room.messages.push({ text: message.value.trim(), time: new Date().toISOString() });
      if (writeData(keys.rooms, rooms)) {
        composer.reset();
        render();
      }
    });
    render();
    extra.append(box);
  }

  function extractSummary(text) {
    const sentences = text.replace(/\s+/g, " ").match(/[^.!?]+[.!?]?/g) || [];
    const meaningful = sentences.map((sentence) => sentence.trim()).filter((sentence) => sentence.length > 20);
    if (!meaningful.length) return "Add a few sentences to create a short extractive summary.";
    const selection = meaningful.length <= 3 ? meaningful : [meaningful[0], meaningful[Math.floor(meaningful.length / 2)], meaningful[meaningful.length - 1]];
    return selection.join(" ");
  }

  function mountAiNotes() {
    const box = moduleBox("On-device notes helper", "Paste text to create a short extractive summary or find action items.");
    const input = element("textarea");
    input.rows = 7;
    input.maxLength = 12000;
    input.placeholder = "Paste your notes here…";
    addField(box, "Source notes", input, "ai-note-input");
    const actions = element("div", "feature-toolbar");
    const summarize = makeButton("Summarize", "button button-primary");
    const tasks = makeButton("Find action items", "button button-quiet");
    actions.append(summarize, tasks);
    const output = element("div", "module-output", "Your result will appear here.");
    const save = makeButton("Save result as a note", "small-control");
    save.disabled = true;
    let resultText = "";
    summarize.addEventListener("click", () => {
      resultText = extractSummary(input.value.trim());
      output.textContent = resultText;
      save.disabled = !input.value.trim();
    });
    tasks.addEventListener("click", () => {
      const items = input.value.split(/\n/).map((line) => line.trim()).filter((line) => /^(?:[-*]\s*\[ \]|todo:|action:)/i.test(line));
      resultText = items.length ? items.join("\n") : "No checklist items found. Add lines like “- [ ] Follow up” to your notes.";
      output.textContent = resultText;
      save.disabled = !input.value.trim();
    });
    save.addEventListener("click", () => {
        const notes = getNotes();
      notes.unshift({ id: makeId(), title: "Notes summary", text: resultText, updatedAt: new Date().toISOString() });
      if (writeData(keys.notes, notes)) notify("Result saved in Notes on this device.");
    });
    box.append(actions, output, save);
    extra.append(box);
  }

  function mountSettings() {
    const box = moduleBox("Your workspace", "Tune the page and back up the local data it can safely store.");
    const themeRow = element("div", "settings-row");
    themeRow.append(element("span", "", "Color theme"));
    const theme = makeButton("Toggle theme", "toggle-button");
    theme.addEventListener("click", () => document.querySelector("#theme-toggle")?.click());
    themeRow.append(theme);
    const motionRow = element("div", "settings-row");
    motionRow.append(element("span", "", "Motion"));
    const motion = element("select");
    motion.setAttribute("aria-label", "Animation preference");
    motion.add(new Option("Follow device setting", "system"));
    motion.add(new Option("Animations on", "full"));
    motion.add(new Option("Reduce motion", "reduced"));
    const prefs = readData(keys.settings, { motion: "system" }) || {};
    motion.value = ["system", "full", "reduced"].includes(prefs.motion) ? prefs.motion : "system";
    motion.addEventListener("change", () => {
      prefs.motion = motion.value;
      writeData(keys.settings, prefs);
      applyMotionPreference();
    });
    motionRow.append(motion);
    const profileRow = element("form", "settings-row settings-profile");
    const profileInput = element("input");
    profileInput.type = "text";
    profileInput.maxLength = 40;
    profileInput.placeholder = "Ruffryan13";
    const currentProfileName = readData(keys.profile, {})?.name;
    profileInput.value = typeof currentProfileName === "string" ? currentProfileName : "";
    addField(profileRow, "Display name", profileInput, "profile-name");
    const saveProfile = element("button", "small-control", "Save");
    saveProfile.type = "submit";
    profileRow.append(saveProfile);
    profileRow.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = profileInput.value.trim();
      if (writeData(keys.profile, { name })) {
        updateProfileName(name || "Ruffryan13");
        notify("Display name saved on this device.");
      }
    });
    const backup = makeButton("Download local data backup", "button button-primary");
    backup.addEventListener("click", () => {
      const data = Object.fromEntries(Object.entries(keys).map(([name, key]) => [name, readData(key, null)]));
      try {
        data.theme = localStorage.getItem("ruffryan13-theme");
        data.legacyQuickNote = localStorage.getItem("ruffryan13-note");
      } catch (error) {
        notify("Could not read all local preferences for the backup.");
      }
      downloadFile("ruffryan13-local-backup.json", JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), data }, null, 2), "application/json");
    });
    box.append(themeRow, motionRow, profileRow, backup, element("p", "local-note", "This site has no secure account backend. Never enter a password here."));
    extra.append(box);
  }

  function mountLogin() {
    const box = moduleBox("Test login", "Use the local test account. Sign-up is blocked and this account has no privileges.");
    const isSignedIn = sessionStorage.getItem("ruffryan13-test-session") === "ruffryan13";
    if (isSignedIn) {
      box.append(
        element("p", "login-status success", "Signed in as Ruffryan13"),
        element("p", "local-note", "Test session only. No account privileges or protected features are available.")
      );
      const signOut = makeButton("Sign out", "button button-quiet");
      signOut.addEventListener("click", () => {
        document.dispatchEvent(new CustomEvent("ruffryan13:signout"));
        updateSignedInState();
        notify("Test session ended.");
        mountLogin();
      });
      box.append(signOut);
      extra.append(box);
      return;
    }
    const form = element("form", "feature-form login-form");
    const identity = element("input");
    identity.type = "text";
    identity.required = true;
    identity.autocomplete = "username";
    identity.placeholder = "Username or email";
    addField(form, "Email or username", identity, "test-login-identity");
    const password = element("input");
    password.type = "password";
    password.required = true;
    password.autocomplete = "current-password";
    password.placeholder = "Password";
    addField(form, "Password", password, "test-login-password");
    const passwordToggle = makeButton("Show password", "small-control");
    passwordToggle.addEventListener("click", () => {
      password.type = password.type === "password" ? "text" : "password";
      passwordToggle.textContent = password.type === "password" ? "Show password" : "Hide password";
      password.focus();
    });
    form.append(passwordToggle);
    const error = element("p", "login-status error");
    error.setAttribute("role", "alert");
    error.hidden = true;
    const signIn = element("button", "button button-primary", "Sign in");
    signIn.type = "submit";
    form.append(signIn);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const identityValue = identity.value.trim().toLowerCase();
      const validIdentity = identityValue === "ruffryan13"
        || identityValue === "ruffryan13@localhost";
      if (!validIdentity || password.value !== "1234") {
        error.textContent = "The test account details were not accepted.";
        error.hidden = false;
        password.select();
        return;
      }
      sessionStorage.setItem("ruffryan13-test-session", "ruffryan13");
      try { localStorage.setItem("ruffryan13-remembered", "ruffryan13"); } catch (error) { /* visit-only fallback */ }
      updateSignedInState();
      notify("Test account signed in.");
      mountLogin();
    });
    const signUp = makeButton("Sign up — admin blocked", "button button-quiet");
    signUp.disabled = true;
    signUp.setAttribute("aria-disabled", "true");
    box.append(form, error, signUp, element("p", "local-note", "This is a public-site demo account only. Credentials are not sent to a server and no privileges are granted."));
    extra.append(box);
  }

  function mountFeature(id) {
    if (!extra || !featureCopy[id] || id === "chess") return;
    extra.replaceChildren();
    document.querySelector("#dialog-description").textContent = cardCopy[id]?.[0] || "";
    document.querySelector("#dialog-footnote").textContent = featureCopy[id][1];
    const status = document.querySelector("#dialog-status");
    const statusCopy = dialogStatuses[id];
    if (statusCopy && status) {
      status.textContent = statusCopy[0];
      status.classList.remove("local-ready", "setup-only");
      status.classList.add(statusCopy[1]);
    }
    const mount = {
      study: mountStudy,
      openbot: mountTasks,
      email: mountEmail,
      notes: mountNotes,
      calendar: mountCalendar,
      remote: mountRemote,
      vlc: mountMedia,
      files: mountFiles,
      search: mountSearch,
      cloud: mountCloud,
      groups: mountGroups,
      "ai-notes": mountAiNotes,
      settings: mountSettings,
      login: mountLogin,
      "provider-setup": mountProviderSetup
    }[id];
    if (mount) mount();
  }

  function applyMotionPreference() {
    const prefs = readData(keys.settings, {}) || {};
    if (prefs.motion === "full" || prefs.motion === "reduced") {
      document.documentElement.dataset.motion = prefs.motion;
      return;
    }
    document.documentElement.dataset.motion = motionQuery.matches
      ? "reduced"
      : "full";
  }

  function enableReveals() {
    const observed = new Set();
    const observer = "IntersectionObserver" in window
      ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target.isConnected) entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
            observed.delete(entry.target);
          }
        });
      }, { threshold: 0.08 })
      : null;
    const reveal = (root = document) => {
      const nodes = root.querySelectorAll(".brand, .side-nav .nav-item, .sidebar-note, .profile-chip, .topbar, .welcome-row, .quick-strip, .quick-item, .launch-section, .section-heading, .app-card, .page-footer, .page-footer > span");
      nodes.forEach((node, index) => {
        node.classList.add("motion-reveal");
        node.style.setProperty("--reveal-index", String(index % 16));
      });
      if (!observer) {
        nodes.forEach((node) => node.classList.add("is-visible"));
        return;
      }
      for (const node of observed) {
        if (!node.isConnected) {
          observer.unobserve(node);
          observed.delete(node);
        }
      }
      nodes.forEach((node) => {
        if (!node.classList.contains("is-visible") && !observed.has(node)) {
          observed.add(node);
          observer.observe(node);
        }
      });
    };
    reveal();
    const grid = document.querySelector("#app-grid");
    if (grid && "MutationObserver" in window) {
      new MutationObserver(() => {
        enhanceCards();
        reveal(grid);
      }).observe(grid, { childList: true });
    }
  }

  motionQuery.addEventListener?.("change", applyMotionPreference);

  function updateNotifications() {
    const popover = document.querySelector("#notification-popover");
    if (!popover) return;
    const upcoming = readArray(keys.events)
      .filter((item) => new Date(item.start).getTime() >= Date.now())
      .sort((a, b) => new Date(a.start) - new Date(b.start))
      .slice(0, 3);
    const empty = popover.querySelector(".notification-empty");
    if (!empty) return;
    empty.replaceChildren();
    if (!upcoming.length) {
      empty.append("No upcoming local events.", element("br"), element("span", "", "Add events in Calendar."));
      return;
    }
    empty.append(element("strong", "", "Upcoming"));
    for (const item of upcoming) {
      const line = element("span", "notification-event", `${item.title} · ${formatEventTime(item.start)}`);
      empty.append(element("br"), line);
    }
  }

  function initialize() {
    enhanceCards();
    applyMotionPreference();
    updateSignedInState();
    const profile = readData(keys.profile, {}) || {};
    if (typeof profile.name === "string" && profile.name) updateProfileName(profile.name);
    enableReveals();
    document.querySelector("#app-grid")?.addEventListener("click", () => window.setTimeout(enhanceCards, 0));
    document.addEventListener("click", (event) => {
      const card = event.target.closest("[data-app]");
      const open = event.target.closest("[data-open]");
      const id = card?.dataset.app || open?.dataset.open;
      if (id && id !== "chess" && featureCopy[id]) queueMicrotask(() => mountFeature(id));
    });
    document.querySelector("#notification-toggle")?.addEventListener("click", () => window.setTimeout(updateNotifications, 0));
    dialog?.addEventListener("close", () => {
      for (const url of mediaUrls) URL.revokeObjectURL(url);
      mediaUrls.clear();
    });
    updateNotifications();
  }

  initialize();
})();
