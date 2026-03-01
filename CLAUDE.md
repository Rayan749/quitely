# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Quitely is a desktop RSS reader application built with Tauri v2, React 19, TypeScript, and Fluent UI v9. It is a modern rewrite of QuiteRSS (Qt/C++ RSS reader).

### Tech Stack
- **Frontend:** React 19 + TypeScript + Fluent UI v9 + Zustand
- **Backend:** Tauri v2 + Rust
- **Database:** SQLite (rusqlite)
- **Feed Parsing:** feed-rs crate
- **HTTP Client:** reqwest

## Development Commands

```bash
# Start Vite dev server (frontend only)
npm run dev

# Run Tauri in development mode (frontend + backend with hot reload)
npm run tauri dev

# Build the production application
npm run tauri build

# Type check frontend
npx tsc --noEmit

# Check Rust code
cd src-tauri && cargo check
```

## Architecture

**Frontend (`src/`):** React 19 with TypeScript, bundled by Vite. The dev server runs on port 1420. Uses Fluent UI v9 for components and Zustand for state management.

**Backend (`src-tauri/`):** Rust application using Tauri v2. The entry point is `main.rs`, which delegates to `lib.rs` for the Tauri builder setup.

### Frontend Structure

```
src/
├── components/           # React components
│   ├── common/          # Layout, AppToolbar, Sidebar
│   ├── content/         # ContentViewer
│   ├── feeds/           # AddFeedDialog, FeedTree
│   ├── news/            # NewsList, NewspaperView
│   └── settings/        # SettingsPage, LabelDialog
├── stores/              # Zustand stores (feed, news, settings, ui, labels, filters)
├── hooks/               # useKeyboardShortcuts, useTrayEvents
├── types/               # TypeScript types (feed, news, label, filter)
├── locales/             # i18n translations (en.json, zh.json)
├── i18n.ts              # i18n configuration
├── utils/               # Utilities (i18nDate.ts)
└── api/                 # Tauri invoke wrappers (commands.ts)
```

**Frontend-Rust Communication:** Use `invoke()` from `@tauri-apps/api/core` to call Rust commands. Define commands in `src-tauri/src/commands/` with `#[tauri::command]` and register them in `lib.rs` `generate_handler![]`.

### Settings

Settings are in a sidebar page (`SettingsPage`), not a dialog. Use `settingsStore` for state management.

### Internationalization (i18n)

Uses `react-i18next` for translations. Translation files in `src/locales/` (en.json, zh.json). Use `useTranslation` hook or `i18n.t()` function. Date formatting via `src/utils/i18nDate.ts`. The primary language is Chinese (zh.json) — always check `zh.json` for the correct user-facing strings before adding or modifying UI text. Never hardcode display strings; use translation keys.

### Backend Structure

```
src-tauri/src/
├── lib.rs              # Tauri builder setup, command registration
├── main.rs             # Entry point
├── commands/           # Tauri IPC commands
│   ├── mod.rs
│   ├── feeds.rs        # Feed CRUD operations
│   ├── news.rs         # News operations
│   └── settings.rs     # Settings management
├── db/                 # Database layer
│   ├── connection.rs   # SQLite connection
│   ├── schema.rs       # Table definitions
│   ├── feeds.rs
│   ├── news.rs
│   └── settings.rs
├── feed/               # Feed fetching and parsing
│   ├── fetcher.rs      # HTTP client, RSS/Atom parsing
│   └── opml.rs         # OPML import/export
├── models/             # Data structures
├── tray.rs             # System tray setup
└── worker/             # Background tasks
    └── scheduler.rs    # Feed update scheduler
```

### Adding a new Tauri command

1. Define the command in `src-tauri/src/lib.rs`:
   ```rust
   #[tauri::command]
   fn my_command(arg: &str) -> String {
       format!("Result: {}", arg)
   }
   ```

2. Register it in the handler:
   ```rust
   .invoke_handler(tauri::generate_handler![greet, my_command])
   ```

3. Call from frontend:
   ```typescript
   import { invoke } from "@tauri-apps/api/core";
   const result = await invoke("my_command", { arg: "value" });
   ```

## Configuration

- **Tauri config:** `src-tauri/tauri.conf.json` - app identifier, window settings, build commands
- **Vite config:** `vite.config.ts` - React plugin, dev server on port 1420
- **TypeScript:** Strict mode enabled, unused variable checks on

## Naming

The app display name is **"Quitely"** (capital Q). Always use this exact casing in user-visible strings: window titles, `productName` in `tauri.conf.json`, HTML `<title>`, tray menus, notifications, etc. The package/directory name `quitely` (lowercase) is fine for code identifiers and file paths.

## Window

Keep the native OS title bar and window decorations. Do NOT set `transparent`, `decorations: false`, or `titleBarStyle` in `tauri.conf.json`. Do NOT add `data-tauri-drag-region` or traffic light padding to the toolbar.

## Important Patterns

### Tauri v2 Tray Icons

In Tauri v2, `app.default_window_icon()` may return `None` because `bundle.icon` in `tauri.conf.json` is only used for the bundled app icon, not the default window icon. When setting up tray icons, always provide a fallback:

```rust
use tauri::image::Image;

fn load_tray_icon() -> Image<'static> {
    let icon_bytes = include_bytes!("../icons/icon.png");
    let img = image::load_from_memory(icon_bytes).expect("Failed to load icon");
    let rgba = img.to_rgba8();
    let (width, height) = rgba.dimensions();
    Image::new_owned(rgba.into_raw(), width, height)
}

// In setup_tray:
let icon = app
    .default_window_icon()
    .cloned()
    .unwrap_or_else(load_tray_icon);
```

### Adding Tauri Commands

1. Create command in appropriate file under `src-tauri/src/commands/`:
   ```rust
   #[tauri::command]
   pub fn my_command(state: State<DbState>, arg: String) -> Result<MyResult, String> {
       // Implementation
   }
   ```

2. Register in `lib.rs`:
   ```rust
   .invoke_handler(tauri::generate_handler![
       commands::my_command,
   ])
   ```

3. Call from frontend:
   ```typescript
   import { invoke } from "@tauri-apps/api/core";
   const result = await invoke("my_command", { arg: "value" });
   ```

### Tauri Events

Backend can emit events to frontend:
```rust
app.emit("event-name", payload)?;
```

Frontend listens:
```typescript
import { listen } from '@tauri-apps/api/event';
const unlisten = await listen('event-name', (event) => {
    console.log(event.payload);
});
// Cleanup: unlisten();
```

## Design Documents

Implementation plans are in `docs/plans/`:
- `2026-02-27-rss-reader-redesign.md` - Overall architecture
- `2026-02-27-phase1-implementation.md` through `2026-02-28-phase5-implementation.md` - Phase details