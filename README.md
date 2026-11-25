# Ruffryan13 Projects

A playful, responsive personal launchpad for learning, games, and everyday tools.

![Square, circle-safe Ruffryan13 pixel-art computer and block world](ruffryan13-world.png)

## Run locally

Open `index.html` in a browser, or serve this folder with Python:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## What's in this preview

- Search and filter the app cards by category.
- Switch between dark and light themes.
- Play local two-player chess with legal moves, castling, en passant, promotion, move history, and draw rules.
- Practice built-in mini-lessons and quizzes; progress stays on this device.
- Create, search, edit, and export local notes.
- Organize OpenBot tasks and local group rooms without a server connection.
- Import `.eml` files for a private session preview and open email drafts in your mail app.
- Plan calendar events locally, import or export `.ics` files, and open Google Calendar separately.
- Save remote-host setup notes, cloud-drive shortcuts, and a local display profile.
- Use Provider Setup to record non-secret OAuth client IDs, redirect URLs, scopes, and backend endpoints for a future connector.
- Play selected audio or video files in the browser and preview files you choose.
- Search Wikipedia or the wider web from the launchpad.
- Summarize pasted text and extract checklist items with an on-device text helper.
- Adjust animation preferences and download a local-data backup.
- Enjoy motion effects that respect the device's reduced-motion preference.
- View the custom square, circle-safe `ruffryan13-world.png` illustration.

The launchpad is a static website. Local notes, events, tasks, rooms, and preferences stay in the current browser and do not sync. Imported email and selected files are handled only for the current session. Search, Google Calendar, cloud shortcuts, and email drafts open separate websites or apps. Secure account sign-in, shared OpenBot rooms, cloud sync, remote desktop streaming, and control of desktop VLC or VS Code require trusted integrations that are not included. Provider Setup stores only non-secret configuration in this browser; it does not perform OAuth or collect passwords, client secrets, API keys, or access tokens.
