{
  module: "MMM-Synology-Download_Station",
  position: "bottom_left",
  config: {
    host: "192.168.11.10",
    port: 5001,
    useHttps: true,
    user: "MagicMirror",
    passwd: "votre_mot_de_passe",
    refreshInterval: 10000,
    maxItems: 10,
    compactMode: false,
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