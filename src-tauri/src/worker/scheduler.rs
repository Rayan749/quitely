use std::time::Duration;
use tauri::{AppHandle, Emitter, Runtime};
use tauri::async_runtime::spawn;
use tokio::time::interval;

pub struct FeedScheduler {
    interval_minutes: u64,
}

impl FeedScheduler {
    pub fn new(interval_minutes: u64) -> Self {
        Self { interval_minutes }
    }

    pub fn start<R: Runtime>(&self, app: AppHandle<R>) {
        let interval_mins = self.interval_minutes;

        spawn(async move {
            let mut ticker = interval(Duration::from_secs(interval_mins * 60));

            loop {
                ticker.tick().await;

                // Emit event to frontend to update feeds
                if let Err(e) = app.emit("scheduler:update-feeds", ()) {
                    eprintln!("Failed to emit scheduler event: {}", e);
                }
            }
        });
    }
}

impl Default for FeedScheduler {
    fn default() -> Self {
        Self::new(30) // Default 30 minutes
    }
}