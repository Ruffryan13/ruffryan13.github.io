# Control Center

An installable, responsive Progressive Web App (PWA) shell for Android and desktop browsers.

## Run locally

From the parent directory:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000/ryan-control-center/`. For installation and offline support, use a browser that supports PWAs; browsers generally require HTTPS or localhost.

## Current features

- Responsive workspace navigation for passwords, email, websites, notes, OpenBot, remote desktop, and SSH.
- Notes can be created, edited, and deleted. They are stored unencrypted in the current browser on the current device; do not use them for secrets.
- Website shortcut to `https://ruffryan13.github.io`.
- App manifest and service worker for install and offline shell support.

The other modules are status screens only. They are not connected to accounts, servers, or OpenBot, and this app does not deploy or change the linked website. A secure vault, mail integration, OpenBot controls, and remote access require their own authenticated, security-reviewed integrations. No native desktop installer is included; supported desktop browsers can install the PWA as a standalone app.
