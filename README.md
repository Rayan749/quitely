# Quitely

A modern desktop RSS reader built with Tauri v2, React 19, and Fluent UI.

## Features

- **RSS/Atom Feed Support** - Subscribe to and read RSS and Atom feeds
- **Modern UI** - Built with Fluent UI v9 for a native Windows look and feel
- **Multi-language** - Supports English and Chinese (简体中文)
- **Feed Organization** - Organize feeds with labels and folders
- **Flexible Reading** - Multiple view modes including list view and newspaper view
- **Keyboard Shortcuts** - Quick navigation with keyboard shortcuts
- **System Tray** - Runs in the background with system tray support

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + Fluent UI v9
- **Backend**: Tauri v2 + Rust
- **State Management**: Zustand
- **Database**: SQLite (rusqlite)
- **Feed Parsing**: feed-rs crate

## Development

```bash
# Install dependencies
npm install

# Start Vite dev server (frontend only)
npm run dev

# Run Tauri in development mode
npm run tauri dev

# Build production application
npm run tauri build
```

## Project Structure

```
quitely/
├── src/                    # React frontend
│   ├── components/         # UI components
│   │   ├── common/        # Layout, Toolbar, Sidebar
│   │   ├── content/       # ContentViewer
│   │   ├── feeds/         # FeedTree, AddFeedDialog
│   │   ├── news/          # NewsList, NewspaperView
│   │   └── settings/      # SettingsPage, LabelDialog
│   ├── stores/            # Zustand stores
│   ├── hooks/             # Custom React hooks
│   ├── locales/           # i18n translations
│   └── types/             # TypeScript types
├── src-tauri/             # Rust backend
│   └── src/
│       ├── commands/      # Tauri IPC commands
│       ├── db/            # Database layer
│       ├── feed/          # Feed fetching/parsing
│       └── models/        # Data structures
└── docs/plans/            # Implementation plans
```

## License

MIT