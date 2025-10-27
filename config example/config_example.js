modules: [
  {
    module: "MMM-SynologyDownload_Station",
    position: "top_center",
    config: {
      host: "x.x.x.x",           // IP/DNS your Synology NAS
      port: 5001,                // Port HTTPS DSM default
      useHttps: true,            // use HTTPS
      user: "username",          // username
      passwd: "password",        // Password
      refreshInterval: 10,       // in seconds
      maxItems: 8,
      compactMode: true,
      displayColumns: {
        status_icon: true,
        title: true,
        percent_completed: true,
        size: true,
        speed_download: true,
        speed_upload: true
      },
      displayTasks: {
        seeding: true,
        downloading: true,
        finished: true,
        error: true,
        paused: true
      }
    }
  }
]