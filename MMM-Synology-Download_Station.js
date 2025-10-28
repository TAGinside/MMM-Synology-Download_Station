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
    msgEmptyList: "No Download Tasks",
  },

  start: function() {
    console.log("[MMM-Synology-Download_Station] Module launched !");
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

    if (this.data.header) {
      var header = document.createElement("header");
      header.innerHTML = this.data.header;
      wrapper.appendChild(header);
    }

    if (!this.loaded) {
      wrapper.innerHTML = "Searching for tasks...";
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
    let iconClass = '';
    let iconColor = '';

    if (task.status === "downloading") {
      iconClass = "fa fa-arrow-down";
      iconColor = "cyan"; // Couleur pour téléchargement
    } else if (task.status === "seeding") {
      iconClass = "fa fa-arrow-up";
      iconColor = "green"; // Couleur pour partage
    } else if (task.status === "error") {
      iconClass = "fa fa-exclamation-triangle"; // Icône d'erreur
      iconColor = "red"; // Couleur pour erreur
    } else if (task.status === "paused") {
      iconClass = "fa fa-pause"; // Icône pause
      iconColor = "gray";        // Couleur pour pause
    } else {
      iconClass = "fa fa-question-circle"; // Par défaut
      iconColor = "gray";
    }

    icon.className = iconClass;
    icon.style.color = iconColor; // Définition couleur en inline style depuis JS
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
      console.log("[MMM-Synology-Download_Station] Synology-NAS Task Received :", payload.length);
      this.taskList = payload;
      this.loaded = true;
      
      // Afficher/Cacher module selon la présence de tâches
      if (this.taskList.length === 0) {
        this.hide(1000); // Cache le module sur 1 seconde
      } else {
        this.show(1000); // Affiche le module sur 1 seconde
        this.updateDom();
      }

      // Log pourcentage pour chaque tâche reçue
      payload.forEach(task => {
        console.log(`[MMM-Synology-Download_Station] ${task.title} - ${task.percent_completed}%`);
      });

      // Log pour téléchargement actif
      payload.forEach(task => {
        if (task.status === "downloading") {
          console.log(`[MMM-Synology-Download_Station] Active Download : ${task.title} (${task.percent_completed}%)`);
        }
      });
    }
    if (notification === "DS_ERROR") {
      console.log("[MMM-Synology-Download_Station] Synology-NAS Error:", payload);
      this.loaded = false;
      this.taskList = [];
      this.updateDom();
      this.hide(1000);
    }
  }
});
// End of file