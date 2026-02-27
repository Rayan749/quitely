# RSS Reader 阶段 4: 系统功能 实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现系统托盘、设置存储、设置对话框和键盘快捷键等系统功能。

**Architecture:** Rust 后端处理系统托盘和设置持久化，React 前端提供设置 UI，Tauri 事件系统实现前后端通信。

**Tech Stack:** Tauri v2 (tray-icon feature), React 19, TypeScript, Fluent UI v9, SQLite

---

## Task 1: 配置系统托盘

**Files:**
- Create: `src-tauri/src/tray.rs`
- Modify: `src-tauri/src/lib.rs`

**Step 1: 创建 tray.rs**

```rust
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, Runtime,
};

pub fn setup_tray<R: Runtime>(app: &tauri::AppHandle<R>) -> Result<(), Box<dyn std::error::Error>> {
    // 创建菜单项
    let show_item = MenuItem::with_id(app, "show", "Show Window", true, None::<&str>)?;
    let hide_item = MenuItem::with_id(app, "hide", "Hide Window", true, None::<&str>)?;
    let update_item = MenuItem::with_id(app, "update", "Update All Feeds", true, None::<&str>)?;
    let mark_read_item = MenuItem::with_id(app, "mark_read", "Mark All Read", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

    // 构建菜单
    let menu = Menu::with_items(app, &[&show_item, &hide_item, &separator, &update_item, &mark_read_item, &separator, &quit_item])?;

    // 构建托盘图标
    let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() { ... })
        .on_tray_icon_event(|tray, event| { ... })
        .build(app)?;

    Ok(())
}
```

**Step 2: 在 lib.rs setup 中调用**

```rust
.setup(|app| {
    // ...
    tray::setup_tray(app.handle())?;
    Ok(())
})
```

---

## Task 2: 实现设置存储

**Files:**
- Create: `src-tauri/src/db/settings.rs`
- Create: `src-tauri/src/commands/settings.rs`
- Modify: `src-tauri/src/db/mod.rs`
- Modify: `src-tauri/src/commands/mod.rs`
- Modify: `src-tauri/src/lib.rs`

**Step 1: 创建 db/settings.rs**

```rust
pub fn get(conn: &Connection, key: &str) -> Result<Option<String>, String>
pub fn set(conn: &Connection, key: &str, value: &str) -> Result<(), String>
pub fn delete(conn: &Connection, key: &str) -> Result<(), String>
pub fn get_all(conn: &Connection) -> Result<Vec<(String, String)>, String>
```

**Step 2: 创建 commands/settings.rs**

```rust
#[tauri::command]
pub fn get_setting(db: State<'_, DbState>, key: String) -> Result<Option<String>, String>

#[tauri::command]
pub fn set_setting(db: State<'_, DbState>, key: String, value: String) -> Result<(), String>

#[tauri::command]
pub fn delete_setting(db: State<'_, DbState>, key: String) -> Result<(), String>

#[tauri::command]
pub fn get_all_settings(db: State<'_, DbState>) -> Result<Vec<(String, String)>, String>
```

---

## Task 3: 创建设置对话框

**Files:**
- Create: `src/components/settings/SettingsDialog.tsx`
- Create: `src/components/settings/index.ts`
- Create: `src/stores/settingsStore.ts`

**Step 1: 创建 SettingsDialog.tsx**

使用 Fluent UI Dialog 组件，包含多个标签页：
- 常规：启动设置、界面设置
- 网络：代理设置、超时设置
- Feed：更新间隔、自动更新
- 通知：通知设置
- 浏览器：内嵌浏览器设置

**Step 2: 创建 settingsStore.ts**

管理设置状态和持久化。

---

## Task 4: 添加键盘快捷键

**Files:**
- Modify: `src/App.tsx`
- Create: `src/hooks/useKeyboardShortcuts.ts`

**Step 1: 创建 useKeyboardShortcuts hook**

```typescript
export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + R: 刷新
      // Ctrl/Cmd + A: 全部标记已读
      // Ctrl/Cmd + S: 收藏
      // Ctrl/Cmd + D: 删除
      // Left/Right: 导航
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
```

**Step 2: 在 App.tsx 中使用**

---

## 阶段 4 完成检查清单

- [ ] 系统托盘已配置
- [ ] 设置存储已实现
- [ ] 设置对话框已创建
- [ ] 键盘快捷键已添加
- [ ] 托盘事件与前端通信正常