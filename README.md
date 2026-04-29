# md.desktop

Native desktop app for Windows to browse, create, edit, and preview local Markdown files.

## Stack

- Electron
- Plain HTML/CSS/JavaScript
- Marked for Markdown rendering

## Why Electron

Tauri is lighter, but this machine does not currently have Rust installed. Electron is the best choice here because it lets you ship a native desktop app right now with the tooling already available on your system.

## Features in v0.1

- Open a local folder
- Browse `.md` files recursively
- Create new Markdown files
- Edit and save files
- Live preview
- Dark UI

## Run locally

```bash
npm install
npm start
```
