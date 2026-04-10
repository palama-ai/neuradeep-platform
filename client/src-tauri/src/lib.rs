use tauri_plugin_shell::ShellExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .setup(|app| {
      #[cfg(debug_assertions)]
      {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      
      // Spawn its sidecar (Python Backend)
      let sidecar_result = app.shell().sidecar("palama-engine");
      match sidecar_result {
          Ok(sidecar) => {
              match sidecar.spawn() {
                  Ok((mut _rx, _child)) => {
                      println!("Successfully spawned Palama Engine Sidecar");
                  }
                  Err(e) => {
                      eprintln!("Failed to spawn Palama Engine sidecar: {}", e);
                  }
              }
          }
          Err(e) => {
              eprintln!("Failed to find Palama Engine sidecar: {}", e);
          }
      }
      
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
