Module.register("MMM-Synology-Download_Station", {
  defaults: {
    updateInterval: 10 * 1000,
    maxItems: 10,
    compactMode: false,
    displayColumns: {
      title: true,
      status_icon: true,
      percent_completed: true,
      speed_download: true,
      speed_upload: true,
      size: true
    },
    displayTasks: {
      finished: true,
      downloading: true,
      waiting: true,
      hash_checking: true,
      paused: true,
      seeding: true,
      error: true
    }
  },

  start() {
    this.tasks = [];
    this.sendSocketNotification("CONFIG", this.config);
    this.updateTasks();
    this.scheduleUpdate();
  },

  scheduleUpdate() {
    setInterval(() => {
      this.updateTasks();
    }, this.config.updateInterval);
  },

  updateTasks() {
    this.sendSocketNotification("GET_TASKS");
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "TASKS_DATA") {
      if (payload && Array.isArray(payload)) {
        // Filtrer les tâches selon le statut et la config
        this.tasks = payload.filter(task =>
          this.config.displayTasks[task.status] !== false
        ).slice(0, this.config.maxItems);
      } else {
        this.tasks = [];
      }
      this.updateDom(1000);
    }
  },

  getDom() {
    const wrapper = document.createElement("div");
    if (!this.tasks.length) {
      wrapper.innerHTML = "<em>Aucune tâche Download Station</em>";
      return wrapper;
    }

    const table = document.createElement("table");
    table.className = "synology-table";

    // En-tête
    const thead = document.createElement("thead");
    const trHead = document.createElement("tr");

    if (this.config.displayColumns.status_icon) {
      const thIcon = document.createElement("th");
      thIcon.textContent = "";
      trHead.appendChild(thIcon);
    }
    if (this.config.displayColumns.title) {
      const thTitle = document.createElement("th");
      thTitle.textContent = "Titre";
      trHead.appendChild(thTitle);
    }
    if (this.config.displayColumns.percent_completed) {
      const thPercent = document.createElement("th");
      thPercent.textContent = "%";
      trHead.appendChild(thPercent);
    }
    if (this.config.displayColumns.speed_download) {
      const thSpeedD = document.createElement("th");
      thSpeedD.textContent = "↓ Débit";
      trHead.appendChild(thSpeedD);
    }
    if (this.config.displayColumns.speed_upload) {
      const thSpeedU = document.createElement("th");
      thSpeedU.textContent = "↑ Débit";
      trHead.appendChild(thSpeedU);
    }
    if (this.config.displayColumns.size) {
      const thSize = document.createElement("th");
      thSize.textContent = "Taille";
      trHead.appendChild(thSize);
    }

    thead.appendChild(trHead);
    table.appendChild(thead);

    // Corps
    const tbody = document.createElement("tbody");

    this.tasks.forEach(task => {
      const tr = document.createElement("tr");

      if (this.config.displayColumns.status_icon) {
        const tdIcon = document.createElement("td");
        tdIcon.className = "status-icon";

        // Exemple d’icône en fonction du statut
        let icon = "⏳"; // par défaut
        switch (task.status) {
          case "downloading": icon = "⬇️"; break;
          case "seeding": icon = "⬆️"; break;
          case "finished": icon = "✔️"; break;
          case "error": icon = "❌"; break;
          case "paused": icon = "⏸️"; break;
        }
        tdIcon.textContent = icon;
        tr.appendChild(tdIcon);
      }

      if (this.config.displayColumns.title) {
        const tdTitle = document.createElement("td");
        tdTitle.textContent = task.title;
        tr.appendChild(tdTitle);
      }

      if (this.config.displayColumns.percent_completed) {
        const tdPercent = document.createElement("td");
        tdPercent.textContent =
          task.additional && task.additional.percent
            ? `${task.additional.percent}%`
            : "N/A";
        tdPercent.style.textAlign = "center";
        tr.appendChild(tdPercent);
      }

      if (this.config.displayColumns.speed_download) {
        const tdSpeedD = document.createElement("td");
        tdSpeedD.textContent =
          task.additional && task.additional.speed_download
            ? this.formatSpeed(task.additional.speed_download)
            : "-";
        tdSpeedD.style.textAlign = "right";
        tr.appendChild(tdSpeedD);
      }

      if (this.config.displayColumns.speed_upload) {
        const tdSpeedU = document.createElement("td");
        tdSpeedU.textContent =
          task.additional && task.additional.speed_upload
            ? this.formatSpeed(task.additional.speed_upload)
            : "-";
        tdSpeedU.style.textAlign = "right";
        tr.appendChild(tdSpeedU);
      }

      if (this.config.displayColumns.size) {
        const tdSize = document.createElement("td");
        tdSize.textContent = this.formatSize(task.size);
        tdSize.style.textAlign = "right";
        tr.appendChild(tdSize);
      }

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    wrapper.appendChild(table);

    return wrapper;
  },

  formatSize(bytes) {
    if (bytes === 0) return "0 B";
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(1) + " " + sizes[i];
  },

  formatSpeed(bytesPerSecond) {
    return this.formatSize(bytesPerSecond) + "/s";
  }
});
