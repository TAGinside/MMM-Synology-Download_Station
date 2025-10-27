Module.register("MMM-Synology-Download_Station", {
  defaults: {
    host: null,
    port: "5000",
    useHttps: false,
    user: null,
    passwd: null,
    refreshInterval: 10,
    maxItems: 5,
    compactMode: true,
    compactMaxLen: 30,
    textSize: "xsmall",
    iconSize: "small",
    displayColumns: {
      status_icon: true,
      title: true,
      size: true,
      percent_completed: true,
      speed_download: true,
      speed_upload: true
    },
    displayTasks: {
      finished: true,
      downloading: true,
      waiting: true,
      hash_checking: true,
      paused: true,
      seeding: true,
      error: true
    },
    msgEmptyList: "Aucun téléchargement",
  },

  start: function() {
    console.log("[MMM-Synology-Download_Station] Module lancé !");
    this.taskList = [];
    this.sendSocketNotification("DS_INIT", this.config);
    this.loaded = false;
    this.scheduleUpdate();
  },

  scheduleUpdate: function() {
    setInterval(() => {
      this.sendSocketNotification("DS_GET", this.config);
    }, this.config.refreshInterval * 1000);
  },

  getDom: function() {
    var wrapper = document.createElement("div");
    wrapper.className = "MMM-Synology-Download_Station";

    if (!this.loaded) {
      wrapper.innerHTML = "Chargement des tâches…";
      return wrapper;
    }

    if (this.taskList.length === 0) {
      wrapper.innerHTML = this.config.msgEmptyList;
      return wrapper;
    }

    var table = document.createElement("table");
    table.className = this.config.textSize;

    this.taskList.forEach((task) => {
      var row = document.createElement("tr");

      if (this.config.displayColumns.status_icon)
        row.appendChild(this._iconCell(task));

      if (this.config.displayColumns.title)
        row.appendChild(this._textCell(task.title, this.config.compactMaxLen));

      if (this.config.displayColumns.size)
        row.appendChild(this._textCell(this._formatBytes(task.size), 15));

      if (this.config.displayColumns.percent_completed)
        row.appendChild(this._textCell(task.percent_completed + " %", 6));

      if (this.config.displayColumns.speed_download)
        row.appendChild(this._textCell(this._formatBytes(task.speed_download) + "/s", 10));

      if (this.config.displayColumns.speed_upload)
        row.appendChild(this._textCell(this._formatBytes(task.speed_upload) + "/s", 10));

      table.appendChild(row);
    });

    wrapper.appendChild(table);
    return wrapper;
  },

  _iconCell: function(task) {
    var cell = document.createElement("td");
    var icon = document.createElement("i");
    icon.className = "fa fa-arrow-down"; // Customise selon status si besoin
    cell.appendChild(icon);
    return cell;
  },

  _textCell: function(text, maxLen) {
    var cell = document.createElement("td");
    cell.innerHTML = typeof text === "string" && text.length > maxLen ? text.substring(0, maxLen) + "..." : text;
    return cell;
  },

  _formatBytes: function(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + " MB";
    return (bytes / 1024 / 1024 / 1024).toFixed(1) + " GB";
  },

  socketNotificationReceived: function(notification, payload) {
    if (notification === "DS_RESULT") {
      console.log("[MMM-Synology-Download_Station] Tâches Synology reçues :", payload.length);
      this.taskList = payload;
      this.loaded = true;
      this.updateDom();
      payload.forEach(task => {
        if (task.status === "downloading") {
          console.log(`[MMM-Synology-Download_Station] Téléchargement actif : ${task.title} (${task.percent_completed}%)`);
        }
      });
    }
    if (notification === "DS_ERROR") {
      console.log("[MMM-Synology-Download_Station] Erreur Synology:", payload);
      this.loaded = false;
      this.taskList = [];
      this.updateDom();
    }
  }
});
