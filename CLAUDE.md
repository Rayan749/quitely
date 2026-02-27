# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Quitely is a desktop application built with Tauri v2, React 19, and TypeScript. The architecture consists of a React frontend bundled with Vite and a Rust backend via Tauri.

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
```

## Architecture

**Frontend (`src/`):** React 19 with TypeScript, bundled by Vite. The dev server runs on port 1420.

**Backend (`src-tauri/`):** Rust application using Tauri v2. The entry point is `main.rs`, which delegates to `lib.rs` for the Tauri builder setup.

**Frontend-Rust Communication:** Use `invoke()` from `@tauri-apps/api/core` to call Rust commands. Define commands in `src-tauri/src/lib.rs` with `#[tauri::command]` and register them in `generate_handler![]`.

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