use tauri::{
    image::Image,
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, Runtime,
};

/// Load the tray icon from embedded bytes
fn load_tray_icon() -> Image<'static> {
    let icon_bytes = include_bytes!("../icons/icon.png");
    let img = image::load_from_memory(icon_bytes)
        .expect("Failed to load tray icon from memory");
    let rgba = img.to_rgba8();
    let (width, height) = rgba.dimensions();
    Image::new_owned(rgba.into_raw(), width, height)
}

pub fn setup_tray<R: Runtime>(app: &tauri::AppHandle<R>) -> Result<(), Box<dyn std::error::Error>> {
    // Create menu items
    let show_item = MenuItem::with_id(app, "show", "Show Window", true, None::<&str>)?;
    let hide_item = MenuItem::with_id(app, "hide", "Hide Window", true, None::<&str>)?;
    let update_item = MenuItem::with_id(app, "update", "Update All Feeds", true, None::<&str>)?;
    let mark_read_item = MenuItem::with_id(app, "mark_read", "Mark All Read", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

    let separator = PredefinedMenuItem::separator(app)?;

    // Build menu
    let menu = Menu::with_items(
        app,
        &[
            &show_item,
            &hide_item,
            &separator,
            &update_item,
            &mark_read_item,
            &separator,
            &quit_item,
        ],
    )?;

    // Build tray icon - use default icon or fall back to embedded icon
    let icon = match app.default_window_icon() {
        Some(icon) => icon.clone(),
        None => load_tray_icon(),
    };

    let _tray = TrayIconBuilder::new()
        .icon(icon)
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "hide" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.hide();
                }
            }
            "update" => {
                // Emit event to frontend to update feeds
                let _ = app.emit("tray:update-feeds", ());
            }
            "mark_read" => {
                // Emit event to frontend to mark all read
                let _ = app.emit("tray:mark-all-read", ());
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)?;

    Ok(())
}